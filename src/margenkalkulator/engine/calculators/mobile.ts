// ============================================
// Mobile Calculation Module
// Handles mobile tariff price calculations
// ============================================

import type { MobileTariff, Promo, SubVariant } from "../types";
import { isPromoValid, resolveTeamDealPricing } from "./promo";

// ============================================
// Mobile Base Price Calculation
// ============================================

/**
 * Calculate mobile base price for a given month (considering promo)
 * IMPORTANT: Promo only affects base price, NOT SUB add-on
 * Slice B: Added ABS_OFF_BASE support
 */
export function calculateMobileBaseForMonth(
  tariff: MobileTariff,
  promo: Promo,
  month: number,
  asOfISO?: string
): number {
  // Check if promo is time-valid (Slice B)
  if (!isPromoValid(promo, asOfISO)) {
    return tariff.baseNet;
  }
  
  const isPromoActive = promo.durationMonths > 0 && month <= promo.durationMonths;
  
  if (!isPromoActive || promo.type === "NONE") {
    return tariff.baseNet;
  }
  
  switch (promo.type) {
    case "INTRO_PRICE":
      // Fixed intro price for base only
      return promo.value;
    case "PCT_OFF_BASE":
      // Percentage discount on base only
      return tariff.baseNet * (1 - promo.value);
    case "ABS_OFF_BASE":
      // Slice B: Absolute discount on base (e.g., -5€/month)
      return Math.max(0, tariff.baseNet - (promo.amountNetPerMonth ?? 0));
    default:
      return tariff.baseNet;
  }
}

// ============================================
// Mobile Monthly Calculation
// ============================================

/**
 * Calculate total mobile monthly cost for a given month
 * Slice C: Added primeOnAccount for TeamDeal fallback
 */
export function calculateMobileMonthlyForMonth(
  tariff: MobileTariff,
  subVariant: SubVariant,
  promo: Promo,
  quantity: number,
  month: number,
  asOfISO?: string,
  primeOnAccount?: boolean
): number {
  let basePrice: number;
  
  // TeamDeal uses special fallback logic
  if (tariff.family === "teamdeal") {
    const resolved = resolveTeamDealPricing(tariff, primeOnAccount ?? false);
    basePrice = resolved.effectiveNet;
  } else {
    basePrice = calculateMobileBaseForMonth(tariff, promo, month, asOfISO);
  }
  
  // SUB is always added at full price, never affected by promo
  const totalPerLine = basePrice + subVariant.monthlyAddNet;
  return totalPerLine * quantity;
}
