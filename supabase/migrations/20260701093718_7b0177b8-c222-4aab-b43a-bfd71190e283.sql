
-- 1) calendar_events: require same-tenant for 'tenant' visibility
DROP POLICY IF EXISTS "Calendar visibility based on role hierarchy" ON public.calendar_events;
CREATE POLICY "Calendar visibility based on role hierarchy"
ON public.calendar_events
FOR SELECT
USING (
  user_id = auth.uid()
  OR user_id = ANY (public.get_visible_user_ids())
  OR (visibility = 'tenant' AND public.is_same_tenant(tenant_id))
);

-- 2) synced_emails: same fix
DROP POLICY IF EXISTS "Email visibility based on role hierarchy" ON public.synced_emails;
CREATE POLICY "Email visibility based on role hierarchy"
ON public.synced_emails
FOR SELECT
USING (
  user_id = auth.uid()
  OR user_id = ANY (public.get_visible_user_ids())
  OR (visibility = 'tenant' AND public.is_same_tenant(tenant_id))
);

-- 3) notifications: only service_role or self-targeted inserts
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Service role can create any notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Users can create own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 4) tenant_distribution_map: drop the auth-any-user read policy; keep tenant-scoped one
DROP POLICY IF EXISTS "Authenticated users can read distribution map" ON public.tenant_distribution_map;

-- 5) hardware-images: remove broad list policy. Public URLs still work (bucket is public);
--    only /list API is affected, which we don't want to expose.
DROP POLICY IF EXISTS "Authenticated users can view hardware images" ON storage.objects;
