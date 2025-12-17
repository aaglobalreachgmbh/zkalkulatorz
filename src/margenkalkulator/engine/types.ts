// ============================================
// MargenKalkulator Types - Phase 2
// ============================================

export type Currency = "EUR";
export type ContractType = "new" | "renewal";
export type ViewMode = "customer" | "dealer";
export type DatasetVersion = "dummy-v0" | "business-2025-09";

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
  datasetVersion: DatasetVersion;
  asOfISO?: string;      // Slice B: deterministic date for promo validity (e.g., "2025-12-17")
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
  promoId: string;           // NONE / 12X50 / OMO25
  contractType: ContractType;
  quantity: number;          // default 1
  // Slice C extensions
  contractVariant?: ContractVariant;  // SIM_ONLY / BASIC / SMARTPHONE
  primeOnAccount?: boolean;           // TeamDeal fallback toggle
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
  gkEligible: boolean;  // Phase 2: GK convergence benefit
};

// ============================================
// Catalog Types - Extended for Phase 2
// ============================================

export type SubVariant = {
  id: string;
  label: string;
  monthlyAddNet: number;
};

export type TariffTier = "XS" | "S" | "M" | "L" | "XL";
export type ProductLine = "PRIME" | "BUSINESS_SMART" | "SMART_BUSINESS" | "SMART_BUSINESS_PLUS" | "TEAMDEAL";
export type TariffFamily = "prime" | "business_smart" | "smart_business" | "teamdeal";
export type ContractVariant = "SIM_ONLY" | "BASIC" | "SMARTPHONE";

export type MobileTariff = {
  id: string;
  name: string;
  baseNet: number;
  features: string[];
  provisionBase: number;
  provisionRenewal?: number;    // Phase 2: provision for renewals
  deductionRate: number;        // percentage of provision as deduction
  tier?: TariffTier;            // Phase 2: S/M/L/XL
  productLine?: ProductLine;    // Phase 2: PRIME/SMART/TEAMDEAL
  oneNumberIncluded?: boolean;  // Phase 2: OneNumber feature
  omoDeduction?: number;        // Phase 2: OMO25 specific deduction amount
  // Slice C extensions
  family?: TariffFamily;        // For UI grouping
  dataVolumeGB?: number | "unlimited";
  pricesByVariant?: {           // Device tier prices (SIM/Basic/Smartphone)
    SIM_ONLY: number;
    BASIC?: number;
    SMARTPHONE?: number;
  };
  minTermMonths?: number;       // 24 or 1 (Flex)
  setupFeeNet?: number;         // 0 for Business Smart
  teamDealBase?: string;        // e.g. "SMART_BUSINESS_PLUS"
  teamDealDelta?: number;       // e.g. -3.50 for XS
};

export type PromoType = "NONE" | "INTRO_PRICE" | "PCT_OFF_BASE" | "ABS_OFF_BASE";

export type Promo = {
  id: string;
  type: PromoType;
  label: string;
  appliesTo?: "mobile" | "fixed" | "both";  // Slice B: target scope
  durationMonths: number;
  value: number;                   // fixed price for INTRO, percentage (0-1) for PCT_OFF
  amountNetPerMonth?: number;      // Slice B: ABS_OFF_BASE absolute discount
  // Time-based validity (Slice B)
  validFromISO?: string;           // e.g., "2025-09-01"
  validUntilISO?: string;          // e.g., "2025-12-18"
  eligibilityNote?: string;        // Display hint
  sourceRef?: string;              // Source URL/doc reference
};

export type FixedNetProductLine = "RBI" | "RBIP" | "DSL" | "FIBER";
export type RouterType = "FRITZBOX" | "VODAFONE_STATION";

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
    validFromISO?: string;   // Slice B: validity start
    validUntilISO?: string;  // Slice B: validity end
  };
  // Phase 2 extensions
  productLine?: FixedNetProductLine;
  speed?: number;               // Mbit/s
  setupWaived?: boolean;        // Setup fee waived
  routerType?: RouterType;
  includesPhone?: boolean;      // Phone line included (RBIP)
};

export type Catalog = {
  version: DatasetVersion;
  validFrom?: string;           // Phase 2: validity date
  subVariants: SubVariant[];
  mobileTariffs: MobileTariff[];
  promos: Promo[];
  fixedNetProducts: FixedNetProduct[];
};

// Legacy alias for backward compatibility
export type DummyCatalog = Catalog;

// ============================================
// Wizard Types
// ============================================

export type WizardStep = "hardware" | "mobile" | "fixedNet" | "compare";

export type WizardValidation = {
  isValid: boolean;
  errors: string[];
};
