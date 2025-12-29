-- Add approval columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);

-- Performance index for approval queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON public.profiles(is_approved);

-- Security definer function to check approval status
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_approved FROM public.profiles WHERE id = _user_id),
    false
  )
$$;

-- Auto-approve all users who have admin or tenant_admin role (prevent lockout)
UPDATE public.profiles 
SET is_approved = true, approved_at = now()
WHERE id IN (
  SELECT user_id FROM public.user_roles 
  WHERE role IN ('admin', 'tenant_admin')
);