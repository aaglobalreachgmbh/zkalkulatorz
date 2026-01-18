// ============================================
// Dealer Economics Module
// Handles provision and margin calculations
// Phase 2: OMO-Matrix (0-25%) + Fixed Net Provisions + FH-Partner
// Phase 2.4: TeamDeal SUB-Variant Provisions (provisionsByVariant)
// Phase 3: Employee Deduction + Push Provisions
// ============================================

import type { MobileTariff, DealerEconomics, ContractType, FixedNetProduct, SubVariantId } from "../types";
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

  // Check for OMO-Matrix in tariff (use renewal matrix for renewals)
  const matrix = contractType === "renewal" && tariff.omoMatrixRenewal
    ? tariff.omoMatrixRenewal
    : tariff.omoMatrix;

  if (matrix) {
    const matrixValue = matrix[omoRate];
    
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
// SUB-Variant Provision Resolver (TeamDeal)
// ============================================

/**
 * Get provision for a tariff, considering SUB-variant specific provisions.
 * 
 * GESCHÄFTSLOGIK (TeamDeal):
 * TeamDeal-Tarife haben unterschiedliche Provisionen je nach SUB-Variante:
 * - SIM_ONLY: Niedrigste Provision (z.B. 55€)
 * - BASIC/SUB_5: Mittlere Provision (z.B. 120€)
 * - SMARTPHONE/SUB_10: Höchste Provision (z.B. 170€)
 * 
 * @returns Provision amount, or undefined if not found
 */
export function getProvisionForVariant(
  tariff: MobileTariff | undefined,
  contractType: ContractType,
  subVariantId?: SubVariantId
): number {
  if (!tariff) return 0;
  
  // Check for SUB-Variant specific provisions (TeamDeal)
  if (tariff.provisionsByVariant && subVariantId) {
    // Map SubVariantId to provisionsByVariant keys
    const variantKey = mapSubVariantToProvisionKey(subVariantId);
    const variantProvision = tariff.provisionsByVariant[variantKey];
    
    if (variantProvision !== undefined) {
      return variantProvision;
    }
  }
  
  // Fallback to contract-type based provision
  if (contractType === "renewal" && tariff.provisionRenewal !== undefined) {
    return tariff.provisionRenewal;
  }
  
  return tariff.provisionBase;
}

/**
 * Map SubVariantId to provisionsByVariant key.
 * 
 * MAPPING:
 * - SIM_ONLY → SIM_ONLY
 * - BASIC_PHONE → BASIC
 * - SMARTPHONE, PREMIUM_SMARTPHONE, SPECIAL_PREMIUM_SMARTPHONE → SMARTPHONE
 */
function mapSubVariantToProvisionKey(subVariantId: SubVariantId): keyof NonNullable<MobileTariff["provisionsByVariant"]> {
  switch (subVariantId) {
    case "SIM_ONLY":
      return "SIM_ONLY";
    case "BASIC_PHONE":
      return "BASIC";
    case "SMARTPHONE":
    case "PREMIUM_SMARTPHONE":
    case "SPECIAL_PREMIUM_SMARTPHONE":
      return "SMARTPHONE";
    default:
      return "SIM_ONLY";
  }
}

// ============================================
// Employee Deduction Calculator (Phase 3)
// ============================================

/**
 * Employee deduction settings for provision reduction.
 */
export type EmployeeDeductionSettings = {
  /** Deduction amount (fixed EUR or percentage) */
  deductionValue: number;
  /** Deduction type: "fixed" = EUR, "percentage" = % of provision */
  deductionType: "fixed" | "percentage";
};

/**
 * Apply employee-specific provision deduction.
 * 
 * GESCHÄFTSLOGIK:
 * Der Admin kann pro Mitarbeiter einen Provisionsabzug konfigurieren:
 * - "fixed": Fester EUR-Betrag wird abgezogen (z.B. -20€)
 * - "percentage": Prozentsatz der Provision (z.B. -5%)
 * 
 * @param provisionAfter - Provision after OMO deductions
 * @param settings - Employee deduction settings (optional)
 * @returns Deducted provision (never negative)
 */
export function applyEmployeeDeduction(
  provisionAfter: number,
  settings?: EmployeeDeductionSettings | null
): number {
  if (!settings || settings.deductionValue <= 0) {
    return provisionAfter;
  }

  let deduction: number;
  if (settings.deductionType === "percentage") {
    deduction = Math.round(provisionAfter * (settings.deductionValue / 100) * 100) / 100;
  } else {
    deduction = settings.deductionValue;
  }

  return Math.max(0, Math.round((provisionAfter - deduction) * 100) / 100);
}

/**
 * Calculate employee deduction amount.
 * 
 * @param provisionAfter - Provision after OMO deductions
 * @param settings - Employee deduction settings
 * @returns The deduction amount in EUR
 */
export function calculateEmployeeDeductionAmount(
  provisionAfter: number,
  settings?: EmployeeDeductionSettings | null
): number {
  if (!settings || settings.deductionValue <= 0) {
    return 0;
  }

  if (settings.deductionType === "percentage") {
    return Math.round(provisionAfter * (settings.deductionValue / 100) * 100) / 100;
  }
  
  return Math.min(settings.deductionValue, provisionAfter);
}

// ============================================
// Extended Dealer Economics Type
// ============================================

export type DealerEconomicsExtended = DealerEconomics & {
  /** Push-Bonus from active push provisions */
  pushBonus?: number;
  /** Employee-specific provision deduction */
  employeeDeduction?: number;
  /** Display provision after all adjustments (for margin indicator) */
  displayProvision?: number;
  /** Flag: TeamDeal without Prime falls back to Smart Business Plus (no provision) */
  teamDealFallback?: boolean;
  /** Quantity bonus (cross-selling on-top) */
  quantityBonus?: number;
  /** Name of the applied quantity bonus tier (e.g., "Gold Staffel") */
  quantityBonusTierName?: string;
};

// ============================================
// Dealer Economics Calculation
// ============================================

/**
 * Calculate dealer economics (provision, deductions, margin)
 * Phase 2: Supports OMO-Matrix (0-25%), Fixed Net Provisions, FH-Partner
 * Phase 2.4: Supports TeamDeal SUB-Variant Provisions
 * Phase 3: Supports Employee Deduction + Push Provisions
 * 
 * GESCHÄFTSLOGIK (Source-of-Truth):
 * - Wenn OMO-Matrix vorhanden → absoluten Wert verwenden (KEINE zusätzliche Deduktion)
 * - Wenn Matrix-Wert null → Stufe gesperrt, Provision = 0
 * - Wenn keine Matrix → Fallback auf prozentuale Berechnung
 * - Wenn provisionsByVariant vorhanden (TeamDeal) → SUB-spezifische Provision
 * - employeeDeduction: Wird von provisionAfter abgezogen (Mitarbeiter-Abzug)
 * - pushBonus: Wird zur Marge addiert (Push-Provision)
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
    subVariantId?: SubVariantId;
    primeOnAccount?: boolean;
    employeeDeduction?: EmployeeDeductionSettings | null;
    pushBonus?: number;
    /** Quantity bonus total (cross-selling on-top) */
    quantityBonus?: number;
    /** Name of the quantity bonus tier */
    quantityBonusTierName?: string;
  }
): DealerEconomicsExtended {
  const omoRate = options?.omoRate ?? 0;
  const fixedNetProduct = options?.fixedNetProduct;
  const isFHPartner = options?.isFHPartner ?? false;
  const subVariantId = options?.subVariantId;
  const primeOnAccount = options?.primeOnAccount ?? true;
  const employeeSettings = options?.employeeDeduction;
  const pushBonus = options?.pushBonus ?? 0;
  const quantityBonus = options?.quantityBonus ?? 0;
  const quantityBonusTierName = options?.quantityBonusTierName;
  
  // Fixed Net Provision (applies regardless of mobile tariff)
  const fixedNetProvision = calculateFixedNetProvision(fixedNetProduct, contractType);
  
  if (!tariff) {
    return {
      provisionBase: 0,
      deductions: 0,
      provisionAfter: 0,
      hardwareEkNet,
      margin: -hardwareEkNet + fixedNetProvision + pushBonus,
      fixedNetProvision: fixedNetProvision > 0 ? fixedNetProvision : undefined,
      omoRate,
      pushBonus: pushBonus > 0 ? pushBonus : undefined,
      employeeDeduction: 0,
      displayProvision: 0,
    };
  }
  
  // ========================================
  // TEAMDEAL FALLBACK: No Prime = No Provision
  // ========================================
  const isTeamDeal = tariff.family === "teamdeal";
  
  if (isTeamDeal && !primeOnAccount) {
    // TeamDeal without Business Prime on account:
    // Falls back to Smart Business Plus, but we don't have provision data for that.
    // Return 0 provision with teamDealFallback flag for UI warning.
    return {
      provisionBase: 0,
      deductions: 0,
      provisionAfter: 0,
      hardwareEkNet,
      margin: Math.round((-hardwareEkNet + fixedNetProvision + pushBonus) * 100) / 100,
      fixedNetProvision: fixedNetProvision > 0 ? fixedNetProvision : undefined,
      omoRate,
      teamDealFallback: true,
      pushBonus: pushBonus > 0 ? pushBonus : undefined,
      employeeDeduction: 0,
      displayProvision: 0,
    };
  }
  
  // ========================================
  // CORE LOGIC: OMO-Matrix Source-of-Truth
  // ========================================
  const omoResult = getProvisionFromOMOMatrix(tariff, omoRate, contractType);
  
  let provisionBase: number;
  let deductions: number;
  let provisionAfter: number;
  
  if (omoResult === undefined) {
    // Matrix returns undefined → OMO-Stufe ist gesperrt
    // Provision = 0 (ungültige Konfiguration)
    provisionBase = 0;
    deductions = 0;
    provisionAfter = 0;
  } else if (omoResult.source === "matrix") {
    // Matrix-Wert ist Source-of-Truth → absoluter Wert (bereits nach OMO-Abzug!)
    provisionBase = omoResult.provision * quantity;
    deductions = 0; // Abzug ist bereits im Matrix-Wert enthalten
    provisionAfter = provisionBase;
  } else {
    // Fallback: Prozentuale Berechnung
    provisionBase = omoResult.provision * quantity;
    
    // Standard-Abzüge (deductionRate) anwenden
    deductions = Math.round(provisionBase * (tariff.deductionRate ?? 0) * 100) / 100;
    
    // Legacy OMO25 support (separate deduction)
    if (promoId === "OMO25") {
      deductions += getOMODeduction(tariff, promoId) * quantity;
    }
    
    provisionAfter = Math.max(0, provisionBase - deductions);
  }
  
  // FH-Partner Bonus addieren (wird NACH OMO-Abzug hinzugefügt)
  const fhBonus = getFHPartnerBonus(tariff, isFHPartner) * quantity;
  provisionAfter += fhBonus;
  
  // ========================================
  // PHASE 3: Employee Deduction
  // ========================================
  const employeeDeductionAmount = calculateEmployeeDeductionAmount(provisionAfter, employeeSettings);
  const provisionAfterEmployee = applyEmployeeDeduction(provisionAfter, employeeSettings);
  
  // Display provision = after all deductions
  const displayProvision = provisionAfterEmployee;
  
  // Total margin = Mobile provision + Fixed Net + Push Bonus + Quantity Bonus - Hardware
  const totalProvision = provisionAfterEmployee + fixedNetProvision + pushBonus + quantityBonus;
  const margin = Math.round((totalProvision - hardwareEkNet) * 100) / 100;
  
  return {
    provisionBase,
    deductions,
    provisionAfter,
    hardwareEkNet,
    margin,
    fixedNetProvision: fixedNetProvision > 0 ? fixedNetProvision : undefined,
    fhPartnerBonus: fhBonus > 0 ? fhBonus : undefined,
    omoRate,
    omoSource: omoResult?.source,
    pushBonus: pushBonus > 0 ? pushBonus : undefined,
    employeeDeduction: employeeDeductionAmount > 0 ? employeeDeductionAmount : undefined,
    displayProvision,
    quantityBonus: quantityBonus > 0 ? quantityBonus : undefined,
    quantityBonusTierName: quantityBonus > 0 ? quantityBonusTierName : undefined,
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
