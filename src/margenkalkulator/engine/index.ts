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
  MobileTariff,
  PromoType,
  Promo,
  FixedNetProduct,
  DummyCatalog,
  WizardStep,
  WizardValidation,
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
} from "./periods";

// Pricing / Calculation
export {
  calculateMobileBaseForMonth,
  calculateMobileMonthlyForMonth,
  calculateFixedNetMonthlyForMonth,
  calculateHardwareAmortization,
  calculateDealerEconomics,
  generateBreakdown,
  calculateOffer,
} from "./pricing";

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
