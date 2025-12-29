-- Push Provisions erweitern: Tarifgruppen und Bedingungen

-- 1. Neue Spalten für push_provisions
ALTER TABLE public.push_provisions
ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'tariff',
ADD COLUMN IF NOT EXISTS conditions JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Kommentar für target_type Werte
COMMENT ON COLUMN public.push_provisions.target_type IS 'tariff = einzelner Tarif, family = Tarif-Familie, pattern = Regex-Pattern, group = Tarif-Gruppe, all = alle Tarife';

-- 2. Neue Tabelle für Tarif-Gruppen
CREATE TABLE IF NOT EXISTS public.push_tariff_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  match_pattern TEXT,
  tariff_ids TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. RLS für push_tariff_groups
ALTER TABLE public.push_tariff_groups ENABLE ROW LEVEL SECURITY;

-- Admins können alles
CREATE POLICY "Admins can manage push tariff groups"
ON public.push_tariff_groups
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tenant-Admins können Gruppen im eigenen Tenant verwalten
CREATE POLICY "Tenant admins can manage own tenant push tariff groups"
ON public.push_tariff_groups
FOR ALL
TO authenticated
USING (public.is_same_tenant(tenant_id) AND public.is_tenant_admin(auth.uid()))
WITH CHECK (public.is_same_tenant(tenant_id) AND public.is_tenant_admin(auth.uid()));

-- Alle Nutzer können Gruppen im eigenen Tenant lesen
CREATE POLICY "Users can view own tenant push tariff groups"
ON public.push_tariff_groups
FOR SELECT
TO authenticated
USING (public.is_same_tenant(tenant_id) OR public.has_role(auth.uid(), 'admin'));

-- 4. Trigger für updated_at
CREATE TRIGGER update_push_tariff_groups_updated_at
BEFORE UPDATE ON public.push_tariff_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_push_tariff_groups_tenant ON public.push_tariff_groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_push_provisions_target_type ON public.push_provisions(target_type);