// ============================================
// Cloud License Hook - Supabase Integration
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

const QUERY_KEY = ["cloud-license"];

export type LicensePlan = "internal" | "starter" | "professional" | "enterprise";

export interface LicenseFeatures {
  pdfExport: boolean;
  dataImport: boolean;
  aiConsultant: boolean;
  cloudSync: boolean;
  teamManagement: boolean;
  pushProvisions: boolean;
  employeeManagement: boolean;
}

export interface CloudLicense {
  id: string;
  tenantId: string;
  plan: LicensePlan;
  features: LicenseFeatures;
  seatLimit: number;
  seatsUsed: number;
  validUntil: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_FEATURES: LicenseFeatures = {
  pdfExport: true,
  dataImport: true,
  aiConsultant: true,
  cloudSync: true,
  teamManagement: true,
  pushProvisions: true,
  employeeManagement: true,
};

function rowToLicense(row: {
  id: string;
  tenant_id: string;
  plan: string;
  features: Json;
  seat_limit: number;
  seats_used: number;
  valid_until: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}): CloudLicense {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    plan: row.plan as LicensePlan,
    features: (row.features as unknown as LicenseFeatures) || DEFAULT_FEATURES,
    seatLimit: row.seat_limit,
    seatsUsed: row.seats_used,
    validUntil: row.valid_until,
    activatedAt: row.activated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Hook for managing license in Supabase
 */
export function useCloudLicense() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch license for current tenant
  const { data: license, isLoading, error } = useQuery({
    queryKey: [...QUERY_KEY, identity.tenantId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("licenses")
          .select("*")
          .eq("tenant_id", identity.tenantId)
          .maybeSingle();

        // CRITICAL: Don't throw on auth errors - session is being cleaned up
        if (error) {
          const errorMsg = error.message?.toLowerCase() || "";
          if (errorMsg.includes("refresh_token") || 
              errorMsg.includes("jwt") ||
              error.code === "PGRST301") {
            console.warn("[useCloudLicense] Auth error, returning null:", error.message);
            return null;
          }
          console.error("[useCloudLicense] Query error:", error);
          return null; // Graceful degradation - don't throw
        }
        if (!data) return null;
        return rowToLicense(data);
      } catch (err) {
        console.error("[useCloudLicense] Unexpected error:", err);
        return null; // NEVER throw - prevents Error Boundary crashes
      }
    },
    enabled: !!user,
    retry: false, // No retry on auth problems
  });

  // Update license mutation (Admin only)
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<{
      plan: LicensePlan;
      features: Partial<LicenseFeatures>;
      seatLimit: number;
      validUntil: string | null;
    }>) => {
      if (!user) throw new Error("Nicht authentifiziert");
      if (!license) throw new Error("Keine Lizenz gefunden");

      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.plan) payload.plan = updates.plan;
      if (updates.seatLimit !== undefined) payload.seat_limit = updates.seatLimit;
      if (updates.validUntil !== undefined) payload.valid_until = updates.validUntil;
      if (updates.features) {
        payload.features = {
          ...license.features,
          ...updates.features,
        } as unknown as Json;
      }

      const { error } = await supabase
        .from("licenses")
        .update(payload)
        .eq("id", license.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Lizenz konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  // Update seat count
  const updateSeatsUsedMutation = useMutation({
    mutationFn: async (seatsUsed: number) => {
      if (!license) throw new Error("Keine Lizenz gefunden");

      const { error } = await supabase
        .from("licenses")
        .update({
          seats_used: seatsUsed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", license.id);

      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Check if feature is enabled
  const isFeatureEnabled = (feature: keyof LicenseFeatures): boolean => {
    if (!license) return false;
    return license.features[feature] ?? false;
  };

  // Check if license is valid
  const isValid = (): boolean => {
    if (!license) return false;
    if (!license.validUntil) return true; // No expiry = valid
    return new Date(license.validUntil) > new Date();
  };

  // Get seat usage info
  const seatUsage = {
    used: license?.seatsUsed || 0,
    limit: license?.seatLimit || 999,
    available: (license?.seatLimit || 999) - (license?.seatsUsed || 0),
    exceeded: (license?.seatsUsed || 0) >= (license?.seatLimit || 999),
  };

  return {
    // Data
    license,
    isLoading,
    error,
    hasLicense: !!license,

    // Computed
    isValid: isValid(),
    seatUsage,
    plan: license?.plan || "internal",
    features: license?.features || DEFAULT_FEATURES,

    // Actions
    updateLicense: (updates: Parameters<typeof updateMutation.mutate>[0]) =>
      updateMutation.mutateAsync(updates),
    updateSeatsUsed: (count: number) => updateSeatsUsedMutation.mutateAsync(count),
    isFeatureEnabled,

    // Mutation states
    isUpdating: updateMutation.isPending,
  };
}
