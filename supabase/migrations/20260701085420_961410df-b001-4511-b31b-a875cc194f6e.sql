
-- 1. Lock down every SECURITY DEFINER function in schema public
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema_name,
           p.proname AS function_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
      fn.schema_name, fn.function_name, fn.args
    );
  END LOOP;
END $$;

-- 2. Re-grant EXECUTE only for RPCs the client is meant to call.
--    All of these functions still enforce authorization internally.
DO $$
DECLARE
  target text;
  allow text[] := ARRAY[
    'get_my_tenant_id',
    'get_visible_user_ids',
    'has_role',
    'is_tenant_admin'
  ];
  fn record;
BEGIN
  FOREACH target IN ARRAY allow LOOP
    FOR fn IN
      SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.prosecdef = true
        AND p.proname = target
    LOOP
      EXECUTE format(
        'GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated',
        fn.proname, fn.args
      );
    END LOOP;
  END LOOP;
END $$;

-- 3a. tenant-logos: tenant-scoped access
DROP POLICY IF EXISTS "Authenticated users can view tenant logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view tenant logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view tenant logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own tenant logos" ON storage.objects;

CREATE POLICY "Users can view own tenant logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1] = public.get_my_tenant_id()
);

DROP POLICY IF EXISTS "Tenant admins can upload tenant logos" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can update tenant logos" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can delete tenant logos" ON storage.objects;

CREATE POLICY "Tenant admins can upload tenant logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1] = public.get_my_tenant_id()
  AND (
    public.is_tenant_admin(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Tenant admins can update tenant logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1] = public.get_my_tenant_id()
  AND (
    public.is_tenant_admin(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Tenant admins can delete tenant logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1] = public.get_my_tenant_id()
  AND (
    public.is_tenant_admin(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- 3b. visit-photos: uploads/reads/deletes scoped to caller's uid folder
DROP POLICY IF EXISTS "Users can upload visit photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can insert visit photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own visit photos" ON storage.objects;

CREATE POLICY "Users can upload own visit photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'visit-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can read own visit photos" ON storage.objects;
CREATE POLICY "Users can read own visit photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'visit-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own visit photos" ON storage.objects;
CREATE POLICY "Users can delete own visit photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'visit-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3c. Public buckets: remove anonymous listing/broad-SELECT policies.
--     Individual public URLs continue to work via Storage's public-bucket path.
DROP POLICY IF EXISTS "Public read access for public buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public can list public buckets" ON storage.objects;
DROP POLICY IF EXISTS "Anon can list public buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public read for public buckets" ON storage.objects;
