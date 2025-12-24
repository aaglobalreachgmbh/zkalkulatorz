// ============================================
// Canonical Dataset Types für XLSX/CSV Import
// ============================================
//
// ZWECK:
// Diese Types definieren das "flache" Zeilenformat aus Spreadsheets.
// Der DataManager transformiert XLSX-Daten in diese Struktur,
// bevor sie in Engine-Catalog-Types konvertiert werden.
//
// DATENFLUSS:
// XLSX-Datei → ParsedSheets → CanonicalDataset → Catalog (Engine)
//
// ============================================

/**
 * Meta-Daten eines importierten Datasets.
 * 
 * ZWECK:
 * Ermöglicht Versionierung und Nachvollziehbarkeit der Tarifdaten.
 * 
 * @example
 * const meta: DatasetMeta = {
 *   datasetVersion: "business-2025-09",
 *   validFromISO: "2025-09-01",
 *   verifiedAtISO: "2025-09-15",
 *   notes: "Herbst-Tarife 2025",
 *   sources: [
 *     { title: "Preisliste Business", url: "https://...", versionDate: "2025-09-01" }
 *   ]
 * };
 */
export type DatasetMeta = {
  /** Eindeutige Version (z.B. "business-2025-09") */
  datasetVersion: string;
  /** Gültig ab (ISO-Datum) */
  validFromISO: string;
  /** Verifiziert am (ISO-Datum) */
  verifiedAtISO: string;
  /** Optionale Notizen */
  notes?: string;
  /** Quellen-Referenzen für Nachvollziehbarkeit */
  sources?: { title: string; url: string; versionDate: string }[];
};

/**
 * Mobilfunk-Tarif-Zeile aus XLSX-Import.
 * 
 * SPALTEN-MAPPING (typisch):
 * - A: id (generiert)
 * - B: family ("prime", "smart_business")
 * - C: name ("Business Prime M")
 * - D: minTermMonths (24)
 * - E: base_sim_only_net (42.02)
 * - F-I: sub_*_add_net (Aufschläge)
 * - J: data_de ("50" oder "unlimited")
 * 
 * @example
 * const row: MobileTariffRow = {
 *   id: "PRIME_M",
 *   family: "prime",
 *   name: "Business Prime M",
 *   minTermMonths: 24,
 *   base_sim_only_net: 42.02,
 *   sub_smartphone_add_net: 10,
 *   data_de: 50,
 *   active: true
 * };
 */
export type MobileTariffRow = {
  /** Eindeutige ID (generiert oder aus Spalte) */
  id: string;
  /** Tarif-Familie ("prime", "business_smart", "smart_business") */
  family: string;
  /** Produktlinie (optional, für erweiterte Filterung) */
  productLine?: string;
  /** Anzeigename */
  name: string;
  /** Mindestlaufzeit in Monaten */
  minTermMonths: number;
  /** Basispreis SIM-Only netto */
  base_sim_only_net: number;
  /** Aufschlag Basic Phone */
  sub_basic_add_net?: number | null;
  /** Aufschlag Smartphone */
  sub_smartphone_add_net?: number | null;
  /** Aufschlag Premium Smartphone */
  sub_premium_add_net?: number | null;
  /** Aufschlag Special Premium */
  sub_special_premium_add_net?: number | null;
  /** Datenvolumen ("unlimited" oder GB-Zahl) */
  data_de: string | number;
  /** EU-Roaming Regel-Typ */
  eu_rule: "numeric" | "text";
  /** EU-Roaming GB (wenn numeric) */
  eu_data_gb?: number | null;
  /** EU-Roaming Hinweis (wenn text) */
  eu_note?: string | null;
  /** Anzahl OneNumber-Nummern */
  one_number_count?: number | null;
  /** GigaDepot-Status */
  giga_depot?: string | null;
  /** GigaDepot-Preis (wenn optional) */
  giga_depot_price?: number | null;
  /** Roaming Zone 1 GB */
  roaming_zone1_gb?: number | null;
  /** Roaming Zone 1 Frequenz */
  roaming_zone1_frequency?: string | null;
  /** Sortierreihenfolge */
  sort_order?: number;
  /** Aktiv (inaktive werden nicht importiert) */
  active: boolean;
};

/**
 * Tarif-Feature-Zeile (z.B. "VoLTE inklusive").
 */
export type MobileFeatureRow = {
  /** Referenz auf Tarif-ID */
  tariff_id: string;
  /** Feature-Schlüssel */
  key: string;
  /** Kurzlabel */
  label_short: string;
  /** Detail-Beschreibung */
  label_detail?: string;
  /** Anzeigereihenfolge */
  display_order?: number;
};

/**
 * Tarif-Abhängigkeit (z.B. "TeamDeal erfordert Prime").
 */
export type MobileDependencyRow = {
  /** Referenz auf Tarif-ID */
  tariff_id: string;
  /** Regel-Typ */
  rule_type: "requires_prime_on_account" | "max_contracts" | string;
  /** Regel-Parameter */
  param1?: string;
  /** Fehlermeldung bei Verletzung */
  message?: string;
};

