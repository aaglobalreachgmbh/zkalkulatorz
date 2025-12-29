-- ============================================
-- PHASE 2: MULTI-TENANT HIERARCHIE
-- Distributions-Tabellen für SaaS-Plattform
-- ============================================

-- 1. Distributions-Tabelle (Master-Tenants für Großhändler)
CREATE TABLE public.distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  
  -- Branding
  branding JSONB DEFAULT '{}'::jsonb,
  -- Schema: { logo_url: string, primary_color: string, accent_color: string, badge_hidden: boolean }
  
  -- Features & Limits
  features JSONB DEFAULT '{}'::jsonb,
  max_partners INTEGER DEFAULT 100,
  
  -- Provisions-Einstellungen
  default_provision_split NUMERIC DEFAULT 0 CHECK (default_provision_split >= 0 AND default_provision_split <= 100),
  
  -- Metadata
  contact_email TEXT,
  contact_phone TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
  trial_ends_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Distribution-Partner Zuordnung
CREATE TABLE public.distribution_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id UUID NOT NULL REFERENCES public.distributions(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  
  -- Partner-spezifische Einstellungen
  provision_split_pct NUMERIC DEFAULT NULL CHECK (provision_split_pct IS NULL OR (provision_split_pct >= 0 AND provision_split_pct <= 100)),
  -- NULL = verwendet Distribution Default
  
  -- Partner-Branding (überschreibt Distribution)
  branding_override JSONB DEFAULT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'revoked')),
  
  -- Einladung
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_email TEXT,
  invite_token TEXT UNIQUE,
  invite_expires_at TIMESTAMPTZ,
  
  -- Aktivierung
  onboarded_at TIMESTAMPTZ,
  onboarded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Limits
  max_seats INTEGER DEFAULT 10,
  max_users INTEGER DEFAULT 20,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure unique partner per distribution
  UNIQUE(distribution_id, tenant_id)
);

-- 3. Erweitere tenant_settings um Distribution-Link
ALTER TABLE public.tenant_settings 
ADD COLUMN IF NOT EXISTS distribution_id UUID REFERENCES public.distributions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS hide_margin_for_subusers BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS features_override JSONB DEFAULT '{}'::jsonb;

-- 4. Erweitere user_roles um Sub-User Rolle
-- (app_role enum bereits vorhanden: admin, moderator, user)
-- Wir nutzen ein neues Feld für die feinere Unterscheidung

ALTER TABLE public.employee_settings
ADD COLUMN IF NOT EXISTS is_subuser BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_margins BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_export_pdf BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_manage_customers BOOLEAN DEFAULT true;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_distributions_slug ON public.distributions(slug);
CREATE INDEX IF NOT EXISTS idx_distributions_status ON public.distributions(status);
CREATE INDEX IF NOT EXISTS idx_distribution_partners_distribution_id ON public.distribution_partners(distribution_id);
CREATE INDEX IF NOT EXISTS idx_distribution_partners_tenant_id ON public.distribution_partners(tenant_id);
CREATE INDEX IF NOT EXISTS idx_distribution_partners_status ON public.distribution_partners(status);
CREATE INDEX IF NOT EXISTS idx_distribution_partners_invite_token ON public.distribution_partners(invite_token);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_distribution_id ON public.tenant_settings(distribution_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_partners ENABLE ROW LEVEL SECURITY;

-- Super-Admins können alle Distributionen sehen/verwalten
CREATE POLICY "Super admins can manage all distributions"
  ON public.distributions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Super-Admins können alle Partner-Zuordnungen verwalten
CREATE POLICY "Super admins can manage all distribution partners"
  ON public.distribution_partners FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Tenant-Admins (Moderatoren) können ihre eigene Distribution sehen
CREATE POLICY "Tenant admins can view their distribution"
  ON public.distributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.distribution_partners dp
      WHERE dp.distribution_id = distributions.id
        AND dp.tenant_id = get_my_tenant_id()
        AND dp.status = 'active'
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Tenant-Admins können ihre eigenen Partner sehen und verwalten
CREATE POLICY "Tenant admins can view partners in their distribution"
  ON public.distribution_partners FOR SELECT
  USING (
    tenant_id = get_my_tenant_id()
    OR EXISTS (
      SELECT 1 FROM public.distribution_partners my_dp
      WHERE my_dp.distribution_id = distribution_partners.distribution_id
        AND my_dp.tenant_id = get_my_tenant_id()
        AND my_dp.status = 'active'
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Tenant-Admins können Partner einladen (wenn sie Moderator-Rolle haben)
CREATE POLICY "Tenant admins can invite partners"
  ON public.distribution_partners FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'moderator'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.distribution_partners my_dp
      WHERE my_dp.distribution_id = distribution_partners.distribution_id
        AND my_dp.tenant_id = get_my_tenant_id()
        AND my_dp.status = 'active'
    )
  );

-- Tenant-Admins können Partner-Status aktualisieren
CREATE POLICY "Tenant admins can update partners in their distribution"
  ON public.distribution_partners FOR UPDATE
  USING (
    has_role(auth.uid(), 'moderator'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.distribution_partners my_dp
      WHERE my_dp.distribution_id = distribution_partners.distribution_id
        AND my_dp.tenant_id = get_my_tenant_id()
        AND my_dp.status = 'active'
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Funktion: Hole Distribution für aktuellen Tenant
CREATE OR REPLACE FUNCTION public.get_my_distribution_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dp.distribution_id
  FROM public.distribution_partners dp
  WHERE dp.tenant_id = get_my_tenant_id()
    AND dp.status = 'active'
  LIMIT 1
$$;

-- Funktion: Prüfe ob User zu einer Distribution gehört
CREATE OR REPLACE FUNCTION public.is_distribution_member(_distribution_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.distribution_partners dp
    WHERE dp.distribution_id = _distribution_id
      AND dp.tenant_id = get_my_tenant_id()
      AND dp.status = 'active'
  )
$$;

-- Funktion: Hole effektiven Provisions-Split für Tenant
CREATE OR REPLACE FUNCTION public.get_effective_provision_split()
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    dp.provision_split_pct,
    d.default_provision_split,
    0
  )
  FROM public.distribution_partners dp
  JOIN public.distributions d ON d.id = dp.distribution_id
  WHERE dp.tenant_id = get_my_tenant_id()
    AND dp.status = 'active'
  LIMIT 1
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-Update updated_at für distributions
CREATE TRIGGER update_distributions_updated_at
  BEFORE UPDATE ON public.distributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-Update updated_at für distribution_partners  
CREATE TRIGGER update_distribution_partners_updated_at
  BEFORE UPDATE ON public.distribution_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();