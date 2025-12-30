-- Add status column to saved_offers for offer tracking
ALTER TABLE public.saved_offers
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'offen';

-- Add comment for documentation
COMMENT ON COLUMN public.saved_offers.status IS 'Status des Angebots: offen, gesendet, angenommen, abgelehnt';