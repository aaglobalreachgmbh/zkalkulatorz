// ============================================
// XLSX/CSV Template Schema Definition
// Defines expected columns and validation rules
// ============================================

export type SheetSchema = {
  columns: string[];
  required: string[];
  uniqueKey?: string;
  foreignKey?: Record<string, string>;
};

export const TEMPLATE_SCHEMA: Record<string, SheetSchema> = {
  meta: {
    columns: ["datasetVersion", "validFromISO", "verifiedAtISO", "notes"],
    required: ["datasetVersion", "validFromISO"],
  },
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
  hardware_catalog: {
    columns: ["id", "brand", "model", "category", "ek_net", "image_url", "sort_order", "active"],
    required: ["id", "brand", "model", "ek_net"],
    uniqueKey: "id",
  },
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
};

// Sheet names in German for UI display
export const SHEET_LABELS: Record<string, string> = {
  meta: "Metadaten",
  mobile_tariffs: "Mobilfunk-Tarife",
  mobile_features: "Mobilfunk-Leistungen",
  mobile_dependencies: "Mobilfunk-Abhängigkeiten",
  fixednet_products: "Festnetz-Produkte",
  hardware_catalog: "Hardware-Katalog",
  promos_possible: "Aktionen/Promos",
  sub_variants: "SUB-Varianten",
};
