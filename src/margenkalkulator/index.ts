// ============================================
// MargenKalkulator - Zentraler Public API Export
// ============================================
// 
// Dieser Barrel-Export ermöglicht saubere Imports im gesamten Projekt:
//   import { calculateOffer, type MobileTariff } from "@/margenkalkulator"
//
// Die Engine ist modular aufgebaut:
//   engine/calculators/ - Spezialisierte Berechnungen (promo, mobile, fixedNet, hardware, dealer)
//   engine/breakdown.ts - Breakdown-Generierung
//   engine/offer.ts     - Haupt-Orchestrator (calculateOffer)
// ============================================

// === CONFIG ===
// Zentrale Konstanten (VAT, TERM, FEES, etc.)
export * from "./config";

// === ENGINE ===
// Types, Calculation, Catalog-Access
export * from "./engine";

// === DATA MANAGER ===
// XLSX/CSV Import, Validation, Diff, Storage
export * from "./dataManager";

// === CATALOGS ===
// Versionierte Tarif-Daten
export { businessCatalog2025_09 } from "./data/business/v2025_09";
export { DATA_SOURCES } from "./data/business/v2025_09/sources";
export {
  komfortRegioPhoneTiers,
  komfortRegioInternetOptions,
  komfortFTTHPhoneTiers,
  komfortFTTHInternetOptions,
  KOMFORT_FIXED_IP_ADDON_NET,
} from "./data/business/v2025_09/fixedNetKomfort";

// === HOOKS ===
// UI-Hooks (Validation, etc.)
export { 
  useWizardValidation, 
  validationRules,
  type StepValidation, 
  type ValidationResult as WizardValidationResult,
} from "./hooks/useWizardValidation";

// === BENEFITS ENGINE ===
export { calculateGigaKombi } from "./engine/benefitsEngine";

// === CATALOG RESOLVER ===
// Re-export specific functions needed by UI that might not be in engine/index
export { 
  listFixedNetByAccessType,
  getActiveDatasetVersion,
} from "./engine/catalogResolver";
