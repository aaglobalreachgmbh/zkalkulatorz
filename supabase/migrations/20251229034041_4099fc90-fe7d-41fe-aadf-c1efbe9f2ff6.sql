
-- ============================================
-- PRE-LAUNCH SECURITY HARDENING MIGRATION
-- ============================================

-- ============================================
-- PHASE 1: KRITISCHE RLS-POLICY FIXES
-- ============================================

-- 1. daily_security_reports - Entferne unsichere Service-Role ALL Policy
DROP POLICY IF EXISTS "Service role can manage security reports" ON public.daily_security_reports;

-- Erstelle separate, restriktivere Policies
CREATE POLICY "Service role can insert security reports"
  ON public.daily_security_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update security reports"
  ON public.daily_security_reports FOR UPDATE
  USING (true);

-- 2. seat_assignments - Schütze Mitarbeiter-Emails
DROP POLICY IF EXISTS "Authenticated users can view seat assignments" ON public.seat_assignments;

CREATE POLICY "Users can view own seat or admins can view all"
  ON public.seat_assignments FOR SELECT
  USING (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 3. licenses - Nur noch Admins oder eigener Tenant
DROP POLICY IF EXISTS "Authenticated users can view licenses" ON public.licenses;

CREATE POLICY "Users can view own tenant licenses"
  ON public.licenses FOR SELECT
  USING (
    is_same_tenant(tenant_id) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- PHASE 2: TENANT-ISOLATION
-- ============================================

-- 4. dataset_versions - Tenant-Isolation hinzufügen
DROP POLICY IF EXISTS "Authenticated users can view tenant dataset versions" ON public.dataset_versions;

CREATE POLICY "Users can view own tenant dataset versions"
  ON public.dataset_versions FOR SELECT
  USING (
    is_same_tenant(tenant_id) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 5. custom_datasets - Tenant-Isolation hinzufügen  
DROP POLICY IF EXISTS "Authenticated users can view tenant datasets" ON public.custom_datasets;

CREATE POLICY "Users can view own tenant datasets"
  ON public.custom_datasets FOR SELECT
  USING (
    is_same_tenant(tenant_id) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 6. hardware_images - Von "Anyone" auf Tenant beschränken
DROP POLICY IF EXISTS "Anyone can view hardware images" ON public.hardware_images;

CREATE POLICY "Users can view own tenant hardware images"
  ON public.hardware_images FOR SELECT
  USING (
    is_same_tenant(tenant_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 7. departments - Tenant-Isolation hinzufügen
DROP POLICY IF EXISTS "Authenticated users can view departments" ON public.departments;

CREATE POLICY "Users can view own tenant departments"
  ON public.departments FOR SELECT
  USING (
    is_same_tenant(tenant_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 8. push_provisions - Tenant-Isolation zu aktiven Provisions hinzufügen
DROP POLICY IF EXISTS "Users can view active push provisions" ON public.push_provisions;

CREATE POLICY "Users can view own tenant active push provisions"
  ON public.push_provisions FOR SELECT
  USING (
    is_active = true 
    AND (
      is_same_tenant(tenant_id)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- 9. corporate_bundles - Tenant-Isolation hinzufügen
DROP POLICY IF EXISTS "Authenticated users can view active bundles" ON public.corporate_bundles;

CREATE POLICY "Users can view own tenant active bundles"
  ON public.corporate_bundles FOR SELECT
  USING (
    is_active = true 
    AND (
      is_same_tenant(tenant_id)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- 10. tenant_settings - Tenant-Isolation hinzufügen (war auch offen)
DROP POLICY IF EXISTS "Authenticated users can view tenant settings" ON public.tenant_settings;

CREATE POLICY "Users can view own tenant settings"
  ON public.tenant_settings FOR SELECT
  USING (
    is_same_tenant(tenant_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  );
