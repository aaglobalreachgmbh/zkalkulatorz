-- Erweitere customers-Tabelle um Mocca-relevante Felder
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS anrede text,
ADD COLUMN IF NOT EXISTS vorname text,
ADD COLUMN IF NOT EXISTS nachname text,
ADD COLUMN IF NOT EXISTS strasse text,
ADD COLUMN IF NOT EXISTS hausnummer text,
ADD COLUMN IF NOT EXISTS plz text,
ADD COLUMN IF NOT EXISTS ort text,
ADD COLUMN IF NOT EXISTS festnetz text,
ADD COLUMN IF NOT EXISTS handy_nr text,
ADD COLUMN IF NOT EXISTS geburtstag date,
ADD COLUMN IF NOT EXISTS customer_status text DEFAULT 'aktiv',
ADD COLUMN IF NOT EXISTS vip_kunde boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_sms boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_email boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_brief boolean DEFAULT false;

-- Index für häufige Suchen
CREATE INDEX IF NOT EXISTS idx_customers_plz ON public.customers(plz);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(customer_status);
CREATE INDEX IF NOT EXISTS idx_customers_vip ON public.customers(vip_kunde) WHERE vip_kunde = true;

-- Kommentar für Dokumentation
COMMENT ON COLUMN public.customers.anrede IS 'Herr/Frau/Divers';
COMMENT ON COLUMN public.customers.customer_status IS 'aktiv/inaktiv/interessent';
COMMENT ON COLUMN public.customers.vip_kunde IS 'VIP-Kunde für Sonderkonditionen';