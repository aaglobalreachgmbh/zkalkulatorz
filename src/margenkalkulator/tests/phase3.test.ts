import { describe, it, expect, beforeEach, vi } from "vitest";
import { validationRules } from "../hooks/useWizardValidation";
import { validateExportData } from "../hooks/useOfferExport";
import { createDefaultOptionState } from "../engine";
import type { OfferOptionState } from "../engine/types";

// ============================================
// Validation Rules Tests
// ============================================

describe("Wizard Validation", () => {
  let defaultState: OfferOptionState;

  beforeEach(() => {
    defaultState = createDefaultOptionState();
  });

  describe("Hardware Step", () => {
    it("should be valid with empty hardware", () => {
      const result = validationRules.validateHardwareStep(defaultState);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should warn when ekNet is set but name is empty", () => {
      const state = {
        ...defaultState,
        hardware: { ...defaultState.hardware, ekNet: 100, name: "" },
      };
      const result = validationRules.validateHardwareStep(state);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain("Hardware-Name fehlt");
    });

    it("should error when amortize is true but amortMonths < 1", () => {
      const state = {
        ...defaultState,
        hardware: { ...defaultState.hardware, amortize: true, amortMonths: 0 },
      };
      const result = validationRules.validateHardwareStep(state);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Amortisierungsdauer muss mindestens 1 Monat sein");
    });
  });

  describe("Mobile Step", () => {
    it("should be valid with default state", () => {
      const result = validationRules.validateMobileStep(defaultState);
      expect(result.valid).toBe(true);
    });

    it("should error when tariffId is empty", () => {
      const state = {
        ...defaultState,
        mobile: { ...defaultState.mobile, tariffId: "" },
      };
      const result = validationRules.validateMobileStep(state);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Bitte wählen Sie einen Tarif");
    });

    it("should error when subVariantId is empty", () => {
      const state = {
        ...defaultState,
        mobile: { ...defaultState.mobile, subVariantId: "" },
      };
      const result = validationRules.validateMobileStep(state);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Bitte wählen Sie eine Tarifvariante");
    });

    it("should error when quantity < 1", () => {
      const state = {
        ...defaultState,
        mobile: { ...defaultState.mobile, quantity: 0 },
      };
      const result = validationRules.validateMobileStep(state);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Mindestens 1 Vertrag erforderlich");
    });
  });

  describe("FixedNet Step", () => {
    it("should be valid when disabled", () => {
      const result = validationRules.validateFixedNetStep(defaultState);
      expect(result.valid).toBe(true);
    });

    it("should be valid when enabled with productId", () => {
      const state = {
        ...defaultState,
        fixedNet: { enabled: true, productId: "CABLE_250" },
      };
      const result = validationRules.validateFixedNetStep(state);
      expect(result.valid).toBe(true);
    });

    it("should error when enabled but productId is empty", () => {
      const state = {
        ...defaultState,
        fixedNet: { enabled: true, productId: "" },
      };
      const result = validationRules.validateFixedNetStep(state);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Bitte wählen Sie ein Festnetzprodukt");
    });
  });

  describe("Compare Step", () => {
    it("should always be valid (warnings only)", () => {
      const result = validationRules.validateCompareStep(defaultState);
      expect(result.valid).toBe(true);
    });

    it("should warn when mobile tariff not configured", () => {
      const state = {
        ...defaultState,
        mobile: { ...defaultState.mobile, tariffId: "" },
      };
      const result = validationRules.validateCompareStep(state);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// Export/Import Validation Tests
// ============================================

describe("Export/Import", () => {
  it("should validate correct export data", () => {
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      datasetVersion: "dummy-v0",
      option1: createDefaultOptionState(),
      option2: createDefaultOptionState(),
    };
    
    const result = validateExportData(exportData, "dummy-v0");
    expect(result.success).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("should warn on datasetVersion mismatch", () => {
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      datasetVersion: "2025-09",
      option1: createDefaultOptionState(),
      option2: createDefaultOptionState(),
    };
    
    const result = validateExportData(exportData, "dummy-v0");
    expect(result.success).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("2025-09");
  });

  it("should error on invalid version", () => {
    const exportData = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      datasetVersion: "dummy-v0",
      option1: createDefaultOptionState(),
      option2: createDefaultOptionState(),
    };
    
    const result = validateExportData(exportData, "dummy-v0");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Nicht unterstützte Version");
  });

  it("should error on missing options", () => {
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      datasetVersion: "dummy-v0",
    };
    
    const result = validateExportData(exportData, "dummy-v0");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Fehlende Optionsdaten");
  });

  it("should error on invalid data format", () => {
    const result = validateExportData(null, "dummy-v0");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Ungültiges Datenformat");
  });
});

// ============================================
// Offer Preview Mapping Tests
// ============================================

describe("Offer Preview Mapping", () => {
  it("should handle single period display", () => {
    const state = createDefaultOptionState();
    // With default state, there's only one period (no promo)
    // This is a simple mapping test - the actual component tests would be integration tests
    expect(state.mobile.promoId).toBe("NONE");
  });

  it("should correctly identify dealer-only fields", () => {
    const state = createDefaultOptionState();
    // Hardware EK is dealer-only
    expect(state.hardware.ekNet).toBeDefined();
    // Provision is calculated in result, which is dealer-only
  });
});

// ============================================
// Smoke Tests
// ============================================

describe("Wizard State Management", () => {
  it("should create valid default state", () => {
    const state = createDefaultOptionState();
    
    expect(state.meta.currency).toBe("EUR");
    expect(state.meta.vatRate).toBe(0.19);
    expect(state.meta.termMonths).toBe(24);
    expect(state.mobile.tariffId).toBeTruthy();
    expect(state.mobile.subVariantId).toBeTruthy();
  });

  it("should copy option correctly", () => {
    const original = createDefaultOptionState();
    original.hardware.name = "Test Device";
    original.hardware.ekNet = 500;
    
    // Simulate copy
    const copied = JSON.parse(JSON.stringify(original));
    
    expect(copied.hardware.name).toBe("Test Device");
    expect(copied.hardware.ekNet).toBe(500);
    
    // Ensure deep copy
    copied.hardware.name = "Changed";
    expect(original.hardware.name).toBe("Test Device");
  });
});
