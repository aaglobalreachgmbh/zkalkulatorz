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

// Cloud Hooks (Supabase Integration)
export { useCloudDrafts } from "./hooks/useCloudDrafts";
export { useCloudHistory } from "./hooks/useCloudHistory";
export { useCloudTemplates, type CloudTemplate, type CloudFolder } from "./hooks/useCloudTemplates";
export { useCloudOffers, type CloudOffer } from "./hooks/useCloudOffers";

// Customer Hooks
export { useCustomers, type Customer, type CustomerInput } from "./hooks/useCustomers";
export { useCustomerNotes, type CustomerNote, type NoteType } from "./hooks/useCustomerNotes";

// Employee Settings & Push Provisions
export { 
  useEmployeeSettings, 
  useAllEmployeeSettings,
  useAdminEmployeeManagement,
  applyEmployeeDeduction,
  isTariffBlocked,
} from "./hooks/useEmployeeSettings";

export { 
  usePushProvisions,
  useAdminPushProvisions,
  useAllPushProvisions,
} from "./hooks/usePushProvisions";

// Hardware Images & Corporate Bundles
export { useHardwareImages } from "./hooks/useHardwareImages";
export { 
  useCorporateBundles,
  SECTOR_LABELS,
  SECTOR_ICONS,
  type Sector,
  type CorporateBundle,
} from "./hooks/useCorporateBundles";

// === BENEFITS ENGINE ===
export { calculateGigaKombi } from "./engine/benefitsEngine";

// === CATALOG RESOLVER ===
// Re-export specific functions needed by UI that might not be in engine/index
export { 
  listFixedNetByAccessType,
  getActiveDatasetVersion,
  listSubVariants,
} from "./engine/catalogResolver";

// === SUB VARIANT INFERENCE ===
export { 
  inferSubVariantFromHardware,
  isSubVariantAllowed,
  getBestAllowedSubVariant,
} from "./lib/subVariantInference";
