-- Schritt 1: tenant_admin Rolle zum bestehenden Nutzer hinzufügen
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'tenant_admin'::app_role
FROM auth.users
WHERE email = 'can.akar@gmx.de'
ON CONFLICT (user_id, role) DO NOTHING;

-- Schritt 2: Datenbank-Funktion für automatische Tenant-Admin Zuweisung
-- Der erste Nutzer eines Tenants wird automatisch tenant_admin
CREATE OR REPLACE FUNCTION public.auto_assign_tenant_admin_on_first_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id text;
  _user_count integer;
BEGIN
  -- Hole tenant_id aus JWT oder Default
  _tenant_id := COALESCE(
    current_setting('request.jwt.claims', true)::json->>'tenant_id',
    'tenant_default'
  );
  
  -- Zähle existierende Nutzer im Tenant (aus employee_settings)
  SELECT COUNT(*) INTO _user_count
  FROM public.employee_settings
  WHERE tenant_id = _tenant_id;
  
  -- Wenn dies der erste Nutzer ist, mache ihn zum tenant_admin
  IF _user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'tenant_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;