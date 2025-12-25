// ============================================
// History Storage - Auto-Save Last 10
// ============================================

import type { OfferOptionState } from "../engine/types";
import type { HistoryEntry } from "./types";
import { STORAGE_KEYS, STORAGE_LIMITS } from "./types";

/**
 * Generiert eine eindeutige ID
 */
function generateId(): string {
  return `h-${Date.now().toString(36)}`;
}

/**
 * Erstellt Kurzbeschreibung aus Config
 */
function createSummary(config: OfferOptionState): string {
  const parts: string[] = [];
  
  if (config.hardware.name && config.hardware.ekNet > 0) {
    parts.push(config.hardware.name);
  } else {
    parts.push("SIM Only");
  }
  
  if (config.mobile.tariffId) {
    parts.push(config.mobile.tariffId.replace(/_/g, " "));
  }
  
  if (config.fixedNet.enabled) {
    parts.push("+ Festnetz");
  }
  
  return parts.join(" • ");
}

/**
 * Lädt History aus localStorage
 */
export function loadHistory(): HistoryEntry[] {
  try {
    const json = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!json) return [];
    return JSON.parse(json) as HistoryEntry[];
  } catch (e) {
    console.warn("Failed to load history:", e);
    return [];
  }
}

/**
 * Speichert History-Array
 */
function saveHistory(history: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save history:", e);
  }
}

/**
 * Fügt Eintrag zum Verlauf hinzu
 * Nur wenn sich die Konfiguration geändert hat
 */
export function addToHistory(config: OfferOptionState): void {
  const history = loadHistory();
  
  // Prüfe ob identisch zum letzten Eintrag
  if (history.length > 0) {
    const last = history[0];
    if (JSON.stringify(last.config) === JSON.stringify(config)) {
      return; // Keine Änderung
    }
  }
  
  const entry: HistoryEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    summary: createSummary(config),
    config,
  };
  
  // Add at start
  history.unshift(entry);
  
  // Limit
  if (history.length > STORAGE_LIMITS.MAX_HISTORY) {
    history.splice(STORAGE_LIMITS.MAX_HISTORY);
  }
  
  saveHistory(history);
}

/**
 * Lädt letzten Verlaufs-Eintrag
 */
export function getLastHistoryEntry(): HistoryEntry | null {
  const history = loadHistory();
  return history[0] ?? null;
}

/**
 * Löscht Verlauf
 */
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
}

/**
 * Prüft ob Verlauf existiert
 */
export function hasHistory(): boolean {
  return loadHistory().length > 0;
}
