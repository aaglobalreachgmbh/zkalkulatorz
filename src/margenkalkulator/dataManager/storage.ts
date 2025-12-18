// ============================================
// Dataset Storage (localStorage)
// ============================================

import type { CanonicalDataset } from "./types";

const STORAGE_KEY = "margenkalkulator_custom_dataset";

export function loadCustomDataset(): CanonicalDataset | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json) as CanonicalDataset;
  } catch (e) {
    console.warn("Failed to load custom dataset from localStorage:", e);
    return null;
  }
}

export function saveCustomDataset(dataset: CanonicalDataset): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
  } catch (e) {
    console.error("Failed to save dataset to localStorage:", e);
    throw new Error("Speichern fehlgeschlagen");
  }
}

export function clearCustomDataset(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasCustomDataset(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function getStoredDatasetVersion(): string | null {
  const dataset = loadCustomDataset();
  return dataset?.meta.datasetVersion ?? null;
}
