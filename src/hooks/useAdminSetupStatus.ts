// ============================================
// Admin Setup Status Hook
// Prüft ob ein Admin die Ersteinrichtung abgeschlossen hat
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { useTenantAdmin } from "./useTenantAdmin";
import { toast } from "sonner";

export interface AdminSetupStatus {
  id: string;
  user_id: string;
  tenant_id: string;
  setup_completed_at: string | null;
  setup_version: number;
  provisions_configured: boolean;
  hardware_configured: boolean;
  on_top_rules_configured: boolean;
  team_configured: boolean;
  reset_at: string | null;
  reset_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface UseAdminSetupStatusResult {
  setupStatus: AdminSetupStatus | null;
  isSetupComplete: boolean;
  needsSetup: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAdminSetupStatus(): UseAdminSetupStatusResult {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const { isTenantAdmin, isLoading: adminLoading } = useTenantAdmin();

  const {
    data: setupStatus,
    isLoading: queryLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-setup-status", user?.id, identity.tenantId],
    queryFn: async () => {
      if (!user || !identity.tenantId) {
        return null;
      }

      const { data, error: queryError } = await supabase
        .from("admin_setup_status")
        .select("*")
        .eq("user_id", user.id)
        .eq("tenant_id", identity.tenantId)
        .maybeSingle();

      if (queryError) {
        console.warn("[useAdminSetupStatus] Query error:", queryError.message);
        // Bei Fehler nicht crashen, einfach null zurückgeben
        return null;
      }

      return data as AdminSetupStatus | null;
    },
    enabled: !!user && !!identity.tenantId && isTenantAdmin && !adminLoading,
    staleTime: 1000 * 60 * 5, // 5 Minuten Cache
  });

  const isLoading = queryLoading || adminLoading;
  const isSetupComplete = setupStatus?.setup_completed_at != null;
  
  // Nur wenn User Tenant-Admin ist UND Setup noch nicht abgeschlossen
  const needsSetup = isTenantAdmin && !isSetupComplete && !isLoading;

  console.log("[useAdminSetupStatus] State:", {
    userId: user?.id,
    tenantId: identity.tenantId,
    isTenantAdmin,
    isSetupComplete,
    needsSetup,
    isLoading,
  });

  return {
    setupStatus: setupStatus ?? null,
    isSetupComplete,
    needsSetup,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// ============================================
// Mutations für Setup-Schritte
// ============================================

interface UpdateSetupStepParams {
  step: "provisions" | "hardware" | "on_top_rules" | "team";
  completed: boolean;
}

export function useUpdateSetupStep() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ step, completed }: UpdateSetupStepParams) => {
      if (!user || !identity.tenantId) {
        console.warn("[useUpdateSetupStep] Not authenticated");
        return null;
      }

      const columnName = `${step}_configured`;
      
      // Upsert: Erstellen wenn nicht existiert, sonst aktualisieren
      const { data, error } = await supabase
        .from("admin_setup_status")
        .upsert(
          {
            user_id: user.id,
            tenant_id: identity.tenantId,
            [columnName]: completed,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,tenant_id",
          }
        )
        .select()
        .maybeSingle();

      if (error) {
        console.error("[useUpdateSetupStep] Error:", error.message);
        toast.error(`Fehler beim Speichern: ${error.message}`);
        return null;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["admin-setup-status", user?.id, identity.tenantId] 
      });
    },
  });
}

export function useCompleteSetup() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user || !identity.tenantId) {
        console.warn("[useCompleteSetup] Not authenticated");
        return null;
      }

      const { data, error } = await supabase
        .from("admin_setup_status")
        .upsert(
          {
            user_id: user.id,
            tenant_id: identity.tenantId,
            setup_completed_at: new Date().toISOString(),
            provisions_configured: true,
            hardware_configured: true,
            on_top_rules_configured: true,
            team_configured: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,tenant_id",
          }
        )
        .select()
        .maybeSingle();

      if (error) {
        console.error("[useCompleteSetup] Error:", error.message);
        toast.error(`Fehler beim Abschließen: ${error.message}`);
        return null;
      }

      toast.success("Ersteinrichtung abgeschlossen!");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["admin-setup-status", user?.id, identity.tenantId] 
      });
    },
  });
}

export function useResetSetup() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reason: string) => {
      if (!user || !identity.tenantId) {
        console.warn("[useResetSetup] Not authenticated");
        return null;
      }

      const { data, error } = await supabase
        .from("admin_setup_status")
        .update({
          setup_completed_at: null,
          provisions_configured: false,
          hardware_configured: false,
          on_top_rules_configured: false,
          team_configured: false,
          reset_at: new Date().toISOString(),
          reset_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("tenant_id", identity.tenantId)
        .select()
        .maybeSingle();

      if (error) {
        console.error("[useResetSetup] Error:", error.message);
        toast.error(`Fehler beim Zurücksetzen: ${error.message}`);
        return null;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["admin-setup-status", user?.id, identity.tenantId] 
      });
    },
  });
}
