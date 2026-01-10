/**
 * Gamification Service
 * 
 * Standalone service for awarding points and badges.
 * Used by other hooks (e.g., useVisitReports) to trigger gamification.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// ============================================
// TYPES
// ============================================

export type PointSourceType = 
  | "visit_completed"
  | "photo_added"
  | "checklist_complete"
  | "gps_captured"
  | "streak_bonus"
  | "badge_earned";

export interface AwardPointsParams {
  userId: string;
  tenantId: string;
  points: number;
  sourceType: PointSourceType;
  sourceId?: string;
  description?: string;
}

export interface VisitPointsParams {
  userId: string;
  tenantId: string;
  visitId: string;
  hasPhotos?: boolean;
  hasChecklist?: boolean;
  hasGPS?: boolean;
}

// ============================================
// POINT VALUES
// ============================================

const POINT_VALUES = {
  visit_completed: 10,
  with_photos: 5,
  with_checklist: 5,
  with_gps: 2,
};

// ============================================
// SERVICE CLASS
// ============================================

class GamificationService {
  /**
   * Award points to a user
   */
  async awardPoints(params: AwardPointsParams): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from("user_points")
        .insert({
          user_id: params.userId,
          tenant_id: params.tenantId,
          points: params.points,
          source_type: params.sourceType,
          source_id: params.sourceId || null,
          description: params.description || null,
        })
        .select("id")
        .single();

      if (error) {
        console.warn("[GamificationService] Award points error:", error.message);
        return null;
      }

      return data.id;
    } catch (e) {
      console.error("[GamificationService] Award points failed:", e);
      return null;
    }
  }

  /**
   * Award points for a completed visit with bonuses
   */
  async awardPointsForVisit(params: VisitPointsParams): Promise<number> {
    let totalPoints = POINT_VALUES.visit_completed;
    let description = "Besuch abgeschlossen";

    if (params.hasPhotos) {
      totalPoints += POINT_VALUES.with_photos;
      description += " (+Fotos)";
    }
    if (params.hasChecklist) {
      totalPoints += POINT_VALUES.with_checklist;
      description += " (+Checkliste)";
    }
    if (params.hasGPS) {
      totalPoints += POINT_VALUES.with_gps;
      description += " (+GPS)";
    }

    await this.awardPoints({
      userId: params.userId,
      tenantId: params.tenantId,
      points: totalPoints,
      sourceType: "visit_completed",
      sourceId: params.visitId,
      description,
    });

    // Check for badges
    await this.checkAndAwardBadges(params.userId, params.tenantId);

    return totalPoints;
  }

  /**
   * Check and award badges based on user's current stats
   */
  async checkAndAwardBadges(userId: string, tenantId: string): Promise<string[]> {
    const awardedBadges: string[] = [];

    try {
      // Get user's current stats
      const { data: points } = await supabase
        .from("user_points")
        .select("points, source_type")
        .eq("user_id", userId);

      const { data: existingBadges } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", userId);

      const { data: allBadges } = await supabase
        .from("badge_definitions")
        .select("*")
        .eq("is_active", true);

      if (!points || !allBadges) return [];

      const earnedBadgeIds = new Set((existingBadges || []).map(b => b.badge_id));
      const totalPoints = points.reduce((sum, p) => sum + p.points, 0);
      const visitCount = points.filter(p => p.source_type === "visit_completed").length;

      for (const badge of allBadges) {
        if (earnedBadgeIds.has(badge.id)) continue;

        let earned = false;

        switch (badge.requirement_type) {
          case "visit_count":
            earned = visitCount >= badge.requirement_value;
            break;
          case "points_total":
            earned = totalPoints >= badge.requirement_value;
            break;
        }

        if (earned) {
          const { error } = await supabase
            .from("user_badges")
            .insert({
              user_id: userId,
              tenant_id: tenantId,
              badge_id: badge.id,
              metadata: {} as unknown as Json,
            });

          if (!error) {
            awardedBadges.push(badge.id);

            // Award bonus points for badge
            if (badge.points_reward > 0) {
              await this.awardPoints({
                userId,
                tenantId,
                points: badge.points_reward,
                sourceType: "badge_earned",
                description: `Badge verdient: ${badge.name}`,
              });
            }
          }
        }
      }
    } catch (e) {
      console.error("[GamificationService] Check badges failed:", e);
    }

    return awardedBadges;
  }

  /**
   * Get user's total points
   */
  async getUserTotalPoints(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("user_points")
        .select("points")
        .eq("user_id", userId);

      if (error || !data) return 0;
      return data.reduce((sum, p) => sum + p.points, 0);
    } catch {
      return 0;
    }
  }
}

export const gamificationService = new GamificationService();
