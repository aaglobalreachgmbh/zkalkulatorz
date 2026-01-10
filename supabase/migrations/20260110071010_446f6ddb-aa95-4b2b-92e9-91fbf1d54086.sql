-- Datum, wann der Kunde gewonnen wurde
ALTER TABLE customers
ADD COLUMN won_at TIMESTAMPTZ DEFAULT NULL;

-- Kommentar für Dokumentation
COMMENT ON COLUMN customers.won_at IS 'Datum, an dem der Kunde als "gewonnen" markiert wurde';