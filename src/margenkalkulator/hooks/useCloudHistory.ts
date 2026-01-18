// ============================================
// Cloud History Hook - Supabase Integration
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";
import type { OfferOptionState } from "../engine/types";
import type { HistoryEntry } from "../storage/types";
import type { Json } from "@/integrations/supabase/types";

const QUERY_KEY = ["cloud-history"];
const MAX_HISTORY_ENTRIES = 50;

/**
 * Creates a summary from config
 */
function createSummary(config: OfferOptionState): string {
  const parts: string[] = [];
  if (config.hardware.name && config.hardware.ekNet > 0) {
    parts.push(config.hardware.name);
  }
  if (config.mobile.tariffId) {
    parts.push(config.mobile.tariffId.replace(/_/g, " "));
  }
  if (config.fixedNet.enabled && config.fixedNet.accessType) {
    parts.push(`Festnetz ${config.fixedNet.accessType}`);
  }
  return parts.join(" + ") || "Leere Konfiguration";
}

/**
 * Maps DB row to HistoryEntry
 */
function rowToHistoryEntry(row: {
  id: string;
  config: Json;
  summary: string | null;
  created_at: string;
}): HistoryEntry {
  return {
    id: row.id,
    config: row.config as unknown as OfferOptionState,
    summary: row.summary || "Keine Zusammenfassung",
    timestamp: row.created_at,
  };
}

/**
 * Hook for managing calculation history in Supabase
 */
export function useCloudHistory() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  // Fetch history for current user (last 10)
  const { data: history = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("calculation_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []).map(rowToHistoryEntry);
    },
    enabled: !!user,
  });

  // Add to history mutation
  const addMutation = useMutation({
    mutationFn: async ({
      config,
      avgMonthly,
      margin,
    }: {
      config: OfferOptionState;
      avgMonthly: number;
      margin?: number;
    }) => {
      if (!user) throw new Error("Nicht authentifiziert");

      const summary = createSummary(config);

      // Insert new entry
      const { data, error } = await supabase
        .from("calculation_history")
        .insert({
          user_id: user.id,
          tenant_id: identity.tenantId,
          department_id: identity.departmentId,
          config: config as unknown as Json,
          summary,
          avg_monthly: avgMonthly,
          margin: margin || null,
          hardware_name: config.hardware.name || null,
          tariff_name: config.mobile.tariffId || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Clean up old entries (keep max 50)
      const { data: allHistory } = await supabase
        .from("calculation_history")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (allHistory && allHistory.length > MAX_HISTORY_ENTRIES) {
        const idsToDelete = allHistory
          .slice(MAX_HISTORY_ENTRIES)
          .map((h) => h.id);
        
        await supabase
          .from("calculation_history")
          .delete()
          .in("id", idsToDelete);
      }

      return rowToHistoryEntry(data);
    },
    onMutate: async ({ config }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<HistoryEntry[]>(QUERY_KEY);

      const optimisticEntry: HistoryEntry = {
        id: `temp-${Date.now()}`,
        config,
        summary: createSummary(config),
        timestamp: new Date().toISOString(),
      };

      queryClient.setQueryData<HistoryEntry[]>(QUERY_KEY, (old = []) =>
        [optimisticEntry, ...old].slice(0, 10)
      );

      return { previous };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(QUERY_KEY, context?.previous);
      // Silent fail for history - don't interrupt user flow
      console.error("Failed to save history:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Clear history mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Nicht authentifiziert");

      const { error } = await supabase
        .from("calculation_history")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<HistoryEntry[]>(QUERY_KEY);
      queryClient.setQueryData<HistoryEntry[]>(QUERY_KEY, []);
      return { previous };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(QUERY_KEY, context?.previous);
      toast.error("Fehler", {
        description: "Verlauf konnte nicht gelöscht werden.",
      });
    },
    onSuccess: () => {
      toast.success("Verlauf gelöscht", {
        description: "Der Berechnungsverlauf wurde gelöscht.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Get last entry
  const getLastEntry = (): HistoryEntry | null => {
    return history.length > 0 ? history[0] : null;
  };

  return {
    // Data
    history,
    isLoading,
    error,
    hasHistory: history.length > 0,

    // Actions
    addToHistory: (
      config: OfferOptionState,
      avgMonthly: number,
      margin?: number
    ) => addMutation.mutate({ config, avgMonthly, margin }),
    clearHistory: () => clearMutation.mutateAsync(),
    getLastEntry,

    // Mutation states
    isAdding: addMutation.isPending,
    isClearing: clearMutation.isPending,
  };
}
