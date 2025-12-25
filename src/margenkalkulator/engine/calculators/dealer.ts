// ============================================
// Dealer Economics Module
// Handles provision and margin calculations
// Phase 2: OMO-Matrix (0-25%) + Fixed Net Provisions + FH-Partner
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

/**
 * Get provision from OMO-Matrix (Source-of-Truth)
 * 
 * REGEL: XLSX ist Source-of-Truth
 * - Wenn Matrix vorhanden und Wert existiert → absoluter Wert
 * - Wenn null oder undefined → Stufe ist gesperrt (return undefined)
 * - Wenn keine Matrix → prozentuale Berechnung (Fallback)
 */
export function getProvisionFromOMOMatrix(
  tariff: MobileTariff | undefined,
  omoRate: number,
  contractType: ContractType
): { provision: number; source: "matrix" | "calculated" } | undefined {
  if (!tariff) return undefined;

  // Base provision (new vs renewal)
  const baseProvision = contractType === "renewal" && tariff.provisionRenewal !== undefined
    ? tariff.provisionRenewal
    : tariff.provisionBase;

  // Check for OMO-Matrix in tariff
  if (tariff.omoMatrix) {
    const matrixValue = tariff.omoMatrix[omoRate];
    
    // Null or undefined in Matrix = locked/invalid
    if (matrixValue === null || matrixValue === undefined) {
      return undefined;
    }
    
    // Value from Matrix (Source-of-Truth)
    return { provision: matrixValue, source: "matrix" };
  }
  
  // No Matrix → Fallback to percentage calculation
  if (omoRate === 0) {
    return { provision: baseProvision, source: "calculated" };
  }
  
  const calculatedProvision = Math.round(baseProvision * (1 - omoRate / 100) * 100) / 100;
  return { provision: calculatedProvision, source: "calculated" };
}

// ============================================
// FH-Partner Bonus Calculator
// ============================================

/**
 * Get FH-Partner (Fachhändler) bonus provision
 * 
 * GESCHÄFTSLOGIK:
 * FH-Partner erhalten eine zusätzliche Provision (tariff.fhPartnerNet)
 * die zur Standard-Provision addiert wird.
 */
export function getFHPartnerBonus(
  tariff: MobileTariff | undefined,
  isFHPartner: boolean
): number {
  if (!tariff || !isFHPartner) return 0;
  return tariff.fhPartnerNet ?? 0;
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
 * Phase 2: Supports OMO-Matrix (0-25%), Fixed Net Provisions, FH-Partner
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
    isFHPartner?: boolean;
  }
): DealerEconomics {
  const omoRate = options?.omoRate ?? 0;
  const fixedNetProduct = options?.fixedNetProduct;
  const isFHPartner = options?.isFHPartner ?? false;
  
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
  
  // Try OMO-Matrix first (Source-of-Truth), fallback to base provision
  const omoResult = getProvisionFromOMOMatrix(tariff, omoRate, contractType);
  
  // Use renewal provision if available and contract is renewal
  const baseProvision = contractType === "renewal" && tariff.provisionRenewal !== undefined
    ? tariff.provisionRenewal
    : tariff.provisionBase;
  
  // Add FH-Partner bonus
  const fhBonus = getFHPartnerBonus(tariff, isFHPartner);

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
