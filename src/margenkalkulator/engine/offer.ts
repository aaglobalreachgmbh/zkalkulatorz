// ============================================
// Offer Calculation Module (Orchestrator)
// Main entry point for offer calculations
// ============================================

import type {
  OfferOptionState,
  CalculationResult,
  Money,
  SubVariantId,
  Promo,
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
  type EmployeeDeductionSettings,
} from "./calculators";
import { generateBreakdown } from "./breakdown";

// Employee-specific calculation options
export interface EmployeeCalculationOptions {
  employeeDeduction?: EmployeeDeductionSettings | null;
  pushBonus?: number;
  /** Quantity bonus total (cross-selling on-top) */
  quantityBonus?: number;
  /** Name of the quantity bonus tier */
  quantityBonusTierName?: string;
}

// ============================================
// Main Calculation Function
// ============================================

/**
 * Calculate complete result for an offer option
 * This is a pure function with no side effects
 * Slice B: Uses asOfISO for deterministic promo evaluation
 * Extended: Supports employeeDeduction and pushBonus options
 */
export function calculateOffer(
  state: OfferOptionState,
  employeeOptions?: EmployeeCalculationOptions
): CalculationResult {
  const { meta, hardware, mobile, fixedNet } = state;
  const datasetVersion = meta.datasetVersion;
  const asOfISO = meta.asOfISO;

  // Get catalog items using resolver
  const tariff = getMobileTariffFromCatalog(datasetVersion, mobile.tariffId);
  const subVariant = getSubVariantFromCatalog(datasetVersion, mobile.subVariantId);
  let promo = getPromoFromCatalog(datasetVersion, mobile.promoId);

  // SUPER AI LOGIC: DGRV Enforcement (Doc 10)
  // Rule: If Business Portfolio AND Lead Time >= 7 Months -> 12 Months Base Price Free.
  // This OVERRIDES any user-selected promo because it's a mandatory Association Benefit.
  const isDgrvTriggered = meta.portfolio === 'business' && (meta.leadTimeMonths ?? 0) >= 7;

  if (isDgrvTriggered) {
    promo = {
      id: "DGRV_AUTO_12M",
      label: "DGRV (12 Monate BP-frei)",
      appliesTo: "mobile",
      type: "INTRO_PRICE",
      durationMonths: 12,
      value: 0,
      validFromISO: "2024-01-01",
      validUntilISO: "2099-12-31"
    } as Promo;
  }
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
    avgTermGross: Math.round((periodTotals.gross / meta.termMonths) * 100) / 100,
    sumTermNet: Math.round((periodTotals.net + oneTimeTotalNet) * 100) / 100,
    sumTermGross: Math.round((periodTotals.gross + oneTimeTotalGross) * 100) / 100,
  };

  // Dealer economics (Phase 2: with OMO-Matrix, Fixed Net provision, FH-Partner)
  // Extended: Now includes employeeDeduction, pushBonus, and quantityBonus
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
      subVariantId: mobile.subVariantId as SubVariantId,
      primeOnAccount: mobile.primeOnAccount ?? true,
      employeeDeduction: employeeOptions?.employeeDeduction ?? null,
      pushBonus: employeeOptions?.pushBonus ?? 0,
      quantityBonus: employeeOptions?.quantityBonus ?? 0,
      quantityBonusTierName: employeeOptions?.quantityBonusTierName,
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

  // Calculate DGRV meta-flags (free months detection)
  const freeMonths = periods
    .filter(p => p.monthly.net < 0.01)
    .reduce((sum, p) => sum + (p.toMonth - p.fromMonth + 1), 0);
  const isDgrvContract = freeMonths >= 12;

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
      isDgrvContract: isDgrvTriggered,
      freeMonths,
    },
  };
}
