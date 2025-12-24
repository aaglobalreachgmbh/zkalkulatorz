// ============================================
// MargenKalkulator - Zentrale Konfiguration
// Alle Magic Numbers an einem Ort
// ============================================

/**
 * STEUERN & ABGABEN
 * Basis für alle Brutto-Berechnungen
 */
export const TAX = {
  /** Deutsche Mehrwertsteuer als Dezimalzahl */
  VAT_RATE: 0.19,
} as const;

/**
 * VERTRAGSLAUFZEITEN
 * Standard-Laufzeiten für Kalkulationen
 */
export const TERM = {
  /** Standard-Vertragslaufzeit in Monaten */
  DEFAULT_MONTHS: 24,
  /** Flex-Tarife Mindestlaufzeit */
  FLEX_MONTHS: 1,
  /** Standard-Amortisationszeitraum für Hardware */
  AMORT_MONTHS: 24,
} as const;

/**
 * WÄHRUNG
 */
export const CURRENCY = {
  /** ISO-Code der Währung */
  DEFAULT: "EUR" as const,
} as const;

/**
 * FESTNETZ-GEBÜHREN
 * Einmalkosten für Anschluss und Services
 */
export const FIXED_NET_FEES = {
  /** Bereitstellungsentgelt (netto) */
  SETUP_NET: 19.90,
  /** Versandkosten Hardware (netto) */
  SHIPPING_NET: 8.40,
  /** Experten-Einrichtung vor Ort (netto) */
  EXPERT_SETUP_NET: 89.99,
  /** Feste IP Zusatzkosten pro Monat (netto) */
  FIXED_IP_ADDON_NET: 5.00,
} as const;

/**
 * GIGAKOMBI
 * Konvergenz-Rabatte bei Festnetz + Mobilfunk
 */
export const GIGAKOMBI = {
  /** Monatlicher Rabatt auf Mobilfunk (netto) */
  DISCOUNT_NET: 5.00,
} as const;

/**
 * TEAMDEAL FALLBACK
 * Smart Business Plus Konditionen ohne Prime
 */
export const TEAMDEAL_FALLBACK = {
  /** Monatlicher Preis ohne Prime (netto) */
  PRICE_NET: 13,
  /** Datenvolumen in GB */
  DATA_GB: 1,
} as const;

/**
 * DATASET-VERSIONEN
 * Unterstützte Tarif-Generationen
 */
export const DATASETS = {
  /** Aktuelle Business-Version */
  CURRENT: "business-2025-09" as const,
  /** Dummy-Version für Tests */
  DUMMY: "dummy-v0" as const,
} as const;
