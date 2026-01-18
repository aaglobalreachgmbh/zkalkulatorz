-- =====================================================
-- Step 1.1: Custom Branding - Storage Bucket + RLS
-- =====================================================

-- 1. Create tenant-logos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-logos',
  'tenant-logos', 
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for tenant-logos bucket

-- Tenant-Admins can upload logos
CREATE POLICY "Tenant admins can upload logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tenant-logos' 
  AND public.is_tenant_admin(auth.uid())
);

-- All authenticated users can view logos (needed for PDF generation)
CREATE POLICY "Authenticated users can view tenant logos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'tenant-logos');

-- Tenant-Admins can update their logos
CREATE POLICY "Tenant admins can update logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'tenant-logos' AND public.is_tenant_admin(auth.uid()))
WITH CHECK (bucket_id = 'tenant-logos' AND public.is_tenant_admin(auth.uid()));

-- Tenant-Admins can delete logos
CREATE POLICY "Tenant admins can delete logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'tenant-logos' AND public.is_tenant_admin(auth.uid()));

-- 3. Ensure tenant_settings has proper RLS for tenant-admins to update branding
-- (Only add policies that don't exist yet)

-- Allow tenant-admins to update their tenant settings
DROP POLICY IF EXISTS "Tenant admins can update own tenant settings" ON public.tenant_settings;
CREATE POLICY "Tenant admins can update own tenant settings"
ON public.tenant_settings FOR UPDATE TO authenticated
USING (is_same_tenant(tenant_id) AND is_tenant_admin(auth.uid()))
WITH CHECK (is_same_tenant(tenant_id) AND is_tenant_admin(auth.uid()));

-- Allow tenant-admins to insert settings if none exist
DROP POLICY IF EXISTS "Tenant admins can create own tenant settings" ON public.tenant_settings;
CREATE POLICY "Tenant admins can create own tenant settings"
ON public.tenant_settings FOR INSERT TO authenticated
WITH CHECK (is_same_tenant(tenant_id) AND is_tenant_admin(auth.uid()));