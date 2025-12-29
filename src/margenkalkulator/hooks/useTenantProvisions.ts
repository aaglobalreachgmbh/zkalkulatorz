// ============================================
// Tenant Provisions Hook
// CRUD operations for tenant-specific provision data
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";

export interface TenantProvisionItem {
  id: string;
  tenant_id: string;
  tariff_id: string;
  tariff_name: string;
  tariff_family: string | null;
  contract_type: string;
  provision_amount: number;
  sub_variant_id: string;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface TenantProvisionInput {
  tariff_id: string;
  tariff_name: string;
  tariff_family?: string;
  contract_type: "new" | "extension";
  provision_amount: number;
  sub_variant_id?: string;
  valid_from?: string;
  valid_until?: string | null;
  is_active?: boolean;
}

export function useTenantProvisions() {
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  // Fetch all provisions for current tenant
  const {
    data: provisions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tenant-provisions", identity.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_provisions")
        .select("*")
        .eq("tenant_id", identity.tenantId)
        .eq("is_active", true)
        .order("tariff_name", { ascending: true });

      if (error) throw error;
      return data as TenantProvisionItem[];
    },
    enabled: !!identity.tenantId,
  });

  // Get provision for specific tariff
  const getProvision = async (
    tariffId: string,
    contractType: "new" | "extension",
    subVariantId?: string
  ): Promise<number | null> => {
    const { data, error } = await supabase
      .from("tenant_provisions")
      .select("provision_amount")
      .eq("tenant_id", identity.tenantId)
      .eq("tariff_id", tariffId)
      .eq("contract_type", contractType)
      .eq("sub_variant_id", subVariantId || "")
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching provision:", error);
      return null;
    }

    return data?.provision_amount ?? null;
  };

  // Upsert provision
  const upsertMutation = useMutation({
    mutationFn: async (items: TenantProvisionInput[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const rows = items.map((item) => ({
        ...item,
        tenant_id: identity.tenantId,
        sub_variant_id: item.sub_variant_id || "",
        created_by: user?.id || null,
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from("tenant_provisions")
        .upsert(rows, { 
          onConflict: "tenant_id,tariff_id,contract_type,sub_variant_id",
          ignoreDuplicates: false,
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-provisions", identity.tenantId] });
      toast.success("Provisionen gespeichert");
    },
    onError: (error) => {
      toast.error(`Fehler beim Speichern: ${error.message}`);
    },
  });

  // Delete provision
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tenant_provisions")
        .delete()
        .eq("id", id)
        .eq("tenant_id", identity.tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-provisions", identity.tenantId] });
      toast.success("Provision gelöscht");
    },
    onError: (error) => {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });

  // Bulk import from CSV
  const bulkImportMutation = useMutation({
    mutationFn: async (items: TenantProvisionInput[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // First, deactivate all existing provisions
      await supabase
        .from("tenant_provisions")
        .update({ is_active: false })
        .eq("tenant_id", identity.tenantId);

      // Then upsert new provisions
      const rows = items.map((item) => ({
        ...item,
        tenant_id: identity.tenantId,
        sub_variant_id: item.sub_variant_id || "",
        created_by: user?.id || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from("tenant_provisions")
        .upsert(rows, { 
          onConflict: "tenant_id,tariff_id,contract_type,sub_variant_id",
          ignoreDuplicates: false,
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-provisions", identity.tenantId] });
      toast.success(`${data.length} Provisions-Einträge importiert`);
    },
    onError: (error) => {
      toast.error(`Import fehlgeschlagen: ${error.message}`);
    },
  });

  // Clear all provisions for tenant
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tenant_provisions")
        .delete()
        .eq("tenant_id", identity.tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-provisions", identity.tenantId] });
      toast.success("Alle Provisions-Daten gelöscht");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  return {
    provisions,
    isLoading,
    error,
    refetch,
    getProvision,
    upsert: upsertMutation.mutate,
    delete: deleteMutation.mutate,
    bulkImport: bulkImportMutation.mutate,
    clearAll: clearAllMutation.mutate,
    isUploading: upsertMutation.isPending || bulkImportMutation.isPending,
    hasData: provisions.length > 0,
  };
}
