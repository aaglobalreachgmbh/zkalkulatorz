-- Step 1: Create helper function to get distribution IDs without triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_distribution_ids()
RETURNS UUID[] 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(distribution_id),
    '{}'::uuid[]
  )
  FROM distribution_partners
  WHERE tenant_id = get_my_tenant_id()
  AND status = 'active';
$$;

-- Step 2: Drop existing problematic policies
DROP POLICY IF EXISTS "Tenant admins can view partners in their distribution" ON distribution_partners;
DROP POLICY IF EXISTS "Tenant admins can invite partners" ON distribution_partners;
DROP POLICY IF EXISTS "Tenant admins can update partners in their distribution" ON distribution_partners;

-- Step 3: Recreate policies using the helper function (no self-reference)
CREATE POLICY "Tenant admins can view partners in their distribution" 
ON distribution_partners 
FOR SELECT 
USING (
  tenant_id = get_my_tenant_id() 
  OR distribution_id = ANY(get_my_distribution_ids())
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Tenant admins can invite partners" 
ON distribution_partners 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'moderator') 
  AND distribution_id = ANY(get_my_distribution_ids())
);

CREATE POLICY "Tenant admins can update partners in their distribution" 
ON distribution_partners 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'moderator') 
  AND distribution_id = ANY(get_my_distribution_ids())
);