// ============================================
// Tenant-Aware Provisioning Hook
// Single Source of Truth für Provisionen:
// 1. Prüft ob Tenant eigene Provisionen hochgeladen hat
// 2. Falls ja → verwendet Tenant-Provisionen
// 3. Falls nein → Fallback auf Seed-Daten
// ============================================

import { useMemo } from "react";
import { useTenantProvisions, type TenantProvisionItem } from "./useTenantProvisions";
import type { ContractType, SubVariantId } from "../engine/types";

/**
 * Result of provision lookup
 */
export interface ProvisionLookupResult {
  /** Provision amount in EUR */
  amount: number;
  /** Source of the provision value */
  source: "tenant" | "fallback";
  /** Whether tenant has uploaded any provisions */
  hasTenantProvisions: boolean;
}

/**
 * Default fallback provisions when no tenant data exists
 * Based on typical Vodafone Business provisions
 */
const FALLBACK_PROVISIONS: Record<string, { new: number; renewal: number }> = {
  // Business Smart
  "smart_business": { new: 105, renewal: 20 },
  "smart_business_plus": { new: 170, renewal: 145 },
  
  // Business Prime
  "prime_go": { new: 290, renewal: 60 },
  "prime": { new: 460, renewal: 105 },
  "prime_plus": { new: 360, renewal: 150 },
  "prime_unlimited": { new: 650, renewal: 330 },
  
  // Legacy names
  "prime_xs": { new: 200, renewal: 100 },
  "prime_s": { new: 300, renewal: 150 },
  "prime_m": { new: 450, renewal: 225 },
  "prime_l": { new: 600, renewal: 300 },
  "prime_xl": { new: 800, renewal: 400 },
  "smart_xs": { new: 100, renewal: 50 },
  "smart_s": { new: 150, renewal: 75 },
  "smart_m": { new: 200, renewal: 100 },
  "smart_l": { new: 250, renewal: 125 },
  "smart_xl": { new: 300, renewal: 150 },
};

/**
 * Normalize tariff ID for matching
 */
function normalizeTariffId(tariffId: string): string {
  return tariffId
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Map SubVariantId to contract suffix for matching
 */
function getSubVariantSuffix(subVariantId?: SubVariantId): string {
  if (!subVariantId || subVariantId === "SIM_ONLY") return "";
  if (subVariantId === "BASIC_PHONE") return "_sub5";
  if (subVariantId === "SMARTPHONE") return "_sub10";
  if (subVariantId === "PREMIUM_SMARTPHONE") return "_sub25";
  if (subVariantId === "SPECIAL_PREMIUM_SMARTPHONE") return "_sub40";
  return "";
}

/**
 * Hook that provides tenant-aware provisioning
 * Automatically uses tenant-uploaded provisions when available,
 * falls back to default provisions otherwise
 */
export function useTenantAwareProvisioning() {
  const { provisions: tenantProvisions, isLoading, hasData } = useTenantProvisions();

  // Build a lookup map for faster access
  const provisionMap = useMemo(() => {
    const map = new Map<string, TenantProvisionItem>();
    
    tenantProvisions.forEach((p) => {
      // Key: tariffId|contractType|subVariantId
      const key = `${normalizeTariffId(p.tariff_id)}|${p.contract_type}|${p.sub_variant_id || ""}`;
      map.set(key, p);
      
      // Also add without sub_variant for broader matching
      const keyWithoutSub = `${normalizeTariffId(p.tariff_id)}|${p.contract_type}|`;
      if (!map.has(keyWithoutSub)) {
        map.set(keyWithoutSub, p);
      }
    });
    
    return map;
  }, [tenantProvisions]);

  /**
   * Get provision for a specific tariff configuration
   */
  const getProvision = (
    tariffId: string,
    contractType: ContractType,
    subVariantId?: SubVariantId
  ): ProvisionLookupResult => {
    const normalizedId = normalizeTariffId(tariffId);
    const contractKey = contractType === "renewal" ? "extension" : "new";
    const subSuffix = getSubVariantSuffix(subVariantId);
    
    // Try tenant provision lookup
    if (hasData) {
      // Try exact match with sub variant
      const exactKey = `${normalizedId}|${contractKey}|${subSuffix}`;
      const exactMatch = provisionMap.get(exactKey);
      
      if (exactMatch) {
        return {
          amount: exactMatch.provision_amount,
          source: "tenant",
          hasTenantProvisions: true,
        };
      }
      
      // Try match without sub variant
      const baseKey = `${normalizedId}|${contractKey}|`;
      const baseMatch = provisionMap.get(baseKey);
      
      if (baseMatch) {
        return {
          amount: baseMatch.provision_amount,
          source: "tenant",
          hasTenantProvisions: true,
        };
      }
      
      // Try partial match by tariff family
      for (const [key, item] of provisionMap.entries()) {
        if (key.includes(normalizedId) || normalizedId.includes(key.split("|")[0])) {
          if (key.includes(contractKey)) {
            return {
              amount: item.provision_amount,
              source: "tenant",
              hasTenantProvisions: true,
            };
          }
        }
      }
    }
    
    // Fallback to default provisions
    const fallbackAmount = getFallbackProvision(tariffId, contractType);
    
    return {
      amount: fallbackAmount,
      source: "fallback",
      hasTenantProvisions: hasData,
    };
  };

  return {
    getProvision,
    isLoading,
    hasTenantProvisions: hasData,
    tenantProvisions,
  };
}

/**
 * Get fallback provision when no tenant data exists
 */
function getFallbackProvision(tariffId: string, contractType: ContractType): number {
  const normalized = normalizeTariffId(tariffId);
  
  // Try exact match
  if (FALLBACK_PROVISIONS[normalized]) {
    return FALLBACK_PROVISIONS[normalized][contractType === "renewal" ? "renewal" : "new"];
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(FALLBACK_PROVISIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value[contractType === "renewal" ? "renewal" : "new"];
    }
  }
  
  // Default provision
  return contractType === "renewal" ? 100 : 250;
}
