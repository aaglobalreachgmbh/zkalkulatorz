-- =============================================
-- SECURITY HARDENING: Tenant Isolation
-- =============================================

-- 1. Fix offer_emails RLS - User can only see their OWN emails
DROP POLICY IF EXISTS "Users can view their tenant's offer emails" ON public.offer_emails;
DROP POLICY IF EXISTS "Users can insert their tenant's offer emails" ON public.offer_emails;
DROP POLICY IF EXISTS "Users can view their own offer emails" ON public.offer_emails;
DROP POLICY IF EXISTS "Tenant admins can view all tenant offer emails" ON public.offer_emails;

-- Users can only view their own emails
CREATE POLICY "Users can view their own offer emails"
  ON public.offer_emails FOR SELECT
  TO authenticated
  USING (
    public.is_same_tenant(tenant_id) 
    AND auth.uid() = user_id
  );

-- Tenant admins can view all tenant emails (for oversight)
CREATE POLICY "Tenant admins can view all tenant offer emails"
  ON public.offer_emails FOR SELECT
  TO authenticated
  USING (
    public.is_same_tenant(tenant_id) 
    AND (public.has_role(auth.uid(), 'admin') OR public.is_tenant_admin(auth.uid()))
  );

-- Users can only insert their own emails
CREATE POLICY "Users can insert their own offer emails"
  ON public.offer_emails FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_same_tenant(tenant_id) 
    AND auth.uid() = user_id
  );

-- Users can only update their own emails
CREATE POLICY "Users can update their own offer emails"
  ON public.offer_emails FOR UPDATE
  TO authenticated
  USING (
    public.is_same_tenant(tenant_id) 
    AND auth.uid() = user_id
  )
  WITH CHECK (
    public.is_same_tenant(tenant_id) 
    AND auth.uid() = user_id
  );

-- 2. Add comments for documentation
COMMENT ON POLICY "Users can view their own offer emails" ON public.offer_emails IS 
  'Security: Users can only see emails they sent. Prevents cross-user data leak within tenant.';

COMMENT ON POLICY "Tenant admins can view all tenant offer emails" ON public.offer_emails IS 
  'Security: Admins have oversight of all tenant communications for compliance.';