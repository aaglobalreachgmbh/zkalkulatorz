-- Password Reset Tokens Table
CREATE TABLE public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index für schnelle Token-Suche
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens(email);

-- RLS: Nur via Service Role zugreifbar (kein public access)
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Kein Public-Zugriff - nur Service Role kann zugreifen
CREATE POLICY "No public access to password_reset_tokens" 
ON public.password_reset_tokens 
FOR ALL 
USING (false);

-- Cleanup: Alte abgelaufene Tokens nach 24 Stunden löschen (automatisch via scheduled function)
COMMENT ON TABLE public.password_reset_tokens IS 'Stores password reset tokens with expiry. Clean up expired tokens periodically.';