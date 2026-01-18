// ============================================
// Storage Types - Drafts & History
// ============================================

import type { OfferOptionState } from "../engine/types";

/**
 * Preview data for offer list
 */
export interface OfferPreview {
  hardware: string;
  tariff: string;
  avgMonthly: number;
  quantity: number;
}

/**
 * Gespeicherter Angebots-Entwurf (lokale Version)
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
  preview: OfferPreview;
}

/**
 * Offer status types
 */
export type OfferStatus = "offen" | "gesendet" | "angenommen" | "abgelehnt";

/**
 * Cloud-gespeichertes Angebot (mit DB-Feldern)
 */
export interface CloudOffer {
  id: string;
  user_id: string;
  name: string;
  config: OfferOptionState;
  preview: OfferPreview | null;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  customer_id: string | null;
  team_id: string | null;
  visibility: "private" | "team";
  dataset_version_id: string | null;
  status: OfferStatus;
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
 * Storage Keys (base keys, will be scoped by identity)
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

/**
 * Legacy storage key (for migration of unscoped data)
 */
export const LEGACY_STORAGE_PREFIX = "margenkalkulator_" as const;
