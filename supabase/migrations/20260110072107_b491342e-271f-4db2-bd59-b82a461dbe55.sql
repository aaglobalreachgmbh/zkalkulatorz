-- ============================================
-- Kalender & E-Mail Integration
-- ============================================

-- 1. Mitarbeiter-Zuteilungen für Hierarchie
CREATE TABLE IF NOT EXISTS employee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  supervisor_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  UNIQUE(supervisor_id, employee_id)
);

ALTER TABLE employee_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supervisors and admins can view assignments"
  ON employee_assignments FOR SELECT
  USING (
    supervisor_id = auth.uid() OR
    employee_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'tenant_admin')
  );

CREATE POLICY "Admins can manage assignments"
  ON employee_assignments FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'tenant_admin')
  );

-- 2. E-Mail-Konten
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'ionos', 'imap')),
  email_address TEXT NOT NULL,
  display_name TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  imap_password_encrypted TEXT,
  token_expiry TIMESTAMPTZ,
  imap_host TEXT,
  imap_port INTEGER DEFAULT 993,
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  sync_enabled BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_address)
);

ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own email accounts"
  ON email_accounts FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all email accounts"
  ON email_accounts FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'tenant_admin')
  );

-- 3. Synchronisierte E-Mails
CREATE TABLE IF NOT EXISTS synced_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  thread_id TEXT,
  subject TEXT,
  sender_email TEXT,
  sender_name TEXT,
  recipients JSONB DEFAULT '[]',
  body_preview TEXT,
  body_html TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  labels TEXT[] DEFAULT '{}',
  folder TEXT DEFAULT 'INBOX',
  attachments JSONB DEFAULT '[]',
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  linked_at TIMESTAMPTZ,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'tenant')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, message_id)
);

ALTER TABLE synced_emails ENABLE ROW LEVEL SECURITY;

-- Helper function für sichtbare User-IDs basierend auf Hierarchie
CREATE OR REPLACE FUNCTION get_visible_user_ids()
RETURNS UUID[] AS $$
DECLARE
  result UUID[];
BEGIN
  -- Admin und Tenant-Admin sehen alle im Tenant
  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tenant_admin') THEN
    SELECT ARRAY_AGG(DISTINCT ur.user_id) INTO result
    FROM user_roles ur;
    RETURN COALESCE(result, ARRAY[auth.uid()]);
  END IF;
  
  -- Normale User sehen nur sich selbst + zugeteilte Mitarbeiter
  SELECT ARRAY_AGG(DISTINCT user_id) INTO result
  FROM (
    SELECT auth.uid() as user_id
    UNION
    SELECT employee_id as user_id
    FROM employee_assignments
    WHERE supervisor_id = auth.uid()
  ) sub;
  
  RETURN COALESCE(result, ARRAY[auth.uid()]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE POLICY "Email visibility based on role hierarchy"
  ON synced_emails FOR SELECT
  USING (
    user_id = auth.uid() OR
    user_id = ANY(get_visible_user_ids()) OR
    visibility = 'tenant'
  );

CREATE POLICY "Users can manage own emails"
  ON synced_emails FOR ALL
  USING (user_id = auth.uid());

-- 4. Kalender-Termine
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  event_type TEXT DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'call', 'followup', 'vvl_reminder', 'task', 'other')),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES customer_contracts(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES saved_offers(id) ON DELETE SET NULL,
  is_all_day BOOLEAN DEFAULT FALSE,
  color TEXT,
  reminder_minutes INTEGER DEFAULT 60,
  recurrence_rule TEXT,
  external_id TEXT,
  external_calendar TEXT CHECK (external_calendar IN ('google', 'ionos') OR external_calendar IS NULL),
  last_synced_at TIMESTAMPTZ,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'tenant')),
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Calendar visibility based on role hierarchy"
  ON calendar_events FOR SELECT
  USING (
    user_id = auth.uid() OR
    user_id = ANY(get_visible_user_ids()) OR
    visibility = 'tenant'
  );

CREATE POLICY "Users can manage own events"
  ON calendar_events FOR ALL
  USING (user_id = auth.uid());

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_time ON calendar_events(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_customer ON calendar_events(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_synced_emails_user_received ON synced_emails(user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_synced_emails_customer ON synced_emails(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employee_assignments_supervisor ON employee_assignments(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_employee_assignments_employee ON employee_assignments(employee_id);

-- Trigger für updated_at
CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();