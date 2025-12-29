// ============================================
// Tenant Hardware Hook
// CRUD operations for tenant-specific hardware data
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";

export interface TenantHardwareItem {
  id: string;
  tenant_id: string;
  hardware_id: string;
  brand: string;
  model: string;
  category: string;
  ek_net: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface TenantHardwareInput {
  hardware_id: string;
  brand: string;
  model: string;
  category?: string;
  ek_net: number;
  sort_order?: number;
  is_active?: boolean;
}

export function useTenantHardware() {
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  // Fetch all hardware for current tenant
  const {
    data: hardware = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tenant-hardware", identity.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_hardware")
        .select("*")
        .eq("tenant_id", identity.tenantId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as TenantHardwareItem[];
    },
    enabled: !!identity.tenantId,
  });

  // Create or update hardware item
  const upsertMutation = useMutation({
    mutationFn: async (items: TenantHardwareInput[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const rows = items.map((item) => ({
        ...item,
        tenant_id: identity.tenantId,
        created_by: user?.id || null,
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from("tenant_hardware")
        .upsert(rows, { 
          onConflict: "tenant_id,hardware_id",
          ignoreDuplicates: false,
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-hardware", identity.tenantId] });
      toast.success("Hardware-Daten gespeichert");
    },
    onError: (error) => {
      toast.error(`Fehler beim Speichern: ${error.message}`);
    },
  });

  // Delete hardware item
  const deleteMutation = useMutation({
    mutationFn: async (hardwareId: string) => {
      const { error } = await supabase
        .from("tenant_hardware")
        .delete()
        .eq("tenant_id", identity.tenantId)
        .eq("hardware_id", hardwareId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-hardware", identity.tenantId] });
      toast.success("Hardware gelöscht");
    },
    onError: (error) => {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });

  // Bulk import from CSV
  const bulkImportMutation = useMutation({
    mutationFn: async (items: TenantHardwareInput[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // First, deactivate all existing hardware
      await supabase
        .from("tenant_hardware")
        .update({ is_active: false })
        .eq("tenant_id", identity.tenantId);

      // Then upsert new hardware
      const rows = items.map((item, index) => ({
        ...item,
        tenant_id: identity.tenantId,
        created_by: user?.id || null,
        sort_order: item.sort_order ?? index,
        is_active: true,
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from("tenant_hardware")
        .upsert(rows, { 
          onConflict: "tenant_id,hardware_id",
          ignoreDuplicates: false,
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-hardware", identity.tenantId] });
      toast.success(`${data.length} Hardware-Einträge importiert`);
    },
    onError: (error) => {
      toast.error(`Import fehlgeschlagen: ${error.message}`);
    },
  });

  // Clear all hardware for tenant
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tenant_hardware")
        .delete()
        .eq("tenant_id", identity.tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-hardware", identity.tenantId] });
      toast.success("Alle Hardware-Daten gelöscht");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  return {
    hardware,
    isLoading,
    error,
    refetch,
    upsert: upsertMutation.mutate,
    delete: deleteMutation.mutate,
    bulkImport: bulkImportMutation.mutate,
    clearAll: clearAllMutation.mutate,
    isUploading: upsertMutation.isPending || bulkImportMutation.isPending,
    hasData: hardware.length > 0,
  };
}
