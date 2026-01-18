-- ============================================
-- Navigation & Berechtigungssystem - Erweiterte Spalten
-- ============================================

-- Neue Berechtigungs-Spalten in employee_settings
ALTER TABLE public.employee_settings 
ADD COLUMN IF NOT EXISTS allowed_menu_items text[] DEFAULT ARRAY['calculator', 'offers', 'customers', 'contracts', 'calendar', 'news', 'bundles', 'inbox', 'reporting', 'team'];

ALTER TABLE public.employee_settings 
ADD COLUMN IF NOT EXISTS can_use_calculator boolean DEFAULT true;

ALTER TABLE public.employee_settings 
ADD COLUMN IF NOT EXISTS can_create_offers boolean DEFAULT true;

ALTER TABLE public.employee_settings 
ADD COLUMN IF NOT EXISTS can_view_reporting boolean DEFAULT false;

ALTER TABLE public.employee_settings 
ADD COLUMN IF NOT EXISTS can_view_team boolean DEFAULT false;

ALTER TABLE public.employee_settings 
ADD COLUMN IF NOT EXISTS can_use_inbox boolean DEFAULT false;

ALTER TABLE public.employee_settings 
ADD COLUMN IF NOT EXISTS can_use_bundles boolean DEFAULT false;

-- Kommentar zur Dokumentation
COMMENT ON COLUMN public.employee_settings.allowed_menu_items IS 'Array der sichtbaren Menüpunkte für diesen Mitarbeiter';
COMMENT ON COLUMN public.employee_settings.can_use_calculator IS 'Darf der Mitarbeiter den Kalkulator nutzen';
COMMENT ON COLUMN public.employee_settings.can_create_offers IS 'Darf der Mitarbeiter Angebote erstellen';
COMMENT ON COLUMN public.employee_settings.can_view_reporting IS 'Darf der Mitarbeiter Auswertungen sehen';
COMMENT ON COLUMN public.employee_settings.can_view_team IS 'Darf der Mitarbeiter Team-Übersicht sehen';
COMMENT ON COLUMN public.employee_settings.can_use_inbox IS 'Darf der Mitarbeiter den Posteingang nutzen';
COMMENT ON COLUMN public.employee_settings.can_use_bundles IS 'Darf der Mitarbeiter Bundles konfigurieren';