-- ============================================
-- EBENE 2: Access Audit Log Tabelle
-- Logging für Zugriffe auf sensitive Tabellen
-- ============================================

-- 1. Neue Tabelle für Access Logs erstellen
CREATE TABLE public.access_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid,
  table_name text NOT NULL,
  operation text NOT NULL,
  row_count integer DEFAULT 0,
  client_fingerprint text,
  success boolean DEFAULT true,
  details jsonb DEFAULT '{}'::jsonb
);

-- 2. RLS aktivieren
ALTER TABLE public.access_audit_log ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Admins können alle Logs sehen
CREATE POLICY "Admins can view all access logs"
ON public.access_audit_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service Role kann Logs schreiben (für Trigger)
CREATE POLICY "Service role can insert access logs"
ON public.access_audit_log FOR INSERT
WITH CHECK (true);

-- Nutzer können ihre eigenen Logs sehen
CREATE POLICY "Users can view own access logs"
ON public.access_audit_log FOR SELECT
USING (auth.uid() = user_id);

-- 4. Index für Performance
CREATE INDEX idx_access_audit_log_created_at ON public.access_audit_log(created_at DESC);
CREATE INDEX idx_access_audit_log_user_id ON public.access_audit_log(user_id);
CREATE INDEX idx_access_audit_log_table_name ON public.access_audit_log(table_name);

-- 5. Logging-Funktion für Trigger
CREATE OR REPLACE FUNCTION public.log_table_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.access_audit_log (user_id, table_name, operation, success)
  VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, true);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Trigger für sensitive Tabellen (Statement-Level für Performance)
-- Hinweis: SELECT-Trigger sind in PostgreSQL nicht möglich
-- Wir loggen INSERT/UPDATE/DELETE als Audit-Trail

CREATE TRIGGER audit_profiles_changes
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH STATEMENT EXECUTE FUNCTION public.log_table_access();

CREATE TRIGGER audit_customers_changes
AFTER INSERT OR UPDATE OR DELETE ON public.customers
FOR EACH STATEMENT EXECUTE FUNCTION public.log_table_access();

CREATE TRIGGER audit_customer_contracts_changes
AFTER INSERT OR UPDATE OR DELETE ON public.customer_contracts
FOR EACH STATEMENT EXECUTE FUNCTION public.log_table_access();

CREATE TRIGGER audit_employee_settings_changes
AFTER INSERT OR UPDATE OR DELETE ON public.employee_settings
FOR EACH STATEMENT EXECUTE FUNCTION public.log_table_access();