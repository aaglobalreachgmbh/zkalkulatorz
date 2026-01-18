-- =====================================================
-- PHASE 1: Service-Role Policies auf TO service_role beschränken
-- 14 Tabellen mit 18 Policies werden korrigiert
-- =====================================================

-- 1. access_audit_log
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.access_audit_log;
CREATE POLICY "Service role can insert audit logs" ON public.access_audit_log
FOR INSERT TO service_role
WITH CHECK (true);

-- 2. admin_audit_log
DROP POLICY IF EXISTS "Service role can insert admin audit logs" ON public.admin_audit_log;
CREATE POLICY "Service role can insert admin audit logs" ON public.admin_audit_log
FOR INSERT TO service_role
WITH CHECK (true);

-- 3. blocked_ips
DROP POLICY IF EXISTS "Service role can manage blocked IPs" ON public.blocked_ips;
CREATE POLICY "Service role can manage blocked IPs" ON public.blocked_ips
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- 4. daily_security_reports
DROP POLICY IF EXISTS "Service role can manage security reports" ON public.daily_security_reports;
CREATE POLICY "Service role can manage security reports" ON public.daily_security_reports
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- 5. gdpr_deletion_log
DROP POLICY IF EXISTS "Service role can insert GDPR logs" ON public.gdpr_deletion_log;
CREATE POLICY "Service role can insert GDPR logs" ON public.gdpr_deletion_log
FOR INSERT TO service_role
WITH CHECK (true);

-- 6. honeypot_submissions
DROP POLICY IF EXISTS "Service role can insert honeypot data" ON public.honeypot_submissions;
CREATE POLICY "Service role can insert honeypot data" ON public.honeypot_submissions
FOR INSERT TO service_role
WITH CHECK (true);

-- 7. login_anomalies
DROP POLICY IF EXISTS "Service role can manage login anomalies" ON public.login_anomalies;
CREATE POLICY "Service role can manage login anomalies" ON public.login_anomalies
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- 8. mfa_backup_codes - Service Role Policy
DROP POLICY IF EXISTS "Service role can manage backup codes" ON public.mfa_backup_codes;
CREATE POLICY "Service role can manage backup codes" ON public.mfa_backup_codes
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- 9. rate_limit_entries
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limit_entries;
CREATE POLICY "Service role can manage rate limits" ON public.rate_limit_entries
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- 10. tenant_invitations
DROP POLICY IF EXISTS "Service role can manage invitations" ON public.tenant_invitations;
CREATE POLICY "Service role can manage invitations" ON public.tenant_invitations
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- 11. threat_feed_entries
DROP POLICY IF EXISTS "Service role can manage threat entries" ON public.threat_feed_entries;
CREATE POLICY "Service role can manage threat entries" ON public.threat_feed_entries
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- 12. threat_feeds
DROP POLICY IF EXISTS "Service role can manage threat feeds" ON public.threat_feeds;
CREATE POLICY "Service role can manage threat feeds" ON public.threat_feeds
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- 13. user_activity_log - Service Role
DROP POLICY IF EXISTS "Service role can insert activity logs" ON public.user_activity_log;
CREATE POLICY "Service role can insert activity logs" ON public.user_activity_log
FOR INSERT TO service_role
WITH CHECK (true);

-- 14. security_events - Service Role
DROP POLICY IF EXISTS "Service role can manage security events" ON public.security_events;
CREATE POLICY "Service role can manage security events" ON public.security_events
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- PHASE 2: tenant_distribution_map SELECT Policy härten
-- Problem: (auth.uid() IS NOT NULL) -> Jeder authentifizierte User
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can view distribution map" ON public.tenant_distribution_map;
DROP POLICY IF EXISTS "Users can view own tenant distribution" ON public.tenant_distribution_map;

CREATE POLICY "Users can view own tenant distribution" ON public.tenant_distribution_map
FOR SELECT TO authenticated
USING (
  public.is_same_tenant(tenant_id) 
  OR public.has_role(auth.uid(), 'admin')
);

