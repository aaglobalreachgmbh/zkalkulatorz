-- Migration: 20240107_admin_users_view.sql
-- Description: Creates a secure view to easily query all admin users.

CREATE OR REPLACE VIEW admin_users_view AS
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.last_sign_in_at,
    ur.role
FROM auth.users au
JOIN user_roles ur ON au.id = ur.user_id
WHERE ur.role IN ('admin', 'superadmin');

-- Security: Only admins can read this view
ALTER VIEW admin_users_view OWNER TO postgres;
GRANT SELECT ON admin_users_view TO service_role;
-- We do NOT grant select to authenticated/anon to prevent leaking admin list
