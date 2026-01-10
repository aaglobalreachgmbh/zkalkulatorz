
-- ============================================
-- 1. Permission Templates (Berechtigungs-Vorlagen)
-- ============================================
CREATE TABLE public.permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Shield',
  color TEXT DEFAULT '#3b82f6',
  is_system BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  permissions JSONB NOT NULL DEFAULT '{
    "can_view_margins": true,
    "can_export_pdf": true,
    "can_view_reporting": false,
    "can_view_team": false,
    "can_use_inbox": false,
    "can_use_bundles": true,
    "can_create_offers": true,
    "can_manage_customers": true,
    "can_use_calculator": true,
    "allowed_menu_items": ["dashboard", "calculator", "offers", "customers"],
    "provision_deduction": 0,
    "provision_deduction_type": "percent"
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.permission_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view permission templates"
  ON public.permission_templates FOR SELECT
  USING (tenant_id = '' OR tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Tenant admins can manage permission templates"
  ON public.permission_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'tenant_admin')
    )
  );

-- Insert default templates
INSERT INTO public.permission_templates (name, description, icon, color, is_system, sort_order, permissions) VALUES
('Vertrieb Standard', 'Basis-Zugang für neue Vertriebsmitarbeiter', 'ShoppingCart', '#22c55e', true, 1, 
 '{"can_view_margins": true, "can_export_pdf": true, "can_view_reporting": false, "can_view_team": false, "can_use_inbox": false, "can_use_bundles": true, "can_create_offers": true, "can_manage_customers": true, "can_use_calculator": true, "allowed_menu_items": ["dashboard", "calculator", "offers", "customers"], "provision_deduction": 0, "provision_deduction_type": "percent"}'::jsonb),
('Vertrieb Senior', 'Erweitert mit Reporting und Team-Einsicht', 'TrendingUp', '#3b82f6', true, 2,
 '{"can_view_margins": true, "can_export_pdf": true, "can_view_reporting": true, "can_view_team": true, "can_use_inbox": true, "can_use_bundles": true, "can_create_offers": true, "can_manage_customers": true, "can_use_calculator": true, "allowed_menu_items": ["dashboard", "calculator", "offers", "customers", "reporting", "team"], "provision_deduction": 0, "provision_deduction_type": "percent"}'::jsonb),
('Back-Office', 'Kunden und Inbox, kein Kalkulator', 'FileText', '#f59e0b', true, 3,
 '{"can_view_margins": false, "can_export_pdf": true, "can_view_reporting": false, "can_view_team": false, "can_use_inbox": true, "can_use_bundles": false, "can_create_offers": false, "can_manage_customers": true, "can_use_calculator": false, "allowed_menu_items": ["dashboard", "customers", "inbox"], "provision_deduction": 0, "provision_deduction_type": "percent"}'::jsonb),
('Führungskraft', 'Voller Zugang ohne Admin-Rechte', 'Briefcase', '#8b5cf6', true, 4,
 '{"can_view_margins": true, "can_export_pdf": true, "can_view_reporting": true, "can_view_team": true, "can_use_inbox": true, "can_use_bundles": true, "can_create_offers": true, "can_manage_customers": true, "can_use_calculator": true, "allowed_menu_items": ["dashboard", "calculator", "offers", "customers", "reporting", "team", "inbox", "calendar"], "provision_deduction": 0, "provision_deduction_type": "percent"}'::jsonb);

-- ============================================
-- 2. Absences (Abwesenheiten)
-- ============================================
CREATE TABLE public.absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL,
  absence_type TEXT NOT NULL DEFAULT 'vacation',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  substitute_user_id UUID,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_absence_type CHECK (absence_type IN ('vacation', 'sick', 'training', 'other')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant absences"
  ON public.absences FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage own absences"
  ON public.absences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending absences"
  ON public.absences FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can manage all absences"
  ON public.absences FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'tenant_admin')
    )
  );

CREATE INDEX idx_absences_user_dates ON public.absences(user_id, start_date, end_date);
CREATE INDEX idx_absences_tenant_dates ON public.absences(tenant_id, start_date, end_date);

-- ============================================
-- 3. Notifications (In-App-Benachrichtigungen)
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================
-- 4. Shift Templates (Schicht-Vorlagen)
-- ============================================
CREATE TABLE public.shift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 30,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view shift templates"
  ON public.shift_templates FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage shift templates"
  ON public.shift_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'tenant_admin')
    )
  );

-- Insert default shift templates
INSERT INTO public.shift_templates (name, start_time, end_time, break_minutes, color) VALUES
('Frühschicht', '08:00', '16:00', 30, '#22c55e'),
('Spätschicht', '12:00', '20:00', 30, '#3b82f6'),
('Tagschicht', '09:00', '18:00', 60, '#f59e0b');

