-- =====================================================
-- Phase D1: User Activity Log für vollständiges Audit-Trail
-- =====================================================

-- Zentrale Tabelle für Benutzeraktivitäten
CREATE TABLE public.user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id text NOT NULL,
  department_id text,
  
  -- Aktionsinformationen
  action text NOT NULL,                    -- 'offer_create', 'customer_update', etc.
  resource_type text NOT NULL,             -- 'offer', 'customer', 'template', 'draft'
  resource_id uuid,
  resource_name text,                       -- Für bessere Lesbarkeit im Dashboard
  
  -- Änderungsdetails
  summary text,                             -- Kurzbeschreibung für UI
  old_values jsonb,                         -- Vorherige Werte (für Änderungen)
  new_values jsonb,                         -- Neue Werte
  metadata jsonb DEFAULT '{}',              -- Zusätzliche Infos
  
  -- Security-Tracking
  ip_hash text,
  user_agent_hash text,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes für Performance
CREATE INDEX idx_user_activity_user ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_tenant ON public.user_activity_log(tenant_id);
CREATE INDEX idx_user_activity_created ON public.user_activity_log(created_at DESC);
CREATE INDEX idx_user_activity_action ON public.user_activity_log(action);
CREATE INDEX idx_user_activity_resource ON public.user_activity_log(resource_type, resource_id);

-- Enable Row Level Security
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Benutzer können eigene Aktivitäten sehen
CREATE POLICY "Users can view own activity"
  ON public.user_activity_log FOR SELECT
  USING (auth.uid() = user_id);

-- Admins können alle Aktivitäten sehen
CREATE POLICY "Admins can view all activity"
  ON public.user_activity_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Authentifizierte Benutzer können Aktivitäten erstellen (für eigene user_id)
CREATE POLICY "Users can insert own activity"
  ON public.user_activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service Role kann alle einfügen
CREATE POLICY "Service role can insert activity"
  ON public.user_activity_log FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- Cleanup Funktion für alte Activities (GDPR Retention)
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_activities(retention_days integer DEFAULT 730)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  deleted_count integer;
BEGIN
  -- Lösche Aktivitäten älter als retention_days (Standard: 2 Jahre)
  DELETE FROM public.user_activity_log
  WHERE created_at < now() - (retention_days * interval '1 day');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- =====================================================
-- Helper-Funktion zum Einfügen von Activities
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_user_activity(
  _user_id uuid,
  _action text,
  _resource_type text,
  _resource_id uuid DEFAULT NULL,
  _resource_name text DEFAULT NULL,
  _summary text DEFAULT NULL,
  _old_values jsonb DEFAULT NULL,
  _new_values jsonb DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id text;
  _department_id text;
  _activity_id uuid;
BEGIN
  -- Hole Tenant und Department aus JWT Claims
  _tenant_id := public.get_my_tenant_id();
  _department_id := public.get_my_department_id();
  
  -- Erstelle Activity-Eintrag
  INSERT INTO public.user_activity_log (
    user_id,
    tenant_id,
    department_id,
    action,
    resource_type,
    resource_id,
    resource_name,
    summary,
    old_values,
    new_values,
    metadata
  ) VALUES (
    _user_id,
    _tenant_id,
    _department_id,
    _action,
    _resource_type,
    _resource_id,
    _resource_name,
    _summary,
    _old_values,
    _new_values,
    _metadata
  )
  RETURNING id INTO _activity_id;
  
  RETURN _activity_id;
END;
$$;