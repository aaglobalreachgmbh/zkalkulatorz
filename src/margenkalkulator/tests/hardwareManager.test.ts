// ============================================
// Hardware Manager Unit Tests
// ============================================

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  validateHardwareRows,
  diffHardware,
} from "../dataManager/importers/hardwareImporter";
import {
  updateHardwareCatalog,
  resetHardwareCatalog,
  loadCustomDataset,
  clearCustomDataset,
  getStoredHardwareCatalog,
  hasCustomHardware,
} from "../dataManager/storage";
import type { HardwareItemRow } from "../dataManager/types";

// ============================================
// Test Data
// ============================================

const sampleHardware: HardwareItemRow[] = [
  { id: "iphone_16", brand: "Apple", model: "iPhone 16", category: "smartphone", ek_net: 779, sort_order: 10, active: true },
  { id: "samsung_s24", brand: "Samsung", model: "Galaxy S24", category: "smartphone", ek_net: 649, sort_order: 20, active: true },
  { id: "pixel_9", brand: "Google", model: "Pixel 9", category: "smartphone", ek_net: 599, sort_order: 30, active: true },
];

// ============================================
// Validation Tests
// ============================================

describe("validateHardwareRows", () => {
  it("validates correct hardware rows", () => {
    const result = validateHardwareRows(sampleHardware);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects missing required fields", () => {
    const invalidRows: HardwareItemRow[] = [
      { id: "", brand: "Apple", model: "iPhone", category: "smartphone", ek_net: 799, sort_order: 10, active: true },
      { id: "test", brand: "", model: "Test", category: "smartphone", ek_net: 100, sort_order: 20, active: true },
      { id: "test2", brand: "Brand", model: "", category: "smartphone", ek_net: 100, sort_order: 30, active: true },
    ];
    
    const result = validateHardwareRows(invalidRows);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("detects duplicate IDs", () => {
    const duplicateRows: HardwareItemRow[] = [
      { id: "same_id", brand: "Apple", model: "iPhone 16", category: "smartphone", ek_net: 779, sort_order: 10, active: true },
      { id: "same_id", brand: "Samsung", model: "Galaxy S24", category: "smartphone", ek_net: 649, sort_order: 20, active: true },
    ];
    
    const result = validateHardwareRows(duplicateRows);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.message.includes("Doppelte ID"))).toBe(true);
  });

  it("detects negative prices", () => {
    const negativePrice: HardwareItemRow[] = [
      { id: "test", brand: "Apple", model: "iPhone", category: "smartphone", ek_net: -100, sort_order: 10, active: true },
    ];
    
    const result = validateHardwareRows(negativePrice);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.message.includes("Negativ"))).toBe(true);
  });

  it("warns about very high prices", () => {
    const highPrice: HardwareItemRow[] = [
      { id: "expensive", brand: "Apple", model: "Mac Pro", category: "smartphone", ek_net: 5000, sort_order: 10, active: true },
    ];
    
    const result = validateHardwareRows(highPrice);
    expect(result.isValid).toBe(true); // Not an error, just warning
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

// ============================================
// Diff Tests
// ============================================

describe("diffHardware", () => {
  it("identifies added items", () => {
    const current: HardwareItemRow[] = [
      { id: "iphone_16", brand: "Apple", model: "iPhone 16", category: "smartphone", ek_net: 779, sort_order: 10, active: true },
    ];
    const next: HardwareItemRow[] = [
      { id: "iphone_16", brand: "Apple", model: "iPhone 16", category: "smartphone", ek_net: 779, sort_order: 10, active: true },
      { id: "pixel_9", brand: "Google", model: "Pixel 9", category: "smartphone", ek_net: 599, sort_order: 20, active: true },
    ];
    
    const diff = diffHardware(current, next);
    expect(diff.summary.added).toBe(1);
    expect(diff.summary.changed).toBe(0);
    expect(diff.summary.removed).toBe(0);
    expect(diff.items.find(i => i.id === "pixel_9")?.type).toBe("added");
  });

  it("identifies removed items", () => {
    const current: HardwareItemRow[] = [
      { id: "iphone_16", brand: "Apple", model: "iPhone 16", category: "smartphone", ek_net: 779, sort_order: 10, active: true },
      { id: "pixel_9", brand: "Google", model: "Pixel 9", category: "smartphone", ek_net: 599, sort_order: 20, active: true },
    ];
    const next: HardwareItemRow[] = [
      { id: "iphone_16", brand: "Apple", model: "iPhone 16", category: "smartphone", ek_net: 779, sort_order: 10, active: true },
    ];
    
    const diff = diffHardware(current, next);
    expect(diff.summary.added).toBe(0);
    expect(diff.summary.changed).toBe(0);
    expect(diff.summary.removed).toBe(1);
    expect(diff.items.find(i => i.id === "pixel_9")?.type).toBe("removed");
  });

  it("identifies changed items (price update)", () => {
    const current: HardwareItemRow[] = [
      { id: "iphone_16", brand: "Apple", model: "iPhone 16", category: "smartphone", ek_net: 779, sort_order: 10, active: true },
    ];
    const next: HardwareItemRow[] = [
      { id: "iphone_16", brand: "Apple", model: "iPhone 16", category: "smartphone", ek_net: 749, sort_order: 10, active: true },
    ];
    
    const diff = diffHardware(current, next);
    expect(diff.summary.added).toBe(0);
    expect(diff.summary.changed).toBe(1);
    expect(diff.summary.removed).toBe(0);
    
    const changed = diff.items.find(i => i.id === "iphone_16");
    expect(changed?.type).toBe("changed");
    expect(changed?.oldEkNet).toBe(779);
    expect(changed?.newEkNet).toBe(749);
  });

  it("handles complex diff with multiple changes", () => {
    const current: HardwareItemRow[] = [
      { id: "iphone_16", brand: "Apple", model: "iPhone 16", category: "smartphone", ek_net: 779, sort_order: 10, active: true },
      { id: "samsung_s24", brand: "Samsung", model: "Galaxy S24", category: "smartphone", ek_net: 649, sort_order: 20, active: true },
      { id: "to_remove", brand: "Old", model: "Device", category: "smartphone", ek_net: 100, sort_order: 99, active: true },
    ];
    const next: HardwareItemRow[] = [
      { id: "iphone_16", brand: "Apple", model: "iPhone 16 Pro", category: "smartphone", ek_net: 899, sort_order: 10, active: true }, // changed
      { id: "samsung_s24", brand: "Samsung", model: "Galaxy S24", category: "smartphone", ek_net: 649, sort_order: 20, active: true }, // unchanged
      { id: "new_device", brand: "Xiaomi", model: "14T", category: "smartphone", ek_net: 499, sort_order: 30, active: true }, // added
    ];
    
    const diff = diffHardware(current, next);
    expect(diff.summary.added).toBe(1);
    expect(diff.summary.changed).toBe(1);
    expect(diff.summary.removed).toBe(1);
  });
});

// ============================================
// Storage Tests
// ============================================

describe("Hardware Storage", () => {
  beforeEach(() => {
    clearCustomDataset();
  });
  
  afterEach(() => {
    clearCustomDataset();
  });

  it("updateHardwareCatalog merges with existing dataset", () => {
    // Initially no custom dataset
    expect(hasCustomHardware()).toBe(false);
    
    // Add hardware
    updateHardwareCatalog(sampleHardware);
    
    // Verify
    expect(hasCustomHardware()).toBe(true);
    const stored = getStoredHardwareCatalog();
    expect(stored).toHaveLength(3);
    expect(stored.find(h => h.id === "iphone_16")).toBeDefined();
  });

  it("resetHardwareCatalog preserves other data", () => {
    // First add hardware
    updateHardwareCatalog(sampleHardware);
    expect(hasCustomHardware()).toBe(true);
    
    // Reset hardware
    resetHardwareCatalog();
    
    // Hardware should be cleared
    expect(getStoredHardwareCatalog()).toHaveLength(0);
  });

  it("preserves dataset meta after hardware update", () => {
    updateHardwareCatalog(sampleHardware);
    
    const dataset = loadCustomDataset();
    expect(dataset).not.toBeNull();
    expect(dataset?.meta.datasetVersion).toContain("hardware-update-");
    expect(dataset?.meta.validFromISO).toBeDefined();
  });
});
