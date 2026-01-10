-- =====================================================
-- GAMIFICATION SYSTEM - Database Schema
-- =====================================================

-- 1. Badge Definitions (Catalog of all available badges)
CREATE TABLE public.badge_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL DEFAULT 'milestone', -- 'milestone', 'streak', 'special'
  requirement_type TEXT NOT NULL, -- 'visit_count', 'streak_days', 'points_total', 'photo_count', 'checklist_count', 'gps_count'
  requirement_value INTEGER NOT NULL DEFAULT 1,
  points_reward INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. User Points (Transaction log of all point awards)
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT '',
  points INTEGER NOT NULL,
  source_type TEXT NOT NULL, -- 'visit_completed', 'photo_added', 'checklist_complete', 'gps_captured', 'streak_bonus', 'badge_earned'
  source_id UUID, -- Reference to visit_report, badge, etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. User Badges (Earned badges per user)
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT '',
  badge_id TEXT NOT NULL REFERENCES public.badge_definitions(id),
  earned_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badge_definitions (read-only for all authenticated users)
CREATE POLICY "Anyone can view badge definitions"
  ON public.badge_definitions FOR SELECT
  USING (true);

-- RLS Policies for user_points
CREATE POLICY "Users can view their own points"
  ON public.user_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points"
  ON public.user_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view team members' points (same tenant)
CREATE POLICY "Users can view team points"
  ON public.user_points FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view team members' badges (same tenant)
CREATE POLICY "Users can view team badges"
  ON public.user_badges FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX idx_user_points_tenant_id ON public.user_points(tenant_id);
CREATE INDEX idx_user_points_created_at ON public.user_points(created_at);
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_tenant_id ON public.user_badges(tenant_id);

-- =====================================================
-- LEADERBOARD RPC FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_tenant_id TEXT,
  p_period TEXT DEFAULT 'week' -- 'week', 'month', 'all'
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  total_points BIGINT,
  visits_count BIGINT,
  badges_count BIGINT,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  -- Calculate start date based on period
  CASE p_period
    WHEN 'week' THEN v_start_date := date_trunc('week', now());
    WHEN 'month' THEN v_start_date := date_trunc('month', now());
    ELSE v_start_date := '1970-01-01'::timestamptz;
  END CASE;

  RETURN QUERY
  SELECT 
    up.user_id,
    COALESCE(p.display_name, p.email, 'Unbekannt') AS display_name,
    COALESCE(SUM(up.points), 0)::BIGINT AS total_points,
    COUNT(CASE WHEN up.source_type = 'visit_completed' THEN 1 END)::BIGINT AS visits_count,
    (SELECT COUNT(*) FROM public.user_badges ub WHERE ub.user_id = up.user_id)::BIGINT AS badges_count,
    RANK() OVER (ORDER BY COALESCE(SUM(up.points), 0) DESC)::BIGINT AS rank
  FROM public.user_points up
  LEFT JOIN public.profiles p ON p.id = up.user_id
  WHERE up.tenant_id = p_tenant_id
    AND up.created_at >= v_start_date
  GROUP BY up.user_id, p.display_name, p.email
  ORDER BY total_points DESC
  LIMIT 50;
END;
$$;

-- =====================================================
-- SEED DEFAULT BADGE DEFINITIONS
-- =====================================================

INSERT INTO public.badge_definitions (id, name, description, icon, category, requirement_type, requirement_value, points_reward, sort_order) VALUES
-- Milestone Badges
('first_visit', 'Erster Besuch', 'Deinen ersten Kundenbesuch abgeschlossen', '🥇', 'milestone', 'visit_count', 1, 10, 1),
('visits_10', '10 Besuche', '10 Kundenbesuche abgeschlossen', '🔟', 'milestone', 'visit_count', 10, 25, 2),
('visits_50', '50 Besuche', '50 Kundenbesuche abgeschlossen', '🎯', 'milestone', 'visit_count', 50, 50, 3),
('visits_100', 'Besuchs-Profi', '100 Kundenbesuche abgeschlossen', '💯', 'milestone', 'visit_count', 100, 100, 4),
('visits_500', 'Besuchs-Legende', '500 Kundenbesuche abgeschlossen', '🏆', 'milestone', 'visit_count', 500, 250, 5),

-- Streak Badges
('streak_3', '3-Tage-Streak', '3 Tage in Folge Besuche gemacht', '🔥', 'streak', 'streak_days', 3, 10, 10),
('streak_7', 'Wochenstreak', '7 Tage in Folge Besuche gemacht', '🔥', 'streak', 'streak_days', 7, 25, 11),
('streak_14', '2-Wochen-Streak', '14 Tage in Folge Besuche gemacht', '🔥', 'streak', 'streak_days', 14, 50, 12),
('streak_30', 'Monatsstreak', '30 Tage in Folge Besuche gemacht', '🔥', 'streak', 'streak_days', 30, 100, 13),

-- Special Badges
('photo_pro', 'Foto-Profi', '50 Fotos bei Besuchen hochgeladen', '📸', 'special', 'photo_count', 50, 50, 20),
('checklist_king', 'Checklisten-König', '50 vollständige Checklisten ausgefüllt', '📝', 'special', 'checklist_count', 50, 50, 21),
('gps_master', 'GPS-Meister', '100 GPS-Standorte erfasst', '🗺️', 'special', 'gps_count', 100, 50, 22),
('points_1000', 'Punkte-Sammler', '1000 Punkte gesammelt', '⭐', 'special', 'points_total', 1000, 50, 23),
('points_5000', 'Punkte-Meister', '5000 Punkte gesammelt', '🌟', 'special', 'points_total', 5000, 100, 24);

-- Grant execute permission on RPC function
GRANT EXECUTE ON FUNCTION public.get_leaderboard TO authenticated;