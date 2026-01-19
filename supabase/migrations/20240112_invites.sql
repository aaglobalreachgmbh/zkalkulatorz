-- Migration: 20240112_invites.sql
-- Description: Invite tokens for secure onboarding.

CREATE TABLE IF NOT EXISTS public.invite_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    token text UNIQUE NOT NULL,
    email text NOT NULL,
    role text NOT NULL,
    tenant_id uuid REFERENCES public.tenants(id),
    expires_at timestamptz DEFAULT (now() + interval '7 days'),
    accepted boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

-- Admins can create/read invites
CREATE POLICY "invites_admin_all" ON public.invite_tokens
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND (ur.role = 'admin' OR ur.role = 'superadmin')
    )
);

-- Public needs to read 'token' to validate? 
-- Actually we can make this 'security definer' function or just allow public read on unexpired tokens if they have the token.
-- Safer: Use a secure RPC or server action with service role to validate token, to avoid exposing list.
-- RLS default deny for public is good. Server Action uses Service Role.

COMMENT ON TABLE public.invite_tokens IS 'Secure invite links.';
