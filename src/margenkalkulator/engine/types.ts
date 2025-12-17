// ============================================
// MargenKalkulator Types - Phase 1
// ============================================

export type Currency = "EUR";
export type ContractType = "new" | "renewal";
export type ViewMode = "customer" | "dealer";

// ============================================
// Money & Period Types
// ============================================

export type Money = {
  net: number;
  gross: number;
};

export type Period = {
  fromMonth: number; // 1-indexed
  toMonth: number;   // inclusive
  monthly: Money;
  label?: string;    // e.g., "Monat 1–6"
};

// ============================================
// Breakdown for Explainability
// ============================================

export type BreakdownItem = {
  key: string;
  label: string;
  appliesTo: "monthly" | "oneTime" | "dealer";
  periodRef?: string;   // which period it affects
  net: number;
  gross?: number;
  ruleId: string;       // e.g., "base", "sub_add", "promo_pct_off_base"
};

// ============================================
// Offer Option State (Input)
// ============================================

export type OfferOptionMeta = {
  currency: Currency;
  vatRate: number;       // default 0.19
  termMonths: number;    // default 24
  datasetVersion: string; // e.g., "dummy-v0"
};

export type HardwareState = {
  name: string;          // free text
  ekNet: number;         // Einkaufspreis netto (>=0)
  amortize: boolean;     // default false
  amortMonths: number;   // default 24, min 1
};

export type MobileState = {
  tariffId: string;          // from catalog
  subVariantId: string;      // SIM_ONLY / SUB5 / SUB10
  promoId: string;           // NONE / INTRO / PCT_OFF
  contractType: ContractType;
  quantity: number;          // default 1
};

export type FixedNetState = {
  enabled: boolean;
  productId: string;         // from catalog if enabled
};

export type OfferOptionState = {
  meta: OfferOptionMeta;
  hardware: HardwareState;
  mobile: MobileState;
  fixedNet: FixedNetState;
};

// ============================================
// Calculation Result (Output)
// ============================================

export type DealerEconomics = {
  provisionBase: number;
  deductions: number;
  provisionAfter: number;
  hardwareEkNet: number;
  margin: number;
};

export type CalculationTotals = {
  avgTermNet: number;
  sumTermNet: number;
  sumTermGross: number;
};

export type CalculationResult = {
  periods: Period[];
  oneTime: Money[];
  totals: CalculationTotals;
  dealer: DealerEconomics;
  breakdown: BreakdownItem[];
};

// ============================================
// Catalog Types
// ============================================

export type SubVariant = {
  id: string;
  label: string;
  monthlyAddNet: number;
};

export type MobileTariff = {
  id: string;
  name: string;
  baseNet: number;
  features: string[];
  provisionBase: number;
  deductionRate: number; // percentage of provision as deduction
};

export type PromoType = "NONE" | "INTRO_PRICE" | "PCT_OFF_BASE";

export type Promo = {
  id: string;
  type: PromoType;
  label: string;
  durationMonths: number;
  value: number; // fixed price for INTRO, percentage (0-1) for PCT_OFF
};

export type FixedNetProduct = {
  id: string;
  name: string;
  monthlyNet: number;
  oneTimeNet: number;
  features: string[];
  promo?: {
    type: PromoType;
    durationMonths: number;
    value: number;
  };
};

export type DummyCatalog = {
  version: string;
  subVariants: SubVariant[];
  mobileTariffs: MobileTariff[];
  promos: Promo[];
  fixedNetProducts: FixedNetProduct[];
};

// ============================================
// Wizard Types
// ============================================

export type WizardStep = "hardware" | "mobile" | "fixedNet" | "compare";

export type WizardValidation = {
  isValid: boolean;
  errors: string[];
};
