-- Migration: 20240109_audit_logs.sql
-- Description: Immutable audit trail for business actions.

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    target text,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamptz DEFAULT now()
);

-- RLS: Only admins can view logs. No one can update/delete.
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_read" ON public.audit_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND (ur.role = 'admin' OR ur.role = 'superadmin')
    )
);

CREATE POLICY "audit_logs_service_insert" ON public.audit_logs
FOR INSERT
TO service_role, authenticated
WITH CHECK (true);
-- Authenticated users can insert their own actions via Server Actions (Service Role usually handles this to enforce integrity)

-- Comment
COMMENT ON TABLE public.audit_logs IS 'Immutable record of system actions.';
