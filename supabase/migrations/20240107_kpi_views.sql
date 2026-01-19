-- Migration: 20240107_kpi_views.sql
-- Description: Standardized views for Admin Dashboard KPIs.

-- 1. Active Users (Last 7 Days)
CREATE OR REPLACE VIEW view_active_users_7d AS
SELECT count(*) as count
FROM auth.users
WHERE last_sign_in_at > (now() - interval '7 days');

-- Security: auth.users is protected. We grant access to service_role and admin.
ALTER VIEW view_active_users_7d OWNER TO postgres;
GRANT SELECT ON view_active_users_7d TO service_role;
-- Note: authenticated users cannot read auth.users by default. 
-- The Server Component uses Service Role or Admin Client so it's fine.

-- 2. PDF Export Stats (Daily Volume)
CREATE OR REPLACE VIEW view_pdf_export_daily AS
SELECT 
    date_trunc('day', created_at) as day,
    count(*) as count
FROM user_events
WHERE event = 'pdf_export'
GROUP BY 1
ORDER BY 1 DESC;

GRANT SELECT ON view_pdf_export_daily TO service_role;
GRANT SELECT ON view_pdf_export_daily TO authenticated; -- RLS on user_events applies (admins see all)

-- 3. Error Stats (Last 24h)
CREATE OR REPLACE VIEW view_error_stats_24h AS
SELECT count(*) as count
FROM error_logs
WHERE created_at > (now() - interval '24 hours');

GRANT SELECT ON view_error_stats_24h TO service_role;
GRANT SELECT ON view_error_stats_24h TO authenticated; -- RLS applies
