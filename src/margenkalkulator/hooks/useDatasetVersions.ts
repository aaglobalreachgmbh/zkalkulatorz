import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/contexts/IdentityContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

// Seed data imports
import { provisionTable } from "@/margenkalkulator/data/business/v2025_10/provisions";
import { omoMatrix } from "@/margenkalkulator/data/business/v2025_10/omoMatrix";
import { hardwareCatalog } from "@/margenkalkulator/data/business/v2025_10/hardware";
import { mobilePrimeTariffs, businessSmartTariffs } from "@/margenkalkulator/data/business/v2025_10";
import { businessSubVariants } from "@/margenkalkulator/data/business/v2025_09/subVariants";

// ============================================
// Types
// ============================================

export interface DatasetVersion {
  id: string;
  tenantId: string;
  versionName: string;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  sourceFile: string | null;
  provisions: Json;
  omoMatrix: Json;
  hardwareCatalog: Json;
  mobileTariffs: Json;
  subVariants: Json;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

interface CreateVersionInput {
  versionName: string;
  validFrom: string;
  validUntil?: string | null;
  sourceFile?: string | null;
  provisions?: Json;
  omoMatrix?: Json;
  hardwareCatalog?: Json;
  mobileTariffs?: Json;
  subVariants?: Json;
  setActive?: boolean;
}

// ============================================
// Hook
// ============================================

export function useDatasetVersions() {
  const { identity, isSupabaseAuth } = useIdentity();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = identity.tenantId;
  
  // Get real UUID for created_by (only if authenticated with Supabase)
  const createdByUserId = isSupabaseAuth && user?.id ? user.id : null;

  // Fetch all versions for tenant
  const { data: versions = [], isLoading, error } = useQuery({
    queryKey: ["dataset-versions", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dataset_versions")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("valid_from", { ascending: false });

      if (error) throw error;

      return (data ?? []).map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        versionName: row.version_name,
        validFrom: row.valid_from,
        validUntil: row.valid_until,
        isActive: row.is_active,
        sourceFile: row.source_file,
        provisions: row.provisions,
        omoMatrix: row.omo_matrix,
        hardwareCatalog: row.hardware_catalog,
        mobileTariffs: row.mobile_tariffs,
        subVariants: row.sub_variants,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
      })) as DatasetVersion[];
    },
    enabled: !!tenantId,
  });

  // Get active version
  const activeVersion = versions.find(v => v.isActive) ?? null;

  // Create new version
  const createMutation = useMutation({
    mutationFn: async (input: CreateVersionInput) => {
      const { data, error } = await supabase
        .from("dataset_versions")
        .insert({
          tenant_id: tenantId,
          version_name: input.versionName,
          valid_from: input.validFrom,
          valid_until: input.validUntil ?? null,
          source_file: input.sourceFile ?? null,
          provisions: input.provisions ?? [],
          omo_matrix: input.omoMatrix ?? [],
          hardware_catalog: input.hardwareCatalog ?? [],
          mobile_tariffs: input.mobileTariffs ?? [],
          sub_variants: input.subVariants ?? [],
          is_active: input.setActive ?? false,
          created_by: createdByUserId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataset-versions", tenantId] });
      toast({
        title: "Version erstellt",
        description: "Die neue Provisions-Version wurde gespeichert.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set version as active
  const activateMutation = useMutation({
    mutationFn: async (versionId: string) => {
      // The trigger will automatically deactivate other versions
      const { data, error } = await supabase
        .from("dataset_versions")
        .update({ is_active: true })
        .eq("id", versionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dataset-versions", tenantId] });
      toast({
        title: "Version aktiviert",
        description: `"${data.version_name}" ist jetzt die aktive Version.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete version
  const deleteMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const { error } = await supabase
        .from("dataset_versions")
        .delete()
        .eq("id", versionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataset-versions", tenantId] });
      toast({
        title: "Version gelöscht",
        description: "Die Version wurde entfernt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update version
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DatasetVersion> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (updates.versionName !== undefined) updateData.version_name = updates.versionName;
      if (updates.validFrom !== undefined) updateData.valid_from = updates.validFrom;
      if (updates.validUntil !== undefined) updateData.valid_until = updates.validUntil;
      if (updates.provisions !== undefined) updateData.provisions = updates.provisions;
      if (updates.omoMatrix !== undefined) updateData.omo_matrix = updates.omoMatrix;
      if (updates.hardwareCatalog !== undefined) updateData.hardware_catalog = updates.hardwareCatalog;
      if (updates.mobileTariffs !== undefined) updateData.mobile_tariffs = updates.mobileTariffs;
      if (updates.subVariants !== undefined) updateData.sub_variants = updates.subVariants;

      const { data, error } = await supabase
        .from("dataset_versions")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataset-versions", tenantId] });
      toast({
        title: "Version aktualisiert",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Seed default v2025_10 version
  const seedMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("dataset_versions")
        .insert({
          tenant_id: tenantId,
          version_name: "Oktober 2025 (Standard)",
          valid_from: "2025-10-01",
          valid_until: "2025-10-31",
          source_file: "v2025_10 TypeScript-Seed",
          provisions: provisionTable as unknown as Json,
          omo_matrix: omoMatrix as unknown as Json,
          hardware_catalog: hardwareCatalog as unknown as Json,
          mobile_tariffs: [...mobilePrimeTariffs, ...businessSmartTariffs] as unknown as Json,
          sub_variants: businessSubVariants as unknown as Json,
          is_active: true,
          created_by: createdByUserId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataset-versions", tenantId] });
      toast({
        title: "Standard-Daten geladen",
        description: "v2025_10 wurde als aktive Version eingerichtet.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler beim Seeding",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    versions,
    activeVersion,
    isLoading,
    error,
    createVersion: createMutation.mutateAsync,
    activateVersion: activateMutation.mutateAsync,
    deleteVersion: deleteMutation.mutateAsync,
    updateVersion: updateMutation.mutateAsync,
    seedDefaultVersion: seedMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isActivating: activateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSeeding: seedMutation.isPending,
  };
}
