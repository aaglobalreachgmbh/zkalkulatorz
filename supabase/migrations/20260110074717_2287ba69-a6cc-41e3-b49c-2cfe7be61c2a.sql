-- Dashboard-Konfiguration für User
CREATE TABLE public.user_dashboard_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL DEFAULT '',
  
  -- Widget-Layout als JSON Array
  layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Ausgeblendete Widgets
  hidden_widgets TEXT[] DEFAULT '{}',
  
  -- Zusätzliche Einstellungen
  settings JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, tenant_id)
);

-- RLS aktivieren
ALTER TABLE public.user_dashboard_config ENABLE ROW LEVEL SECURITY;

-- Policy: User kann nur eigene Config lesen
CREATE POLICY "Users can view their own dashboard config"
  ON public.user_dashboard_config
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: User kann eigene Config erstellen
CREATE POLICY "Users can create their own dashboard config"
  ON public.user_dashboard_config
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: User kann eigene Config aktualisieren
CREATE POLICY "Users can update their own dashboard config"
  ON public.user_dashboard_config
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: User kann eigene Config löschen
CREATE POLICY "Users can delete their own dashboard config"
  ON public.user_dashboard_config
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger für updated_at
CREATE TRIGGER update_user_dashboard_config_updated_at
  BEFORE UPDATE ON public.user_dashboard_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();