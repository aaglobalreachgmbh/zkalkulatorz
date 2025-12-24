// ============================================
// MargenKalkulator Engine - Phase 1 Exports
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
  // Slice C additions
  TariffFamily,
  ContractVariant,
} from "./types";

// Catalog
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

// Pricing / Calculation
export {
  calculateMobileBaseForMonth,
  calculateMobileMonthlyForMonth,
  calculateFixedNetMonthlyForMonth,
  calculateHardwareAmortization,
  calculateDealerEconomics,
  calculateDealerEconomicsLegacy,
  generateBreakdown,
  calculateOffer,
  isPromoValid,
  isFixedPromoValid,
  // Slice C additions
  resolveTeamDealPricing,
} from "./pricing";

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
  getOMODeduction,
} from "./catalogResolver";

// ============================================
// Default State Factory
// ============================================

import type { OfferOptionState } from "./types";

export function createDefaultOptionState(): OfferOptionState {
  return {
    meta: {
      currency: "EUR",
      vatRate: 0.19,
      termMonths: 24,
      datasetVersion: "business-2025-09",
      asOfISO: "2025-12-17",  // Slice B: deterministic date
    },
    hardware: {
      name: "",
      ekNet: 0,
      amortize: false,
      amortMonths: 24,
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
      currency: "EUR",
      vatRate: 0.19,
      termMonths: 24,
      datasetVersion: "dummy-v0",
    },
    hardware: {
      name: "",
      ekNet: 0,
      amortize: false,
      amortMonths: 24,
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
