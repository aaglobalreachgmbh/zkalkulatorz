-- Migration: Secure Gatekeeper Approval Flow
-- 1. Ensure is_approved column exists and default is FALSE (Strict Mode)
-- 2. Backfill existing users to TRUE (Safe Mode)
-- 3. Whitelist Super Admins

-- 1. Alter table to ensure is_approved defaults to false
ALTER TABLE public.profiles 
ALTER COLUMN is_approved SET DEFAULT false;

-- 2. Backfill: Set all CURRENT users to approved (to avoid breaking live app)
-- EXCEPT if they are clearly new/unapproved (optional, but safer to approve existing)
UPDATE public.profiles
SET is_approved = true
WHERE is_approved IS NULL;

-- 3. Super Admin Whitelist (Explicit Security)
-- Ensure these two emails are ALWAYS approved
UPDATE public.profiles
SET is_approved = true
WHERE email IN ('akar@allenetze.de', 'info@aandaglobal.de');

-- 4. Update the handle_new_user trigger function to ensure is_approved is false for new signups
-- (We recreate it to be sure logic is correct)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, is_approved)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    -- Auto-approve ONLY super admins
    (new.email IN ('akar@allenetze.de', 'info@aandaglobal.de'))
  );
  RETURN new;
END;
$$;
