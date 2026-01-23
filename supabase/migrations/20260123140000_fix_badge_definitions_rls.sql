-- Migration: Fix badge_definitions RLS policy
-- Issue: USING(true) allows anonymous read access
-- Fix: Restrict to authenticated users only

-- Drop the insecure policy that allows anyone to read
DROP POLICY IF EXISTS "Anyone can view badge definitions" ON public.badge_definitions;

-- Create policy for authenticated users only
CREATE POLICY "Authenticated users can view badge definitions"
  ON public.badge_definitions 
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create policy for admin management (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage badge definitions"
  ON public.badge_definitions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );
