// ============================================
// Custom Branding Hook for Tenant Settings
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";

/**
 * Branding configuration for tenant
 */
export interface TenantBranding {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  companyName: string | null;
  // Tenant profile (optional, for licensing display)
  tenantDisplayName?: string;
  departmentNames?: string[];
}

/**
 * Default branding values (Vodafone-style)
 */
export const DEFAULT_BRANDING: TenantBranding = {
  logoUrl: null,
  primaryColor: "#e4002b", // Vodafone Red
  secondaryColor: "#1a1a1a", // Black
  companyName: null,
};

/**
 * Hook for loading and saving tenant branding
 */
export function useTenantBranding() {
  const { identity } = useIdentity();
  const queryClient = useQueryClient();
  const tenantId = identity.tenantId;

  // Fetch branding from tenant_settings
  const { data: branding, isLoading, error } = useQuery({
    queryKey: ["tenant-branding", tenantId],
    queryFn: async (): Promise<TenantBranding> => {
      const { data, error } = await supabase
        .from("tenant_settings")
        .select("branding")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (error) {
        console.error("[useTenantBranding] Error fetching branding:", error);
        throw error;
      }

      if (!data?.branding) {
        return DEFAULT_BRANDING;
      }

      // Merge with defaults to ensure all fields exist
      const storedBranding = data.branding as Partial<TenantBranding>;
      return {
        logoUrl: storedBranding.logoUrl ?? DEFAULT_BRANDING.logoUrl,
        primaryColor: storedBranding.primaryColor ?? DEFAULT_BRANDING.primaryColor,
        secondaryColor: storedBranding.secondaryColor ?? DEFAULT_BRANDING.secondaryColor,
        companyName: storedBranding.companyName ?? DEFAULT_BRANDING.companyName,
      };
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Save branding mutation
  const saveBrandingMutation = useMutation({
    mutationFn: async (newBranding: Partial<TenantBranding>) => {
      const mergedBranding = {
        ...DEFAULT_BRANDING,
        ...branding,
        ...newBranding,
      };

      // Check if settings exist
      const { data: existing } = await supabase
        .from("tenant_settings")
        .select("id")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("tenant_settings")
          .update({ 
            branding: mergedBranding,
            updated_at: new Date().toISOString(),
          })
          .eq("tenant_id", tenantId);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("tenant_settings")
          .insert({
            tenant_id: tenantId,
            branding: mergedBranding,
          });

        if (error) throw error;
      }

      return mergedBranding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["tenant-branding", tenantId], data);
      toast.success("Branding gespeichert");
    },
    onError: (error) => {
      console.error("[useTenantBranding] Save error:", error);
      toast.error("Fehler beim Speichern des Brandings");
    },
  });

  // Reset to defaults
  const resetBranding = () => {
    saveBrandingMutation.mutate(DEFAULT_BRANDING);
  };

  return {
    branding: branding ?? DEFAULT_BRANDING,
    isLoading,
    error,
    saveBranding: saveBrandingMutation.mutate,
    isSaving: saveBrandingMutation.isPending,
    resetBranding,
  };
}
