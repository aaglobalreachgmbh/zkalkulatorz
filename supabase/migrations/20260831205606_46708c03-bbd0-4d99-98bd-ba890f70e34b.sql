DROP POLICY IF EXISTS "Tenant admins can manage quantity_bonus_tiers" ON public.quantity_bonus_tiers;
CREATE POLICY "Tenant admins can manage quantity_bonus_tiers"
ON public.quantity_bonus_tiers FOR ALL TO authenticated
USING (is_same_tenant(tenant_id) AND (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))
WITH CHECK (is_same_tenant(tenant_id) AND (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Tenant admins can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins can delete logos" ON storage.objects;