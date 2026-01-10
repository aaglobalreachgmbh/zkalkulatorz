-- ============================================
-- Migration: Stacked On-Top Bonus System
-- ============================================

-- 1. Rename columns in quantity_bonus_tiers for clarity
-- min_quantity -> position_number (welche Position im Angebot)
-- bonus_per_contract -> position_bonus (Bonus für diese Position)

-- Add new column position_number (keep min_quantity for migration)
ALTER TABLE public.quantity_bonus_tiers 
ADD COLUMN IF NOT EXISTS position_number INTEGER;

-- Copy data from min_quantity to position_number
UPDATE public.quantity_bonus_tiers 
SET position_number = min_quantity 
WHERE position_number IS NULL;

-- Add comment for clarity
COMMENT ON TABLE public.quantity_bonus_tiers IS 
  'Gestaffelte On-Top Boni pro Vertragsposition (1., 2., 3. Tarif etc.)';

COMMENT ON COLUMN public.quantity_bonus_tiers.position_number IS 
  'Position im Angebot (1 = erster Tarif, 2 = zweiter Tarif, etc.)';

COMMENT ON COLUMN public.quantity_bonus_tiers.bonus_per_contract IS 
  'On-Top Bonus für diese Position in Euro';

-- 2. Create bonus_rules table for admin-definable rules
CREATE TABLE IF NOT EXISTS public.bonus_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  description TEXT,
  
  -- Rule type
  rule_type TEXT NOT NULL DEFAULT 'monthly_threshold', -- 'monthly_threshold', 'quarterly_threshold', 'special_period', 'tariff_family'
  
  -- Conditions
  condition_field TEXT NOT NULL DEFAULT 'contracts_submitted', -- 'contracts_submitted', 'revenue_generated', 'tariff_family'
  condition_operator TEXT NOT NULL DEFAULT 'gte', -- 'gte', 'lte', 'eq', 'between'
  condition_value NUMERIC NOT NULL DEFAULT 0, -- e.g. 50 (for 50+ contracts)
  condition_value_max NUMERIC, -- for 'between' operator
  condition_text TEXT, -- for text-based conditions like tariff_family
  
  -- Bonus type
  bonus_type TEXT NOT NULL DEFAULT 'fixed', -- 'fixed', 'percentage', 'multiplier'
  bonus_value NUMERIC NOT NULL DEFAULT 0, -- e.g. 100 (€) or 10 (%) or 1.5 (multiplier)
  
  -- Validity
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Scope (who does this rule apply to)
  scope_type TEXT DEFAULT 'all', -- 'all', 'team', 'user'
  scope_id UUID, -- team_id or user_id if scoped
  
  -- Stacking behavior
  is_stackable BOOLEAN DEFAULT TRUE, -- Can combine with other rules
  priority INTEGER DEFAULT 0, -- Higher = evaluated first
  
  -- Metadata
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bonus_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bonus_rules
CREATE POLICY "Users can view bonus rules for their tenant"
  ON public.bonus_rules
  FOR SELECT
  USING (true); -- All authenticated users can see rules

CREATE POLICY "Admins can manage bonus rules"
  ON public.bonus_rules
  FOR ALL
  USING (true)
  WITH CHECK (true); -- Will be restricted by application logic

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_bonus_rules_tenant_active 
  ON public.bonus_rules(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_bonus_rules_valid_period 
  ON public.bonus_rules(valid_from, valid_until);

CREATE INDEX IF NOT EXISTS idx_quantity_bonus_position 
  ON public.quantity_bonus_tiers(tenant_id, position_number);

-- 3. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_bonus_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bonus_rules
DROP TRIGGER IF EXISTS trigger_bonus_rules_updated_at ON public.bonus_rules;
CREATE TRIGGER trigger_bonus_rules_updated_at
  BEFORE UPDATE ON public.bonus_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bonus_rules_updated_at();

-- 4. Insert default position bonuses if table is empty
INSERT INTO public.quantity_bonus_tiers (
  tenant_id, position_number, min_quantity, bonus_per_contract, name, description, 
  scope_type, is_active, valid_from
)
SELECT '', 1, 1, 50, '1. Tarif On-Top', 'On-Top Bonus für den ersten Tarif im Angebot', 'all', true, CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM public.quantity_bonus_tiers WHERE position_number = 1 OR min_quantity = 1);

INSERT INTO public.quantity_bonus_tiers (
  tenant_id, position_number, min_quantity, bonus_per_contract, name, description, 
  scope_type, is_active, valid_from
)
SELECT '', 2, 2, 70, '2. Tarif On-Top', 'On-Top Bonus für den zweiten Tarif im Angebot', 'all', true, CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM public.quantity_bonus_tiers WHERE position_number = 2 OR min_quantity = 2);

INSERT INTO public.quantity_bonus_tiers (
  tenant_id, position_number, min_quantity, bonus_per_contract, name, description, 
  scope_type, is_active, valid_from
)
SELECT '', 3, 3, 80, '3. Tarif On-Top', 'On-Top Bonus für den dritten Tarif im Angebot', 'all', true, CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM public.quantity_bonus_tiers WHERE position_number = 3 OR min_quantity = 3);