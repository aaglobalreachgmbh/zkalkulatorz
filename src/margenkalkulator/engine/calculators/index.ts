// ============================================
// Calculator Module Exports
// ============================================

export * from "./promo";
export * from "./mobile";
export * from "./dealer";
export * from "./hardware";
export * from "./fixedNet";

// Error types
export * from "../errors";

// ============================================
// Calculator Modules - Barrel Export
// ============================================

// Promo validation and TeamDeal resolution
export {
  isPromoValid,
  isFixedPromoValid,
  resolveTeamDealPricing,
  type TeamDealResolution,
} from "./promo";

// Mobile tariff calculations
export {
  calculateMobileBaseForMonth,
  calculateMobileMonthlyForMonth,
} from "./mobile";

// Fixed net calculations
export {
  calculateFixedNetMonthlyForMonth,
  getEffectiveOneTimeCost,
} from "./fixedNet";

// Hardware calculations
export {
  calculateHardwareAmortization,
} from "./hardware";

// Dealer economics
export {
  getOMODeduction,
  calculateOMOMatrixDeduction,
  calculateFixedNetProvision,
  calculateDealerEconomics,
  calculateDealerEconomicsLegacy,
} from "./dealer";
