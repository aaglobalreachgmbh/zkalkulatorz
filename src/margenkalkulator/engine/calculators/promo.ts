// ============================================
// Promo Calculation Module
// Handles promo validity, tariff-specific filtering, and TeamDeal resolution
// ============================================

import type { Promo, MobileTariff, FixedNetProduct } from "../types";
import { TEAMDEAL_FALLBACK } from "../../config";

// ============================================
// Types
// ============================================

export type TeamDealResolution = {
  effectiveNet: number;
  dataVolumeGB: number | "unlimited";
  isFallback: boolean;
};

// ============================================
// Promo Validity
// ============================================

/**
 * Check if a promo is valid for a given date
 * Uses asOfISO for deterministic calculation (no new Date())
 */
export function isPromoValid(
  promo: Promo | undefined,
  asOfISO?: string
): boolean {
  if (!promo || promo.type === "NONE") return true;
  
  // If no validity dates set, promo is always valid
  if (!promo.validFromISO || !promo.validUntilISO) return true;
  
  // If no asOfISO provided, assume promo is valid (backward compat)
  if (!asOfISO) return true;
  
  return asOfISO >= promo.validFromISO && asOfISO <= promo.validUntilISO;
}

/**
 * Check if a promo applies to a specific tariff
 */
export function isPromoForTariff(
  promo: Promo,
  tariffId: string
): boolean {
  // NONE type always applies
  if (promo.type === "NONE") return true;
  
  // No tariff restriction or wildcard = applies to all
  if (!promo.appliesToTariffs || promo.appliesToTariffs === "*") return true;
  
  // Check if tariff is in the allowed list
  return promo.appliesToTariffs.includes(tariffId);
}

/**
 * Get all valid promos for a specific tariff
 * Filters by: tariff applicability AND date validity
 */
export function getPromosForTariff(
  allPromos: Promo[],
  tariffId: string,
  asOfISO?: string
): Promo[] {
  return allPromos.filter(promo => {
    // Always include "NONE" option
    if (promo.id === "NONE") return true;
    
    // Check tariff applicability
    if (!isPromoForTariff(promo, tariffId)) return false;
    
    // Check date validity
    if (!isPromoValid(promo, asOfISO)) return false;
    
    return true;
  });
}

/**
 * Check if a fixed product promo is valid
 */
export function isFixedPromoValid(
  promo: FixedNetProduct["promo"],
  asOfISO?: string
): boolean {
  if (!promo || promo.type === "NONE") return true;
  if (!promo.validFromISO || !promo.validUntilISO) return true;
  if (!asOfISO) return true;
  
  return asOfISO >= promo.validFromISO && asOfISO <= promo.validUntilISO;
}

// ============================================
// TeamDeal Fallback Logic
// ============================================

/**
 * Resolve TeamDeal pricing based on primeOnAccount status
 * If no Prime on account, falls back to Smart Business Plus (13€/1GB)
 */
export function resolveTeamDealPricing(
  tariff: MobileTariff,
  primeOnAccount: boolean
): TeamDealResolution {
  // Only applies to TeamDeal family
  if (tariff.family !== "teamdeal") {
    return {
      effectiveNet: tariff.baseNet,
      dataVolumeGB: tariff.dataVolumeGB ?? 0,
      isFallback: false,
    };
  }
  
  // TeamDeal WITHOUT Prime → Fallback to Smart Business Plus
  if (!primeOnAccount) {
    return {
      effectiveNet: TEAMDEAL_FALLBACK.PRICE_NET,
      dataVolumeGB: TEAMDEAL_FALLBACK.DATA_GB,
      isFallback: true,
    };
  }
  
  // TeamDeal WITH Prime → Special conditions apply
  return {
    effectiveNet: tariff.baseNet,
    dataVolumeGB: tariff.dataVolumeGB ?? 0,
    isFallback: false,
  };
}
