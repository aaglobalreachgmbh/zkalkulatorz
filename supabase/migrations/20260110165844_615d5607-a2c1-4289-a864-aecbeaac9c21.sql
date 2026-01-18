-- ============================================
-- Notification Preferences Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL DEFAULT 'tenant_default',
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  calendar_sync_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_before_minutes INTEGER NOT NULL DEFAULT 15,
  notification_types JSONB NOT NULL DEFAULT '{"visit_reminder": true, "visit_overdue": true, "sync_pending": true, "sync_failed": true, "appointment_reminder": true, "vvl_reminder": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Extend user_dashboard_config for mode-specific layouts
-- ============================================

ALTER TABLE public.user_dashboard_config 
  ADD COLUMN IF NOT EXISTS pos_layout JSONB,
  ADD COLUMN IF NOT EXISTS field_layout JSONB,
  ADD COLUMN IF NOT EXISTS active_mode TEXT DEFAULT 'pos';

-- ============================================
-- Scheduled Notifications Table (for email reminders)
-- ============================================

CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL DEFAULT 'tenant_default',
  notification_type TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  related_id UUID,
  related_type TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own scheduled notifications"
  ON public.scheduled_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled notifications"
  ON public.scheduled_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled notifications"
  ON public.scheduled_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled notifications"
  ON public.scheduled_notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Admin access for scheduled notifications
CREATE POLICY "Admins can view all scheduled notifications"
  ON public.scheduled_notifications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.is_tenant_admin(auth.uid()));

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending 
  ON public.scheduled_notifications (scheduled_for) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user 
  ON public.scheduled_notifications (user_id, status);