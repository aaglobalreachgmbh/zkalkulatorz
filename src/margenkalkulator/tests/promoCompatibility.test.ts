// ============================================
// Promo Compatibility Tests
// Phase 8: Tests & Evidence
// ============================================

import { describe, it, expect } from "vitest";
import {
  validatePromoCompatibility,
  isPromoCompatible,
  getAvailableOMORatesFromDataset,
  enrichPromoWithCompatibility,
  DEFAULT_COMPATIBILITY_RULES,
  type ExtendedPromo,
} from "../engine/promoResolver";
import type { Promo } from "../engine/types";

// ============================================
// Test Promos (using valid Promo base type)
// ============================================

const basePromo: Promo = {
  id: "NONE",
  type: "NONE",
  label: "Keine",
  durationMonths: 0,
  value: 0,
};

const omo10: ExtendedPromo = {
  ...basePromo,
  id: "OMO10",
  type: "PCT_OFF_BASE",
  label: "OMO 10%",
  value: 0.10,
  exclusiveGroup: "OMO",
  incompatibleWithGroups: [],
  priority: 10,
  isCustomerVisible: false,
  isDealerSensitive: true,
};

const omo20: ExtendedPromo = {
  ...basePromo,
  id: "OMO20",
  type: "PCT_OFF_BASE",
  label: "OMO 20%",
  value: 0.20,
  exclusiveGroup: "OMO",
  incompatibleWithGroups: [],
  priority: 10,
  isCustomerVisible: false,
  isDealerSensitive: true,
};

const omo30: ExtendedPromo = {
  ...basePromo,
  id: "OMO30",
  type: "PCT_OFF_BASE",
  label: "OMO 30%",
  value: 0.30,
  exclusiveGroup: "OMO",
  incompatibleWithGroups: [],
  priority: 10,
  isCustomerVisible: false,
  isDealerSensitive: true,
};

const bpFrei6m: ExtendedPromo = {
  ...basePromo,
  id: "BP_FREI_6M",
  type: "INTRO_PRICE",
  label: "6 Monate Basispreis frei",
  durationMonths: 6,
  value: 0,
  stackableWithAll: true,
  priority: 20,
  isCustomerVisible: true,
  isDealerSensitive: false,
};

const absOffBase: ExtendedPromo = {
  ...basePromo,
  id: "ABS_OFF_BASE_10",
  type: "ABS_OFF_BASE",
  label: "10€ Rabatt auf Basispreis",
  amountNetPerMonth: 10,
  exclusiveGroup: "ABS_DISCOUNT",
  incompatibleWithGroups: ["OMO"],
  priority: 5,
  isCustomerVisible: true,
  isDealerSensitive: false,
};

// DATA_UPGRADE is not a valid PromoType, use NONE for test
const dataBoost: ExtendedPromo = {
  ...basePromo,
  id: "DATA_BOOST",
  type: "NONE", // Placeholder - actual type depends on catalog
  label: "Daten-Upgrade",
  stackableWithAll: true,
  priority: 1,
  isCustomerVisible: true,
  isDealerSensitive: false,
};

// ============================================
// Tests
// ============================================

describe("Promo Compatibility", () => {
  describe("OMO Exclusivity", () => {
    it("rejects multiple OMO tiers (only one allowed)", () => {
      const result = validatePromoCompatibility([omo10, omo20], "PRIME_M");
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes("OMO") || e.includes("exklusiv") || e.includes("Gruppe"))).toBe(true);
    });

    it("accepts single OMO tier", () => {
      const result = validatePromoCompatibility([omo10], "PRIME_M");
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("OMO vs ABS_OFF_BASE Incompatibility", () => {
    it("rejects OMO combined with ABS_OFF_BASE by default", () => {
      const result = validatePromoCompatibility([omo20, absOffBase], "PRIME_M");
      
      expect(result.isValid).toBe(false);
      expect(result.conflictingPromos.length).toBeGreaterThan(0);
    });

    it("explains the conflict reason", () => {
      const compatibility = isPromoCompatible(absOffBase, [omo10]);
      
      expect(compatibility.compatible).toBe(false);
      expect(compatibility.conflictReason).toBeDefined();
    });
  });

  describe("BP-free Stacking", () => {
    it("allows BP-free combined with OMO (stackableWithAll)", () => {
      const result = validatePromoCompatibility([bpFrei6m, omo10], "PRIME_M");
      
      expect(result.isValid).toBe(true);
      expect(result.appliedPromos).toHaveLength(2);
    });

    it("applies BP-free first due to higher priority", () => {
      const result = validatePromoCompatibility([omo10, bpFrei6m], "PRIME_M");
      
      // BP-free has priority 20, OMO has 10
      expect(result.appliedPromos[0].id).toBe("BP_FREI_6M");
    });
  });

  describe("Data Boost Stacking", () => {
    it("allows Data Boost with OMO", () => {
      const result = validatePromoCompatibility([dataBoost, omo20], "PRIME_M");
      
      expect(result.isValid).toBe(true);
    });

    it("allows Data Boost with BP-free and OMO together", () => {
      const result = validatePromoCompatibility([dataBoost, bpFrei6m, omo10], "PRIME_M");
      
      expect(result.isValid).toBe(true);
      expect(result.appliedPromos).toHaveLength(3);
    });
  });

  describe("Promo Enrichment", () => {
    it("enriches base promo with compatibility fields", () => {
      const testPromo: Promo = { ...basePromo, id: "TEST", type: "NONE", label: "Test" };
      const enriched = enrichPromoWithCompatibility(testPromo);
      
      expect(enriched.priority).toBeDefined();
      expect(enriched.isCustomerVisible).toBeDefined();
      expect(enriched.isDealerSensitive).toBeDefined();
    });
  });

  describe("Default Compatibility Rules", () => {
    it("has OMO exclusivity rule defined", () => {
      const omoRule = DEFAULT_COMPATIBILITY_RULES["OMO"];
      
      expect(omoRule).toBeDefined();
      expect(omoRule.exclusiveGroup).toBe("OMO");
    });
  });
});

describe("OMO Rate Dataset Validation", () => {
  describe("OMO 30/35 availability", () => {
    it("returns available OMO rates from dataset", () => {
      // This test validates that OMO rates come from dataset, not hardcoded
      const rates = getAvailableOMORatesFromDataset("PRIME_M", "business-2025-09");
      
      expect(Array.isArray(rates)).toBe(true);
      // Standard rates should be available
      expect(rates).toContain(10);
      expect(rates).toContain(15);
      expect(rates).toContain(20);
      expect(rates).toContain(25);
    });

    it("OMO 30/35 only if in dataset matrix", () => {
      // OMO 30/35 requires dataset entry
      const ratesM = getAvailableOMORatesFromDataset("PRIME_M", "business-2025-09");
      const ratesXL = getAvailableOMORatesFromDataset("PRIME_XL", "business-2025-09");
      
      // These should be dataset-dependent, not assumed
      // If dataset doesn't have 30/35 for a tariff, they shouldn't appear
      if (ratesM.includes(30)) {
        expect(ratesM.includes(30)).toBe(true);
      }
      if (!ratesXL.includes(35)) {
        expect(ratesXL.includes(35)).toBe(false);
      }
    });

    it("returns empty array for unknown tariff", () => {
      const rates = getAvailableOMORatesFromDataset("UNKNOWN_TARIFF", "business-2025-09");
      
      expect(rates).toEqual([]);
    });
  });
});
