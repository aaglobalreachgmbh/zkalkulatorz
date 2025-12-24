// ============================================
// MargenKalkulator Engine - Modular Exports
// ============================================

// Types
export type {
  Currency,
  ContractType,
  ViewMode,
  Money,
  Period,
  BreakdownItem,
  OfferOptionMeta,
  HardwareState,
  MobileState,
  FixedNetState,
  OfferOptionState,
  DealerEconomics,
  CalculationTotals,
  CalculationResult,
  SubVariant,
  SubVariantId,
  MobileTariff,
  PromoType,
  Promo,
  FixedNetProduct,
  FixedNetAccessType,
  DummyCatalog,
  WizardStep,
  WizardValidation,
  DatasetVersion,
  TariffFamily,
  ContractVariant,
} from "./types";

// Catalog (dummy data)
export {
  dummyCatalog,
  subVariants,
  mobileTariffs,
  promos,
  fixedNetProducts,
  getSubVariant,
  getMobileTariff,
  getPromo,
  getFixedNetProduct,
} from "./catalog.dummy";

// Period utilities
export {
  calculateGross,
  createMoney,
  generatePeriodLabel,
  collectPeriodBoundaries,
  createPeriodsFromBoundaries,
  calculateTotalFromPeriods,
  calculateAverageMonthly,
  mergePeriodsWithSamePrice,
} from "./periods";

// === MODULAR CALCULATORS ===
export {
  // Promo
  isPromoValid,
  isFixedPromoValid,
  resolveTeamDealPricing,
  type TeamDealResolution,
  // Mobile
  calculateMobileBaseForMonth,
  calculateMobileMonthlyForMonth,
  // Fixed Net
  calculateFixedNetMonthlyForMonth,
  getEffectiveOneTimeCost,
  // Hardware
  calculateHardwareAmortization,
  // Dealer
  getOMODeduction,
  calculateDealerEconomics,
  calculateDealerEconomicsLegacy,
} from "./calculators";

// Breakdown generation
export { generateBreakdown } from "./breakdown";

// Main offer calculation
export { calculateOffer } from "./offer";

// Catalog Resolver (Phase 2)
export {
  getCatalog,
  getSubVariantFromCatalog,
  getMobileTariffFromCatalog,
  getPromoFromCatalog,
  getFixedNetProductFromCatalog,
  listSubVariants,
  listMobileTariffs,
  listPromos,
  listFixedNetProducts,
  checkGKEligibility,
} from "./catalogResolver";

// ============================================
// Default State Factory
// ============================================

import type { OfferOptionState } from "./types";
import { TAX, TERM, CURRENCY, DATASETS } from "../config";

export function createDefaultOptionState(): OfferOptionState {
  return {
    meta: {
      currency: CURRENCY.DEFAULT,
      vatRate: TAX.VAT_RATE,
      termMonths: TERM.DEFAULT_MONTHS,
      datasetVersion: DATASETS.CURRENT,
      asOfISO: "2025-12-17",  // Slice B: deterministic date
    },
    hardware: {
      name: "",
      ekNet: 0,
      amortize: false,
      amortMonths: TERM.AMORT_MONTHS,
    },
    mobile: {
      tariffId: "PRIME_S",
      subVariantId: "SIM_ONLY",
      promoId: "NONE",
      contractType: "new",
      quantity: 1,
    },
    fixedNet: {
      enabled: false,
      productId: "RBI_100",
    },
  };
}

// Legacy function for tests that need dummy data
export function createDummyOptionState(): OfferOptionState {
  return {
    meta: {
      currency: CURRENCY.DEFAULT,
      vatRate: TAX.VAT_RATE,
      termMonths: TERM.DEFAULT_MONTHS,
      datasetVersion: DATASETS.DUMMY,
    },
    hardware: {
      name: "",
      ekNet: 0,
      amortize: false,
      amortMonths: TERM.AMORT_MONTHS,
    },
    mobile: {
      tariffId: "RED_BIZ_S",
      subVariantId: "SIM_ONLY",
      promoId: "NONE",
      contractType: "new",
      quantity: 1,
    },
    fixedNet: {
      enabled: false,
      productId: "CABLE_250",
    },
  };
}
