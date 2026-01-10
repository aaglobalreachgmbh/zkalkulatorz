-- ============================================
-- Phase 1: Neue Tabellen für Multi-Tenancy Onboarding
-- ============================================

-- 1. Tenants-Tabelle (Kunden/Firmen)
CREATE TABLE IF NOT EXISTS public.tenants (
  id text PRIMARY KEY,
  company_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  address jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial'))
);

-- 2. Allowed-Email-Domains (pro Tenant)
CREATE TABLE IF NOT EXISTS public.tenant_allowed_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(tenant_id, domain)
);

-- 3. Allowed-Email-Addresses (einzelne Adressen für Einladungen)
CREATE TABLE IF NOT EXISTS public.tenant_allowed_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text DEFAULT 'user',
  invite_token text UNIQUE,
  invited_at timestamptz,
  registered_at timestamptz,
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- 4. Profiles um tenant_id erweitern (falls nicht existiert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN tenant_id text;
  END IF;
END $$;

-- 5. Default-Tenant erstellen (für Migration bestehender User)
INSERT INTO public.tenants (id, company_name, contact_email, status)
VALUES ('tenant_default', 'Default Tenant', 'admin@allenetze.de', 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Phase 2: E-Mail-Allowlist Prüfung
-- ============================================

CREATE OR REPLACE FUNCTION public.check_email_allowed(p_email text)
RETURNS TABLE(allowed boolean, tenant_id text, role text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain text;
  v_tenant_id text;
  v_role text;
BEGIN
  -- Domain extrahieren
  v_domain := lower(split_part(p_email, '@', 2));
  
  -- 1. Prüfe explizite E-Mail-Adresse in Allowlist
  SELECT tae.tenant_id, tae.role INTO v_tenant_id, v_role
  FROM public.tenant_allowed_emails tae
  JOIN public.tenants t ON t.id = tae.tenant_id
  WHERE lower(tae.email) = lower(p_email)
  AND t.status = 'active'
  AND tae.registered_at IS NULL;
  
  IF FOUND THEN
    RETURN QUERY SELECT true, v_tenant_id, v_role;
    RETURN;
  END IF;
  
  -- 2. Prüfe Domain-Allowlist
  SELECT tad.tenant_id INTO v_tenant_id
  FROM public.tenant_allowed_domains tad
  JOIN public.tenants t ON t.id = tad.tenant_id
  WHERE lower(tad.domain) = v_domain
  AND t.status = 'active';
  
  IF FOUND THEN
    RETURN QUERY SELECT true, v_tenant_id, 'user'::text;
    RETURN;
  END IF;
  
  -- Nicht in Allowlist - Registrierung nicht erlaubt
  RETURN QUERY SELECT false, NULL::text, NULL::text;
END;
$$;

-- Funktion um Invite-Token zu validieren
CREATE OR REPLACE FUNCTION public.validate_invite_token(p_token text)
RETURNS TABLE(valid boolean, email text, tenant_id text, role text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true,
    tae.email,
    tae.tenant_id,
    tae.role
  FROM public.tenant_allowed_emails tae
  JOIN public.tenants t ON t.id = tae.tenant_id
  WHERE tae.invite_token = p_token
  AND tae.registered_at IS NULL
  AND t.status = 'active';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::text, NULL::text, NULL::text;
  END IF;
END;
$$;

-- ============================================
-- Phase 3: handle_new_user Trigger anpassen
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id text;
  v_role text;
  v_allowed boolean;
  v_display_name text;
BEGIN
  -- Display Name aus Metadaten oder E-Mail ableiten
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
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
  
  -- Profil erstellen/aktualisieren
  INSERT INTO public.profiles (id, email, display_name, tenant_id, is_approved, approved_at)
  VALUES (
    NEW.id,
    NEW.email,
    v_display_name,
    v_tenant_id,
    true,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
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

-- ============================================
-- RLS Policies für neue Tabellen
-- ============================================

-- Tenants RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all tenants"
  ON public.tenants FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant admins can view own tenant"
  ON public.tenants FOR SELECT
  USING (id = get_my_tenant_id() OR has_role(auth.uid(), 'admin'::app_role));

-- tenant_allowed_domains RLS
ALTER TABLE public.tenant_allowed_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all domains"
  ON public.tenant_allowed_domains FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant admins can manage own domains"
  ON public.tenant_allowed_domains FOR ALL
  USING (tenant_id = get_my_tenant_id() AND is_tenant_admin(auth.uid()))
  WITH CHECK (tenant_id = get_my_tenant_id() AND is_tenant_admin(auth.uid()));

CREATE POLICY "Users can view own tenant domains"
  ON public.tenant_allowed_domains FOR SELECT
  USING (tenant_id = get_my_tenant_id());

-- tenant_allowed_emails RLS
ALTER TABLE public.tenant_allowed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all allowed emails"
  ON public.tenant_allowed_emails FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant admins can manage own allowed emails"
  ON public.tenant_allowed_emails FOR ALL
  USING (tenant_id = get_my_tenant_id() AND is_tenant_admin(auth.uid()))
  WITH CHECK (tenant_id = get_my_tenant_id() AND is_tenant_admin(auth.uid()));

CREATE POLICY "Users can view own tenant allowed emails"
  ON public.tenant_allowed_emails FOR SELECT
  USING (tenant_id = get_my_tenant_id());

-- ============================================
-- Indexes für Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tenant_allowed_domains_tenant ON public.tenant_allowed_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_allowed_domains_domain ON public.tenant_allowed_domains(lower(domain));
CREATE INDEX IF NOT EXISTS idx_tenant_allowed_emails_tenant ON public.tenant_allowed_emails(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_allowed_emails_email ON public.tenant_allowed_emails(lower(email));
CREATE INDEX IF NOT EXISTS idx_tenant_allowed_emails_token ON public.tenant_allowed_emails(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);