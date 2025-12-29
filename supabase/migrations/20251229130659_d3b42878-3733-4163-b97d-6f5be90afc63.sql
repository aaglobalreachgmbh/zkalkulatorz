-- ============================================
-- Phase 1-3 Teil 2: Funktion und Tabellen
-- ============================================

-- 1. Erstelle is_tenant_admin() Funktion
CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'tenant_admin'
  )
$$;

-- ============================================
-- Phase 2: tenant_hardware Tabelle
-- ============================================

CREATE TABLE IF NOT EXISTS public.tenant_hardware (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  hardware_id text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  category text DEFAULT 'smartphone',
  ek_net numeric NOT NULL CHECK (ek_net >= 0),
  sort_order integer DEFAULT 999,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  UNIQUE (tenant_id, hardware_id)
);

-- RLS aktivieren
ALTER TABLE public.tenant_hardware ENABLE ROW LEVEL SECURITY;

-- Policy: Nur eigener Tenant kann Daten lesen
CREATE POLICY "Users can view own tenant hardware"
ON public.tenant_hardware FOR SELECT
USING (is_same_tenant(tenant_id));

-- Policy: Nur Tenant-Admins oder globale Admins können Daten verwalten
CREATE POLICY "Tenant admins can manage hardware"
ON public.tenant_hardware FOR ALL
USING (is_same_tenant(tenant_id) AND (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'admin')))
WITH CHECK (is_same_tenant(tenant_id) AND (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'admin')));

-- Trigger für updated_at
CREATE TRIGGER update_tenant_hardware_updated_at
  BEFORE UPDATE ON public.tenant_hardware
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Phase 3: tenant_provisions Tabelle
-- ============================================

CREATE TABLE IF NOT EXISTS public.tenant_provisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  tariff_id text NOT NULL,
  tariff_name text NOT NULL,
  tariff_family text,
  contract_type text NOT NULL DEFAULT 'new',
  provision_amount numeric NOT NULL CHECK (provision_amount >= 0),
  sub_variant_id text DEFAULT '',
  valid_from date DEFAULT CURRENT_DATE,
  valid_until date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid
);

-- Unique Index für Provisions
CREATE UNIQUE INDEX IF NOT EXISTS tenant_provisions_unique_idx 
ON public.tenant_provisions (tenant_id, tariff_id, contract_type, sub_variant_id);

-- RLS aktivieren
ALTER TABLE public.tenant_provisions ENABLE ROW LEVEL SECURITY;

-- Policy: Nur eigener Tenant kann Daten lesen
CREATE POLICY "Users can view own tenant provisions"
ON public.tenant_provisions FOR SELECT
USING (is_same_tenant(tenant_id));

-- Policy: Nur Tenant-Admins oder globale Admins können Daten verwalten
CREATE POLICY "Tenant admins can manage provisions"
ON public.tenant_provisions FOR ALL
USING (is_same_tenant(tenant_id) AND (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'admin')))
WITH CHECK (is_same_tenant(tenant_id) AND (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'admin')));

-- Trigger für updated_at
CREATE TRIGGER update_tenant_provisions_updated_at
  BEFORE UPDATE ON public.tenant_provisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();