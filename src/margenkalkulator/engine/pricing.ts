// ============================================
// Calculation Engine - Phase 2 / Slice B
// ============================================

import type {
  OfferOptionState,
  CalculationResult,
  Period,
  Money,
  BreakdownItem,
  DealerEconomics,
  MobileTariff,
  Promo,
  SubVariant,
  FixedNetProduct,
  ContractType,
} from "./types";
import {
  getSubVariantFromCatalog,
  getMobileTariffFromCatalog,
  getPromoFromCatalog,
  getFixedNetProductFromCatalog,
  checkGKEligibility,
  getOMODeduction,
} from "./catalogResolver";
import {
  collectPeriodBoundaries,
  createPeriodsFromBoundaries,
  calculateTotalFromPeriods,
  calculateAverageMonthly,
  createMoney,
  calculateGross,
  mergePeriodsWithSamePrice,
} from "./periods";

// ============================================
// Promo Validity (Slice B)
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
// Mobile Calculation
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
// TeamDeal Fallback Logic (Slice C)
// ============================================

export type TeamDealResolution = {
  effectiveNet: number;
  dataVolumeGB: number | "unlimited";
  isFallback: boolean;
};

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
      effectiveNet: 13, // Smart Business Plus SIM-only
      dataVolumeGB: 1,
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

// ============================================
// Fixed Net Calculation
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

/**
 * Get effective one-time cost (considering setupWaived)
 */
export function getEffectiveOneTimeCost(product: FixedNetProduct): number {
  if (product.setupWaived) {
    return 0;
  }
  return product.oneTimeNet;
}

// ============================================
// Hardware Amortization
// ============================================

/**
 * Calculate hardware amortization per month
 */
export function calculateHardwareAmortization(
  ekNet: number,
  amortize: boolean,
  amortMonths: number
): number {
  if (!amortize || ekNet <= 0 || amortMonths <= 0) {
    return 0;
  }
  return Math.round((ekNet / amortMonths) * 100) / 100;
}

// ============================================
// Dealer Economics - Phase 2 Enhanced
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

// Legacy signature for backward compatibility with tests
export function calculateDealerEconomicsLegacy(
  tariff: MobileTariff | undefined,
  quantity: number,
  hardwareEkNet: number
): DealerEconomics {
  return calculateDealerEconomics(tariff, "new", quantity, hardwareEkNet, "NONE");
}

// ============================================
// Breakdown Generation - Phase 2 / Slice B Enhanced
// ============================================

/**
 * Generate breakdown items for explainability
 * Slice B: Added promo_expired handling
 */
