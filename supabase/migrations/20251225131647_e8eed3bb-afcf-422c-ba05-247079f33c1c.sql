-- Create security_events table for logging security incidents
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash TEXT,
  user_agent_hash TEXT,
  details JSONB DEFAULT '{}',
  email_sent BOOLEAN DEFAULT false,
  is_bot BOOLEAN DEFAULT false,
  is_phishing BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (edge functions)
CREATE POLICY "Service role can insert security events"
ON public.security_events
FOR INSERT
TO service_role
WITH CHECK (true);

-- Only service role can read
CREATE POLICY "Service role can read security events"
ON public.security_events
FOR SELECT
TO service_role
USING (true);

-- Admins can view security events
CREATE POLICY "Admins can view security events"
ON public.security_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX idx_security_events_risk_level ON public.security_events(risk_level);
CREATE INDEX idx_security_events_event_type ON public.security_events(event_type);