-- Migration: 20240108_feature_flags.sql
-- Description: Tenant-specific feature toggles.

CREATE TABLE IF NOT EXISTS public.feature_flags (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    feature_key text NOT NULL,
    enabled boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, feature_key)
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "feature_flags_read_own" ON public.feature_flags
FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "feature_flags_admin_all" ON public.feature_flags
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND (ur.role = 'admin' OR ur.role = 'superadmin')
    )
);

-- Comments
COMMENT ON TABLE public.feature_flags IS 'Granular feature control per tenant.';
