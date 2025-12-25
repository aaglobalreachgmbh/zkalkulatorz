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

/**
 * OMO-ABZUGSMATRIX
 * Prozentuale Provisionsabzüge bei OMO-Rabatten
 */
export const OMO_MATRIX = {
  /** Kein OMO-Rabatt */
  NONE: 0,
  /** OMO 5% */
  OMO_5: 0.05,
  /** OMO 10% */
  OMO_10: 0.10,
  /** OMO 15% */
  OMO_15: 0.15,
  /** OMO 17,5% */
  OMO_17_5: 0.175,
  /** OMO 20% */
  OMO_20: 0.20,
  /** OMO 25% */
  OMO_25: 0.25,
} as const;

/**
 * Mappt OMO-Rate (0-25) auf den Provisionsabzugsfaktor
 */
export function getOMODeductionFactor(omoRate: number): number {
  return omoRate / 100;
}

/**
 * FESTNETZ-PROVISIONEN
 * Provision nach Produkt-Typ und Vertragsart
 */
export const FIXED_NET_PROVISIONS = {
  // Cable-Produkte
  RBI_CABLE: {
    new: 100,
    renewal: 50,
  },
  RBIP_CABLE: {
    new: 120,
    renewal: 60,
  },
  // DSL-Produkte
  DSL: {
    new: 80,
    renewal: 40,
  },
  // Glasfaser
  FIBER: {
    new: 150,
    renewal: 75,
  },
  // Komfort-Anschluss
  KOMFORT: {
    new: 100,
    renewal: 50,
  },
} as const;

/**
 * MARGEN-SCHWELLENWERTE
 * Für den diskreten Marge-Indikator
 */
export const MARGIN_THRESHOLDS = {
  /** Marge gilt als gut (grün) */
  GOOD: 100,
  /** Marge gilt als neutral (gelb) bei >= 0 */
  NEUTRAL: 0,
  // Unter 0 = negativ (rot)
} as const;