/**
 * Festnetz-Produkt-Zeile aus XLSX-Import.
 * 
 * @example
 * const row: FixedNetProductRow = {
 *   id: "CABLE_100",
 *   access_type: "CABLE",
 *   name: "Red Business Internet & Phone 100 Cable",
 *   minTermMonths: 24,
 *   speed: 100,
 *   monthly_net: 29.32,
 *   router_included: true,
 *   one_time_setup_net: 69.90,
 *   active: true
 * };
 */
export type FixedNetProductRow = {
  /** Eindeutige ID */
  id: string;
  /** Zugangsart (CABLE, DSL, FIBER, KOMFORT) */
  access_type: string;
  /** Variante (optional) */
  variant?: string;
  /** Anzeigename */
  name: string;
  /** Mindestlaufzeit */
  minTermMonths: number;
  /** Geschwindigkeits-Label */
  speed_label?: string;
  /** Geschwindigkeit in Mbit/s */
  speed?: number;
  /** Monatspreis netto */
  monthly_net: number;
  /** Router inklusive? */
  router_included: boolean;
  /** Router-Modell */
  router_model?: string;
  /** Einmalige Setup-Kosten */
  one_time_setup_net: number;
  /** Versandkosten */
  one_time_shipping_net: number;
  /** Feste IP inklusive? */
  fixed_ip_included: boolean;
  /** Feste IP Add-on Preis */
  fixed_ip_addon_net?: number;
  /** Experten-Setup Preis */
  optional_expert_install_net?: number;
  /** Sortierreihenfolge */
  sort_order?: number;
  /** Aktiv */
  active: boolean;
};

/**
 * Hardware-Artikel-Zeile aus XLSX-Import.
 * 
 * PFLICHTFELDER FÜR IMPORT:
 * - brand, model: Für Anzeige
 * - ek_net: Für Margenberechnung
 * - active: true (sonst ignoriert)
 */
export type HardwareItemRow = {
  /** Eindeutige ID */
  id: string;
  /** Hersteller (Apple, Samsung, etc.) */
  brand: string;
  /** Modellbezeichnung */
  model: string;
  /** Kategorie (smartphone, tablet, accessory) */
  category: string;
  /** Einkaufspreis netto - WICHTIG für Marge! */
  ek_net: number;
  /** Bild-URL */
  image_url?: string;
  /** Sortierreihenfolge */
  sort_order?: number;
  /** Aktiv */
  active: boolean;
};

/**
 * Promo-Definition aus XLSX-Import.
 */
export type PromoDefinitionRow = {
  /** Eindeutige ID */
  id: string;
  /** Anzeige-Label */
  label?: string;
  /** Anwendungsbereich */
  applies_to: "mobile" | "fixed" | "both";
  /** Promo-Typ */
  type: "PCT_OFF_BASE" | "ABS_OFF_BASE" | "INTRO_PRICE";
  /** Dauer in Monaten */
  duration_months: number;
  /** Prozentsatz (bei PCT_OFF_BASE) */
  pct?: number;
  /** Absolutbetrag (bei ABS_OFF_BASE) */
  amount_net?: number;
  /** Einführungspreis (bei INTRO_PRICE) */
  intro_net?: number;
  /** Gültig ab */
  valid_from?: string;
  /** Gültig bis */
  valid_until?: string;
  /** Berechtigungshinweis */
  eligibility_note?: string;
};

/**
 * SUB-Varianten-Zeile aus XLSX-Import.
 */
export type SubVariantRow = {
  /** Eindeutige ID (SIM_ONLY, SMARTPHONE, etc.) */
  id: string;
  /** Anzeige-Label */
  label: string;
  /** Monatlicher Aufschlag netto */
  monthly_add_net: number;
};

/**
 * Vollständiges kanonisches Dataset.
 * 
 * STRUKTUR:
 * Enthält alle importierten Zeilen in typisierter Form.
 * Wird vom DataManager in Engine-Catalog transformiert.
 */
export type CanonicalDataset = {
  /** Meta-Informationen */
  meta: DatasetMeta;
  /** Mobilfunk-Tarife */
  mobileTariffs: MobileTariffRow[];
  /** Tarif-Features */
  mobileFeatures: MobileFeatureRow[];
  /** Tarif-Abhängigkeiten */
  mobileDependencies: MobileDependencyRow[];
  /** Festnetz-Produkte */
  fixedNetProducts: FixedNetProductRow[];
  /** Hardware-Katalog */
  hardwareCatalog: HardwareItemRow[];
  /** Promos */
  promos: PromoDefinitionRow[];
  /** SUB-Varianten */
  subVariants: SubVariantRow[];
};

/**
 * Geparste Sheet-Daten vor Transformation.
 * 
 * ZWECK:
 * Zwischenschritt beim XLSX-Import.
 * Enthält Roh-Daten bevor sie in typisierte Rows konvertiert werden.
 */
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
