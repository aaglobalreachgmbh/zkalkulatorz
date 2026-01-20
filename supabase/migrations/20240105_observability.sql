-- Migration: 20240105_observability.sql
-- Phase 9: Feature Observability & Usage Audit
-- FIXED: Removed dependency on profiles table, using auth.jwt() claims instead

-- ============================================
-- 1. User Events Table (Frontend Actions)
-- ============================================
CREATE TABLE IF NOT EXISTS user_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    tenant_id uuid,
    event text NOT NULL,
    context jsonb DEFAULT '{}'::jsonb,
    -- Metadata
    session_id text,
    page_url text,
    user_agent text
);

-- RLS: Users can only see their own events
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_events_own" ON user_events;
CREATE POLICY "user_events_own" ON user_events
FOR ALL
USING (auth.uid() = user_id);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_user_events_user ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event ON user_events(event);
CREATE INDEX IF NOT EXISTS idx_user_events_created ON user_events(created_at DESC);

-- ============================================
-- 2. API Logs Table (Edge Function Telemetry)
-- ============================================
CREATE TABLE IF NOT EXISTS api_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    function_name text NOT NULL,
    status_code integer,
    duration_ms integer,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    request_id text,
    error_message text
);

-- RLS: Only service role can write, admins can read via JWT claims
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "api_logs_service_insert" ON api_logs;
CREATE POLICY "api_logs_service_insert" ON api_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Admin check via JWT custom claims (no profiles table dependency)
DROP POLICY IF EXISTS "api_logs_admin_select" ON api_logs;
CREATE POLICY "api_logs_admin_select" ON api_logs
FOR SELECT
USING (
    (auth.jwt() ->> 'role')::text = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);

CREATE INDEX IF NOT EXISTS idx_api_logs_function ON api_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at DESC);

-- ============================================
-- 3. Error Logs Table (Structured Errors)
-- ============================================
CREATE TABLE IF NOT EXISTS error_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    source text NOT NULL, -- 'frontend', 'edge_function', 'database'
    error_code text,
    error_message text NOT NULL,
    stack_trace text,
    context jsonb DEFAULT '{}'::jsonb,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved boolean DEFAULT false
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Admin check via JWT custom claims (no profiles table dependency)
DROP POLICY IF EXISTS "error_logs_admin_only" ON error_logs;
CREATE POLICY "error_logs_admin_only" ON error_logs
FOR ALL
USING (
    (auth.jwt() ->> 'role')::text = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);

CREATE INDEX IF NOT EXISTS idx_error_logs_source ON error_logs(source);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);

-- ============================================
-- 4. Usage Summary View (Analytics)
-- ============================================
DROP VIEW IF EXISTS vw_usage_summary;
CREATE OR REPLACE VIEW vw_usage_summary AS
SELECT
    date_trunc('day', created_at) AS day,
    event,
    COUNT(*) AS event_count
FROM user_events
GROUP BY 1, 2
ORDER BY 1 DESC, 3 DESC;

-- ============================================
-- 5. Comments
-- ============================================
COMMENT ON TABLE user_events IS 'Phase 9: Frontend user action logging for analytics.';
COMMENT ON TABLE api_logs IS 'Phase 9: Edge Function performance and error tracking.';
COMMENT ON TABLE error_logs IS 'Phase 9: Structured error logging for debugging.';
COMMENT ON VIEW vw_usage_summary IS 'Phase 9: Daily event counts for admin dashboard.';
