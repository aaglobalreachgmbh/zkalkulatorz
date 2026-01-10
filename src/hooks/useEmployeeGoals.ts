// ============================================
// Employee Goals Hook
// Monthly sales targets and KPI tracking
// ============================================

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";

export type GoalType = "revenue" | "contracts" | "customers" | "offers" | "margin";

export interface EmployeeGoal {
  id: string;
  tenant_id: string;
  user_id: string;
  month: string;
  goal_type: GoalType;
  target_value: number;
  current_value: number;
  bonus_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: { id: string; display_name: string | null; email: string | null };
}

export interface GoalProgress {
  user_id: string;
  user_name: string;
  goals: EmployeeGoal[];
  totalProgress: number; // Average progress across all goals
  achievedGoals: number;
  totalGoals: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  progress: number;
  achievedGoals: number;
  trend?: "up" | "down" | "same";
}

const QUERY_KEY = ["employee-goals"];

const goalTypeLabels: Record<GoalType, string> = {
  revenue: "Umsatz",
  contracts: "Verträge",
  customers: "Neukunden",
  offers: "Angebote",
  margin: "Marge",
};

const goalTypeUnits: Record<GoalType, string> = {
  revenue: "€",
  contracts: "",
  customers: "",
  offers: "",
  margin: "€",
};

export function useEmployeeGoals(month?: Date) {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  // Default to current month
  const targetMonth = month || new Date();
  const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
  const monthKey = monthStart.toISOString().split("T")[0];

  const queryKey = [...QUERY_KEY, monthKey];

  // Fetch goals for the month
  const {
    data: goals = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from("employee_goals")
          .select(`
            *,
            user:profiles!employee_goals_user_id_fkey(id, display_name, email)
          `)
          .eq("month", monthKey)
          .order("goal_type", { ascending: true });

        if (error) {
          console.warn("[useEmployeeGoals] Query error:", error.message);
          return [];
        }

        return (data || []) as unknown as EmployeeGoal[];
      } catch (err) {
        console.error("[useEmployeeGoals] Unexpected error:", err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Calculate progress per user
  const progressByUser = useMemo(() => {
    const byUser = new Map<string, GoalProgress>();

    goals.forEach((goal) => {
      const existing = byUser.get(goal.user_id) || {
        user_id: goal.user_id,
        user_name: goal.user?.display_name || goal.user?.email || "Unbekannt",
        goals: [],
        totalProgress: 0,
        achievedGoals: 0,
        totalGoals: 0,
      };

      existing.goals.push(goal);
      existing.totalGoals++;

      const progress = goal.target_value > 0
        ? (goal.current_value / goal.target_value) * 100
        : 0;

      if (progress >= 100) {
        existing.achievedGoals++;
      }

      byUser.set(goal.user_id, existing);
    });

    // Calculate average progress for each user
    byUser.forEach((progress) => {
      if (progress.goals.length > 0) {
        const totalProgressSum = progress.goals.reduce((sum, goal) => {
          const p = goal.target_value > 0
            ? (goal.current_value / goal.target_value) * 100
            : 0;
          return sum + Math.min(p, 150); // Cap at 150% to not skew averages
        }, 0);
        progress.totalProgress = totalProgressSum / progress.goals.length;
      }
    });

    return Array.from(byUser.values());
  }, [goals]);

  // My goals
  const myGoals = useMemo(
    () => goals.filter((g) => g.user_id === user?.id),
    [goals, user]
  );

  // My progress
  const myProgress = useMemo(() => {
    if (myGoals.length === 0) return 0;
    
    const totalProgress = myGoals.reduce((sum, goal) => {
      const progress = goal.target_value > 0
        ? (goal.current_value / goal.target_value) * 100
        : 0;
      return sum + Math.min(progress, 150);
    }, 0);

    return totalProgress / myGoals.length;
  }, [myGoals]);

  // Leaderboard
  const leaderboard = useMemo((): LeaderboardEntry[] => {
    return progressByUser
      .sort((a, b) => b.totalProgress - a.totalProgress)
      .map((p, index) => ({
        rank: index + 1,
        user_id: p.user_id,
        user_name: p.user_name,
        progress: p.totalProgress,
        achievedGoals: p.achievedGoals,
      }));
  }, [progressByUser]);

  // Set goal mutation
  const setGoalMutation = useMutation({
    mutationFn: async (input: {
      user_id: string;
      goal_type: GoalType;
      target_value: number;
      bonus_amount?: number;
      notes?: string;
    }) => {
      if (!user || !identity.tenantId) {
        throw new Error("Nicht authentifiziert");
      }

      const { data, error } = await supabase
        .from("employee_goals")
        .upsert({
          tenant_id: identity.tenantId,
          user_id: input.user_id,
          month: monthKey,
          goal_type: input.goal_type,
          target_value: input.target_value,
          bonus_amount: input.bonus_amount || 0,
          notes: input.notes || null,
          created_by: user.id,
        }, {
          onConflict: "user_id,month,goal_type",
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmployeeGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Ziel gespeichert");
    },
    onError: (error) => {
      console.error("[useEmployeeGoals] Set goal error:", error);
      toast.error("Fehler beim Speichern des Ziels");
    },
  });

  // Update current value mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (input: { goalId: string; current_value: number }) => {
      const { data, error } = await supabase
        .from("employee_goals")
        .update({ current_value: input.current_value })
        .eq("id", input.goalId)
        .select()
        .single();

      if (error) throw error;

      // Check if goal was just achieved
      if (data.target_value > 0 && data.current_value >= data.target_value) {
        // Create notification
        await supabase.from("notifications").insert({
          user_id: data.user_id,
          tenant_id: data.tenant_id,
          type: "goal_achieved",
          title: "🎉 Ziel erreicht!",
          message: `Sie haben Ihr ${goalTypeLabels[data.goal_type as GoalType]}-Ziel erreicht!`,
          link: "/team",
        });
      }

      return data as EmployeeGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => {
      console.error("[useEmployeeGoals] Update progress error:", error);
      toast.error("Fehler beim Aktualisieren des Fortschritts");
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from("employee_goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Ziel gelöscht");
    },
    onError: (error) => {
      console.error("[useEmployeeGoals] Delete goal error:", error);
      toast.error("Fehler beim Löschen des Ziels");
    },
  });

  return {
    goals,
    myGoals,
    myProgress,
    progressByUser,
    leaderboard,
    isLoading,
    error,
    refetch,
    setGoal: setGoalMutation.mutateAsync,
    updateProgress: updateProgressMutation.mutateAsync,
    deleteGoal: deleteGoalMutation.mutateAsync,
    isSaving: setGoalMutation.isPending,
    goalTypeLabels,
    goalTypeUnits,
    monthKey,
  };
}
