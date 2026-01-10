// ============================================
// Employee Settings Hook
// Manages individual employee provision/tariff settings
// ============================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { supabase } from "@/integrations/supabase/client";
import type { SubVariantId } from "../engine/types";

export interface EmployeeSettings {
  id: string;
  userId: string;
  tenantId: string;
  displayName?: string;
  department?: string;
  provisionDeduction: number;
  provisionDeductionType: "fixed" | "percent";
  blockedTariffs: string[];
  featureOverrides: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

interface UseEmployeeSettingsReturn {
  settings: EmployeeSettings | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for loading employee settings (own or by userId for admins)
 */
export function useEmployeeSettings(targetUserId?: string): UseEmployeeSettingsReturn {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const [settings, setSettings] = useState<EmployeeSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveUserId = targetUserId || user?.id;

  const loadSettings = useCallback(async () => {
    if (!effectiveUserId || !identity?.tenantId) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("employee_settings")
        .select("*")
        .eq("user_id", effectiveUserId)
        .eq("tenant_id", identity.tenantId)
        .maybeSingle();

      if (fetchError) {
        console.warn("[useEmployeeSettings] Query error, using null:", fetchError.message);
        setSettings(null);
        setIsLoading(false);
        return; // Graceful fallback statt throw
      }

      if (data) {
        setSettings({
          id: data.id,
          userId: data.user_id,
          tenantId: data.tenant_id,
          displayName: data.display_name ?? undefined,
          department: data.department ?? undefined,
          provisionDeduction: Number(data.provision_deduction) || 0,
          provisionDeductionType: (data.provision_deduction_type as "fixed" | "percent") || "fixed",
          blockedTariffs: data.blocked_tariffs || [],
          featureOverrides: (data.feature_overrides as Record<string, boolean>) || {},
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      } else {
        // No settings yet - return defaults
        setSettings(null);
      }
    } catch (err: unknown) {
      console.warn("[useEmployeeSettings] Unexpected error, using null:", err);
      setSettings(null); // Graceful fallback
      setError(null); // Don't propagate error
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, identity?.tenantId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    error,
    refresh: loadSettings,
  };
}

/**
 * Hook for listing all employees in a tenant (admin only)
 */
export function useAllEmployeeSettings() {
  const { identity } = useIdentity();
  const [employees, setEmployees] = useState<EmployeeSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!identity?.tenantId) {
      setEmployees([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("employee_settings")
        .select("*")
        .eq("tenant_id", identity.tenantId)
        .order("display_name", { ascending: true });

      if (fetchError) {
        console.warn("[useAllEmployeeSettings] Query error, using empty array:", fetchError.message);
        setEmployees([]);
        setIsLoading(false);
        return; // Graceful fallback
      }

      setEmployees(
        (data || []).map((d) => ({
          id: d.id,
          userId: d.user_id,
          tenantId: d.tenant_id,
          displayName: d.display_name ?? undefined,
          department: d.department ?? undefined,
          provisionDeduction: Number(d.provision_deduction) || 0,
          provisionDeductionType: (d.provision_deduction_type as "fixed" | "percent") || "fixed",
          blockedTariffs: d.blocked_tariffs || [],
          featureOverrides: (d.feature_overrides as Record<string, boolean>) || {},
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }))
      );
    } catch (err: unknown) {
      console.warn("[useAllEmployeeSettings] Unexpected error, using empty array:", err);
      setEmployees([]); // Graceful fallback
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [identity?.tenantId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return {
    employees,
    isLoading,
    error,
    refresh: loadAll,
  };
}

/**
 * Hook for admin to manage employee settings
 */
export function useAdminEmployeeManagement() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const { trackSettingsChanged } = useActivityTracker();

  const createOrUpdateSettings = useCallback(
    async (
      targetUserId: string,
      updates: Partial<{
        displayName: string;
        department: string;
        provisionDeduction: number;
        provisionDeductionType: "fixed" | "percent";
        blockedTariffs: string[];
        featureOverrides: Record<string, boolean>;
      }>
    ) => {
      if (!user?.id || !identity.tenantId) {
        throw new Error("Nicht authentifiziert");
      }

      const payload = {
        user_id: targetUserId,
        tenant_id: identity.tenantId,
        display_name: updates.displayName,
        department: updates.department,
        provision_deduction: updates.provisionDeduction,
        provision_deduction_type: updates.provisionDeductionType,
        blocked_tariffs: updates.blockedTariffs,
        feature_overrides: updates.featureOverrides,
        updated_by: user.id,
      };

      const { data, error } = await supabase
        .from("employee_settings")
        .upsert(payload, { onConflict: "user_id,tenant_id" })
        .select()
        .single();

      if (error) throw error;
      
      // Track settings change
      trackSettingsChanged("employee_settings", targetUserId, updates);
      
      return data;
    },
    [user?.id, identity.tenantId, trackSettingsChanged]
  );

  const updateProvisionDeduction = useCallback(
    async (targetUserId: string, amount: number, type: "fixed" | "percent" = "fixed") => {
      return createOrUpdateSettings(targetUserId, {
        provisionDeduction: amount,
        provisionDeductionType: type,
      });
    },
    [createOrUpdateSettings]
  );

  const updateBlockedTariffs = useCallback(
    async (targetUserId: string, tariffIds: string[]) => {
      return createOrUpdateSettings(targetUserId, {
        blockedTariffs: tariffIds,
      });
    },
    [createOrUpdateSettings]
  );

  const updateFeatureOverride = useCallback(
    async (targetUserId: string, feature: string, enabled: boolean) => {
      // First load current overrides
      const { data: current } = await supabase
        .from("employee_settings")
        .select("feature_overrides")
        .eq("user_id", targetUserId)
        .eq("tenant_id", identity.tenantId)
        .maybeSingle();

      const currentOverrides = (current?.feature_overrides as Record<string, boolean>) || {};
      const newOverrides = { ...currentOverrides, [feature]: enabled };

      return createOrUpdateSettings(targetUserId, {
        featureOverrides: newOverrides,
      });
    },
    [createOrUpdateSettings, identity.tenantId]
  );

  const deleteEmployeeSettings = useCallback(
    async (targetUserId: string) => {
      if (!identity.tenantId) throw new Error("Kein Tenant");

      const { error } = await supabase
        .from("employee_settings")
        .delete()
        .eq("user_id", targetUserId)
        .eq("tenant_id", identity.tenantId);

      if (error) throw error;
    },
    [identity.tenantId]
  );

  return {
    createOrUpdateSettings,
    updateProvisionDeduction,
    updateBlockedTariffs,
    updateFeatureOverride,
    deleteEmployeeSettings,
  };
}

/**
 * Computed provision with employee deduction applied
 */
export function applyEmployeeDeduction(
  baseProvision: number,
  settings: EmployeeSettings | null
): number {
  if (!settings || settings.provisionDeduction === 0) {
    return baseProvision;
  }

  if (settings.provisionDeductionType === "percent") {
    return baseProvision * (1 - settings.provisionDeduction / 100);
  }

  // Fixed deduction
  return Math.max(0, baseProvision - settings.provisionDeduction);
}

/**
 * Check if a tariff is blocked for an employee
 */
export function isTariffBlocked(
  tariffId: string,
  settings: EmployeeSettings | null
): boolean {
  if (!settings || !settings.blockedTariffs || !settings.blockedTariffs.length) {
    return false;
  }
  return settings.blockedTariffs.includes(tariffId);
}
