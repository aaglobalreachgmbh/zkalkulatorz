DROP POLICY IF EXISTS "Anyone can view badge definitions" ON public.badge_definitions;

CREATE POLICY "Authenticated users can view badge definitions"
ON public.badge_definitions
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

REVOKE ALL ON public.badge_definitions FROM anon;
GRANT SELECT ON public.badge_definitions TO authenticated;
GRANT ALL ON public.badge_definitions TO service_role;