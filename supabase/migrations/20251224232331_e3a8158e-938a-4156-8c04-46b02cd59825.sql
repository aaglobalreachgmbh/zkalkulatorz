-- Drop the existing SELECT policy and create a more explicit one
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a new policy that explicitly requires authentication AND ownership
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = id);