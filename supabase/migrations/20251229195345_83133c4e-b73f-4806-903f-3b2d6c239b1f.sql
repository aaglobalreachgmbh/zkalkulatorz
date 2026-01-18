-- ============================================
-- EBENE 1: Security Audit Funktion
-- Überprüft alle Tabellen auf RLS-Sicherheit
-- ============================================

-- Funktion zur Überprüfung der RLS-Sicherheit aller Tabellen
CREATE OR REPLACE FUNCTION public.audit_rls_security()
RETURNS TABLE (
  table_name text,
  rls_enabled boolean,
  has_select_policy boolean,
  select_requires_auth boolean,
  risk_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::text,
    t.rowsecurity,
    EXISTS (
      SELECT 1 FROM pg_policies p 
      WHERE p.tablename = t.tablename AND p.cmd = 'SELECT'
    ),
    EXISTS (
      SELECT 1 FROM pg_policies p 
      WHERE p.tablename = t.tablename 
        AND p.cmd = 'SELECT'
        AND (p.qual::text LIKE '%auth.uid()%' OR p.qual::text LIKE '%has_role%')
    ),
    CASE 
      WHEN NOT t.rowsecurity THEN 'CRITICAL'
      WHEN NOT EXISTS (
        SELECT 1 FROM pg_policies p 
        WHERE p.tablename = t.tablename AND p.cmd = 'SELECT'
      ) THEN 'HIGH'
      WHEN NOT EXISTS (
        SELECT 1 FROM pg_policies p 
        WHERE p.tablename = t.tablename 
          AND p.cmd = 'SELECT'
          AND (p.qual::text LIKE '%auth.uid()%' OR p.qual::text LIKE '%has_role%')
      ) THEN 'MEDIUM'
      ELSE 'LOW'
    END
  FROM pg_tables t
  WHERE t.schemaname = 'public';
END;
$$;

-- Grant execute permission to authenticated users (admins will use this)
GRANT EXECUTE ON FUNCTION public.audit_rls_security() TO authenticated;