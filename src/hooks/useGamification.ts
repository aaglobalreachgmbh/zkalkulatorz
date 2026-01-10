/**
 * Hook für das Gamification-System
 * 
 * Verwaltet Punkte, Badges und Streaks für Außendienstler.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

// ============================================
// TYPES
// ============================================

export interface PointTransaction {
  id: string;
  user_id: string;
  tenant_id: string;
  points: number;
  source_type: PointSourceType;
  source_id: string | null;
  description: string | null;
  created_at: string;
}

export type PointSourceType = 
  | "visit_completed"
  | "photo_added"
  | "checklist_complete"
  | "gps_captured"
  | "streak_bonus"
  | "badge_earned";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: "milestone" | "streak" | "special";
  requirement_type: string;
  requirement_value: number;
  points_reward: number;
  is_active: boolean;
  sort_order: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  tenant_id: string;
  badge_id: string;
  earned_at: string;
  metadata: Record<string, unknown>;
  // Joined
  badge?: BadgeDefinition;
}

export interface AwardPointsInput {
  points: number;
  source_type: PointSourceType;
  source_id?: string;
  description?: string;
}

export interface GamificationStats {
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  visitCount: number;
  currentStreak: number;
  longestStreak: number;
  badgesEarned: number;
  badgesTotal: number;
}

// ============================================
// POINT VALUES CONFIG
// ============================================

export const POINT_VALUES = {
  visit_completed: 10,
  with_photos: 5,
  with_checklist: 5,
  with_gps: 2,
  streak_3: 10,
  streak_7: 25,
  streak_14: 50,
  streak_30: 100,
};

// ============================================
// MAIN HOOK
// ============================================

export function useGamification() {
  const queryClient = useQueryClient();
  const { identity } = useIdentity();
  const { userId, tenantId } = identity;

  // ------------------------------------------
  // Fetch all badge definitions
  // ------------------------------------------
  const badgeDefinitionsQuery = useQuery({
    queryKey: ["badge-definitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_definitions")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) {
        console.warn("[useGamification] Badge definitions error:", error.message);
        return [];
      }

      return (data || []) as BadgeDefinition[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // ------------------------------------------
  // Fetch user's earned badges
  // ------------------------------------------
  const userBadgesQuery = useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("user_badges")
        .select(`
          *,
          badge:badge_definitions(*)
        `)
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (error) {
        console.warn("[useGamification] User badges error:", error.message);
        return [];
      }

      return (data || []) as UserBadge[];
    },
    enabled: !!userId,
  });

  // ------------------------------------------
  // Fetch user's point transactions
  // ------------------------------------------
  const pointsQuery = useQuery({
    queryKey: ["user-points", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("user_points")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.warn("[useGamification] Points error:", error.message);
        return [];
      }

      return (data || []) as PointTransaction[];
    },
    enabled: !!userId,
  });

  // ------------------------------------------
  // Calculate stats from points
  // ------------------------------------------
  const stats: GamificationStats = (() => {
    const points = pointsQuery.data || [];
    const badges = userBadgesQuery.data || [];
    const allBadges = badgeDefinitionsQuery.data || [];

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalPoints = points.reduce((sum, p) => sum + p.points, 0);
    const weeklyPoints = points
      .filter(p => new Date(p.created_at) >= weekStart)
      .reduce((sum, p) => sum + p.points, 0);
    const monthlyPoints = points
      .filter(p => new Date(p.created_at) >= monthStart)
      .reduce((sum, p) => sum + p.points, 0);

    const visitCount = points.filter(p => p.source_type === "visit_completed").length;

    // Streak calculation (simplified - counts consecutive days with visits)
    const visitDates = points
      .filter(p => p.source_type === "visit_completed")
      .map(p => new Date(p.created_at).toDateString());
    const uniqueDates = [...new Set(visitDates)].sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    for (let i = 0; i < uniqueDates.length; i++) {
      const date = uniqueDates[i];
      const prevDate = i > 0 ? uniqueDates[i - 1] : today;
      const dayDiff = (new Date(prevDate).getTime() - new Date(date).getTime()) / 86400000;

      if (i === 0 && (date === today || date === yesterday)) {
        tempStreak = 1;
        currentStreak = 1;
      } else if (dayDiff === 1) {
        tempStreak++;
        if (i === 0 || uniqueDates[0] === today || uniqueDates[0] === yesterday) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      totalPoints,
      weeklyPoints,
      monthlyPoints,
      visitCount,
      currentStreak,
      longestStreak,
      badgesEarned: badges.length,
      badgesTotal: allBadges.length,
    };
  })();

  // ------------------------------------------
  // Award points mutation
  // ------------------------------------------
  const awardPoints = useMutation({
    mutationFn: async (input: AwardPointsInput) => {
      if (!userId || !tenantId) {
        console.warn("[useGamification] Not authenticated");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      const { data, error } = await supabase
        .from("user_points")
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          points: input.points,
          source_type: input.source_type,
          source_id: input.source_id || null,
          description: input.description || null,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-points", userId] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });

  // ------------------------------------------
  // Award badge mutation
  // ------------------------------------------
  const awardBadge = useMutation({
    mutationFn: async (badgeId: string) => {
      if (!userId || !tenantId) {
        console.warn("[useGamification] Not authenticated");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      // Check if already earned
      const { data: existing } = await supabase
        .from("user_badges")
        .select("id")
        .eq("user_id", userId)
        .eq("badge_id", badgeId)
        .maybeSingle();

      if (existing) {
        return null; // Already has badge
      }

      // Award badge
      const { data, error } = await supabase
        .from("user_badges")
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          badge_id: badgeId,
          metadata: {} as unknown as Json,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Get badge info for bonus points
      const badge = badgeDefinitionsQuery.data?.find(b => b.id === badgeId);
      if (badge && badge.points_reward > 0) {
        await awardPoints.mutateAsync({
          points: badge.points_reward,
          source_type: "badge_earned",
          description: `Badge verdient: ${badge.name}`,
        });
      }

      return { badgeId, badge };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["user-badges", userId] });
      if (result?.badge) {
        // This will be handled by the BadgeUnlockedModal
      }
    },
  });

  // ------------------------------------------
  // Check and award badges based on current stats
  // ------------------------------------------
  const checkAndAwardBadges = async (): Promise<BadgeDefinition[]> => {
    const earnedBadgeIds = new Set((userBadgesQuery.data || []).map(b => b.badge_id));
    const allBadges = badgeDefinitionsQuery.data || [];
    const newBadges: BadgeDefinition[] = [];

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      let earned = false;

      switch (badge.requirement_type) {
        case "visit_count":
          earned = stats.visitCount >= badge.requirement_value;
          break;
        case "streak_days":
          earned = stats.currentStreak >= badge.requirement_value || 
                   stats.longestStreak >= badge.requirement_value;
          break;
        case "points_total":
          earned = stats.totalPoints >= badge.requirement_value;
          break;
        // photo_count, checklist_count, gps_count would need separate tracking
      }

      if (earned) {
        try {
          await awardBadge.mutateAsync(badge.id);
          newBadges.push(badge);
        } catch (e) {
          console.warn("[useGamification] Failed to award badge:", badge.id, e);
        }
      }
    }

    return newBadges;
  };

  // ------------------------------------------
  // Award points for a completed visit
  // ------------------------------------------
  const awardPointsForVisit = async (options: {
    visitId: string;
    hasPhotos?: boolean;
    hasChecklist?: boolean;
    hasGPS?: boolean;
  }): Promise<number> => {
    let totalPoints = POINT_VALUES.visit_completed;
    let description = "Besuch abgeschlossen";

    if (options.hasPhotos) {
      totalPoints += POINT_VALUES.with_photos;
      description += " (+Fotos)";
    }
    if (options.hasChecklist) {
      totalPoints += POINT_VALUES.with_checklist;
      description += " (+Checkliste)";
    }
    if (options.hasGPS) {
      totalPoints += POINT_VALUES.with_gps;
      description += " (+GPS)";
    }

    await awardPoints.mutateAsync({
      points: totalPoints,
      source_type: "visit_completed",
      source_id: options.visitId,
      description,
    });

    // Check for new badges after awarding points
    const newBadges = await checkAndAwardBadges();
    
    if (newBadges.length > 0) {
      toast.success(`🎉 Neuer Badge: ${newBadges[0].name}`, {
        description: newBadges[0].description || undefined,
        duration: 5000,
      });
    }

    return totalPoints;
  };

  return {
    // Queries
    badgeDefinitions: badgeDefinitionsQuery.data || [],
    userBadges: userBadgesQuery.data || [],
    points: pointsQuery.data || [],
    stats,
    isLoading: pointsQuery.isLoading || userBadgesQuery.isLoading,

    // Mutations
    awardPoints,
    awardBadge,
    awardPointsForVisit,
    checkAndAwardBadges,
  };
}
