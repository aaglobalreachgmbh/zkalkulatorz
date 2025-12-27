// ============================================
// Push Provisions Hook
// Manages bonus provisions for tariffs
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { supabase } from "@/integrations/supabase/client";
import type { ContractType } from "../engine/types";

export interface PushProvision {
  id: string;
  tenantId: string;
  scopeType: "all" | "user" | "team";
  scopeId?: string;
  tariffId: string;
  tariffFamily?: string;
  contractType?: "new" | "renewal" | "both";
  bonusAmount: number;
  bonusType: "fixed" | "percent";
  validFrom: string;
  validUntil?: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
}

interface UsePushProvisionsReturn {
  provisions: PushProvision[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getActiveForTariff: (tariffId: string, contractType?: ContractType) => PushProvision[];
  getBonusAmount: (tariffId: string, contractType?: ContractType, baseProvision?: number) => number;
}

/**
 * Hook for loading and using push provisions
 */
export function usePushProvisions(): UsePushProvisionsReturn {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const [provisions, setProvisions] = useState<PushProvision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProvisions = useCallback(async () => {
    if (!identity.tenantId) {
      setProvisions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const today = new Date().toISOString().split("T")[0];

      const { data, error: fetchError } = await supabase
        .from("push_provisions")
        .select("*")
        .eq("tenant_id", identity.tenantId)
        .eq("is_active", true)
        .lte("valid_from", today)
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setProvisions(
        (data || []).map((d) => ({
          id: d.id,
          tenantId: d.tenant_id,
          scopeType: d.scope_type as "all" | "user" | "team",
          scopeId: d.scope_id ?? undefined,
          tariffId: d.tariff_id,
          tariffFamily: d.tariff_family ?? undefined,
          contractType: d.contract_type as "new" | "renewal" | "both" | undefined,
          bonusAmount: Number(d.bonus_amount) || 0,
          bonusType: (d.bonus_type as "fixed" | "percent") || "fixed",
          validFrom: d.valid_from,
          validUntil: d.valid_until ?? undefined,
          name: d.name,
          description: d.description ?? undefined,
          isActive: d.is_active ?? true,
          createdAt: d.created_at,
          createdBy: d.created_by ?? undefined,
        }))
      );
    } catch (err: unknown) {
      console.error("Failed to load push provisions:", err);
      setError(err instanceof Error ? err.message : "Laden fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  }, [identity.tenantId]);

  useEffect(() => {
    loadProvisions();
  }, [loadProvisions]);

  // Get active provisions for a specific tariff
  const getActiveForTariff = useCallback(
    (tariffId: string, contractType?: ContractType): PushProvision[] => {
      return provisions.filter((p) => {
        // Match tariff (exact or family)
        const tariffMatch = p.tariffId === tariffId || 
          (p.tariffFamily && tariffId.toLowerCase().includes(p.tariffFamily.toLowerCase()));
        
        if (!tariffMatch) return false;

        // Match contract type
        if (p.contractType && p.contractType !== "both" && contractType && p.contractType !== contractType) {
          return false;
        }

        // Match scope (user-specific or all)
        if (p.scopeType === "user" && p.scopeId !== user?.id) {
          return false;
        }

        // Team scope would need team membership check (simplified here)
        if (p.scopeType === "team" && p.scopeId !== identity.departmentId) {
          return false;
        }

        return true;
      });
    },
    [provisions, user?.id, identity.departmentId]
  );

  // Calculate total bonus amount for a tariff
  const getBonusAmount = useCallback(
    (tariffId: string, contractType?: ContractType, baseProvision: number = 0): number => {
      const activeProvisions = getActiveForTariff(tariffId, contractType);
      
      return activeProvisions.reduce((total, p) => {
        if (p.bonusType === "percent") {
          return total + baseProvision * (p.bonusAmount / 100);
        }
        return total + p.bonusAmount;
      }, 0);
    },
    [getActiveForTariff]
  );

  return {
    provisions,
    isLoading,
    error,
    refresh: loadProvisions,
    getActiveForTariff,
    getBonusAmount,
  };
}

/**
 * Hook for admin to manage push provisions
 */
export function useAdminPushProvisions() {
  const { user } = useAuth();
  const { identity } = useIdentity();

  const createProvision = useCallback(
    async (provision: Omit<PushProvision, "id" | "createdAt" | "createdBy" | "tenantId">) => {
      if (!user?.id || !identity.tenantId) {
        throw new Error("Nicht authentifiziert");
      }

      const payload = {
        tenant_id: identity.tenantId,
        scope_type: provision.scopeType,
        scope_id: provision.scopeId ?? null,
        tariff_id: provision.tariffId,
        tariff_family: provision.tariffFamily ?? null,
        contract_type: provision.contractType ?? null,
        bonus_amount: provision.bonusAmount,
        bonus_type: provision.bonusType,
        valid_from: provision.validFrom,
        valid_until: provision.validUntil ?? null,
        name: provision.name,
        description: provision.description ?? null,
        is_active: provision.isActive,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from("push_provisions")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    [user?.id, identity.tenantId]
  );

  const updateProvision = useCallback(
    async (id: string, updates: Partial<Omit<PushProvision, "id" | "createdAt" | "createdBy" | "tenantId">>) => {
      const payload: Record<string, unknown> = {};

      if (updates.scopeType !== undefined) payload.scope_type = updates.scopeType;
      if (updates.scopeId !== undefined) payload.scope_id = updates.scopeId ?? null;
      if (updates.tariffId !== undefined) payload.tariff_id = updates.tariffId;
      if (updates.tariffFamily !== undefined) payload.tariff_family = updates.tariffFamily ?? null;
      if (updates.contractType !== undefined) payload.contract_type = updates.contractType ?? null;
      if (updates.bonusAmount !== undefined) payload.bonus_amount = updates.bonusAmount;
      if (updates.bonusType !== undefined) payload.bonus_type = updates.bonusType;
      if (updates.validFrom !== undefined) payload.valid_from = updates.validFrom;
      if (updates.validUntil !== undefined) payload.valid_until = updates.validUntil ?? null;
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description ?? null;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;

      const { data, error } = await supabase
        .from("push_provisions")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    []
  );

  const deleteProvision = useCallback(async (id: string) => {
    const { error } = await supabase.from("push_provisions").delete().eq("id", id);
    if (error) throw error;
  }, []);

  const deactivateProvision = useCallback(async (id: string) => {
    return updateProvision(id, { isActive: false });
  }, [updateProvision]);

  return {
    createProvision,
    updateProvision,
    deleteProvision,
    deactivateProvision,
  };
}

/**
 * Hook for loading all push provisions (admin view, including inactive)
 */
export function useAllPushProvisions() {
  const { identity } = useIdentity();
  const [provisions, setProvisions] = useState<PushProvision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!identity.tenantId) {
      setProvisions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("push_provisions")
        .select("*")
        .eq("tenant_id", identity.tenantId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setProvisions(
        (data || []).map((d) => ({
          id: d.id,
          tenantId: d.tenant_id,
          scopeType: d.scope_type as "all" | "user" | "team",
          scopeId: d.scope_id ?? undefined,
          tariffId: d.tariff_id,
          tariffFamily: d.tariff_family ?? undefined,
          contractType: d.contract_type as "new" | "renewal" | "both" | undefined,
          bonusAmount: Number(d.bonus_amount) || 0,
          bonusType: (d.bonus_type as "fixed" | "percent") || "fixed",
          validFrom: d.valid_from,
          validUntil: d.valid_until ?? undefined,
          name: d.name,
          description: d.description ?? undefined,
          isActive: d.is_active ?? true,
          createdAt: d.created_at,
          createdBy: d.created_by ?? undefined,
        }))
      );
    } catch (err: unknown) {
      console.error("Failed to load all push provisions:", err);
      setError(err instanceof Error ? err.message : "Laden fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  }, [identity.tenantId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return {
    provisions,
    isLoading,
    error,
    refresh: loadAll,
  };
}
