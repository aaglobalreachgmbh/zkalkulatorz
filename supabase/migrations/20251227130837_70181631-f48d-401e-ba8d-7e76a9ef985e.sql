-- Create trigger for automatic last_activity_at updates on profiles
-- This ensures GDPR inactivity tracking works even without frontend hook

CREATE OR REPLACE TRIGGER update_profiles_last_activity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_activity();

COMMENT ON TRIGGER update_profiles_last_activity ON public.profiles IS 
  'Automatically updates last_activity_at on profile updates for GDPR compliance tracking';