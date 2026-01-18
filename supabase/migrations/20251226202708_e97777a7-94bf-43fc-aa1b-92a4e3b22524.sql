-- Add last_activity_at column to profiles table for GDPR compliance
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for faster queries on inactive users
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON public.profiles(last_activity_at);

-- Create table for GDPR deletion requests and audit
CREATE TABLE IF NOT EXISTS public.gdpr_deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_hash TEXT,
  deletion_reason TEXT NOT NULL DEFAULT 'inactivity_2_years',
  deleted_tables JSONB DEFAULT '[]'::jsonb,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deletion_requested_by TEXT DEFAULT 'system_auto'
);

-- Enable RLS on GDPR deletion log
ALTER TABLE public.gdpr_deletion_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view deletion logs
CREATE POLICY "Admins can view deletion logs"
ON public.gdpr_deletion_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert deletion logs
CREATE POLICY "Service role can insert deletion logs"
ON public.gdpr_deletion_log
FOR INSERT
WITH CHECK (true);

-- Add trigger to update last_activity_at on any profile update
CREATE OR REPLACE FUNCTION public.update_last_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_activity_at = now();
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_profile_activity ON public.profiles;

CREATE TRIGGER update_profile_activity
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_last_activity();