// ============================================
// Tenant Data Status Hook
// Checks if tenant has required data (hardware, provisions)
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/contexts/IdentityContext";

export interface TenantDataStatus {
  hasHardware: boolean;
  hasProvisions: boolean;
  isComplete: boolean;
  hardwareCount: number;
  provisionCount: number;
}

export function useTenantDataStatus() {
  const { identity, isSupabaseAuth } = useIdentity();

  // Super-Admin bypass - immer "complete" für Plattform-Admins
  if (identity.role === "admin") {
    return {
      status: {
        hasHardware: true,
        hasProvisions: true,
        isComplete: true,
        hardwareCount: 0,
        provisionCount: 0,
      },
      isLoading: false,
    };
  }

  const query = useQuery({
    queryKey: ["tenant-data-status", identity.tenantId],
    queryFn: async (): Promise<TenantDataStatus> => {
      const [hardwareResult, provisionsResult] = await Promise.all([
        supabase
          .from("tenant_hardware")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", identity.tenantId),
        supabase
          .from("tenant_provisions")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", identity.tenantId),
      ]);

      const hardwareCount = hardwareResult.count ?? 0;
      const provisionCount = provisionsResult.count ?? 0;

      return {
        hasHardware: hardwareCount > 0,
        hasProvisions: provisionCount > 0,
        isComplete: hardwareCount > 0 && provisionCount > 0,
        hardwareCount,
        provisionCount,
      };
    },
    staleTime: 60_000, // 1 minute cache
    enabled: !!identity.tenantId && isSupabaseAuth,
  });

  // For non-Supabase auth (mock identities), always return complete
  if (!isSupabaseAuth) {
    return {
      status: {
        hasHardware: true,
        hasProvisions: true,
        isComplete: true,
        hardwareCount: 0,
        provisionCount: 0,
      },
      isLoading: false,
    };
  }

  return {
    status: query.data,
    isLoading: query.isLoading,
  };
}
