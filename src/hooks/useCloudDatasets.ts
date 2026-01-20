// ============================================
// Cloud Datasets Hook - Supabase Integration
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";
import type { CanonicalDataset } from "@/margenkalkulator/dataManager/types";
import type { Json } from "@/integrations/supabase/types";

const QUERY_KEY = ["cloud-datasets"];

export interface CloudDataset {
  id: string;
  tenantId: string;
  datasetVersion: string;
  validFrom: string;
  verifiedAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  dataset: CanonicalDataset;
}

function rowToCloudDataset(row: {
  id: string;
  tenant_id: string;
  dataset_version: string;
  valid_from: string;
  verified_at: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  hardware_catalog: Json;
  mobile_tariffs: Json;
  mobile_features: Json;
  mobile_dependencies: Json;
  fixed_net_products: Json;
  promos: Json;
  provisions: Json;
  sub_variants: Json;
  omo_matrix: Json;
}): CloudDataset {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    datasetVersion: row.dataset_version,
    validFrom: row.valid_from,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    dataset: {
      meta: {
        datasetVersion: row.dataset_version,
        validFromISO: row.valid_from,
        verifiedAtISO: row.verified_at,
      },
      hardwareCatalog: row.hardware_catalog as unknown as CanonicalDataset["hardwareCatalog"],
      mobileTariffs: row.mobile_tariffs as unknown as CanonicalDataset["mobileTariffs"],
      mobileFeatures: row.mobile_features as unknown as CanonicalDataset["mobileFeatures"],
      mobileDependencies: row.mobile_dependencies as unknown as CanonicalDataset["mobileDependencies"],
      fixedNetProducts: row.fixed_net_products as unknown as CanonicalDataset["fixedNetProducts"],
      promos: row.promos as unknown as CanonicalDataset["promos"],
      provisions: row.provisions as unknown as CanonicalDataset["provisions"],
      subVariants: row.sub_variants as unknown as CanonicalDataset["subVariants"],
      omoMatrix: row.omo_matrix as unknown as CanonicalDataset["omoMatrix"],
      iotTariffs: [],
      voipProducts: [],
      voipHardware: [],
    },
  };
}

/**
 * Hook for managing custom datasets in Supabase (Admin only)
 */
export function useCloudDatasets() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  // Fetch dataset for current tenant
  const { data: cloudDataset, isLoading, error } = useQuery({
    queryKey: [...QUERY_KEY, identity.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_datasets")
        .select("*")
        .eq("tenant_id", identity.tenantId)
        .order("valid_from", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return rowToCloudDataset(data);
    },
    enabled: !!user,
  });

  // Save dataset mutation (Admin only)
  const saveMutation = useMutation({
    mutationFn: async (dataset: CanonicalDataset) => {
      if (!user) {
        console.warn("[useCloudDatasets] Not authenticated");
        toast.error("Bitte zuerst einloggen");
        return;
      }

      const payload = {
        tenant_id: identity.tenantId,
        dataset_version: dataset.meta.datasetVersion,
        valid_from: dataset.meta.validFromISO,
        verified_at: dataset.meta.verifiedAtISO,
        created_by: user.id,
        hardware_catalog: dataset.hardwareCatalog as unknown as Json,
        mobile_tariffs: dataset.mobileTariffs as unknown as Json,
        mobile_features: dataset.mobileFeatures as unknown as Json,
        mobile_dependencies: dataset.mobileDependencies as unknown as Json,
        fixed_net_products: dataset.fixedNetProducts as unknown as Json,
        promos: dataset.promos as unknown as Json,
        provisions: dataset.provisions as unknown as Json,
        sub_variants: dataset.subVariants as unknown as Json,
        omo_matrix: dataset.omoMatrix as unknown as Json,
      };

      // Upsert based on tenant_id
      const { data: existing } = await supabase
        .from("custom_datasets")
        .select("id")
        .eq("tenant_id", identity.tenantId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("custom_datasets")
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          console.warn("[useCloudDatasets] Update error:", error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("custom_datasets")
          .insert(payload);

        if (error) {
          console.warn("[useCloudDatasets] Insert error:", error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success("Dataset gespeichert", {
        description: "Das benutzerdefinierte Dataset wurde erfolgreich gespeichert.",
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => {
      console.error("Save dataset error:", error);
      toast.error("Fehler", {
        description: "Dataset konnte nicht gespeichert werden: " + (error instanceof Error ? error.message : "Unknown error"),
      });
    },
  });

  // Clear dataset mutation (Admin only)
  const clearMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        console.warn("[useCloudDatasets] Not authenticated");
        toast.error("Bitte zuerst einloggen");
        return;
      }

      const { error } = await supabase
        .from("custom_datasets")
        .delete()
        .eq("tenant_id", identity.tenantId);

      if (error) {
        console.warn("[useCloudDatasets] Clear error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Dataset zurückgesetzt", {
        description: "Das benutzerdefinierte Dataset wurde gelöscht.",
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => {
      console.error("Clear dataset error:", error);
      toast.error("Fehler", {
        description: "Dataset konnte nicht gelöscht werden.",
      });
    },
  });

  return {
    // Data
    cloudDataset,
    dataset: cloudDataset?.dataset || null,
    hasCustomDataset: !!cloudDataset,
    isLoading,
    error,

    // Actions
    saveDataset: (dataset: CanonicalDataset) => saveMutation.mutateAsync(dataset),
    clearDataset: () => clearMutation.mutateAsync(),

    // Mutation states
    isSaving: saveMutation.isPending,
    isClearing: clearMutation.isPending,
  };
}
