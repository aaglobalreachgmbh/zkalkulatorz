-- ============================================
-- Won Offer Data Table
-- Backoffice-Daten für gewonnene Angebote
-- ============================================

CREATE TABLE public.won_offer_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES public.saved_offers(id) ON DELETE CASCADE,
  tenant_id text NOT NULL DEFAULT get_my_tenant_id(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Firmen-/Kundendaten
  company_data jsonb NOT NULL DEFAULT '{}',
  
  -- Kontaktperson
  contact_data jsonb NOT NULL DEFAULT '{}',
  
  -- Rechnungsadresse
  billing_address jsonb NOT NULL DEFAULT '{}',
  
  -- Zahlungsdaten (SEPA)
  payment_data jsonb DEFAULT NULL,
  
  -- SIM-Optionen
  sim_options jsonb DEFAULT NULL,
  
  -- Status & Timestamps
  status text NOT NULL DEFAULT 'draft',
  captured_at timestamptz DEFAULT now(),
  submitted_at timestamptz DEFAULT NULL,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Kommentar zur Tabelle
COMMENT ON TABLE public.won_offer_data IS 'Speichert Backoffice-Daten für gewonnene Angebote (Vertragsabschluss-Daten)';

-- Indizes
CREATE INDEX idx_won_offer_data_tenant ON public.won_offer_data(tenant_id);
CREATE INDEX idx_won_offer_data_offer ON public.won_offer_data(offer_id);
CREATE INDEX idx_won_offer_data_user ON public.won_offer_data(user_id);
CREATE INDEX idx_won_offer_data_status ON public.won_offer_data(status);

-- RLS aktivieren
ALTER TABLE public.won_offer_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Nur Tenant-Mitglieder
CREATE POLICY "Tenant members can view won_offer_data"
  ON public.won_offer_data FOR SELECT
  USING (public.is_same_tenant(tenant_id));

CREATE POLICY "Tenant members can insert won_offer_data"
  ON public.won_offer_data FOR INSERT
  WITH CHECK (public.is_same_tenant(tenant_id));

CREATE POLICY "Tenant members can update won_offer_data"
  ON public.won_offer_data FOR UPDATE
  USING (public.is_same_tenant(tenant_id));

CREATE POLICY "Tenant admins can delete won_offer_data"
  ON public.won_offer_data FOR DELETE
  USING (public.is_same_tenant(tenant_id) AND public.is_tenant_admin(auth.uid()));

-- Trigger für updated_at
CREATE TRIGGER update_won_offer_data_updated_at
  BEFORE UPDATE ON public.won_offer_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();