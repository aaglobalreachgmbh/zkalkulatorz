-- Phase 1: RLS-Policy für dataset_versions erweitern
-- Alte restriktive Policy löschen (falls existent)
DROP POLICY IF EXISTS "Admins can view full dataset versions" ON public.dataset_versions;
DROP POLICY IF EXISTS "Tenant admins can view full dataset versions" ON public.dataset_versions;

-- Neue Policy: Alle authentifizierten Tenant-Mitglieder können lesen
CREATE POLICY "Tenant members can view dataset versions"
ON public.dataset_versions FOR SELECT
TO authenticated
USING (is_same_tenant(tenant_id));