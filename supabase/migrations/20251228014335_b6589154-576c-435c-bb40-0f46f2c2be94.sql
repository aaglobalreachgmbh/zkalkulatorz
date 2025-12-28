-- Create customer_contracts table for VVL tracking
CREATE TABLE public.customer_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Contract details
  netz TEXT NOT NULL DEFAULT 'vodafone',
  tarif_name TEXT,
  handy_nr TEXT,
  
  -- Duration
  vertragsbeginn DATE,
  vertragsende DATE,
  vvl_datum DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'aktiv',
  
  -- Hardware & Finances
  hardware_name TEXT,
  ek_preis NUMERIC(10,2),
  monatspreis NUMERIC(10,2),
  provision_erhalten NUMERIC(10,2),
  
  -- Meta
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access contracts of their own customers
CREATE POLICY "Users can view contracts of their customers"
  ON public.customer_contracts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.customers 
    WHERE customers.id = customer_contracts.customer_id 
    AND customers.user_id = auth.uid()
  ));

CREATE POLICY "Users can create contracts for their customers"
  ON public.customer_contracts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.customers 
      WHERE customers.id = customer_contracts.customer_id 
      AND customers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contracts of their customers"
  ON public.customer_contracts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.customers 
    WHERE customers.id = customer_contracts.customer_id 
    AND customers.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete contracts of their customers"
  ON public.customer_contracts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.customers 
    WHERE customers.id = customer_contracts.customer_id 
    AND customers.user_id = auth.uid()
  ));

-- Indexes for VVL queries
CREATE INDEX idx_contracts_vvl ON public.customer_contracts(vvl_datum);
CREATE INDEX idx_contracts_status ON public.customer_contracts(status);
CREATE INDEX idx_contracts_customer ON public.customer_contracts(customer_id);
CREATE INDEX idx_contracts_user ON public.customer_contracts(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_customer_contracts_updated_at
  BEFORE UPDATE ON public.customer_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();