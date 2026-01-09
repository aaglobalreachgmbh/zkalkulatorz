// ============================================
// Tenant Data Status Hook
// Checks if tenant has required data (hardware, provisions)
// FIXED: Always call useQuery to comply with React Hooks rules
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

// Default complete status for bypass cases
const COMPLETE_STATUS: TenantDataStatus = {
  hasHardware: true,
  hasProvisions: true,
  isComplete: true,
  hardwareCount: 0,
  provisionCount: 0,
};

export function useTenantDataStatus() {
  const { identity, isSupabaseAuth } = useIdentity();

  // Determine if query should actually run
  const isAdmin = identity.role === "admin";
  const shouldQuery = !!identity.tenantId && isSupabaseAuth && !isAdmin;

  // ALWAYS call the hook (React Hooks rules), but conditionally enable
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
    enabled: shouldQuery, // Only run when conditions are met
  });

  // Super-Admin bypass - return AFTER hook is called
  if (isAdmin) {
    return {
      status: COMPLETE_STATUS,
      isLoading: false,
    };
  }

  // Non-Supabase auth (mock identities) - return AFTER hook is called
  if (!isSupabaseAuth) {
    return {
      status: COMPLETE_STATUS,
      isLoading: false,
    };
  }

  // Query failed or errored - fallback to complete to avoid blocking
  if (query.isError) {
    console.warn("[useTenantDataStatus] Query failed, using fallback:", query.error);
    return {
      status: COMPLETE_STATUS,
      isLoading: false,
    };
  }

  return {
    status: query.data,
    isLoading: query.isLoading,
  };
}