export function generateBreakdown(
  state: OfferOptionState,
  tariff: MobileTariff | undefined,
  subVariant: SubVariant | undefined,
  promo: Promo | undefined,
  fixedProduct: FixedNetProduct | undefined,
  dealer: DealerEconomics,
  gkEligible: boolean
): BreakdownItem[] {
  const breakdown: BreakdownItem[] = [];
  const { vatRate, asOfISO } = state.meta;
  
  // Mobile base
  if (tariff) {
    breakdown.push({
      key: "mobile_base",
      label: `${tariff.name} Grundpreis`,
      appliesTo: "monthly",
      net: tariff.baseNet * state.mobile.quantity,
      gross: calculateGross(tariff.baseNet * state.mobile.quantity, vatRate),
      ruleId: "base",
    });
    
    // SUB add-on
    if (subVariant && subVariant.monthlyAddNet > 0) {
      breakdown.push({
        key: "mobile_sub",
        label: `${subVariant.label} Aufpreis`,
        appliesTo: "monthly",
        net: subVariant.monthlyAddNet * state.mobile.quantity,
        gross: calculateGross(subVariant.monthlyAddNet * state.mobile.quantity, vatRate),
        ruleId: "sub_add",
      });
    }
    
    // Promo handling (Slice B: check validity)
    if (promo && promo.type !== "NONE") {
      const promoValid = isPromoValid(promo, asOfISO);
      
      if (!promoValid) {
        // Slice B: Expired promo warning
        breakdown.push({
          key: "mobile_promo_expired",
          label: `${promo.label} – Promo abgelaufen, nicht angewendet`,
          appliesTo: "monthly",
          net: 0,
          ruleId: "promo_expired",
        });
      } else {
        // Active promo
        const promoLabel = promo.type === "INTRO_PRICE" 
          ? `Intro-Preis (${promo.durationMonths} Monate)`
          : promo.type === "ABS_OFF_BASE"
            ? `${promo.label} (${promo.durationMonths} Monate)`
            : promo.id === "OMO25"
              ? "OMO 25% Dauerrabatt"
              : `${promo.value * 100}% Rabatt auf Base (${promo.durationMonths} Monate)`;
        
        const ruleId = promo.type === "ABS_OFF_BASE" 
          ? "promo_abs_off_base"
          : promo.id === "OMO25" 
            ? "promo_omo25" 
            : promo.type === "INTRO_PRICE" 
              ? "promo_intro" 
              : "promo_pct_off_base";
        
        breakdown.push({
          key: "mobile_promo",
          label: promoLabel,
          appliesTo: "monthly",
          periodRef: `1-${promo.durationMonths}`,
          net: 0, // Calculated in periods
          ruleId,
        });
      }
    }
    
    // GK Eligibility Badge (Phase 2)
    if (gkEligible) {
      breakdown.push({
        key: "gk_benefit",
        label: "GK Konvergenz: Unlimited möglich",
        appliesTo: "monthly",
        net: 0,
        ruleId: "gk_eligible",
      });
    }
    
    // Slice C: TeamDeal fallback warning
    if (tariff.family === "teamdeal" && !state.mobile.primeOnAccount) {
      breakdown.push({
        key: "teamdeal_fallback",
        label: "TeamDeal Fallback: Ohne Prime → Smart Business Plus (1 GB / 13€)",
        appliesTo: "monthly",
        net: 13 * state.mobile.quantity,
        ruleId: "teamdeal_fallback_no_prime",
      });
    }
  }
  
  // Fixed net
  if (state.fixedNet.enabled && fixedProduct) {
    breakdown.push({
      key: "fixed_monthly",
      label: `${fixedProduct.name} monatlich`,
      appliesTo: "monthly",
      net: fixedProduct.monthlyNet,
      gross: calculateGross(fixedProduct.monthlyNet, vatRate),
      ruleId: "fixed_base",
    });
    
    // Fixed one-time (Phase 2: consider setupWaived)
    if (fixedProduct.setupWaived) {
      breakdown.push({
        key: "fixed_onetime_waived",
        label: "Bereitstellung erlassen",
        appliesTo: "oneTime",
        net: 0,
        gross: 0,
        ruleId: "fixed_setup_waived",
      });
    } else if (fixedProduct.oneTimeNet > 0) {
      breakdown.push({
        key: "fixed_onetime",
        label: `${fixedProduct.name} Einrichtung`,
        appliesTo: "oneTime",
        net: fixedProduct.oneTimeNet,
        gross: calculateGross(fixedProduct.oneTimeNet, vatRate),
        ruleId: "fixed_setup",
      });
    }
    
    // Router inclusion (Phase 2)
    if (fixedProduct.routerType) {
      const routerLabel = fixedProduct.routerType === "FRITZBOX" 
        ? "FRITZ!Box inklusive" 
        : "Vodafone Station inklusive";
      breakdown.push({
        key: "fixed_router",
        label: routerLabel,
        appliesTo: "monthly",
        net: 0,
        ruleId: "router_included",
      });
    }
    
    // Fixed promo (Slice B: check validity)
    if (fixedProduct.promo && fixedProduct.promo.type !== "NONE") {
      const fixedPromoValid = isFixedPromoValid(fixedProduct.promo, asOfISO);
      
      if (!fixedPromoValid) {
        breakdown.push({
          key: "fixed_promo_expired",
          label: "Festnetz Aktion – abgelaufen, nicht angewendet",
          appliesTo: "monthly",
          net: 0,
          ruleId: "promo_expired",
        });
      } else {
        breakdown.push({
          key: "fixed_promo",
          label: `Festnetz Aktion (${fixedProduct.promo.durationMonths} Monate)`,
          appliesTo: "monthly",
          periodRef: `1-${fixedProduct.promo.durationMonths}`,
          net: 0,
          ruleId: "fixed_promo",
        });
      }
    }
  }
  
  // Hardware amortization
  if (state.hardware.amortize && state.hardware.ekNet > 0) {
    const amortPerMonth = calculateHardwareAmortization(
      state.hardware.ekNet,
      true,
      state.hardware.amortMonths
    );
    breakdown.push({
      key: "hardware_amort",
      label: `Hardware Amortisierung (${state.hardware.amortMonths} Mo.)`,
      appliesTo: "monthly",
      net: amortPerMonth,
      gross: calculateGross(amortPerMonth, vatRate),
      ruleId: "hardware_amort",
    });
  }
  
  // Dealer breakdown
  breakdown.push({
    key: "dealer_provision_base",
    label: state.mobile.contractType === "renewal" ? "Provision (Verlängerung)" : "Provision (Neuvertrag)",
    appliesTo: "dealer",
    net: dealer.provisionBase,
    ruleId: "provision_base",
  });
  
  breakdown.push({
    key: "dealer_deductions",
    label: state.mobile.promoId === "OMO25" ? "Abzüge (inkl. OMO)" : "Abzüge",
    appliesTo: "dealer",
    net: -dealer.deductions,
    ruleId: "deductions",
  });
  
  breakdown.push({
    key: "dealer_provision_after",
    label: "Provision (nach Abzügen)",
    appliesTo: "dealer",
    net: dealer.provisionAfter,
    ruleId: "provision_after",
  });
  
  if (state.hardware.ekNet > 0) {
    breakdown.push({
      key: "dealer_hardware_ek",
      label: "Hardware EK",
      appliesTo: "dealer",
      net: -dealer.hardwareEkNet,
      ruleId: "hardware_ek",
    });
  }
  
  breakdown.push({
    key: "dealer_margin",
    label: "Marge",
    appliesTo: "dealer",
    net: dealer.margin,
    ruleId: "margin",
  });
  
  return breakdown;
}

