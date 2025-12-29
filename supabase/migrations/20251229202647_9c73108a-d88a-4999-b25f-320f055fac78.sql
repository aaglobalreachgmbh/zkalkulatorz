-- ============================================
-- Fix: RLS Infinite Recursion für distribution_partners
-- Lösung: RLS-freie Helper-Tabelle tenant_distribution_map
-- ============================================

-- Schritt 1: Neue Mapping-Tabelle ohne RLS erstellen
CREATE TABLE IF NOT EXISTS public.tenant_distribution_map (
  tenant_id TEXT PRIMARY KEY,
  distribution_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- KEINE RLS aktivieren - diese Tabelle dient nur als Cache
-- Nur authentifizierte Benutzer können lesen
GRANT SELECT ON public.tenant_distribution_map TO authenticated;

-- Schritt 2: Trigger-Funktion für automatische Synchronisation
CREATE OR REPLACE FUNCTION public.sync_tenant_distribution_map()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.tenant_distribution_map (tenant_id, distribution_id, is_active, updated_at)
    VALUES (NEW.tenant_id, NEW.distribution_id, NEW.status = 'active', now())
    ON CONFLICT (tenant_id) 
    DO UPDATE SET 
      distribution_id = EXCLUDED.distribution_id,
      is_active = EXCLUDED.is_active,
      updated_at = now();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.tenant_distribution_map WHERE tenant_id = OLD.tenant_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Schritt 3: Trigger an distribution_partners anhängen
DROP TRIGGER IF EXISTS trigger_sync_tenant_distribution_map ON public.distribution_partners;
CREATE TRIGGER trigger_sync_tenant_distribution_map
  AFTER INSERT OR UPDATE OR DELETE ON public.distribution_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_tenant_distribution_map();

-- Schritt 4: Helper-Funktionen aktualisieren (nutzen jetzt tenant_distribution_map)
CREATE OR REPLACE FUNCTION public.get_my_distribution_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT distribution_id
  FROM public.tenant_distribution_map
  WHERE tenant_id = get_my_tenant_id()
    AND is_active = true
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_my_distribution_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(distribution_id),
    '{}'::uuid[]
  )
  FROM public.tenant_distribution_map
  WHERE tenant_id = get_my_tenant_id()
    AND is_active = true
$$;

-- Schritt 5: distributions SELECT Policy aktualisieren (nutzt jetzt Helper-Funktion)
DROP POLICY IF EXISTS "Tenant admins can view their distribution" ON public.distributions;

CREATE POLICY "Tenant admins can view their distribution"
ON public.distributions
FOR SELECT
USING (
  id = get_my_distribution_id()
  OR has_role(auth.uid(), 'admin')
);

-- Schritt 6: Bestehende Daten in die Map-Tabelle migrieren
INSERT INTO public.tenant_distribution_map (tenant_id, distribution_id, is_active, updated_at)
SELECT tenant_id, distribution_id, (status = 'active'), now()
FROM public.distribution_partners
ON CONFLICT (tenant_id) DO UPDATE SET
  distribution_id = EXCLUDED.distribution_id,
  is_active = EXCLUDED.is_active,
  updated_at = now();