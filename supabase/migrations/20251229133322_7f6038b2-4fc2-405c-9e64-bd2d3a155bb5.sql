-- PHASE 5: RLS-Härtung
-- 5.1: saved_offers um tenant_id erweitern

-- Spalte hinzufügen
ALTER TABLE public.saved_offers 
ADD COLUMN IF NOT EXISTS tenant_id text;

-- Default-Wert für existierende Zeilen
UPDATE public.saved_offers 
SET tenant_id = 'tenant_default' 
WHERE tenant_id IS NULL;

-- NOT NULL und Default erzwingen
ALTER TABLE public.saved_offers 
ALTER COLUMN tenant_id SET NOT NULL,
ALTER COLUMN tenant_id SET DEFAULT 'tenant_default';

-- Alte Policies löschen
DROP POLICY IF EXISTS "Users can view own and team offers" ON public.saved_offers;
DROP POLICY IF EXISTS "Users can create their own offers" ON public.saved_offers;
DROP POLICY IF EXISTS "Users can update their own offers" ON public.saved_offers;
DROP POLICY IF EXISTS "Users can delete their own offers" ON public.saved_offers;

-- Neue Policies mit Tenant-Filterung
CREATE POLICY "Users can view own tenant offers"
ON public.saved_offers FOR SELECT
USING (
  is_same_tenant(tenant_id) AND (
    auth.uid() = user_id 
    OR (visibility = 'team' AND team_id IS NOT NULL AND is_team_member(auth.uid(), team_id))
  )
);

CREATE POLICY "Users can create own tenant offers"
ON public.saved_offers FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_same_tenant(tenant_id));

CREATE POLICY "Users can update own tenant offers"
ON public.saved_offers FOR UPDATE
USING (auth.uid() = user_id AND is_same_tenant(tenant_id));

CREATE POLICY "Users can delete own tenant offers"
ON public.saved_offers FOR DELETE
USING (auth.uid() = user_id AND is_same_tenant(tenant_id));

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_saved_offers_tenant ON public.saved_offers(tenant_id);

-- 5.2: customers um tenant_id erweitern

-- Spalte hinzufügen
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS tenant_id text;

-- Default-Wert für existierende Zeilen
UPDATE public.customers 
SET tenant_id = 'tenant_default' 
WHERE tenant_id IS NULL;

-- NOT NULL und Default erzwingen
ALTER TABLE public.customers 
ALTER COLUMN tenant_id SET NOT NULL,
ALTER COLUMN tenant_id SET DEFAULT 'tenant_default';

-- Alte Policies löschen
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can create their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;

-- Neue Policies mit Tenant-Filterung
CREATE POLICY "Users can view own tenant customers"
ON public.customers FOR SELECT
USING (is_same_tenant(tenant_id) AND auth.uid() = user_id);

CREATE POLICY "Users can create own tenant customers"
ON public.customers FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_same_tenant(tenant_id));

CREATE POLICY "Users can update own tenant customers"
ON public.customers FOR UPDATE
USING (auth.uid() = user_id AND is_same_tenant(tenant_id));

CREATE POLICY "Users can delete own tenant customers"
ON public.customers FOR DELETE
USING (auth.uid() = user_id AND is_same_tenant(tenant_id));

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON public.customers(tenant_id);

-- 4.1: tenant_invitations Tabelle für Team-Verwaltung

-- Neue Tabelle für Tenant-Einladungen
CREATE TABLE public.tenant_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  invited_by uuid NOT NULL,
  invite_token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Tenant-Admins können Einladungen ihres Tenants verwalten
CREATE POLICY "Tenant admins can manage own tenant invitations"
ON public.tenant_invitations FOR ALL
USING (is_same_tenant(tenant_id) AND is_tenant_admin(auth.uid()))
WITH CHECK (is_same_tenant(tenant_id) AND is_tenant_admin(auth.uid()));

-- Policy: Service Role kann Einladungen erstellen (für Edge Function)
CREATE POLICY "Service role can manage invitations"
ON public.tenant_invitations FOR ALL
USING (true)
WITH CHECK (true);

-- Indizes für Performance
CREATE INDEX idx_tenant_invitations_token ON public.tenant_invitations(invite_token);
CREATE INDEX idx_tenant_invitations_email ON public.tenant_invitations(email);
CREATE INDEX idx_tenant_invitations_tenant ON public.tenant_invitations(tenant_id);