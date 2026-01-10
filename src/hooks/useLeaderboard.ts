/**
 * Hook für das Team-Leaderboard
 * 
 * Zeigt Rangliste der Team-Mitglieder nach Punkten.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/contexts/IdentityContext";
import { useMemo } from "react";

// ============================================
// TYPES
// ============================================

export type LeaderboardPeriod = "week" | "month" | "all";

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_points: number;
  visits_count: number;
  badges_count: number;
  rank: number;
}

// ============================================
// MAIN HOOK
// ============================================

export function useLeaderboard(period: LeaderboardPeriod = "week") {
  const { identity } = useIdentity();
  const { userId, tenantId } = identity;

  // ------------------------------------------
  // Fetch leaderboard via RPC
  // ------------------------------------------
  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard", tenantId, period],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .rpc("get_leaderboard", {
          p_tenant_id: tenantId,
          p_period: period,
        });

      if (error) {
        console.warn("[useLeaderboard] RPC error:", error.message);
        return [];
      }

      return (data || []) as LeaderboardEntry[];
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // ------------------------------------------
  // Find current user's rank
  // ------------------------------------------
  const myRank = useMemo(() => {
    if (!userId || !leaderboardQuery.data) return null;
    
    const entry = leaderboardQuery.data.find(e => e.user_id === userId);
    return entry || null;
  }, [userId, leaderboardQuery.data]);

  // ------------------------------------------
  // Top 3 for podium display
  // ------------------------------------------
  const podium = useMemo(() => {
    const data = leaderboardQuery.data || [];
    return {
      first: data[0] || null,
      second: data[1] || null,
      third: data[2] || null,
    };
  }, [leaderboardQuery.data]);

  return {
    leaderboard: leaderboardQuery.data || [],
    isLoading: leaderboardQuery.isLoading,
    isError: leaderboardQuery.isError,
    myRank,
    podium,
    period,
  };
}
