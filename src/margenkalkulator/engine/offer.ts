// ============================================
// Offer Calculation Module (Orchestrator)
// Main entry point for offer calculations
// ============================================

import type {
  OfferOptionState,
  CalculationResult,
  Money,
} from "./types";
import {
  getSubVariantFromCatalog,
  getMobileTariffFromCatalog,
  getPromoFromCatalog,
  getFixedNetProductFromCatalog,
  checkGKEligibility,
} from "./catalogResolver";
import {
  collectPeriodBoundaries,
  createPeriodsFromBoundaries,
  calculateTotalFromPeriods,
  calculateAverageMonthly,
  createMoney,
  mergePeriodsWithSamePrice,
} from "./periods";
import {
  isPromoValid,
  isFixedPromoValid,
  calculateMobileMonthlyForMonth,
  calculateFixedNetMonthlyForMonth,
  getEffectiveOneTimeCost,
  calculateHardwareAmortization,
  calculateDealerEconomics,
} from "./calculators";
import { generateBreakdown } from "./breakdown";

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
  
  // Dealer economics (Phase 2: with OMO-Matrix, Fixed Net provision, FH-Partner)
  const dealer = calculateDealerEconomics(
    tariff, 
    mobile.contractType, 
    mobile.quantity, 
    hardware.ekNet,
    mobile.promoId,
    {
      omoRate: mobile.omoRate ?? 0,
      fixedNetProduct: fixedProduct,
      isFHPartner: mobile.isFHPartner ?? false,
    }
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
  
  // Determine convergence flags
  const convergenceEligible = fixedNet.enabled;
  const primeUnlimitedUpgradeEligible = fixedNet.enabled && 
    gkEligible && 
    tariff?.family === "prime";

  return {
    periods,
    oneTime,
    totals,
    dealer,
    breakdown,
    gkEligible,
    meta: {
      convergenceEligible,
      primeUnlimitedUpgradeEligible,
    },
  };
}
