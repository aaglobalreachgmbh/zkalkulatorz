-- Korrigiere Default-Werte für sensible Berechtigungen
-- Neue Mitarbeiter sollen standardmäßig KEINEN Zugriff auf sensitive Features haben

-- can_view_margins: Margen-Einsicht standardmäßig deaktiviert
ALTER TABLE public.employee_settings 
  ALTER COLUMN can_view_margins SET DEFAULT false;

-- can_export_pdf: PDF-Export (Händler-Version) standardmäßig deaktiviert
ALTER TABLE public.employee_settings 
  ALTER COLUMN can_export_pdf SET DEFAULT false;

-- can_view_reporting: Reporting/Auswertungen standardmäßig deaktiviert
ALTER TABLE public.employee_settings 
  ALTER COLUMN can_view_reporting SET DEFAULT false;

-- can_view_team: Team-Übersicht standardmäßig deaktiviert
ALTER TABLE public.employee_settings 
  ALTER COLUMN can_view_team SET DEFAULT false;

-- can_use_inbox: Posteingang standardmäßig deaktiviert
ALTER TABLE public.employee_settings 
  ALTER COLUMN can_use_inbox SET DEFAULT false;

-- can_use_bundles: Bundle-Konfigurator standardmäßig deaktiviert
ALTER TABLE public.employee_settings 
  ALTER COLUMN can_use_bundles SET DEFAULT false;

-- Diese bleiben standardmäßig aktiviert (Basisrechte):
-- can_use_calculator: true (Hauptfunktion)
-- can_create_offers: true (Grundfunktion)
-- can_manage_customers: true (Grundfunktion)