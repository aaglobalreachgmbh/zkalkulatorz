-- Step 2: Create AI access control table and functions

-- AI access control table
CREATE TABLE public.ai_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT false NOT NULL,
    enabled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    enabled_at TIMESTAMPTZ,
    features JSONB DEFAULT '{"consultant": true, "offer_check": true, "data_import": true}'::jsonb,
    max_requests_per_day INTEGER DEFAULT 50,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_access ENABLE ROW LEVEL SECURITY;

-- Security definer function to check superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'::app_role
  )
$$;

-- Function to check AI access
CREATE OR REPLACE FUNCTION public.has_ai_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ai_access
    WHERE user_id = _user_id
      AND enabled = true
  )
  OR public.is_superadmin(_user_id)
$$;

-- RLS Policies for ai_access
-- Superadmins can do everything
CREATE POLICY "Superadmins can manage ai_access"
ON public.ai_access
FOR ALL
TO authenticated
USING (public.is_superadmin(auth.uid()));

-- Users can view their own access
CREATE POLICY "Users can view own ai_access"
ON public.ai_access
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Update trigger for updated_at
CREATE TRIGGER update_ai_access_updated_at
BEFORE UPDATE ON public.ai_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_ai_access_user_id ON public.ai_access(user_id);
CREATE INDEX idx_ai_access_enabled ON public.ai_access(enabled) WHERE enabled = true;