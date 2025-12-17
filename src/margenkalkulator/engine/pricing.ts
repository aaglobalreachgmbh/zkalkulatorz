// ============================================
// Calculation Engine - Phase 1
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
} from "./types";
import {
  getSubVariant,
  getMobileTariff,
  getPromo,
  getFixedNetProduct,
} from "./catalog.dummy";
import {
  collectPeriodBoundaries,
  createPeriodsFromBoundaries,
  calculateTotalFromPeriods,
  calculateAverageMonthly,
  createMoney,
  calculateGross,
} from "./periods";

// ============================================
// Mobile Calculation
// ============================================

/**
 * Calculate mobile base price for a given month (considering promo)
 * IMPORTANT: Promo only affects base price, NOT SUB add-on
 */
export function calculateMobileBaseForMonth(
  tariff: MobileTariff,
  promo: Promo,
  month: number
): number {
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
    default:
      return tariff.baseNet;
  }
}

/**
 * Calculate total mobile monthly cost for a given month
 */
export function calculateMobileMonthlyForMonth(
  tariff: MobileTariff,
  subVariant: SubVariant,
  promo: Promo,
  quantity: number,
  month: number
): number {
  const basePrice = calculateMobileBaseForMonth(tariff, promo, month);
  // SUB is always added at full price, never affected by promo
  const totalPerLine = basePrice + subVariant.monthlyAddNet;
  return totalPerLine * quantity;
}

// ============================================
// Fixed Net Calculation
// ============================================

/**
 * Calculate fixed net monthly cost for a given month (considering promo)
 */
export function calculateFixedNetMonthlyForMonth(
  product: FixedNetProduct,
  month: number
): number {
  const promo = product.promo;
  
  if (!promo || promo.type === "NONE" || month > promo.durationMonths) {
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
// Dealer Economics
// ============================================

/**
 * Calculate dealer economics (provision, deductions, margin)
 */
export function calculateDealerEconomics(
  tariff: MobileTariff | undefined,
  quantity: number,
  hardwareEkNet: number
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
  
  const provisionBase = tariff.provisionBase * quantity;
  const deductions = Math.round(provisionBase * tariff.deductionRate * 100) / 100;
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
// Breakdown Generation
// ============================================

/**
 * Generate breakdown items for explainability
 */
export function generateBreakdown(
  state: OfferOptionState,
  tariff: MobileTariff | undefined,
  subVariant: SubVariant | undefined,
  promo: Promo | undefined,
  fixedProduct: FixedNetProduct | undefined,
  dealer: DealerEconomics
): BreakdownItem[] {
  const breakdown: BreakdownItem[] = [];
  const { vatRate } = state.meta;
  
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
    
    // Promo
    if (promo && promo.type !== "NONE") {
      const promoLabel = promo.type === "INTRO_PRICE" 
        ? `Intro-Preis (${promo.durationMonths} Monate)`
        : `${promo.value * 100}% Rabatt auf Base (${promo.durationMonths} Monate)`;
      
      breakdown.push({
        key: "mobile_promo",
        label: promoLabel,
        appliesTo: "monthly",
        periodRef: `1-${promo.durationMonths}`,
        net: 0, // Calculated in periods
        ruleId: promo.type === "INTRO_PRICE" ? "promo_intro" : "promo_pct_off_base",
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
    
    // Fixed one-time
    if (fixedProduct.oneTimeNet > 0) {
      breakdown.push({
        key: "fixed_onetime",
        label: `${fixedProduct.name} Einrichtung`,
        appliesTo: "oneTime",
        net: fixedProduct.oneTimeNet,
        gross: calculateGross(fixedProduct.oneTimeNet, vatRate),
        ruleId: "fixed_setup",
      });
    }
    
    // Fixed promo
    if (fixedProduct.promo && fixedProduct.promo.type !== "NONE") {
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
    label: "Provision (Basis)",
    appliesTo: "dealer",
    net: dealer.provisionBase,
    ruleId: "provision_base",
  });
  
  breakdown.push({
    key: "dealer_deductions",
    label: "Abzüge",
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
 */
export function calculateOffer(state: OfferOptionState): CalculationResult {
  const { meta, hardware, mobile, fixedNet } = state;
  
  // Get catalog items
  const tariff = getMobileTariff(mobile.tariffId);
  const subVariant = getSubVariant(mobile.subVariantId);
  const promo = getPromo(mobile.promoId);
  const fixedProduct = fixedNet.enabled ? getFixedNetProduct(fixedNet.productId) : undefined;
  
  // Determine promo durations
  const mobilePromoDuration = promo?.durationMonths ?? 0;
  const fixedPromoDuration = fixedProduct?.promo?.durationMonths ?? 0;
  
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
  const periods = createPeriodsFromBoundaries(
    boundaries,
    (fromMonth: number, _toMonth: number) => {
      // We use fromMonth to determine which promo phase we're in
      const month = fromMonth;
      
      // Mobile cost
      let mobileCost = 0;
      if (tariff && subVariant && promo) {
        mobileCost = calculateMobileMonthlyForMonth(
          tariff,
          subVariant,
          promo,
          mobile.quantity,
          month
        );
      }
      
      // Fixed net cost
      let fixedCost = 0;
      if (fixedNet.enabled && fixedProduct) {
        fixedCost = calculateFixedNetMonthlyForMonth(fixedProduct, month);
      }
      
      // Hardware amortization (if enabled)
      const hardwareCost = hardware.amortize ? hardwareAmortPerMonth : 0;
      
      return mobileCost + fixedCost + hardwareCost;
    },
    meta.vatRate
  );
  
  // One-time costs
  const oneTime: Money[] = [];
  if (fixedNet.enabled && fixedProduct && fixedProduct.oneTimeNet > 0) {
    oneTime.push(createMoney(fixedProduct.oneTimeNet, meta.vatRate));
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
  
  // Dealer economics
  const dealer = calculateDealerEconomics(tariff, mobile.quantity, hardware.ekNet);
  
  // Generate breakdown
  const breakdown = generateBreakdown(
    state,
    tariff,
    subVariant,
    promo,
    fixedProduct,
    dealer
  );
  
  return {
    periods,
    oneTime,
    totals,
    dealer,
    breakdown,
  };
}
