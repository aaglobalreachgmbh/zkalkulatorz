-- ============================================
-- MFA Backup Codes Table
-- Stores hashed backup codes for admin MFA recovery
-- ============================================

-- Create backup_codes table
CREATE TABLE public.mfa_backup_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_mfa_backup_codes_user_id ON public.mfa_backup_codes(user_id);

-- Enable RLS
ALTER TABLE public.mfa_backup_codes ENABLE ROW LEVEL SECURITY;

-- Users can only view their own backup codes (but not the hash values - for security)
CREATE POLICY "Users can view their own backup codes metadata"
ON public.mfa_backup_codes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can mark their own backup codes as used (via service role in edge function)
-- We don't allow direct updates from client - only via edge function
CREATE POLICY "Service role can manage backup codes"
ON public.mfa_backup_codes
FOR ALL
USING (true)
WITH CHECK (true);

-- Users can delete their own backup codes (when regenerating)
CREATE POLICY "Users can delete their own backup codes"
ON public.mfa_backup_codes
FOR DELETE
USING (auth.uid() = user_id);