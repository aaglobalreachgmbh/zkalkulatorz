
-- ============================================
-- SECURITY HARDENING: Economic Data Protection
-- ============================================
-- Purpose: Restrict access to sensitive financial data
-- (EK prices, provisions, margins) to authorized users only
-- ============================================

-- 1. Create function to check if user can view economic data
CREATE OR REPLACE FUNCTION public.can_view_economics(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_role(_user_id, 'admin') 
    OR public.is_tenant_admin(_user_id)
    OR COALESCE(
      (SELECT can_view_margins 
       FROM public.employee_settings 
       WHERE user_id = _user_id
       LIMIT 1),
      false
    );
$$;

-- 2. Create safe catalog function for hardware (without ek_net)
CREATE OR REPLACE FUNCTION public.get_catalog_hardware_safe()
RETURNS TABLE (
  id uuid,
  tenant_id text,
  hardware_id text,
  brand text,
  model text,
  category text,
  sort_order integer,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id, tenant_id, hardware_id, brand, model, category,
    sort_order, is_active, created_at, updated_at
    -- NOTE: ek_net is intentionally excluded
  FROM public.tenant_hardware
  WHERE public.is_same_tenant(tenant_id) AND is_active = true;
$$;

-- 3. Create safe dataset catalog function (without provisions/omo_matrix)
CREATE OR REPLACE FUNCTION public.get_dataset_catalog_safe(p_tenant_id text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', id,
    'version_name', version_name,
    'valid_from', valid_from,
    'mobile_tariffs', mobile_tariffs,
    'sub_variants', sub_variants,
    'hardware_catalog', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', h->>'id',
          'brand', h->>'brand',
          'model', h->>'model',
          'category', h->>'category'
          -- NOTE: ekNet is intentionally excluded
        )
      )
      FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(hardware_catalog) = 'array' 
             THEN hardware_catalog 
             ELSE '[]'::jsonb END
      ) h
    )
    -- NOTE: provisions and omo_matrix are intentionally excluded
  )
  FROM public.dataset_versions
  WHERE tenant_id = p_tenant_id AND is_active = true
  LIMIT 1;
$$;

-- ============================================
-- 4. HARDEN RLS POLICIES: tenant_hardware
-- ============================================

-- Drop old permissive policy
DROP POLICY IF EXISTS "Users can view own tenant hardware" ON public.tenant_hardware;

-- Create restrictive policy: only economics-authorized users can see ek_net
CREATE POLICY "Economics-authorized users can view tenant hardware"
  ON public.tenant_hardware FOR SELECT
  TO authenticated
  USING (
    public.is_same_tenant(tenant_id) AND (
      public.has_role(auth.uid(), 'admin')
      OR public.is_tenant_admin(auth.uid())
      OR public.can_view_economics(auth.uid())
    )
  );

-- ============================================
-- 5. HARDEN RLS POLICIES: tenant_provisions
-- ============================================

-- Drop old permissive policy
DROP POLICY IF EXISTS "Users can view own tenant provisions" ON public.tenant_provisions;

-- Create restrictive policy: only admins/tenant-admins/economics-authorized
CREATE POLICY "Economics-authorized users can view tenant provisions"
  ON public.tenant_provisions FOR SELECT
  TO authenticated
  USING (
    public.is_same_tenant(tenant_id) AND (
      public.has_role(auth.uid(), 'admin')
      OR public.is_tenant_admin(auth.uid())
      OR public.can_view_economics(auth.uid())
    )
  );

-- ============================================
-- 6. HARDEN RLS POLICIES: dataset_versions
-- ============================================

-- Drop old permissive policy
DROP POLICY IF EXISTS "Users can view own tenant dataset versions" ON public.dataset_versions;

-- Create restrictive policy: full access only for admins (includes provisions)
CREATE POLICY "Admins can view full dataset versions"
  ON public.dataset_versions FOR SELECT
  TO authenticated
  USING (
    public.is_same_tenant(tenant_id) AND (
      public.has_role(auth.uid(), 'admin')
      OR public.is_tenant_admin(auth.uid())
    )
  );

-- ============================================
-- 7. HARDEN RLS POLICIES: custom_datasets
-- ============================================

-- Drop old permissive policy
DROP POLICY IF EXISTS "Users can view own tenant datasets" ON public.custom_datasets;

-- Create restrictive policy
CREATE POLICY "Admins can view full custom datasets"
  ON public.custom_datasets FOR SELECT
  TO authenticated
  USING (
    public.is_same_tenant(tenant_id) AND (
      public.has_role(auth.uid(), 'admin')
      OR public.is_tenant_admin(auth.uid())
    )
  );

-- ============================================
-- 8. HARDEN RLS POLICIES: push_provisions
-- ============================================

-- Drop old permissive policy
DROP POLICY IF EXISTS "Users can view own tenant active push provisions" ON public.push_provisions;

-- Create restrictive policy
CREATE POLICY "Economics-authorized users can view push provisions"
  ON public.push_provisions FOR SELECT
  TO authenticated
  USING (
    public.is_same_tenant(tenant_id) AND (
      public.has_role(auth.uid(), 'admin')
      OR public.is_tenant_admin(auth.uid())
      OR public.can_view_economics(auth.uid())
    )
  );

-- ============================================
-- 9. HARDEN RLS POLICIES: quantity_bonus_tiers
-- ============================================

-- Drop old permissive policy
DROP POLICY IF EXISTS "Users can read quantity_bonus_tiers for their tenant" ON public.quantity_bonus_tiers;

-- Create restrictive policy
CREATE POLICY "Economics-authorized users can view quantity bonuses"
  ON public.quantity_bonus_tiers FOR SELECT
  TO authenticated
  USING (
    public.is_same_tenant(tenant_id) AND (
      public.has_role(auth.uid(), 'admin')
      OR public.is_tenant_admin(auth.uid())
      OR public.can_view_economics(auth.uid())
    )
  );

-- ============================================
-- 10. Add comments for documentation
-- ============================================
COMMENT ON FUNCTION public.can_view_economics IS 
'Security function: Returns true if user is admin, tenant_admin, or has can_view_margins enabled in employee_settings. Used to protect economic data (EK, provisions, margins).';

COMMENT ON FUNCTION public.get_catalog_hardware_safe IS 
'Security function: Returns hardware catalog without ek_net (purchase price). Safe for all tenant users.';

COMMENT ON FUNCTION public.get_dataset_catalog_safe IS 
'Security function: Returns dataset catalog without provisions and omo_matrix. Safe for all tenant users.';
