// ============================================
// Canonical Dataset Types for XLSX/CSV Import
// These represent the "flat" row format from spreadsheets
// ============================================

export type DatasetMeta = {
  datasetVersion: string;
  validFromISO: string;
  verifiedAtISO: string;
  notes?: string;
  sources?: { title: string; url: string; versionDate: string }[];
};

export type MobileTariffRow = {
  id: string;
  family: string;
  productLine?: string;
  name: string;
  minTermMonths: number;
  base_sim_only_net: number;
  sub_basic_add_net?: number | null;
  sub_smartphone_add_net?: number | null;
  sub_premium_add_net?: number | null;
  sub_special_premium_add_net?: number | null;
  data_de: string | number; // "unlimited" or GB number
  eu_rule: "numeric" | "text";
  eu_data_gb?: number | null;
  eu_note?: string | null;
  one_number_count?: number | null;
  giga_depot?: string | null; // "included" | "optional" | null
  giga_depot_price?: number | null;
  roaming_zone1_gb?: number | null;
  roaming_zone1_frequency?: string | null;
  sort_order?: number;
  active: boolean;
};

export type MobileFeatureRow = {
  tariff_id: string;
  key: string;
  label_short: string;
  label_detail?: string;
  display_order?: number;
};

export type MobileDependencyRow = {
  tariff_id: string;
  rule_type: "requires_prime_on_account" | "max_contracts" | string;
  param1?: string;
  message?: string;
};

export type FixedNetProductRow = {
  id: string;
  access_type: string;
  variant?: string;
  name: string;
  minTermMonths: number;
  speed_label?: string;
  speed?: number;
  monthly_net: number;
  router_included: boolean;
  router_model?: string;
  one_time_setup_net: number;
  one_time_shipping_net: number;
  fixed_ip_included: boolean;
  fixed_ip_addon_net?: number;
  optional_expert_install_net?: number;
  sort_order?: number;
  active: boolean;
};

export type HardwareItemRow = {
  id: string;
  brand: string;
  model: string;
  category: string;
  ek_net: number;
  image_url?: string;
  sort_order?: number;
  active: boolean;
};

export type PromoDefinitionRow = {
  id: string;
  label?: string;
  applies_to: "mobile" | "fixed" | "both";
  type: "PCT_OFF_BASE" | "ABS_OFF_BASE" | "INTRO_PRICE";
  duration_months: number;
  pct?: number;
  amount_net?: number;
  intro_net?: number;
  valid_from?: string;
  valid_until?: string;
  eligibility_note?: string;
};

export type SubVariantRow = {
  id: string;
  label: string;
  monthly_add_net: number;
};

export type CanonicalDataset = {
  meta: DatasetMeta;
  mobileTariffs: MobileTariffRow[];
  mobileFeatures: MobileFeatureRow[];
  mobileDependencies: MobileDependencyRow[];
  fixedNetProducts: FixedNetProductRow[];
  hardwareCatalog: HardwareItemRow[];
  promos: PromoDefinitionRow[];
  subVariants: SubVariantRow[];
};

// Parsed sheet data before transformation
export type ParsedSheets = {
  meta?: Record<string, unknown>[];
  mobile_tariffs?: Record<string, unknown>[];
  mobile_features?: Record<string, unknown>[];
  mobile_dependencies?: Record<string, unknown>[];
  fixednet_products?: Record<string, unknown>[];
  hardware_catalog?: Record<string, unknown>[];
  promos_possible?: Record<string, unknown>[];
  sub_variants?: Record<string, unknown>[];
};
