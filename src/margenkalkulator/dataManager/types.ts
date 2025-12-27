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
  /** FH-Partner-Preis (Phase 2.4) */
  fh_partner_net?: number;
  /** Push-Preis (Phase 2.4) */
  push_net?: number;
  /** OMO-Matrix (Phase 2.4) */
  omo_matrix?: Record<number, number | null>;
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

// ============================================
// IoT / M2M Tarife (NEU)
// ============================================

/**
 * IoT/M2M-Tarif-Zeile aus XLSX-Import.
 * 
 * ANWENDUNGSFÄLLE:
 * - Telematik (Fahrzeug-Tracking)
 * - Smart Meter (Strom/Gas/Wasser)
 * - Industrie 4.0 (Maschinen-Kommunikation)
 * - POS-Terminals (Kartenzahlung)
 * 
 * @example
 * const row: IoTTariffRow = {
 *   id: "IOT_100MB",
 *   name: "IoT Connect 100 MB",
 *   category: "standard",
 *   data_volume_mb: 100,
 *   monthly_net: 2.50,
 *   provision_new: 25,
 *   active: true
 * };
 */
export type IoTTariffRow = {
  /** Eindeutige ID */
  id: string;
  /** Anzeigename */
  name: string;
  /** Kategorie (standard, enterprise, automotive) */
  category: "standard" | "enterprise" | "automotive" | string;
  /** Datenvolumen in MB */
  data_volume_mb: number;
  /** Datenvolumen als Text ("100 MB", "1 GB", "unlimited") */
  data_volume_text?: string;
  /** Monatspreis netto */
  monthly_net: number;
  /** Mindestlaufzeit in Monaten */
  minTermMonths: number;
  /** Überverbrauch pro MB netto (optional) */
  overage_per_mb_net?: number;
  /** Neuvertrag-Provision */
  provision_new: number;
  /** VVL-Provision */
  provision_renewal?: number;
  /** Features als kommaseparierte Liste */
  features?: string;
  /** Typische Anwendungsfälle */
  use_cases?: string;
  /** Sortierreihenfolge */
  sort_order?: number;
  /** Aktiv */
  active: boolean;
};

// ============================================
// VoIP / RingCentral (NEU)
// ============================================

/**
 * VoIP-Produkt-Zeile aus XLSX-Import (RingCentral).
 * 
 * LIZENZMODELL:
 * - Preis pro Benutzer pro Monat
 * - Staffelpreise bei größeren Teams
 * - Jährliche vs. monatliche Abrechnung
 * 
 * @example
 * const row: VoIPProductRow = {
 *   id: "RC_STANDARD_MONTHLY",
 *   name: "RingCentral Standard",
 *   tier: "standard",
 *   price_per_user_net: 14.99,
 *   min_users: 1,
 *   video_conferencing: true,
 *   provision_per_user: 20,
 *   active: true
 * };
 */
export type VoIPProductRow = {
  /** Eindeutige ID */
  id: string;
  /** Anzeigename */
  name: string;
  /** Produktstufe */
  tier: "essentials" | "standard" | "premium" | "ultimate" | string;
  /** Preis pro Benutzer netto */
  price_per_user_net: number;
  /** Mindestanzahl Benutzer */
  min_users: number;
  /** Maximalanzahl Benutzer (optional) */
  max_users?: number;
  /** Mindestlaufzeit in Monaten */
  minTermMonths: number;
  /** Abrechnungszyklus */
  billing_cycle: "monthly" | "annual";
  /** Inklusivminuten Deutschland */
  included_minutes_de?: number | "unlimited";
  /** Inklusivminuten International */
  included_minutes_intl?: number;
  /** Videokonferenz inklusive? */
  video_conferencing: boolean;
  /** Team-Messaging inklusive? */
  team_messaging: boolean;
  /** SMS-Versand möglich? */
  sms_enabled: boolean;
  /** Hardware-Optionen (kommaseparierte IDs) */
  hardware_options?: string;
  /** Features als kommaseparierte Liste */
  features?: string;
  /** Provision pro Benutzer */
  provision_per_user: number;
  /** Einmalige Setup-Provision */
  provision_setup?: number;
  /** Sortierreihenfolge */
  sort_order?: number;
  /** Aktiv */
  active: boolean;
};

/**
 * VoIP-Hardware-Zeile (Telefone, Headsets).
 */
