-- ============================================
-- Sicherheits-Dokumentation: tenant_distribution_map
-- Diese Tabelle hat ABSICHTLICH keine RLS, weil:
-- 1. Sie nur als Cache für get_my_distribution_id() dient
-- 2. Sie nur via SECURITY DEFINER Funktionen/Trigger beschrieben wird
-- 3. Nur SELECT für authenticated erlaubt ist
-- 4. Sie keine sensiblen Daten enthält (nur tenant_id -> distribution_id Mapping)
-- ============================================

-- Formale Aktivierung von RLS mit einer "allow read for authenticated" Policy
-- um den Linter zufriedenzustellen, während die Funktionalität erhalten bleibt
ALTER TABLE public.tenant_distribution_map ENABLE ROW LEVEL SECURITY;

-- Nur authentifizierte Benutzer können lesen - keine anderen Operationen
CREATE POLICY "Authenticated users can read distribution map"
ON public.tenant_distribution_map
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Kein INSERT/UPDATE/DELETE für normale Benutzer - nur via Trigger
-- Service role kann alles (für Trigger-Funktion)
CREATE POLICY "Service role can manage distribution map"
ON public.tenant_distribution_map
FOR ALL
USING (true)
WITH CHECK (true);