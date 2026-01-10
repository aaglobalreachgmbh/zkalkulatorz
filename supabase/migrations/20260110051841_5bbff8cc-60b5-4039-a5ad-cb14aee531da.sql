-- Erweitere tenant_settings um Unternehmens- und Rechnungsinformationen für PDF-Generierung
ALTER TABLE public.tenant_settings 
ADD COLUMN IF NOT EXISTS company_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS billing_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS pdf_contact JSONB DEFAULT '{}'::jsonb;

-- Kommentare für Dokumentation
COMMENT ON COLUMN public.tenant_settings.company_info IS 'Unternehmensinfos für PDF-Header: name, street, zip, city, phone, email, website';
COMMENT ON COLUMN public.tenant_settings.billing_info IS 'Rechnungsinfos für PDF-Footer: ustId, taxNumber, bankName, iban, bic, registrationCourt, registrationNumber';
COMMENT ON COLUMN public.tenant_settings.pdf_contact IS 'Standard-Ansprechpartner für PDFs: name, email, phone, position';