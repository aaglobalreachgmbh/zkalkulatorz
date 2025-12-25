// ============================================
// Cloud Offers Hook - React Query Integration
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { OfferOptionState } from "../engine/types";
import type { OfferDraft } from "../storage/types";
import {
  loadCloudOffers,
  createCloudOffer,
  updateCloudOffer,
  deleteCloudOffer,
  renameCloudOffer,
} from "../storage/cloudOffers";
import { useToast } from "@/hooks/use-toast";

const QUERY_KEY = ["cloudOffers"];

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
    queryFn: loadCloudOffers,
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: ({
      name,
      config,
      avgMonthly,
    }: {
      name: string;
      config: OfferOptionState;
      avgMonthly: number;
    }) => createCloudOffer(name, config, avgMonthly),
    onSuccess: (newOffer) => {
      queryClient.setQueryData<OfferDraft[]>(QUERY_KEY, (old) => [
        newOffer,
        ...(old || []),
      ]);
      toast({
        title: "In Cloud gespeichert",
        description: `"${newOffer.name}" wurde in der Cloud gespeichert.`,
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

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      config,
      avgMonthly,
    }: {
      id: string;
      config: OfferOptionState;
      avgMonthly: number;
    }) => updateCloudOffer(id, config, avgMonthly),
    onSuccess: (updated) => {
      queryClient.setQueryData<OfferDraft[]>(QUERY_KEY, (old) =>
        (old || []).map((o) => (o.id === updated.id ? updated : o))
      );
      toast({
        title: "Aktualisiert",
        description: `"${updated.name}" wurde aktualisiert.`,
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
    mutationFn: deleteCloudOffer,
    onSuccess: (_, id) => {
      queryClient.setQueryData<OfferDraft[]>(QUERY_KEY, (old) =>
        (old || []).filter((o) => o.id !== id)
      );
      toast({
        title: "Gelöscht",
        description: "Angebot wurde aus der Cloud entfernt.",
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
    mutationFn: ({ id, newName }: { id: string; newName: string }) =>
      renameCloudOffer(id, newName),
    onSuccess: (_, { id, newName }) => {
      queryClient.setQueryData<OfferDraft[]>(QUERY_KEY, (old) =>
        (old || []).map((o) => (o.id === id ? { ...o, name: newName } : o))
      );
      toast({
        title: "Umbenannt",
        description: `Angebot wurde in "${newName}" umbenannt.`,
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
    createOffer: createMutation.mutateAsync,
    updateOffer: updateMutation.mutateAsync,
    deleteOffer: deleteMutation.mutateAsync,
    renameOffer: renameMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
