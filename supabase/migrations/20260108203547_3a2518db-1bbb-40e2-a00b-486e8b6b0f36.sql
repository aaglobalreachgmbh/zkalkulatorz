-- Create quantity_bonus_tiers table for cross-selling bonuses
CREATE TABLE public.quantity_bonus_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  scope_type TEXT NOT NULL DEFAULT 'all' CHECK (scope_type IN ('all', 'user', 'team')),
  scope_id UUID,
  min_quantity INTEGER NOT NULL,
  bonus_per_contract NUMERIC(10,2) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, scope_type, scope_id, min_quantity)
);

-- Enable RLS
ALTER TABLE public.quantity_bonus_tiers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their tenant's tiers
CREATE POLICY "Users can read quantity_bonus_tiers for their tenant"
ON public.quantity_bonus_tiers FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT sa.tenant_id FROM seat_assignments sa WHERE sa.user_id = auth.uid()
  )
);

-- Policy: Tenant admins can manage tiers
CREATE POLICY "Tenant admins can manage quantity_bonus_tiers"
ON public.quantity_bonus_tiers FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT sa.tenant_id FROM seat_assignments sa WHERE sa.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'tenant_admin')
  )
);

-- Insert default example tiers for demonstration
-- These will be tenant-specific when created through the admin UI