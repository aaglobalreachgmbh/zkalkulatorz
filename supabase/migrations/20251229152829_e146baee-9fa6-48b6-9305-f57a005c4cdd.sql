-- Super-Admin Rolle für can.akar@gmx.de hinzufügen
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'can.akar@gmx.de'
ON CONFLICT (user_id, role) DO NOTHING;