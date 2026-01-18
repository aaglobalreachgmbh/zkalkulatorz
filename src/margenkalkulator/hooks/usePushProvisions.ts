// ============================================
// Push Provisions Hook
// Manages bonus provisions for tariffs
// Extended with target types and conditions
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database, Json } from "@/integrations/supabase/types";
import type { ContractType } from "../engine/types";

// Condition types for push provisions
export interface PushProvisionConditions {
  requireHardware?: boolean;      // Nur mit Hardware (nicht SIM-Only)
  requireFixedNet?: boolean;      // Nur mit Festnetz
  requireGigaKombi?: boolean;     // Nur wenn GigaKombi aktiv
  excludeSubVariants?: string[];  // Bestimmte SUB-Varianten ausschließen
  includeSubVariants?: string[];  // Nur diese SUB-Varianten
  minQuantity?: number;           // Mindestmenge
  requireContractType?: "new" | "renewal";
  bundleRequirements?: {          // Für Bundle-Boni
    requireMobile?: boolean;
    requireFixedNet?: boolean;
    requireHardware?: boolean;
    requireProducts?: string[];
  };
}

// Context for evaluating push provisions
export interface PushProvisionContext {
  hasHardware?: boolean;
  hardwareEkNet?: number;
  hasFixedNet?: boolean;
  hasGigaKombi?: boolean;
  subVariantId?: string;
  quantity?: number;
  bundleProducts?: string[];
  contractType?: ContractType;
}

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
  // New fields for extended targeting
  targetType: "tariff" | "family" | "pattern" | "group" | "all";
  conditions: PushProvisionConditions;
}

