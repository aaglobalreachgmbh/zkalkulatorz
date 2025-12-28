import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { OfferOptionState } from "../engine/types";
import type { Json } from "@/integrations/supabase/types";

export type Sector = "private" | "business" | "enterprise";

export interface CorporateBundle {
  id: string;
  sector: Sector;
  name: string;
  description: string | null;
  tags: string[];
  featured: boolean;
  config: OfferOptionState;
  image_url: string | null;
  created_by: string | null;
  tenant_id: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface CreateBundleParams {
  sector: Sector;
  name: string;
  description?: string;
  tags?: string[];
  featured?: boolean;
  config: OfferOptionState;
  image_url?: string;
}

interface UpdateBundleParams {
  id: string;
  updates: Partial<Omit<CreateBundleParams, "config"> & { config?: OfferOptionState; is_active?: boolean; sort_order?: number }>;
}

/**
 * Hook for managing corporate bundles
 * - CRUD operations on bundles
 * - Filter by sector
 * - Toggle active state
 */
export function useCorporateBundles(options?: { sector?: Sector; includeInactive?: boolean }) {
  const queryClient = useQueryClient();
  const { sector, includeInactive = false } = options || {};

  // Query bundles
  const { data: bundles = [], isLoading, error } = useQuery({
    queryKey: ["corporate-bundles", sector, includeInactive],
    queryFn: async (): Promise<CorporateBundle[]> => {
      let query = supabase
        .from("corporate_bundles")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (sector) {
        query = query.eq("sector", sector);
      }

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Type cast the JSON config to OfferOptionState
      return (data || []).map(bundle => ({
        ...bundle,
        sector: bundle.sector as Sector,
        tags: bundle.tags || [],
        featured: bundle.featured || false,
        is_active: bundle.is_active ?? true,
        sort_order: bundle.sort_order || 0,
        config: bundle.config as unknown as OfferOptionState,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create bundle mutation
  const createMutation = useMutation({
    mutationFn: async (params: CreateBundleParams) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("corporate_bundles")
        .insert({
          sector: params.sector,
          name: params.name,
          description: params.description || null,
          tags: params.tags || [],
          featured: params.featured || false,
          config: params.config as unknown as Json,
          image_url: params.image_url || null,
          created_by: user.user?.id,
          tenant_id: "tenant_default",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-bundles"] });
      toast({
        title: "Bundle erstellt",
        description: "Das Bundle wurde erfolgreich angelegt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler beim Erstellen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    },
  });

  // Update bundle mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: UpdateBundleParams) => {
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.config) {
        updateData.config = updates.config as unknown as Json;
      }

      const { data, error } = await supabase
        .from("corporate_bundles")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-bundles"] });
      toast({
        title: "Bundle aktualisiert",
        description: "Die Änderungen wurden gespeichert.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler beim Aktualisieren",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    },
  });

  // Delete bundle mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("corporate_bundles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-bundles"] });
      toast({
        title: "Bundle gelöscht",
        description: "Das Bundle wurde entfernt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler beim Löschen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    },
  });

  // Toggle active state
  const toggleActive = async (id: string, isActive: boolean) => {
    await updateMutation.mutateAsync({
      id,
      updates: { is_active: isActive },
    });
  };

  return {
    bundles,
    isLoading,
    error,
    createBundle: createMutation.mutate,
    createBundleAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateBundle: updateMutation.mutate,
    updateBundleAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteBundle: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    toggleActive,
  };
}

// Sector display helpers
export const SECTOR_LABELS: Record<Sector, string> = {
  private: "Privatkunden",
  business: "Geschäftskunden",
  enterprise: "Konzernkunden",
};

export const SECTOR_ICONS: Record<Sector, string> = {
  private: "User",
  business: "Building2",
  enterprise: "Building",
};
