-- Phase 1: Avatar URL Spalte hinzufügen
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Phase 2: handle_new_user Trigger für Google OAuth erweitern
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id text;
  v_role text;
  v_allowed boolean;
  v_display_name text;
  v_avatar_url text;
BEGIN
  -- Display Name: Google liefert 'full_name', manuell 'display_name'
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',      -- Google OAuth
    NEW.raw_user_meta_data->>'name',           -- Fallback
    NEW.raw_user_meta_data->>'display_name',   -- Manuell gesetzt
    split_part(NEW.email, '@', 1)              -- Aus E-Mail ableiten
  );
  
  -- Avatar URL von Google OAuth
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',     -- Standard
    NEW.raw_user_meta_data->>'picture'         -- Google OAuth Format
  );
  
  -- Prüfe ob E-Mail in Allowlist
  SELECT allowed, cea.tenant_id, cea.role 
  INTO v_allowed, v_tenant_id, v_role
  FROM public.check_email_allowed(NEW.email) cea;
  
  -- Fallback auf tenant_default für Migration/Tests
  IF NOT v_allowed OR v_tenant_id IS NULL THEN
    v_tenant_id := 'tenant_default';
    v_role := 'user';
  END IF;
  
  -- Profil erstellen/aktualisieren mit Avatar
  INSERT INTO public.profiles (id, email, display_name, avatar_url, tenant_id, is_approved, approved_at)
  VALUES (
    NEW.id,
    NEW.email,
    v_display_name,
    v_avatar_url,
    v_tenant_id,
    true,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    tenant_id = COALESCE(profiles.tenant_id, EXCLUDED.tenant_id),
    is_approved = true,
    approved_at = COALESCE(profiles.approved_at, now()),
    updated_at = now();
  
  -- Rolle zuweisen
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Wenn aus Allowlist: als registriert markieren
  UPDATE public.tenant_allowed_emails
  SET registered_at = now()
  WHERE lower(email) = lower(NEW.email)
  AND registered_at IS NULL;
  
  -- Employee Settings erstellen
  INSERT INTO public.employee_settings (user_id, tenant_id, display_name)
  VALUES (NEW.id, v_tenant_id, v_display_name)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Phase 3: Deine E-Mail in Allowlist für Superadmin (UNIQUE auf tenant_id + email)
INSERT INTO public.tenant_allowed_emails (email, tenant_id, role, invited_by)
VALUES ('info@aandaglobal.de', 'tenant_default', 'superadmin', NULL)
ON CONFLICT (tenant_id, email) DO UPDATE SET role = 'superadmin';