// Tariff group for grouping multiple tariffs
export interface PushTariffGroup {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  matchPattern?: string;
  tariffIds: string[];
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface UsePushProvisionsReturn {
  provisions: PushProvision[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getActiveForTariff: (tariffId: string, contractType?: ContractType, context?: PushProvisionContext) => PushProvision[];
  getBonusAmount: (tariffId: string, contractType?: ContractType, baseProvision?: number, context?: PushProvisionContext) => number;
}

/**
 * Check if a provision's conditions are met
 */
function evaluateConditions(conditions: PushProvisionConditions, context?: PushProvisionContext): boolean {
  if (!context) return true;
  if (!conditions || Object.keys(conditions).length === 0) return true;

  // Check hardware requirement
  if (conditions.requireHardware) {
    const hasHardware = context.hasHardware || (context.hardwareEkNet && context.hardwareEkNet > 0);
    if (!hasHardware) return false;
  }

  // Check fixed net requirement
  if (conditions.requireFixedNet && !context.hasFixedNet) {
    return false;
  }

  // Check GigaKombi requirement
  if (conditions.requireGigaKombi && !context.hasGigaKombi) {
    return false;
  }

  // Check SUB-variant exclusions
  if (conditions.excludeSubVariants?.length && context.subVariantId) {
    if (conditions.excludeSubVariants.includes(context.subVariantId)) {
      return false;
    }
  }

  // Check SUB-variant inclusions
  if (conditions.includeSubVariants?.length && context.subVariantId) {
    if (!conditions.includeSubVariants.includes(context.subVariantId)) {
      return false;
    }
  }

  // Check minimum quantity
  if (conditions.minQuantity && (context.quantity || 1) < conditions.minQuantity) {
    return false;
  }

  // Check contract type requirement
  if (conditions.requireContractType && context.contractType) {
    if (conditions.requireContractType !== context.contractType) {
      return false;
    }
  }

  // Check bundle requirements
  if (conditions.bundleRequirements) {
    const bundle = conditions.bundleRequirements;
    
    // All enabled bundle requirements must be met
    if (bundle.requireMobile !== false) {
      // Mobile is always assumed to be present in calculator context
    }
    if (bundle.requireFixedNet && !context.hasFixedNet) {
      return false;
    }
    if (bundle.requireHardware) {
      const hasHardware = context.hasHardware || (context.hardwareEkNet && context.hardwareEkNet > 0);
      if (!hasHardware) return false;
    }
    if (bundle.requireProducts?.length && context.bundleProducts) {
      const hasAllProducts = bundle.requireProducts.every(p => context.bundleProducts?.includes(p));
      if (!hasAllProducts) return false;
    }
  }

  return true;
}

/**
 * Check if a provision matches a tariff based on target type
 */
function matchesTariff(
  provision: PushProvision, 
  tariffId: string,
  tariffGroups?: PushTariffGroup[]
): boolean {
  switch (provision.targetType) {
    case "all":
      return true;
    
    case "tariff":
      return provision.tariffId === tariffId;
    
    case "family":
      // Match tariff family (e.g., "prime" matches PRIME_S, PRIME_M, etc.)
      if (provision.tariffFamily) {
        return tariffId.toLowerCase().includes(provision.tariffFamily.toLowerCase());
      }
      return false;
    
    case "pattern":
      // Match regex pattern
      if (provision.tariffId) {
        try {
          const regex = new RegExp(provision.tariffId, "i");
          return regex.test(tariffId);
        } catch {
          return false;
        }
      }
      return false;
    
    case "group":
      // Match tariff group
      if (tariffGroups && provision.tariffId) {
        const group = tariffGroups.find(g => g.id === provision.tariffId);
        if (group) {
          // Check explicit tariff IDs
          if (group.tariffIds.includes(tariffId)) {
            return true;
          }
          // Check match pattern
          if (group.matchPattern) {
            try {
              const regex = new RegExp(group.matchPattern, "i");
              return regex.test(tariffId);
            } catch {
              return false;
            }
          }
        }
      }
      return false;
    
    default:
      // Legacy fallback: exact match or family match
      return provision.tariffId === tariffId || 
        (provision.tariffFamily && tariffId.toLowerCase().includes(provision.tariffFamily.toLowerCase()));
  }
}

/**
 * Hook for loading and using push provisions
 */
export function usePushProvisions(): UsePushProvisionsReturn {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const [provisions, setProvisions] = useState<PushProvision[]>([]);
  const [tariffGroups, setTariffGroups] = useState<PushTariffGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProvisions = useCallback(async () => {
    if (!identity?.tenantId) {
      setProvisions([]);
      setTariffGroups([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const today = new Date().toISOString().split("T")[0];

      // Load provisions and tariff groups in parallel
      const [provisionsResult, groupsResult] = await Promise.all([
        supabase
          .from("push_provisions")
          .select("*")
          .eq("tenant_id", identity.tenantId)
          .eq("is_active", true)
          .lte("valid_from", today)
          .or(`valid_until.is.null,valid_until.gte.${today}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("push_tariff_groups")
          .select("*")
          .eq("tenant_id", identity.tenantId)
          .eq("is_active", true)
      ]);

      if (provisionsResult.error) {
        console.warn("[usePushProvisions] Provisions query error, using empty array:", provisionsResult.error.message);
        setProvisions([]);
      } else {
        setProvisions(
          (provisionsResult.data || []).map((d) => ({
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
            targetType: (d.target_type as PushProvision["targetType"]) || "tariff",
            conditions: (d.conditions as PushProvisionConditions) || {},
          }))
        );
      }

      if (groupsResult.error) {
        console.warn("[usePushProvisions] Groups query error, using empty array:", groupsResult.error.message);
        setTariffGroups([]);
      } else {
        setTariffGroups(
          (groupsResult.data || []).map((g) => ({
            id: g.id,
            tenantId: g.tenant_id,
            name: g.name,
            description: g.description ?? undefined,
            matchPattern: g.match_pattern ?? undefined,
            tariffIds: g.tariff_ids || [],
            isActive: g.is_active ?? true,
            createdBy: g.created_by ?? undefined,
            createdAt: g.created_at,
            updatedAt: g.updated_at,
          }))
        );
      }
    } catch (err: unknown) {
      console.warn("[usePushProvisions] Unexpected error, using empty arrays:", err);
      setProvisions([]); // Graceful fallback
      setTariffGroups([]);
      setError(null); // Don't propagate error
    } finally {
      setIsLoading(false);
    }
  }, [identity?.tenantId]);

  useEffect(() => {
    loadProvisions();
  }, [loadProvisions]);

  // Get active provisions for a specific tariff with context
  const getActiveForTariff = useCallback(
    (tariffId: string, contractType?: ContractType, context?: PushProvisionContext): PushProvision[] => {
      return provisions.filter((p) => {
        // Match tariff based on target type
        if (!matchesTariff(p, tariffId, tariffGroups)) {
          return false;
        }

        // Match contract type
        if (p.contractType && p.contractType !== "both" && contractType && p.contractType !== contractType) {
          return false;
        }

        // Match scope (user-specific or all)
        if (p.scopeType === "user" && p.scopeId !== user?.id) {
          return false;
        }

        // Team scope
        if (p.scopeType === "team" && p.scopeId !== identity.departmentId) {
          return false;
        }

        // Evaluate conditions
        if (!evaluateConditions(p.conditions, context)) {
          return false;
        }

        return true;
      });
    },
    [provisions, tariffGroups, user?.id, identity.departmentId]
  );

  // Calculate total bonus amount for a tariff with context
  const getBonusAmount = useCallback(
    (tariffId: string, contractType?: ContractType, baseProvision: number = 0, context?: PushProvisionContext): number => {
      const activeProvisions = getActiveForTariff(tariffId, contractType, context);
      
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
        console.warn("[usePushProvisions] Not authenticated");
        toast.error("Bitte zuerst einloggen");
        return null;
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
        target_type: provision.targetType || "tariff",
        conditions: provision.conditions || {},
      };

      const { data, error } = await supabase
        .from("push_provisions")
        .insert(payload as Database["public"]["Tables"]["push_provisions"]["Insert"])
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
      if (updates.targetType !== undefined) payload.target_type = updates.targetType;
      if (updates.conditions !== undefined) payload.conditions = updates.conditions;

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
          targetType: (d.target_type as PushProvision["targetType"]) || "tariff",
          conditions: (d.conditions as PushProvisionConditions) || {},
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

/**
 * Hook for managing tariff groups
 */
export function usePushTariffGroups() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const [groups, setGroups] = useState<PushTariffGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    if (!identity.tenantId) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("push_tariff_groups")
        .select("*")
        .eq("tenant_id", identity.tenantId)
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;

      setGroups(
        (data || []).map((g) => ({
          id: g.id,
          tenantId: g.tenant_id,
          name: g.name,
          description: g.description ?? undefined,
          matchPattern: g.match_pattern ?? undefined,
          tariffIds: g.tariff_ids || [],
          isActive: g.is_active ?? true,
          createdBy: g.created_by ?? undefined,
          createdAt: g.created_at,
          updatedAt: g.updated_at,
        }))
      );
    } catch (err: unknown) {
      console.error("Failed to load tariff groups:", err);
      setError(err instanceof Error ? err.message : "Laden fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  }, [identity.tenantId]);

  const createGroup = useCallback(
    async (group: Omit<PushTariffGroup, "id" | "tenantId" | "createdBy" | "createdAt" | "updatedAt">) => {
      if (!user?.id || !identity.tenantId) {
        console.warn("[usePushProvisions] createGroup: Nicht authentifiziert");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      const { data, error } = await supabase
        .from("push_tariff_groups")
        .insert({
          tenant_id: identity.tenantId,
          name: group.name,
          description: group.description ?? null,
          match_pattern: group.matchPattern ?? null,
          tariff_ids: group.tariffIds,
          is_active: group.isActive,
          created_by: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      await loadGroups();
      return data;
    },
    [user?.id, identity.tenantId, loadGroups]
  );

  const updateGroup = useCallback(
    async (id: string, updates: Partial<Omit<PushTariffGroup, "id" | "tenantId" | "createdBy" | "createdAt" | "updatedAt">>) => {
      const payload: Record<string, unknown> = {};

      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description ?? null;
      if (updates.matchPattern !== undefined) payload.match_pattern = updates.matchPattern ?? null;
      if (updates.tariffIds !== undefined) payload.tariff_ids = updates.tariffIds;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;

      const { data, error } = await supabase
        .from("push_tariff_groups")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      await loadGroups();
      return data;
    },
    [loadGroups]
  );

  const deleteGroup = useCallback(async (id: string) => {
    const { error } = await supabase.from("push_tariff_groups").delete().eq("id", id);
    if (error) throw error;
    await loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return {
    groups,
    isLoading,
    error,
    refresh: loadGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