export type VoIPHardwareRow = {
  /** Eindeutige ID */
  id: string;
  /** Hersteller (Poly, Yealink, Jabra) */
  brand: string;
  /** Modell */
  model: string;
  /** Kategorie */
  category: "desk_phone" | "conference_phone" | "headset" | "accessory";
  /** Einkaufspreis netto */
  ek_net: number;
  /** UVP netto */
  uvp_net?: number;
  /** Kompatible Tier-Level (kommasepariert) */
  compatible_tiers?: string;
  /** Features */
  features?: string;
  /** Bild-URL */
  image_url?: string;
  /** Sortierreihenfolge */
  sort_order?: number;
  /** Aktiv */
  active: boolean;
};

// ============================================
// PROVISIONEN (NEU)
// ============================================

/**
 * Provisions-Zeile aus XLSX-Import.
 * 
 * STRUKTUR:
 * - Pro Tarif: Neu- und VVL-Provision
 * - Optional: FH-Partner und Push-Modifikatoren
 * 
 * @example
 * const row: ProvisionRow = {
 *   tariff_id: "PRIME_M",
 *   tariff_type: "mobile",
 *   provision_new_net: 450,
 *   provision_renewal_net: 220,
 *   provision_renewal_pct: 0.49
 * };
 */
export type ProvisionRow = {
  /** Referenz auf Tarif-ID */
  tariff_id: string;
  /** Tarif-Typ für Zuordnung */
  tariff_type: "mobile" | "fixednet" | "iot" | "voip";
  /** Neuvertrag-Provision netto */
  provision_new_net: number;
  /** VVL-Provision netto */
  provision_renewal_net?: number;
  /** VVL als Prozent von Neu (Alternative zu absolutem Wert) */
  provision_renewal_pct?: number;
  /** FH-Partner Modifikator (z.B. 0.95 = 95% der Basis) */
  fh_partner_modifier?: number;
  /** Push-Modifikator */
  push_modifier?: number;
  /** Notizen */
  notes?: string;
};

// ============================================
// OMO-MATRIX (NEU)
// ============================================

/**
 * OMO-Matrix-Zeile aus XLSX-Import.
 * 
 * LOGIK:
 * OMO (Online-Maßnahmen-Optimierung) = Dauerrabatt für Kunden
 * → Reduziert den Tarifpreis
 * → Reduziert die Händler-Provision um festen Betrag
 * 
 * STUFEN: 0%, 5%, 10%, 15%, 17.5%, 20%, 25%
 * 
 * @example
 * const row: OMOMatrixRow = {
 *   tariff_id: "PRIME_M",
 *   omo_0: 0,      // Kein Abzug
 *   omo_5: 15,     // 15€ Abzug bei 5% OMO
 *   omo_10: 30,
 *   omo_15: 45,
 *   omo_17_5: 52.5,
 *   omo_20: 60,
 *   omo_25: 75     // 75€ Abzug bei 25% OMO
 * };
 */
export type OMOMatrixRow = {
  /** Referenz auf Tarif-ID */
  tariff_id: string;
  /** Abzug bei 0% OMO (immer 0, zur Vollständigkeit) */
  omo_0: number;
  /** Abzug bei 5% OMO */
  omo_5: number | null;
  /** Abzug bei 10% OMO */
  omo_10: number | null;
  /** Abzug bei 15% OMO */
  omo_15: number | null;
  /** Abzug bei 17.5% OMO */
  omo_17_5: number | null;
  /** Abzug bei 20% OMO */
  omo_20: number | null;
  /** Abzug bei 25% OMO */
  omo_25: number | null;
  /** Notizen */
  notes?: string;
};

// ============================================
// VOLLSTÄNDIGES CANONICAL DATASET
// ============================================

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
  /** IoT/M2M-Tarife (NEU) */
  iotTariffs: IoTTariffRow[];
  /** VoIP-Produkte (NEU) */
  voipProducts: VoIPProductRow[];
  /** VoIP-Hardware (NEU) */
  voipHardware: VoIPHardwareRow[];
  /** Provisions-Matrix (NEU) */
  provisions: ProvisionRow[];
  /** OMO-Matrix (NEU) */
  omoMatrix: OMOMatrixRow[];
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
  // NEU
  iot_tariffs?: Record<string, unknown>[];
  voip_products?: Record<string, unknown>[];
  voip_hardware?: Record<string, unknown>[];
  provisions?: Record<string, unknown>[];
  omo_matrix?: Record<string, unknown>[];
};
