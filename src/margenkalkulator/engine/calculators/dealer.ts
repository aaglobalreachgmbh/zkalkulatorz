// ============================================
// Dealer Economics Module
// Handles provision and margin calculations
// Phase 2: OMO-Matrix (0-25%) + Fixed Net Provisions
// ============================================

import type { MobileTariff, DealerEconomics, ContractType, FixedNetProduct } from "../types";
import { getOMODeductionFactor, FIXED_NET_PROVISIONS } from "../../config";

// ============================================
// OMO Deduction Calculator
// ============================================

/**
 * Get OMO deduction amount for a tariff (legacy OMO25 support)
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

/**
 * Calculate OMO deduction based on rate (0-25%)
 * @param provisionBase - Base provision amount
 * @param omoRate - OMO rate in percent (0, 5, 10, 15, 17.5, 20, 25)
 */
export function calculateOMOMatrixDeduction(
  provisionBase: number,
  omoRate: number
): number {
  const factor = getOMODeductionFactor(omoRate);
  return Math.round(provisionBase * factor * 100) / 100;
}

// ============================================
// Fixed Net Provision Calculator
// ============================================

/**
 * Calculate fixed net provision based on product and contract type
 */
export function calculateFixedNetProvision(
  product: FixedNetProduct | undefined,
  contractType: ContractType
): number {
  if (!product) return 0;
  
  // Determine provision based on product line
  const productLine = product.productLine;
  
  if (productLine === "RBI") {
    return contractType === "new" 
      ? FIXED_NET_PROVISIONS.RBI_CABLE.new 
      : FIXED_NET_PROVISIONS.RBI_CABLE.renewal;
  }
  
  if (productLine === "RBIP") {
    return contractType === "new" 
      ? FIXED_NET_PROVISIONS.RBIP_CABLE.new 
      : FIXED_NET_PROVISIONS.RBIP_CABLE.renewal;
  }
  
  // DSL products
  if (product.accessType === "DSL") {
    return contractType === "new" 
      ? FIXED_NET_PROVISIONS.DSL.new 
      : FIXED_NET_PROVISIONS.DSL.renewal;
  }
  
  // Fiber products
  if (product.accessType === "FIBER") {
    return contractType === "new" 
      ? FIXED_NET_PROVISIONS.FIBER.new 
      : FIXED_NET_PROVISIONS.FIBER.renewal;
  }
  
  // Komfort products
  if (product.accessType === "KOMFORT_REGIO" || product.accessType === "KOMFORT_FTTH") {
    return contractType === "new" 
      ? FIXED_NET_PROVISIONS.KOMFORT.new 
      : FIXED_NET_PROVISIONS.KOMFORT.renewal;
  }
  
  // Default for CABLE without specific product line
  if (product.accessType === "CABLE") {
    return contractType === "new" 
      ? FIXED_NET_PROVISIONS.RBI_CABLE.new 
      : FIXED_NET_PROVISIONS.RBI_CABLE.renewal;
  }
  
  return 0;
}

// ============================================
// Dealer Economics Calculation
// ============================================

/**
 * Calculate dealer economics (provision, deductions, margin)
 * Phase 2: Supports OMO-Matrix (0-25%), Fixed Net Provisions
 */
export function calculateDealerEconomics(
  tariff: MobileTariff | undefined,
  contractType: ContractType,
  quantity: number,
  hardwareEkNet: number,
  promoId: string = "NONE",
  options?: {
    omoRate?: number;
    fixedNetProduct?: FixedNetProduct;
  }
): DealerEconomics {
  const omoRate = options?.omoRate ?? 0;
  const fixedNetProduct = options?.fixedNetProduct;
  
  if (!tariff) {
    const fixedNetProvision = calculateFixedNetProvision(fixedNetProduct, contractType);
    return {
      provisionBase: 0,
      deductions: 0,
      provisionAfter: 0,
      hardwareEkNet,
      margin: -hardwareEkNet + fixedNetProvision,
      fixedNetProvision: fixedNetProvision > 0 ? fixedNetProvision : undefined,
      omoRate,
    };
  }
  
  // Use renewal provision if available and contract is renewal
  const baseProvision = contractType === "renewal" && tariff.provisionRenewal !== undefined
    ? tariff.provisionRenewal
    : tariff.provisionBase;
  
  const provisionBase = baseProvision * quantity;
  
  // Calculate deductions
  let deductions = 0;
  
  // Standard deduction rate from tariff
  deductions += Math.round(provisionBase * tariff.deductionRate * 100) / 100;
  
  // OMO-Matrix deduction (0-25%)
  if (omoRate > 0) {
    deductions += calculateOMOMatrixDeduction(provisionBase, omoRate);
  } else if (promoId === "OMO25") {
    // Legacy OMO25 support: use tariff-specific deduction
    deductions += getOMODeduction(tariff, promoId) * quantity;
  }
  
  const provisionAfter = Math.max(0, provisionBase - deductions);
  
  // Fixed Net Provision
  const fixedNetProvision = calculateFixedNetProvision(fixedNetProduct, contractType);
  
  // Total margin = Mobile provision + Fixed Net provision - Hardware
  const totalProvision = provisionAfter + fixedNetProvision;
  const margin = Math.round((totalProvision - hardwareEkNet) * 100) / 100;
  
  return {
    provisionBase,
    deductions,
    provisionAfter,
    hardwareEkNet,
    margin,
    fixedNetProvision: fixedNetProvision > 0 ? fixedNetProvision : undefined,
    omoRate,
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
