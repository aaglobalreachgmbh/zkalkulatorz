-- =============================================================================
-- VAULT SECURITY: Admin Audit Trail + IP Blocking Tables
-- =============================================================================

-- 1. Admin Audit Log Table für Compliance und Nachvollziehbarkeit
CREATE TABLE public.admin_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL,
    action text NOT NULL,
    target_table text,
    target_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_hash text,
    user_agent_hash text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins können alle Audit-Logs lesen
CREATE POLICY "Admins can view all audit logs"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service Role kann Logs schreiben (für Edge Functions)
CREATE POLICY "Service role can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (true);

-- Index für Performance
CREATE INDEX idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log(action);

-- 2. Blocked IPs Table für IP-basierte Blockierung
CREATE TABLE public.blocked_ips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_hash text NOT NULL UNIQUE,
    reason text NOT NULL,
    blocked_until timestamptz,
    block_count integer DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- Admins können blocked IPs verwalten
CREATE POLICY "Admins can manage blocked IPs"
ON public.blocked_ips
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service Role kann IPs blockieren (für Edge Functions)
CREATE POLICY "Service role can insert blocked IPs"
ON public.blocked_ips
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update blocked IPs"
ON public.blocked_ips
FOR UPDATE
USING (true);

-- Index für schnelle Lookup
CREATE INDEX idx_blocked_ips_hash ON public.blocked_ips(ip_hash);
CREATE INDEX idx_blocked_ips_blocked_until ON public.blocked_ips(blocked_until);

-- 3. Login Anomalies Table für Anomalie-Erkennung
CREATE TABLE public.login_anomalies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    ip_hash text NOT NULL,
    anomaly_type text NOT NULL,
    severity text NOT NULL DEFAULT 'medium',
    details jsonb DEFAULT '{}',
    resolved boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_anomalies ENABLE ROW LEVEL SECURITY;

-- Admins können Anomalien sehen
CREATE POLICY "Admins can view login anomalies"
ON public.login_anomalies
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service Role kann Anomalien erstellen
CREATE POLICY "Service role can insert login anomalies"
ON public.login_anomalies
FOR INSERT
WITH CHECK (true);

-- Service Role kann Anomalien aktualisieren
CREATE POLICY "Service role can update login anomalies"
ON public.login_anomalies
FOR UPDATE
USING (true);

-- Indexes
CREATE INDEX idx_login_anomalies_user_id ON public.login_anomalies(user_id);
CREATE INDEX idx_login_anomalies_ip_hash ON public.login_anomalies(ip_hash);
CREATE INDEX idx_login_anomalies_created_at ON public.login_anomalies(created_at DESC);

-- 4. Honeypot Submissions Table
CREATE TABLE public.honeypot_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_hash text NOT NULL,
    user_agent_hash text,
    form_id text,
    field_name text NOT NULL,
    field_value text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.honeypot_submissions ENABLE ROW LEVEL SECURITY;

-- Admins können Submissions sehen
CREATE POLICY "Admins can view honeypot submissions"
ON public.honeypot_submissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service Role kann Submissions erstellen
CREATE POLICY "Service role can insert honeypot submissions"
ON public.honeypot_submissions
FOR INSERT
WITH CHECK (true);

-- Index
CREATE INDEX idx_honeypot_submissions_ip_hash ON public.honeypot_submissions(ip_hash);
CREATE INDEX idx_honeypot_submissions_created_at ON public.honeypot_submissions(created_at DESC);