// ============================================
// Dealer Economics Module
// Handles provision and margin calculations
// ============================================

import type { MobileTariff, DealerEconomics, ContractType } from "../types";

// ============================================
// OMO Deduction Calculator
// ============================================

/**
 * Get OMO25 deduction amount for a tariff
 * OMO25 has a specific provision deduction per tier
 */
export function getOMODeduction(
  tariff: MobileTariff | undefined,
  promoId: string
): number {
  if (!tariff || promoId !== "OMO25") {
    return 0;
  }
  return tariff.omoDeduction ?? 0;
}

// ============================================
// Dealer Economics Calculation
// ============================================

/**
 * Calculate dealer economics (provision, deductions, margin)
 * Phase 2: Supports OMO25 deductions and renewal provisions
 */
export function calculateDealerEconomics(
  tariff: MobileTariff | undefined,
  contractType: ContractType,
  quantity: number,
  hardwareEkNet: number,
  promoId: string = "NONE"
): DealerEconomics {
  if (!tariff) {
    return {
      provisionBase: 0,
      deductions: 0,
      provisionAfter: 0,
      hardwareEkNet,
      margin: -hardwareEkNet,
    };
  }
  
  // Use renewal provision if available and contract is renewal
  const baseProvision = contractType === "renewal" && tariff.provisionRenewal !== undefined
    ? tariff.provisionRenewal
    : tariff.provisionBase;
  
  const provisionBase = baseProvision * quantity;
  
  // Standard deduction rate
  let deductions = Math.round(provisionBase * tariff.deductionRate * 100) / 100;
  
  // OMO25 specific deduction (per line)
  const omoDeduction = getOMODeduction(tariff, promoId) * quantity;
  deductions += omoDeduction;
  
  const provisionAfter = Math.max(0, provisionBase - deductions);
  const margin = Math.round((provisionAfter - hardwareEkNet) * 100) / 100;
  
  return {
    provisionBase,
    deductions,
    provisionAfter,
    hardwareEkNet,
    margin,
  };
}

// ============================================
// Legacy Functions
// ============================================

/**
 * Legacy signature for backward compatibility with tests
 */
export function calculateDealerEconomicsLegacy(
  tariff: MobileTariff | undefined,
  quantity: number,
  hardwareEkNet: number
): DealerEconomics {
  return calculateDealerEconomics(tariff, "new", quantity, hardwareEkNet, "NONE");
}
