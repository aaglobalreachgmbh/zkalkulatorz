// ============================================
// Cloud Drafts Hook - Supabase Integration
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import type { OfferOptionState } from "../engine/types";
import type { OfferDraft, OfferPreview } from "../storage/types";
import type { Json } from "@/integrations/supabase/types";

const QUERY_KEY = ["cloud-drafts"];

/**
 * Creates a preview object from config
 */
function createPreview(config: OfferOptionState, avgMonthly: number): OfferPreview {
  return {
    hardware: config.hardware.name || "SIM-Only",
    tariff: config.mobile.tariffId || "Kein Tarif",
    avgMonthly,
    quantity: 1,
  };
}

/**
 * Maps DB row to OfferDraft
 */
function rowToDraft(row: {
  id: string;
  name: string;
  config: Json;
  preview: Json | null;
  created_at: string;
  updated_at: string;
}): OfferDraft {
  return {
    id: row.id,
    name: row.name,
    config: row.config as unknown as OfferOptionState,
    preview: (row.preview as unknown as OfferPreview) || {
      hardware: "Unbekannt",
      tariff: "Unbekannt",
      avgMonthly: 0,
      quantity: 1,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Hook for managing drafts in Supabase
 */
export function useCloudDrafts() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();
  const { trackDraftCreated, trackDraftDeleted } = useActivityTracker();

  // Fetch all drafts for current user
  const { data: drafts = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("offer_drafts")
        .select("*")
        .eq("user_id", user.id)
        .eq("draft_type", "draft")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(rowToDraft);
    },
    enabled: !!user,
  });

  // Create draft mutation
  const createMutation = useMutation({
    mutationFn: async ({
      name,
      config,
      avgMonthly,
    }: {
      name: string;
      config: OfferOptionState;
      avgMonthly: number;
    }) => {
      if (!user) throw new Error("Nicht authentifiziert");

      const preview = createPreview(config, avgMonthly);
      const { data, error } = await supabase
        .from("offer_drafts")
        .insert({
          user_id: user.id,
          tenant_id: identity.tenantId,
          department_id: identity.departmentId,
          name,
          config: config as unknown as Json,
          preview: preview as unknown as Json,
          draft_type: "draft",
        })
        .select()
        .single();

      if (error) throw error;
      return rowToDraft(data);
    },
    onMutate: async ({ name, config, avgMonthly }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<OfferDraft[]>(QUERY_KEY);

      const optimisticDraft: OfferDraft = {
        id: `temp-${Date.now()}`,
        name,
        config,
        preview: createPreview(config, avgMonthly),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<OfferDraft[]>(QUERY_KEY, (old = []) => [
        optimisticDraft,
        ...old,
      ]);

      return { previous };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(QUERY_KEY, context?.previous);
      toast.error("Fehler", {
        description: "Entwurf konnte nicht gespeichert werden.",
      });
    },
    onSuccess: (draft) => {
      toast.success("Entwurf gespeichert", {
        description: "Der Entwurf wurde erfolgreich gespeichert.",
      });
      trackDraftCreated(draft.id, draft.name);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Update draft mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      config,
      avgMonthly,
    }: {
      id: string;
      config: OfferOptionState;
      avgMonthly: number;
    }) => {
      if (!user) throw new Error("Nicht authentifiziert");

      const preview = createPreview(config, avgMonthly);
      const { data, error } = await supabase
        .from("offer_drafts")
        .update({
          config: config as unknown as Json,
          preview: preview as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return rowToDraft(data);
    },
    onMutate: async ({ id, config, avgMonthly }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<OfferDraft[]>(QUERY_KEY);

      queryClient.setQueryData<OfferDraft[]>(QUERY_KEY, (old = []) =>
        old.map((d) =>
          d.id === id
            ? {
                ...d,
                config,
                preview: createPreview(config, avgMonthly),
                updatedAt: new Date().toISOString(),
              }
            : d
        )
      );

      return { previous };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(QUERY_KEY, context?.previous);
      toast.error("Fehler", {
        description: "Entwurf konnte nicht aktualisiert werden.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Delete draft mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Nicht authentifiziert");

      const { error } = await supabase
        .from("offer_drafts")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<OfferDraft[]>(QUERY_KEY);

      queryClient.setQueryData<OfferDraft[]>(QUERY_KEY, (old = []) =>
        old.filter((d) => d.id !== id)
      );

      return { previous };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(QUERY_KEY, context?.previous);
      toast.error("Fehler", {
        description: "Entwurf konnte nicht gelöscht werden.",
      });
    },
    onSuccess: (_, id) => {
      toast.success("Gelöscht", {
        description: "Entwurf wurde gelöscht.",
      });
      trackDraftDeleted(id, "Gelöscht");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Rename draft mutation
  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!user) throw new Error("Nicht authentifiziert");

      const { error } = await supabase
        .from("offer_drafts")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<OfferDraft[]>(QUERY_KEY);

      queryClient.setQueryData<OfferDraft[]>(QUERY_KEY, (old = []) =>
        old.map((d) =>
          d.id === id
            ? { ...d, name, updatedAt: new Date().toISOString() }
            : d
        )
      );

      return { previous };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(QUERY_KEY, context?.previous);
      toast.error("Fehler", {
        description: "Umbenennung fehlgeschlagen.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    // Data
    drafts,
    isLoading,
    error,
    hasDrafts: drafts.length > 0,

    // Actions
    createDraft: (name: string, config: OfferOptionState, avgMonthly: number) =>
      createMutation.mutateAsync({ name, config, avgMonthly }),
    updateDraft: (id: string, config: OfferOptionState, avgMonthly: number) =>
      updateMutation.mutateAsync({ id, config, avgMonthly }),
    deleteDraft: (id: string) => deleteMutation.mutateAsync(id),
    renameDraft: (id: string, name: string) =>
      renameMutation.mutateAsync({ id, name }),

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
