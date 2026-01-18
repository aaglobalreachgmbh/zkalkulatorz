// ============================================
// Fixed Net Calculation Module
// Handles fixed-line product price calculations
// ============================================

import type { FixedNetProduct } from "../types";
import { isFixedPromoValid } from "./promo";

// ============================================
// Fixed Net Monthly Calculation
// ============================================

/**
 * Calculate fixed net monthly cost for a given month (considering promo)
 * Slice B: Added time validity check
 */
export function calculateFixedNetMonthlyForMonth(
  product: FixedNetProduct,
  month: number,
  asOfISO?: string
): number {
  const promo = product.promo;
  
  // Check time validity (Slice B)
  if (!promo || promo.type === "NONE" || !isFixedPromoValid(promo, asOfISO)) {
    return product.monthlyNet;
  }
  
  if (month > promo.durationMonths) {
    return product.monthlyNet;
  }
  
  switch (promo.type) {
    case "INTRO_PRICE":
      return promo.value;
    case "PCT_OFF_BASE":
      return product.monthlyNet * (1 - promo.value);
    default:
      return product.monthlyNet;
  }
}

// ============================================
// One-Time Cost Calculation
// ============================================

/**
 * Get effective one-time cost (considering setupWaived)
 */
export function getEffectiveOneTimeCost(product: FixedNetProduct): number {
  if (product.setupWaived) {
    return 0;
  }
  return product.oneTimeNet;
}
