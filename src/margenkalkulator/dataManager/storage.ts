// ============================================
// Dataset Storage (localStorage)
// ============================================

import type { CanonicalDataset, HardwareItemRow } from "./types";

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

// ============================================
// Partial Update Functions (Hardware-Only)
// ============================================

/**
 * Update only the hardware catalog in the stored dataset.
 * Creates a new dataset if none exists.
 */
export function updateHardwareCatalog(newHardware: HardwareItemRow[]): void {
  const existing = loadCustomDataset() ?? createEmptyDataset();
  
  existing.hardwareCatalog = newHardware;
  existing.meta.datasetVersion = `hardware-update-${Date.now()}`;
  existing.meta.verifiedAtISO = new Date().toISOString().split("T")[0];
  
  saveCustomDataset(existing);
}

/**
 * Reset only the hardware catalog (remove from custom dataset).
 * If no other custom data exists, clears the entire dataset.
 */
export function resetHardwareCatalog(): void {
  const existing = loadCustomDataset();
  if (!existing) return;
  
  // Remove hardware, keep rest
  existing.hardwareCatalog = [];
  existing.meta.datasetVersion = `hardware-reset-${Date.now()}`;
  
  // Check if dataset is now empty
  if (isDatasetEmpty(existing)) {
    clearCustomDataset();
  } else {
    saveCustomDataset(existing);
  }
}

/**
 * Get just the hardware catalog from stored dataset (or empty array)
 */
export function getStoredHardwareCatalog(): HardwareItemRow[] {
  const dataset = loadCustomDataset();
  return dataset?.hardwareCatalog ?? [];
}

/**
 * Check if custom hardware data exists
 */
export function hasCustomHardware(): boolean {
  const dataset = loadCustomDataset();
  return (dataset?.hardwareCatalog?.length ?? 0) > 0;
}

// ============================================
// Helper Functions
// ============================================

function createEmptyDataset(): CanonicalDataset {
  return {
    meta: {
      datasetVersion: "custom-empty",
      validFromISO: new Date().toISOString().split("T")[0],
      verifiedAtISO: new Date().toISOString().split("T")[0],
    },
    mobileTariffs: [],
    mobileFeatures: [],
    mobileDependencies: [],
    fixedNetProducts: [],
    hardwareCatalog: [],
    promos: [],
    subVariants: [],
    // NEU
    iotTariffs: [],
    voipProducts: [],
    voipHardware: [],
    provisions: [],
    omoMatrix: [],
  };
}

function isDatasetEmpty(dataset: CanonicalDataset): boolean {
  return (
    (dataset.mobileTariffs?.length ?? 0) === 0 &&
    (dataset.mobileFeatures?.length ?? 0) === 0 &&
    (dataset.fixedNetProducts?.length ?? 0) === 0 &&
    (dataset.hardwareCatalog?.length ?? 0) === 0 &&
    (dataset.promos?.length ?? 0) === 0 &&
    (dataset.subVariants?.length ?? 0) === 0
  );
}
