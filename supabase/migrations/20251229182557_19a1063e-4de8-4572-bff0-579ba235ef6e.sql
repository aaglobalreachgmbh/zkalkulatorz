-- ============================================================================
-- MASTER SECURITY FRAMEWORK - RLS HARDENING MIGRATION (Teil 1)
-- ============================================================================

-- SÄULE 1: RLS-HÄRTUNG - Tenant-Isolation für alle kritischen Tabellen
-- ============================================================================

-- 1. CALCULATION_HISTORY - Tenant-Isolation hinzufügen
DROP POLICY IF EXISTS "Users can view own calculation history" ON calculation_history;
DROP POLICY IF EXISTS "Users can create own calculation history" ON calculation_history;
DROP POLICY IF EXISTS "Users can delete own calculation history" ON calculation_history;

CREATE POLICY "Users can view own tenant calculation history" ON calculation_history
FOR SELECT USING (
  auth.uid() = user_id 
  AND is_same_tenant(tenant_id)
);

CREATE POLICY "Users can create own tenant calculation history" ON calculation_history
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND is_same_tenant(tenant_id)
);

CREATE POLICY "Users can delete own tenant calculation history" ON calculation_history
FOR DELETE USING (
  auth.uid() = user_id 
  AND is_same_tenant(tenant_id)
);

-- Admin-Fallback für calculation_history
DROP POLICY IF EXISTS "Admins can view all calculation history" ON calculation_history;
CREATE POLICY "Admins can view all calculation history" ON calculation_history
FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 2. OFFER_DRAFTS - Tenant-Isolation härten
DROP POLICY IF EXISTS "Users can view own offer drafts" ON offer_drafts;
DROP POLICY IF EXISTS "Users can create own offer drafts" ON offer_drafts;
DROP POLICY IF EXISTS "Users can update own offer drafts" ON offer_drafts;
DROP POLICY IF EXISTS "Users can delete own offer drafts" ON offer_drafts;

CREATE POLICY "Users can view own tenant offer drafts" ON offer_drafts
FOR SELECT USING (
  auth.uid() = user_id 
  AND is_same_tenant(tenant_id)
);

CREATE POLICY "Users can create own tenant offer drafts" ON offer_drafts
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND is_same_tenant(tenant_id)
);

CREATE POLICY "Users can update own tenant offer drafts" ON offer_drafts
FOR UPDATE USING (
  auth.uid() = user_id 
  AND is_same_tenant(tenant_id)
);

CREATE POLICY "Users can delete own tenant offer drafts" ON offer_drafts
FOR DELETE USING (
  auth.uid() = user_id 
  AND is_same_tenant(tenant_id)
);

-- Tenant-Admin kann alle Drafts im eigenen Tenant sehen
CREATE POLICY "Tenant admins can view all tenant drafts" ON offer_drafts
FOR SELECT USING (
  is_same_tenant(tenant_id) 
  AND is_tenant_admin(auth.uid())
);

-- Admin-Fallback für offer_drafts
DROP POLICY IF EXISTS "Admins can manage all offer drafts" ON offer_drafts;
CREATE POLICY "Admins can manage all offer drafts" ON offer_drafts
FOR ALL USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3. EMPLOYEE_SETTINGS - Tenant-Isolation verstärken
DROP POLICY IF EXISTS "Users can view own employee settings" ON employee_settings;
DROP POLICY IF EXISTS "Users can view own settings" ON employee_settings;

CREATE POLICY "Users can view own tenant employee settings" ON employee_settings
FOR SELECT USING (
  (auth.uid() = user_id AND is_same_tenant(tenant_id))
  OR (is_same_tenant(tenant_id) AND is_tenant_admin(auth.uid()))
  OR has_role(auth.uid(), 'admin')
);

-- Update-Policy für employee_settings härten
DROP POLICY IF EXISTS "Tenant admins can update employee settings" ON employee_settings;
CREATE POLICY "Tenant admins can update tenant employee settings" ON employee_settings
FOR UPDATE USING (
  (is_same_tenant(tenant_id) AND is_tenant_admin(auth.uid()))
  OR has_role(auth.uid(), 'admin')
);

-- Insert-Policy für employee_settings härten
DROP POLICY IF EXISTS "Tenant admins can insert employee settings" ON employee_settings;
CREATE POLICY "Tenant admins can insert tenant employee settings" ON employee_settings
FOR INSERT WITH CHECK (
  (is_same_tenant(tenant_id) AND is_tenant_admin(auth.uid()))
  OR has_role(auth.uid(), 'admin')
);

-- 4. SEAT_ASSIGNMENTS - Tenant-Isolation hinzufügen
DROP POLICY IF EXISTS "Users can view own seat or admins can view all" ON seat_assignments;
DROP POLICY IF EXISTS "Users can view own seat assignments" ON seat_assignments;

CREATE POLICY "Users can view own tenant seat assignments" ON seat_assignments
FOR SELECT USING (
  (auth.uid() = user_id AND is_same_tenant(tenant_id))
  OR (is_same_tenant(tenant_id) AND is_tenant_admin(auth.uid()))
  OR has_role(auth.uid(), 'admin')
);

-- Insert-Policy für seat_assignments
DROP POLICY IF EXISTS "Admins can create seat assignments" ON seat_assignments;
CREATE POLICY "Tenant admins can create tenant seat assignments" ON seat_assignments
FOR INSERT WITH CHECK (
  (is_same_tenant(tenant_id) AND is_tenant_admin(auth.uid()))
  OR has_role(auth.uid(), 'admin')
);

-- Delete-Policy für seat_assignments
DROP POLICY IF EXISTS "Admins can delete seat assignments" ON seat_assignments;
CREATE POLICY "Tenant admins can delete tenant seat assignments" ON seat_assignments
FOR DELETE USING (
  (is_same_tenant(tenant_id) AND is_tenant_admin(auth.uid()))
  OR has_role(auth.uid(), 'admin')
);

-- ============================================================================
-- SÄULE 5: Cross-Tenant Attempt Detection Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_cross_tenant_attempt(
  _user_id uuid,
  _attempted_tenant_id text,
  _actual_tenant_id text,
  _action text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    risk_level,
    details
  ) VALUES (
    'cross_tenant_attempt',
    _user_id,
    'critical',
    jsonb_build_object(
      'attempted_tenant', _attempted_tenant_id,
      'actual_tenant', _actual_tenant_id,
      'action', _action,
      'timestamp', now()
    )
  );
END;
$$;

-- ============================================================================
-- SÄULE 2: Helper-Funktion für Tenant-Manager (ohne neue Enum-Werte)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_tenant_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('tenant_admin')
  )
$$;