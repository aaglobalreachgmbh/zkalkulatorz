-- Migration: 20240106_admin_policies.sql
-- Phase 10: Admin Access Policies & Infrastructure

-- 0. Ensure user_roles table exists (Self-Healing)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'moderator', 'tenant_admin', 'admin', 'superadmin')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 0b. Policy for user_roles (Admins can manage, Users can read own)
DROP POLICY IF EXISTS "user_roles_read_own" ON public.user_roles;
CREATE POLICY "user_roles_read_own" ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;
CREATE POLICY "user_roles_admin_manage" ON public.user_roles
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND (ur.role = 'admin' OR ur.role = 'superadmin')
    )
);

-- 1. Grant Admins access to ALL user_events
CREATE POLICY "user_events_admin_select" ON public.user_events
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND (ur.role = 'admin' OR ur.role = 'superadmin')
    )
);

-- 2. Grant Admins access to ALL api_logs
DROP POLICY IF EXISTS "api_logs_admin_select" ON public.api_logs;
CREATE POLICY "api_logs_admin_select_v2" ON public.api_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND (ur.role = 'admin' OR ur.role = 'superadmin')
    )
);

-- 3. Grant Admins access to ALL error_logs
DROP POLICY IF EXISTS "error_logs_admin_only" ON public.error_logs;
CREATE POLICY "error_logs_admin_select_v2" ON public.error_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND (ur.role = 'admin' OR ur.role = 'superadmin')
    )
);

-- 4. Grant Admins access to ALL profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
CREATE POLICY "profiles_admin_select" ON public.profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND (ur.role = 'admin' OR ur.role = 'superadmin')
    )
    OR
    auth.uid() = id -- Users see themselves
);

