// ============================================
// Cloud Offers Hook - React Query Integration
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { OfferOptionState } from "../engine/types";
import type { CloudOffer, OfferPreview } from "../storage/types";
import { useToast } from "@/hooks/use-toast";

// Re-export CloudOffer type
export type { CloudOffer };

const QUERY_KEY = ["cloudOffers"];

/**
 * Create preview from config
 */
function createPreview(config: OfferOptionState, avgMonthly: number): OfferPreview {
  return {
    hardware: config.hardware.name || "SIM Only",
    tariff: config.mobile.tariffId || "Kein Tarif",
    avgMonthly,
    quantity: config.mobile.quantity,
  };
}

/**
 * Hook for cloud offer management
 */
export function useCloudOffers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load offers query
  const {
    data: offers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<CloudOffer[]> => {
      const { data, error } = await supabase
        .from("saved_offers")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw new Error("Laden fehlgeschlagen: " + error.message);

      return (data || []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        config: row.config as unknown as OfferOptionState,
        preview: row.preview as unknown as OfferPreview | null,
        is_draft: row.is_draft ?? true,
        created_at: row.created_at,
        updated_at: row.updated_at,
        customer_id: row.customer_id ?? null,
        team_id: row.team_id ?? null,
        visibility: (row.visibility as "private" | "team") ?? "private",
      }));
    },
    enabled: !!user,
    staleTime: 1000 * 60,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async ({
      name,
      config,
      avgMonthly,
    }: {
      name: string;
      config: OfferOptionState;
      avgMonthly: number;
    }): Promise<CloudOffer> => {
      if (!user) throw new Error("Nicht eingeloggt");

      const preview = createPreview(config, avgMonthly);

      const { data, error } = await supabase
        .from("saved_offers")
        .insert({
          user_id: user.id,
          name,
          config: JSON.parse(JSON.stringify(config)),
          preview: JSON.parse(JSON.stringify(preview)),
          is_draft: false,
        })
        .select()
        .single();

      if (error) throw new Error("Speichern fehlgeschlagen: " + error.message);

      return {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        config: data.config as unknown as OfferOptionState,
        preview: data.preview as unknown as OfferPreview | null,
        is_draft: data.is_draft ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at,
        customer_id: data.customer_id ?? null,
        team_id: data.team_id ?? null,
        visibility: (data.visibility as "private" | "team") ?? "private",
      };
    },
    onSuccess: (newOffer) => {
      queryClient.setQueryData<CloudOffer[]>(QUERY_KEY, (old) => [
        newOffer,
        ...(old || []),
      ]);
      toast({
        title: "Gespeichert",
        description: `"${newOffer.name}" wurde gespeichert.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from("saved_offers")
        .delete()
        .eq("id", id);

      if (error) throw new Error("Löschen fehlgeschlagen: " + error.message);
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<CloudOffer[]>(QUERY_KEY, (old) =>
        (old || []).filter((o) => o.id !== id)
      );
      toast({
        title: "Gelöscht",
        description: "Angebot wurde entfernt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }): Promise<void> => {
      const { error } = await supabase
        .from("saved_offers")
        .update({ name })
        .eq("id", id);

      if (error) throw new Error("Umbenennen fehlgeschlagen: " + error.message);
    },
    onSuccess: (_, { id, name }) => {
      queryClient.setQueryData<CloudOffer[]>(QUERY_KEY, (old) =>
        (old || []).map((o) => (o.id === id ? { ...o, name } : o))
      );
      toast({
        title: "Umbenannt",
        description: `Angebot wurde in "${name}" umbenannt.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    offers,
    isLoading,
    error,
    refetch,
    isAuthenticated: !!user,
    createOffer: createMutation,
    deleteOffer: deleteMutation,
    renameOffer: renameMutation,
  };
}
