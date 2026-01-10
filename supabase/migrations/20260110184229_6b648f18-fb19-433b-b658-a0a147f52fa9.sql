-- =====================================================
-- Phase 1: Admin Setup Status & Notifications Tables
-- =====================================================

-- 1.1 Tabelle für Admin-Ersteinrichtungs-Status
CREATE TABLE public.admin_setup_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id text NOT NULL,
  -- Wann wurde Setup abgeschlossen
  setup_completed_at timestamptz,
  setup_version integer DEFAULT 1,
  -- Welche Schritte wurden abgeschlossen
  provisions_configured boolean DEFAULT false,
  hardware_configured boolean DEFAULT false,
  on_top_rules_configured boolean DEFAULT false,
  team_configured boolean DEFAULT false,
  -- Bei Reaktivierung zurücksetzen
  reset_at timestamptz,
  reset_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- RLS für admin_setup_status
ALTER TABLE public.admin_setup_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own setup status"
  ON public.admin_setup_status FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own setup status"
  ON public.admin_setup_status FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own setup status"
  ON public.admin_setup_status FOR UPDATE
  USING (user_id = auth.uid());

-- 1.2 Tabelle für Admin-Benachrichtigungen (neue Registrierungen etc.)
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  type text NOT NULL, -- 'new_registration', 'setup_reminder', 'approval_required'
  title text NOT NULL,
  message text,
  target_user_id uuid, -- NULL = alle Admins des Tenants
  related_user_id uuid, -- Der neue User bei Registrierungen
  related_email text, -- E-Mail des neuen Users
  is_read boolean DEFAULT false,
  read_at timestamptz,
  read_by uuid,
  action_taken text, -- 'approved', 'rejected', 'dismissed'
  action_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS für admin_notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admins können Benachrichtigungen ihres Tenants lesen
CREATE POLICY "Tenant admins can read notifications"
  ON public.admin_notifications FOR SELECT
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
    AND (
      target_user_id IS NULL 
      OR target_user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('superadmin', 'admin', 'tenant_admin')
    )
  );

-- Admins können Benachrichtigungen aktualisieren (markieren als gelesen)
CREATE POLICY "Tenant admins can update notifications"
  ON public.admin_notifications FOR UPDATE
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('superadmin', 'admin', 'tenant_admin')
    )
  );

-- 1.3 Profiles erweitern für Account-Status
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS paused_at timestamptz,
ADD COLUMN IF NOT EXISTS reactivated_at timestamptz;

-- 1.4 Trigger für automatische Admin-Benachrichtigung bei neuen Registrierungen
CREATE OR REPLACE FUNCTION public.notify_admins_new_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Nur wenn User nicht automatisch approved ist
  IF NEW.is_approved = false THEN
    INSERT INTO public.admin_notifications (
      tenant_id, 
      type, 
      title, 
      message, 
      related_user_id,
      related_email
    )
    VALUES (
      COALESCE(NEW.tenant_id, 'tenant_default'),
      'new_registration',
      'Neue Registrierung wartet auf Freischaltung',
      format('Benutzer %s (%s) hat sich registriert und wartet auf Freischaltung.', 
             COALESCE(NEW.display_name, 'Unbekannt'), 
             COALESCE(NEW.email, 'Keine E-Mail')),
      NEW.id,
      NEW.email
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger nur erstellen wenn er nicht existiert
DROP TRIGGER IF EXISTS on_new_profile_notify_admins ON public.profiles;
CREATE TRIGGER on_new_profile_notify_admins
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_registration();

-- 1.5 Updated_at Trigger für admin_setup_status
CREATE TRIGGER update_admin_setup_status_updated_at
  BEFORE UPDATE ON public.admin_setup_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 1.6 Handle_new_user anpassen: Nicht-Allowlist-User starten mit is_approved = false
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
  v_is_approved boolean;
BEGIN
  -- Display Name: Google liefert 'full_name', manuell 'display_name'
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Avatar URL von Google OAuth
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );
  
  -- Prüfe ob E-Mail in Allowlist
  SELECT allowed, cea.tenant_id, cea.role 
  INTO v_allowed, v_tenant_id, v_role
  FROM public.check_email_allowed(NEW.email) cea;
  
  -- Wenn in Allowlist: automatisch approved, sonst pending
  IF v_allowed AND v_tenant_id IS NOT NULL THEN
    v_is_approved := true;
  ELSE
    v_tenant_id := 'tenant_default';
    v_role := 'user';
    v_is_approved := false; -- Muss erst freigeschaltet werden!
  END IF;
  
  -- Profil erstellen/aktualisieren
  INSERT INTO public.profiles (id, email, display_name, avatar_url, tenant_id, is_approved, approved_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    v_display_name, 
    v_avatar_url, 
    v_tenant_id, 
    v_is_approved, 
    CASE WHEN v_is_approved THEN now() ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    tenant_id = COALESCE(profiles.tenant_id, EXCLUDED.tenant_id),
    is_approved = CASE 
      WHEN profiles.is_approved = true THEN true 
      ELSE EXCLUDED.is_approved 
    END,
    approved_at = CASE 
      WHEN profiles.approved_at IS NOT NULL THEN profiles.approved_at
      WHEN EXCLUDED.is_approved THEN now()
      ELSE NULL
    END,
    updated_at = now();
  
  -- Rolle zuweisen
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Allowlist aktualisieren
  UPDATE public.tenant_allowed_emails
  SET registered_at = now()
  WHERE lower(email) = lower(NEW.email)
  AND registered_at IS NULL;
  
  -- Employee Settings erstellen
  INSERT INTO public.employee_settings (user_id, tenant_id, display_name)
  VALUES (NEW.id, v_tenant_id, v_display_name)
  ON CONFLICT (user_id, tenant_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;