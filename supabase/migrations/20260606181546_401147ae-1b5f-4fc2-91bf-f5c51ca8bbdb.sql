
-- =========================================================
-- 1. get_my_tenant_id: no fallback to tenant_default
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'tenant_id', '')
$$;

-- =========================================================
-- 2. get_visible_user_ids: scope admins to their own tenant
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_visible_user_ids()
RETURNS uuid[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result UUID[];
  my_tenant TEXT;
BEGIN
  my_tenant := public.get_my_tenant_id();

  IF my_tenant IS NULL THEN
    RETURN ARRAY[auth.uid()];
  END IF;

  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tenant_admin') THEN
    SELECT ARRAY_AGG(DISTINCT p.id) INTO result
    FROM profiles p
    WHERE p.tenant_id = my_tenant;
    RETURN COALESCE(result, ARRAY[auth.uid()]);
  END IF;

  SELECT ARRAY_AGG(DISTINCT user_id) INTO result
  FROM (
    SELECT auth.uid() as user_id
    UNION
    SELECT employee_id as user_id
    FROM employee_assignments
    WHERE supervisor_id = auth.uid()
  ) sub;

  RETURN COALESCE(result, ARRAY[auth.uid()]);
END;
$$;

-- =========================================================
-- 3. bonus_rules: scope to tenant + admin-only writes
-- =========================================================
DROP POLICY IF EXISTS "Admins can manage bonus rules" ON public.bonus_rules;
DROP POLICY IF EXISTS "Users can view bonus rules for their tenant" ON public.bonus_rules;

CREATE POLICY "Tenant members can view bonus rules"
  ON public.bonus_rules FOR SELECT TO authenticated
  USING (public.is_same_tenant(tenant_id));

CREATE POLICY "Tenant admins can manage bonus rules"
  ON public.bonus_rules FOR ALL TO authenticated
  USING (public.is_same_tenant(tenant_id) AND public.is_tenant_admin(auth.uid()))
  WITH CHECK (public.is_same_tenant(tenant_id) AND public.is_tenant_admin(auth.uid()));

-- =========================================================
-- 4. news_items: tenant-scoped SELECT
-- =========================================================
DROP POLICY IF EXISTS "Tenant members can view news" ON public.news_items;
CREATE POLICY "Tenant members can view news"
  ON public.news_items FOR SELECT TO authenticated
  USING (public.is_same_tenant(tenant_id));

-- =========================================================
-- 5. onboarding_progress: enforce user_id = auth.uid() on insert
-- =========================================================
DROP POLICY IF EXISTS "System can create onboarding progress" ON public.onboarding_progress;
CREATE POLICY "Users can create own onboarding progress"
  ON public.onboarding_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =========================================================
-- 6. Security/audit tables: remove public INSERT/UPDATE policies
-- =========================================================
DROP POLICY IF EXISTS "Service role can insert blocked IPs" ON public.blocked_ips;
DROP POLICY IF EXISTS "Service role can update blocked IPs" ON public.blocked_ips;

DROP POLICY IF EXISTS "Service role can insert login anomalies" ON public.login_anomalies;
DROP POLICY IF EXISTS "Service role can update login anomalies" ON public.login_anomalies;

DROP POLICY IF EXISTS "Service role can insert security reports" ON public.daily_security_reports;
DROP POLICY IF EXISTS "Service role can update security reports" ON public.daily_security_reports;

DROP POLICY IF EXISTS "Service role can insert honeypot submissions" ON public.honeypot_submissions;

DROP POLICY IF EXISTS "Service role can insert access logs" ON public.access_audit_log;

DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.admin_audit_log;

DROP POLICY IF EXISTS "Service role can insert deletion logs" ON public.gdpr_deletion_log;

DROP POLICY IF EXISTS "Service role can insert threat feeds" ON public.threat_feeds;
DROP POLICY IF EXISTS "Service role can update threat feeds" ON public.threat_feeds;
DROP POLICY IF EXISTS "Admins can manage threat feeds" ON public.threat_feeds;
CREATE POLICY "Admins can manage threat feeds"
  ON public.threat_feeds FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 7. user_activity_log: remove spoofable public INSERT
-- =========================================================
DROP POLICY IF EXISTS "Service role can insert activity" ON public.user_activity_log;
DROP POLICY IF EXISTS "Admins can view all activity" ON public.user_activity_log;
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity_log;
DROP POLICY IF EXISTS "Users can insert own activity" ON public.user_activity_log;

CREATE POLICY "Users can insert own activity"
  ON public.user_activity_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own activity"
  ON public.user_activity_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity"
  ON public.user_activity_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 8. shared_offers: remove anon SELECT (use SECURITY DEFINER RPC)
-- =========================================================
DROP POLICY IF EXISTS "Public can view with valid token" ON public.shared_offers;

-- =========================================================
-- 9. tenant_allowed_emails: hide invite_token from regular members
-- =========================================================
DROP POLICY IF EXISTS "Users can view own tenant allowed emails" ON public.tenant_allowed_emails;
CREATE POLICY "Tenant admins can view allowed emails"
  ON public.tenant_allowed_emails FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_my_tenant_id()
    AND (public.is_tenant_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  );

-- =========================================================
-- 10. won_offer_data: ownership-based access
-- =========================================================
DROP POLICY IF EXISTS "Tenant members can view won_offer_data" ON public.won_offer_data;
DROP POLICY IF EXISTS "Tenant members can insert won_offer_data" ON public.won_offer_data;
DROP POLICY IF EXISTS "Tenant members can update won_offer_data" ON public.won_offer_data;

CREATE POLICY "Owners and admins can view won_offer_data"
  ON public.won_offer_data FOR SELECT TO authenticated
  USING (
    public.is_same_tenant(tenant_id)
    AND (user_id = auth.uid() OR public.is_tenant_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Users can insert own won_offer_data"
  ON public.won_offer_data FOR INSERT TO authenticated
  WITH CHECK (public.is_same_tenant(tenant_id) AND user_id = auth.uid());

CREATE POLICY "Owners can update own won_offer_data"
  ON public.won_offer_data FOR UPDATE TO authenticated
  USING (public.is_same_tenant(tenant_id) AND user_id = auth.uid())
  WITH CHECK (public.is_same_tenant(tenant_id) AND user_id = auth.uid());

-- =========================================================
-- 11. Realtime: restrict messages to authenticated users
-- =========================================================
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='realtime' AND tablename='messages'
      AND policyname='Authenticated users can use realtime'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Authenticated users can use realtime"
        ON realtime.messages FOR SELECT TO authenticated
        USING (auth.uid() IS NOT NULL)
    $p$;
  END IF;
END $$;
