import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Helper to get tenant ID from JWT claims
async function getTenantId(): Promise<string> {
  const { data } = await supabase.rpc("get_my_tenant_id");
  return data ?? "tenant_default";
}

export interface HardwareImportLog {
  id: string;
  tenant_id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  status: "completed" | "failed" | "partial";
  total_rows: number;
  added_count: number;
  changed_count: number;
  removed_count: number;
  error_count: number;
  warnings: string[];
  created_at: string;
}

export interface HardwareImportInput {
  file_name: string;
  file_type: "csv" | "xlsx";
  status: "completed" | "failed" | "partial";
  total_rows: number;
  added_count: number;
  changed_count: number;
  removed_count: number;
  error_count?: number;
  warnings?: string[];
}

export function useHardwareImports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch import history (last 10)
  const { data: history, isLoading } = useQuery({
    queryKey: ["hardware-imports", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const tenantId = await getTenantId();
      
      const { data, error } = await supabase
        .from("hardware_imports")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as HardwareImportLog[];
    },
    enabled: !!user?.id,
  });

  // Log a new import
  const logImportMutation = useMutation({
    mutationFn: async (input: HardwareImportInput) => {
      if (!user?.id) {
        console.warn("[useHardwareImports] logImport: User not available");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      const tenantId = await getTenantId();

      const { data, error } = await supabase
        .from("hardware_imports")
        .insert({
          tenant_id: tenantId,
          user_id: user.id,
          file_name: input.file_name,
          file_type: input.file_type,
          status: input.status,
          total_rows: input.total_rows,
          added_count: input.added_count,
          changed_count: input.changed_count,
          removed_count: input.removed_count,
          error_count: input.error_count ?? 0,
          warnings: input.warnings ?? [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardware-imports", user?.id] });
    },
  });

  return {
    history: history ?? [],
    isLoading,
    logImport: logImportMutation.mutateAsync,
    isLogging: logImportMutation.isPending,
  };
}
