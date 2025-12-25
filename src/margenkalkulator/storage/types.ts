// ============================================
// Storage Types - Drafts & History
// ============================================

import type { OfferOptionState } from "../engine/types";

/**
 * Gespeicherter Angebots-Entwurf
 */
export interface OfferDraft {
  /** Eindeutige ID */
  id: string;
  /** Benutzerdefinierter Name */
  name: string;
  /** Erstellungsdatum ISO */
  createdAt: string;
  /** Letzte Änderung ISO */
  updatedAt: string;
  /** Vollständige Konfiguration */
  config: OfferOptionState;
  /** Vorschau-Daten für Liste */
  preview: {
    hardware: string;
    tariff: string;
    avgMonthly: number;
    quantity: number;
  };
}

/**
 * Automatisch gespeicherter Verlaufs-Eintrag
 */
export interface HistoryEntry {
  /** Eindeutige ID */
  id: string;
  /** Timestamp ISO */
  timestamp: string;
  /** Kurzbeschreibung */
  summary: string;
  /** Konfiguration */
  config: OfferOptionState;
}

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  DRAFTS: "margenkalkulator_drafts",
  HISTORY: "margenkalkulator_history",
} as const;

/**
 * Limits
 */
export const STORAGE_LIMITS = {
  MAX_DRAFTS: 20,
  MAX_HISTORY: 10,
} as const;
