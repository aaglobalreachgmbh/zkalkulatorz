-- Migration: 20240111_notifications.sql
-- Description: User notifications system.

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL, -- 'info', 'warning', 'error'
    title text NOT NULL,
    message text,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_read_own" ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert via service role usually, or admin if needed.
-- Allow admins to insert for anyone? Maybe.
CREATE POLICY "notifications_insert_admin" ON public.notifications
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND (ur.role = 'admin' OR ur.role = 'superadmin')
    )
);