-- ============================================
-- 5. Shifts (Schichtzuweisungen)
-- ============================================
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL,
  template_id UUID REFERENCES public.shift_templates(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_shift_status CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled'))
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view shifts"
  ON public.shifts FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage shifts"
  ON public.shifts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'tenant_admin')
    )
  );

CREATE INDEX idx_shifts_user_date ON public.shifts(user_id, date);
CREATE INDEX idx_shifts_tenant_date ON public.shifts(tenant_id, date);

-- Enable realtime for shifts
ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;

-- ============================================
-- 6. Shift Swap Requests (Tausch-Anfragen)
-- ============================================
CREATE TABLE public.shift_swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT '',
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  requesting_user_id UUID NOT NULL,
  target_user_id UUID,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_swap_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view swap requests"
  ON public.shift_swap_requests FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create own swap requests"
  ON public.shift_swap_requests FOR INSERT
  WITH CHECK (requesting_user_id = auth.uid());

CREATE POLICY "Admins can manage swap requests"
  ON public.shift_swap_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'tenant_admin')
    )
  );

-- Enable realtime for swap requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_swap_requests;

-- ============================================
-- 7. Employee Goals (Mitarbeiter-Ziele)
-- ============================================
CREATE TABLE public.employee_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL,
  month DATE NOT NULL,
  goal_type TEXT NOT NULL DEFAULT 'contracts',
  target_value NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  bonus_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_goal_type CHECK (goal_type IN ('revenue', 'contracts', 'customers', 'offers', 'margin')),
  CONSTRAINT unique_user_month_type UNIQUE (user_id, month, goal_type)
);

ALTER TABLE public.employee_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view goals"
  ON public.employee_goals FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage goals"
  ON public.employee_goals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'tenant_admin')
    )
  );

CREATE INDEX idx_goals_user_month ON public.employee_goals(user_id, month);
CREATE INDEX idx_goals_tenant_month ON public.employee_goals(tenant_id, month);

-- ============================================
-- 8. Onboarding Templates (Checklisten-Vorlagen)
-- ============================================
CREATE TABLE public.onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view onboarding templates"
  ON public.onboarding_templates FOR SELECT
  USING (tenant_id = '' OR tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage onboarding templates"
  ON public.onboarding_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'tenant_admin')
    )
  );

-- Insert default onboarding template
INSERT INTO public.onboarding_templates (name, description, is_default, steps) VALUES
('Standard Onboarding', 'Standard-Checkliste für neue Mitarbeiter', true, '[
  {"id": "profile", "title": "Profil vervollständigen", "description": "Name und Abteilung eintragen", "auto_check": "profile_complete"},
  {"id": "calculator", "title": "Ersten Kalkulator-Test", "description": "Eine Beispiel-Kalkulation durchführen", "auto_check": "first_calculation"},
  {"id": "customer", "title": "Ersten Kunden anlegen", "description": "Einen Kunden erstellen, um Angebote zuzuordnen", "auto_check": "first_customer"},
  {"id": "tour", "title": "App-Tour abschließen", "description": "Lass dir die wichtigsten Features zeigen", "auto_check": "tour_complete"},
  {"id": "offer", "title": "Erstes Angebot speichern", "description": "Ein vollständiges Angebot erstellen und speichern", "auto_check": "first_offer"}
]'::jsonb);

-- ============================================
-- 9. Onboarding Progress (Fortschritt)
-- ============================================
CREATE TABLE public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL UNIQUE,
  template_id UUID REFERENCES public.onboarding_templates(id),
  completed_steps TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding progress"
  ON public.onboarding_progress FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'tenant_admin')
  ));

CREATE POLICY "Users can update own onboarding progress"
  ON public.onboarding_progress FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can create onboarding progress"
  ON public.onboarding_progress FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 10. Extend Calendar Events for Assignment
-- ============================================
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS assigned_to UUID,
ADD COLUMN IF NOT EXISTS assigned_by UUID,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_calendar_events_assigned ON public.calendar_events(assigned_to);

-- ============================================
-- 11. Update timestamp triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_permission_templates_updated_at
  BEFORE UPDATE ON public.permission_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_absences_updated_at
  BEFORE UPDATE ON public.absences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_templates_updated_at
  BEFORE UPDATE ON public.shift_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_swap_requests_updated_at
  BEFORE UPDATE ON public.shift_swap_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_goals_updated_at
  BEFORE UPDATE ON public.employee_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_templates_updated_at
  BEFORE UPDATE ON public.onboarding_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
