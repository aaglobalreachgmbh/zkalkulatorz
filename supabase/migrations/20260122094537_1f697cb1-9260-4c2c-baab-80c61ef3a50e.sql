-- Tighten access to internal configuration tables: permission_templates & onboarding_templates
-- Goal: prevent unauthenticated (anon/public) reads.

BEGIN;

-- ========== permission_templates ==========
ALTER TABLE public.permission_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (names are known from pg_policies)
DROP POLICY IF EXISTS "Tenant members can view permission templates" ON public.permission_templates;
DROP POLICY IF EXISTS "Tenant admins can manage permission templates" ON public.permission_templates;

-- Authenticated tenant members can view templates for their tenant (and optional global templates)
CREATE POLICY "Tenant members can view permission templates"
ON public.permission_templates
FOR SELECT
TO authenticated
USING (
  public.is_same_tenant(tenant_id) OR tenant_id = ''
);

-- Only tenant admins / admins can manage
CREATE POLICY "Tenant admins can manage permission templates"
ON public.permission_templates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['admin'::public.app_role, 'tenant_admin'::public.app_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['admin'::public.app_role, 'tenant_admin'::public.app_role])
  )
);


-- ========== onboarding_templates ==========
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members can view onboarding templates" ON public.onboarding_templates;
DROP POLICY IF EXISTS "Admins can manage onboarding templates" ON public.onboarding_templates;

CREATE POLICY "Tenant members can view onboarding templates"
ON public.onboarding_templates
FOR SELECT
TO authenticated
USING (
  public.is_same_tenant(tenant_id) OR tenant_id = ''
);

CREATE POLICY "Admins can manage onboarding templates"
ON public.onboarding_templates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['admin'::public.app_role, 'tenant_admin'::public.app_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = ANY (ARRAY['admin'::public.app_role, 'tenant_admin'::public.app_role])
  )
);

COMMIT;