-- Service role policy für tenant_distribution_map
DROP POLICY IF EXISTS "Service role can manage distribution map" ON public.tenant_distribution_map;
CREATE POLICY "Service role can manage distribution map" ON public.tenant_distribution_map
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- PHASE 3: licenses Policy auf Tenant-Admins beschränken
-- Nur Tenant-Admins und System-Admins sehen Lizenz-Details
-- =====================================================

DROP POLICY IF EXISTS "Users can view own tenant licenses" ON public.licenses;
DROP POLICY IF EXISTS "Tenant admins can view own tenant licenses" ON public.licenses;

CREATE POLICY "Tenant admins can view own tenant licenses" ON public.licenses
FOR SELECT TO authenticated
USING (
  (public.is_same_tenant(tenant_id) AND public.is_tenant_admin(auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

-- Service role für licenses
DROP POLICY IF EXISTS "Service role can manage licenses" ON public.licenses;
CREATE POLICY "Service role can manage licenses" ON public.licenses
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- PHASE 4: Security Helper Functions erstellen
-- Wiederverwendbare Funktionen für zukünftige Tabellen
-- =====================================================

-- Prüft ob User Besitzer eines Datensatzes ist
CREATE OR REPLACE FUNCTION public.is_owner(record_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT record_user_id = auth.uid()
$$;

-- Prüft ob User zum Tenant gehört UND Besitzer ist
CREATE OR REPLACE FUNCTION public.is_tenant_owner(
  record_tenant_id TEXT, 
  record_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_same_tenant(record_tenant_id) AND (record_user_id = auth.uid())
$$;

-- Prüft ob User zum Tenant gehört ODER Admin ist
CREATE OR REPLACE FUNCTION public.is_tenant_member_or_admin(record_tenant_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_same_tenant(record_tenant_id) OR has_role(auth.uid(), 'admin')
$$;

-- =====================================================
-- PHASE 5: Zusätzliche Härtungen für sensible Tabellen
-- =====================================================

-- Stelle sicher, dass MFA-Codes nur für eigenen User sichtbar sind
DROP POLICY IF EXISTS "Users can view own MFA codes" ON public.mfa_backup_codes;
DROP POLICY IF EXISTS "Users can manage own backup codes" ON public.mfa_backup_codes;

CREATE POLICY "Users can view own backup codes" ON public.mfa_backup_codes
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own backup codes" ON public.mfa_backup_codes
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own backup codes" ON public.mfa_backup_codes
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Stelle sicher, dass Login-Anomalien nur für Admins sichtbar sind
DROP POLICY IF EXISTS "Admins can view login anomalies" ON public.login_anomalies;
CREATE POLICY "Admins can view login anomalies" ON public.login_anomalies
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Security Events nur für Admins lesbar
DROP POLICY IF EXISTS "Admins can view security events" ON public.security_events;
CREATE POLICY "Admins can view security events" ON public.security_events
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Daily Security Reports nur für Admins
DROP POLICY IF EXISTS "Admins can view security reports" ON public.daily_security_reports;
CREATE POLICY "Admins can view security reports" ON public.daily_security_reports
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Blocked IPs nur für Admins lesbar
DROP POLICY IF EXISTS "Admins can view blocked IPs" ON public.blocked_ips;
CREATE POLICY "Admins can view blocked IPs" ON public.blocked_ips
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Threat Feeds nur für Admins
DROP POLICY IF EXISTS "Admins can view threat feeds" ON public.threat_feeds;
CREATE POLICY "Admins can view threat feeds" ON public.threat_feeds
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Threat Feed Entries nur für Admins
DROP POLICY IF EXISTS "Admins can view threat entries" ON public.threat_feed_entries;
CREATE POLICY "Admins can view threat entries" ON public.threat_feed_entries
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- GDPR Deletion Log nur für Admins
DROP POLICY IF EXISTS "Admins can view GDPR logs" ON public.gdpr_deletion_log;
CREATE POLICY "Admins can view GDPR logs" ON public.gdpr_deletion_log
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin Audit Log nur für Admins
DROP POLICY IF EXISTS "Admins can view admin audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can view admin audit log" ON public.admin_audit_log
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Access Audit Log nur für Admins
DROP POLICY IF EXISTS "Admins can view access audit log" ON public.access_audit_log;
CREATE POLICY "Admins can view access audit log" ON public.access_audit_log
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));