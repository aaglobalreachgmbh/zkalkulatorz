// ============================================
// Draft Storage - localStorage CRUD
// ============================================

import type { OfferOptionState } from "../engine/types";
import type { OfferDraft } from "./types";
import { STORAGE_KEYS, STORAGE_LIMITS } from "./types";

/**
 * Generiert eine eindeutige ID
 */
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Erstellt Vorschau-Daten aus Config
 */
function createPreview(config: OfferOptionState, avgMonthly: number): OfferDraft["preview"] {
  return {
    hardware: config.hardware.name || "SIM Only",
    tariff: config.mobile.tariffId || "Kein Tarif",
    avgMonthly,
    quantity: config.mobile.quantity,
  };
}

/**
 * Lädt alle Drafts aus localStorage
 */
export function loadDrafts(): OfferDraft[] {
  try {
    const json = localStorage.getItem(STORAGE_KEYS.DRAFTS);
    if (!json) return [];
    return JSON.parse(json) as OfferDraft[];
  } catch (e) {
    console.warn("Failed to load drafts:", e);
    return [];
  }
}

/**
 * Speichert Draft-Array
 */
function saveDrafts(drafts: OfferDraft[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
  } catch (e) {
    console.error("Failed to save drafts:", e);
    throw new Error("Speichern fehlgeschlagen");
  }
}

/**
 * Erstellt neuen Draft
 */
export function createDraft(
  name: string,
  config: OfferOptionState,
  avgMonthly: number
): OfferDraft {
  const drafts = loadDrafts();
  const now = new Date().toISOString();
  
  const draft: OfferDraft = {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    config,
    preview: createPreview(config, avgMonthly),
  };
  
  // Add new draft at start
  drafts.unshift(draft);
  
  // Limit to max drafts
  if (drafts.length > STORAGE_LIMITS.MAX_DRAFTS) {
    drafts.splice(STORAGE_LIMITS.MAX_DRAFTS);
  }
  
  saveDrafts(drafts);
  return draft;
}

/**
 * Aktualisiert bestehenden Draft
 */
export function updateDraft(
  id: string,
  config: OfferOptionState,
  avgMonthly: number
): OfferDraft | null {
  const drafts = loadDrafts();
  const index = drafts.findIndex((d) => d.id === id);
  
  if (index === -1) return null;
  
  drafts[index] = {
    ...drafts[index],
    updatedAt: new Date().toISOString(),
    config,
    preview: createPreview(config, avgMonthly),
  };
  
  saveDrafts(drafts);
  return drafts[index];
}

/**
 * Löscht Draft
 */
export function deleteDraft(id: string): boolean {
  const drafts = loadDrafts();
  const filtered = drafts.filter((d) => d.id !== id);
  
  if (filtered.length === drafts.length) return false;
  
  saveDrafts(filtered);
  return true;
}

/**
 * Findet Draft by ID
 */
export function getDraft(id: string): OfferDraft | null {
  const drafts = loadDrafts();
  return drafts.find((d) => d.id === id) ?? null;
}

/**
 * Löscht alle Drafts
 */
export function clearDrafts(): void {
  localStorage.removeItem(STORAGE_KEYS.DRAFTS);
}

/**
 * Prüft ob Drafts existieren
 */
export function hasDrafts(): boolean {
  return loadDrafts().length > 0;
}