// ============================================
// Main Calculation Function
// ============================================

/**
 * Calculate complete result for an offer option
 * This is a pure function with no side effects
 * Slice B: Uses asOfISO for deterministic promo evaluation
 */
export function calculateOffer(state: OfferOptionState): CalculationResult {
  const { meta, hardware, mobile, fixedNet } = state;
  const datasetVersion = meta.datasetVersion;
  const asOfISO = meta.asOfISO;
  
  // Get catalog items using resolver
  const tariff = getMobileTariffFromCatalog(datasetVersion, mobile.tariffId);
  const subVariant = getSubVariantFromCatalog(datasetVersion, mobile.subVariantId);
  const promo = getPromoFromCatalog(datasetVersion, mobile.promoId);
  const fixedProduct = fixedNet.enabled 
    ? getFixedNetProductFromCatalog(datasetVersion, fixedNet.productId) 
    : undefined;
  
  // Check GK eligibility (Phase 2)
  const gkEligible = checkGKEligibility(tariff, fixedNet.enabled);
  
  // Determine effective promo durations (Slice B: check validity)
  const mobilePromoValid = isPromoValid(promo, asOfISO);
  const fixedPromoValid = fixedProduct?.promo ? isFixedPromoValid(fixedProduct.promo, asOfISO) : false;
  
  const mobilePromoDuration = mobilePromoValid ? (promo?.durationMonths ?? 0) : 0;
  const fixedPromoDuration = fixedPromoValid ? (fixedProduct?.promo?.durationMonths ?? 0) : 0;
  
  // Calculate hardware amortization
  const hardwareAmortPerMonth = calculateHardwareAmortization(
    hardware.ekNet,
    hardware.amortize,
    hardware.amortMonths
  );
  
  // Collect period boundaries
  const boundaries = collectPeriodBoundaries(
    meta.termMonths,
    mobilePromoDuration,
    fixedPromoDuration
  );
  
  // Create periods with combined costs
  let periods = createPeriodsFromBoundaries(
    boundaries,
    (fromMonth: number, _toMonth: number) => {
      const month = fromMonth;
      
      // Mobile cost (Slice B: pass asOfISO)
      let mobileCost = 0;
      if (tariff && subVariant && promo) {
        mobileCost = calculateMobileMonthlyForMonth(
          tariff,
          subVariant,
          promo,
          mobile.quantity,
          month,
          asOfISO,
          mobile.primeOnAccount // Slice C: TeamDeal fallback
        );
      }
      
      // Fixed net cost (Slice B: pass asOfISO)
      let fixedCost = 0;
      if (fixedNet.enabled && fixedProduct) {
        fixedCost = calculateFixedNetMonthlyForMonth(fixedProduct, month, asOfISO);
      }
      
      // Hardware amortization (if enabled)
      const hardwareCost = hardware.amortize ? hardwareAmortPerMonth : 0;
      
      return mobileCost + fixedCost + hardwareCost;
    },
    meta.vatRate
  );
  
  // Slice B: Merge periods with same price (avoid unnecessary splits)
  periods = mergePeriodsWithSamePrice(periods);
  
  // One-time costs (Phase 2: consider setupWaived)
  const oneTime: Money[] = [];
  if (fixedNet.enabled && fixedProduct) {
    const effectiveSetup = getEffectiveOneTimeCost(fixedProduct);
    if (effectiveSetup > 0) {
      oneTime.push(createMoney(effectiveSetup, meta.vatRate));
    }
  }
  
  // Calculate totals
  const periodTotals = calculateTotalFromPeriods(periods);
  const oneTimeTotalNet = oneTime.reduce((sum, m) => sum + m.net, 0);
  const oneTimeTotalGross = oneTime.reduce((sum, m) => sum + m.gross, 0);
  
  const totals = {
    avgTermNet: calculateAverageMonthly(periods, meta.termMonths),
    sumTermNet: Math.round((periodTotals.net + oneTimeTotalNet) * 100) / 100,
    sumTermGross: Math.round((periodTotals.gross + oneTimeTotalGross) * 100) / 100,
  };
  
  // Dealer economics (Phase 2: with contract type and promo)
  const dealer = calculateDealerEconomics(
    tariff, 
    mobile.contractType, 
    mobile.quantity, 
    hardware.ekNet,
    mobile.promoId
  );
  
  // Generate breakdown
  const breakdown = generateBreakdown(
    state,
    tariff,
    subVariant,
    promo,
    fixedProduct,
    dealer,
    gkEligible
  );
  
  return {
    periods,
    oneTime,
    totals,
    dealer,
    breakdown,
    gkEligible,
  };
}
