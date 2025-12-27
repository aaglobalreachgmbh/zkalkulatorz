// ============================================
// XLSX/CSV Template Schema Definition
// Defines expected columns and validation rules
// ============================================
// 
// PRODUKTKATEGORIEN:
// - Hardware (Smartphones, Tablets, Zubehör)
// - Mobilfunk (Prime, Smart, TeamDeal)
// - Festnetz (Cable, DSL, Fiber, Komfort)
// - IoT/M2M (Daten-SIMs für Maschinen)
// - VoIP (RingCentral Cloud-Telefonie)
// - Provisionen (Neu/VVL pro Tarif)
// - OMO-Matrix (Rabatt-Abzüge)
// ============================================

export type SheetSchema = {
  columns: string[];
  required: string[];
  uniqueKey?: string;
  foreignKey?: Record<string, string>;
};

export const TEMPLATE_SCHEMA: Record<string, SheetSchema> = {
  // ============================================
  // META-DATEN
  // ============================================
  meta: {
    columns: ["datasetVersion", "validFromISO", "verifiedAtISO", "notes"],
    required: ["datasetVersion", "validFromISO"],
  },

  // ============================================
  // MOBILFUNK
  // ============================================
  mobile_tariffs: {
    columns: [
      "id", "family", "productLine", "name", "minTermMonths",
      "base_sim_only_net",
      "sub_basic_add_net", "sub_smartphone_add_net",
      "sub_premium_add_net", "sub_special_premium_add_net",
      "data_de", "eu_rule", "eu_data_gb", "eu_note",
      "one_number_count", "giga_depot", "giga_depot_price",
      "roaming_zone1_gb", "roaming_zone1_frequency",
      "sort_order", "active"
    ],
    required: ["id", "family", "name", "base_sim_only_net"],
    uniqueKey: "id",
  },
  mobile_features: {
    columns: ["tariff_id", "key", "label_short", "label_detail", "display_order"],
    required: ["tariff_id", "key", "label_short"],
    foreignKey: { tariff_id: "mobile_tariffs.id" },
  },
  mobile_dependencies: {
    columns: ["tariff_id", "rule_type", "param1", "message"],
    required: ["tariff_id", "rule_type"],
    foreignKey: { tariff_id: "mobile_tariffs.id" },
  },

  // ============================================
  // FESTNETZ
  // ============================================
  fixednet_products: {
    columns: [
      "id", "access_type", "variant", "name", "minTermMonths",
      "speed_label", "speed", "monthly_net",
      "router_included", "router_model",
      "one_time_setup_net", "one_time_shipping_net",
      "fixed_ip_included", "fixed_ip_addon_net",
      "optional_expert_install_net",
      "sort_order", "active"
    ],
    required: ["id", "access_type", "name", "monthly_net"],
    uniqueKey: "id",
  },

  // ============================================
  // IoT / M2M
  // ============================================
  iot_tariffs: {
    columns: [
      "id", "name", "category",
      "data_volume_mb", "data_volume_text",
      "monthly_net", "minTermMonths",
      "overage_per_mb_net",
      "provision_new", "provision_renewal",
      "features", "use_cases",
      "sort_order", "active"
    ],
    required: ["id", "name", "data_volume_mb", "monthly_net"],
    uniqueKey: "id",
  },

  // ============================================
  // VoIP / RingCentral
  // ============================================
  voip_products: {
    columns: [
      "id", "name", "tier",
      "price_per_user_net", "min_users", "max_users",
      "minTermMonths", "billing_cycle",
      "included_minutes_de", "included_minutes_intl",
      "video_conferencing", "team_messaging", "sms_enabled",
      "hardware_options", "features",
      "provision_per_user", "provision_setup",
      "sort_order", "active"
    ],
    required: ["id", "name", "tier", "price_per_user_net"],
    uniqueKey: "id",
  },
  voip_hardware: {
    columns: [
      "id", "brand", "model", "category",
      "ek_net", "uvp_net",
      "compatible_tiers", "features",
      "image_url", "sort_order", "active"
    ],
    required: ["id", "brand", "model", "ek_net"],
    uniqueKey: "id",
  },

  // ============================================
  // HARDWARE (Mobilfunk)
  // ============================================
  hardware_catalog: {
    columns: ["id", "brand", "model", "category", "ek_net", "image_url", "sort_order", "active"],
    required: ["id", "brand", "model", "ek_net"],
    uniqueKey: "id",
  },

  // ============================================
  // PROMOS & RABATTE
  // ============================================
  promos_possible: {
    columns: [
      "id", "label", "applies_to", "type", "duration_months",
      "pct", "amount_net", "intro_net",
      "valid_from", "valid_until", "eligibility_note"
    ],
    required: ["id", "type"],
    uniqueKey: "id",
  },
  sub_variants: {
    columns: ["id", "label", "monthly_add_net"],
    required: ["id", "label", "monthly_add_net"],
    uniqueKey: "id",
  },

  // ============================================
  // PROVISIONEN (NEU)
  // ============================================
  provisions: {
    columns: [
      "tariff_id", "tariff_type",
      "provision_new_net", "provision_renewal_net",
      "provision_renewal_pct",
      "fh_partner_modifier", "push_modifier",
      "notes"
    ],
    required: ["tariff_id", "tariff_type", "provision_new_net"],
    foreignKey: { tariff_id: "mobile_tariffs.id" },
  },

  // ============================================
  // OMO-MATRIX (Rabatt-Abzüge)
  // ============================================
  omo_matrix: {
    columns: [
      "tariff_id",
      "omo_0", "omo_5", "omo_10", "omo_15", "omo_17_5", "omo_20", "omo_25",
      "notes"
    ],
    required: ["tariff_id"],
    foreignKey: { tariff_id: "mobile_tariffs.id" },
  },
};

// Sheet names in German for UI display
export const SHEET_LABELS: Record<string, string> = {
  meta: "Metadaten",
  mobile_tariffs: "Mobilfunk-Tarife",
  mobile_features: "Mobilfunk-Leistungen",
  mobile_dependencies: "Mobilfunk-Abhängigkeiten",
  fixednet_products: "Festnetz-Produkte",
  iot_tariffs: "IoT/M2M-Tarife",
  voip_products: "VoIP-Produkte (RingCentral)",
  voip_hardware: "VoIP-Hardware",
  hardware_catalog: "Hardware-Katalog",
  promos_possible: "Aktionen/Promos",
  sub_variants: "SUB-Varianten",
  provisions: "Provisionen",
  omo_matrix: "OMO-Matrix",
};

// Product type categories for UI grouping
export const PRODUCT_CATEGORIES = {
  MOBILE: ["mobile_tariffs", "mobile_features", "mobile_dependencies"],
  FIXED_NET: ["fixednet_products"],
  IOT: ["iot_tariffs"],
  VOIP: ["voip_products", "voip_hardware"],
  HARDWARE: ["hardware_catalog"],
  PRICING: ["promos_possible", "sub_variants", "provisions", "omo_matrix"],
} as const;
