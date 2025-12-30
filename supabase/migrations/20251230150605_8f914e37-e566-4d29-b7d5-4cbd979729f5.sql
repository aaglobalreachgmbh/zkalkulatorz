-- Add Admin bypass policies for customers table
CREATE POLICY "Admins can view all customers"
ON public.customers
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all customers"
ON public.customers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all customers"
ON public.customers
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add Admin bypass policies for saved_offers table
CREATE POLICY "Admins can view all offers"
ON public.saved_offers
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all offers"
ON public.saved_offers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all offers"
ON public.saved_offers
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add Admin bypass for customer_contracts
CREATE POLICY "Admins can view all contracts"
ON public.customer_contracts
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all contracts"
ON public.customer_contracts
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add Admin bypass for customer_notes
CREATE POLICY "Admins can view all notes"
ON public.customer_notes
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all notes"
ON public.customer_notes
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add Admin bypass for offer_emails
CREATE POLICY "Admins can view all offer emails"
ON public.offer_emails
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add Admin bypass for offer_drafts
CREATE POLICY "Admins can view all drafts"
ON public.offer_drafts
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all drafts"
ON public.offer_drafts
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add Admin bypass for hardware_imports (new table)
CREATE POLICY "Admins can view all hardware imports"
ON public.hardware_imports
FOR SELECT
USING (has_role(auth.uid(), 'admin'));