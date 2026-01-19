-- Migration: 20240110_licenses.sql
-- Description: License management for tenants.

-- Ensure tenants table exists (Self-Healing)
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.licenses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE NOT NULL,
    max_seats integer DEFAULT 1,
    expires_at timestamptz DEFAULT (now() + interval '30 days'),
    plan text DEFAULT 'standard',
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "licenses_read_admin" ON public.licenses
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND (ur.role = 'admin' OR ur.role = 'superadmin')
    )
);

CREATE POLICY "licenses_write_admin" ON public.licenses
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND (ur.role = 'admin' OR ur.role = 'superadmin')
    )
);

COMMENT ON TABLE public.licenses IS 'Tenant licensing details.';
