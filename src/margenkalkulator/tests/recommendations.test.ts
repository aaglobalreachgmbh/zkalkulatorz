// ============================================
// Recommendation Engine Tests
// Phase 8: Tests & Evidence
// ============================================

import { describe, it, expect } from "vitest";
import {
  generateRecommendations,
  getMaxMarginRecommendation,
  getBestPriceRecommendation,
  compareWithRecommendations,
  type TariffRecommendation,
} from "../engine/recommendationEngine";
import { createDefaultOptionState } from "../engine";
import type { OfferOptionState } from "../engine/types";

// ============================================
// Test Config
// ============================================

function createTestConfig(): OfferOptionState {
  return {
    ...createDefaultOptionState(),
    meta: {
      ...createDefaultOptionState().meta,
      datasetVersion: "business-2025-09",
    },
    mobile: {
      tariffId: "PRIME_S",
      subVariantId: "SIM_ONLY",
      promoId: "NONE",
      contractType: "new",
      quantity: 1,
    },
    hardware: {
      name: "",
      ekNet: 0,
      amortize: false,
      amortMonths: 24,
    },
  };
}

// ============================================
// Tests
// ============================================

describe("Recommendation Engine", () => {
  describe("generateRecommendations", () => {
    it("returns up to maxResults recommendations", () => {
      const config = createTestConfig();
      const recs = generateRecommendations(config, "margin", { maxResults: 3 });
      
      expect(recs.length).toBeLessThanOrEqual(3);
    });

    it("returns top 3 sorted by margin score (descending)", () => {
      const config = createTestConfig();
      const recs = generateRecommendations(config, "margin", { maxResults: 3 });
      
      if (recs.length >= 2) {
        expect(recs[0].scores.marginScore).toBeGreaterThanOrEqual(recs[1].scores.marginScore);
      }
      if (recs.length >= 3) {
        expect(recs[1].scores.marginScore).toBeGreaterThanOrEqual(recs[2].scores.marginScore);
      }
    });

    it("excludes negative margin candidates by default", () => {
      const config = createTestConfig();
      // Add expensive hardware to test negative margin filtering
      config.hardware.ekNet = 500;
      
      const recs = generateRecommendations(config, "margin", { 
        excludeNegativeMargin: true,
        maxResults: 10,
      });
      
      recs.forEach(r => {
        expect(r.calculatedResult.dealer.margin).toBeGreaterThanOrEqual(0);
      });
    });

    it("includes negative margin candidates when disabled", () => {
      const config = createTestConfig();
      config.hardware.ekNet = 800; // Very expensive hardware
      
      const recs = generateRecommendations(config, "margin", { 
        excludeNegativeMargin: false,
        maxResults: 10,
      });
      
      // Should have some candidates (may include negative)
      expect(recs.length).toBeGreaterThan(0);
    });

    it("assigns ranks correctly (1, 2, 3...)", () => {
      const config = createTestConfig();
      const recs = generateRecommendations(config, "margin", { maxResults: 5 });
      
      recs.forEach((rec, index) => {
        expect(rec.rank).toBe(index + 1);
      });
    });

    it("generates explanation for each recommendation", () => {
      const config = createTestConfig();
      const recs = generateRecommendations(config, "margin", { maxResults: 3 });
      
      recs.forEach(rec => {
        expect(rec.explanation).toBeDefined();
        expect(typeof rec.explanation).toBe("string");
        expect(rec.explanation.length).toBeGreaterThan(0);
      });
    });

    it("calculates marginDelta relative to base config", () => {
      const config = createTestConfig();
      const recs = generateRecommendations(config, "margin", { 
        maxResults: 3,
        includeCurrentConfig: false,
      });
      
      recs.forEach(rec => {
        expect(typeof rec.marginDelta).toBe("number");
      });
    });
  });

  describe("Price-based recommendations", () => {
    it("returns recommendations sorted by price score", () => {
      const config = createTestConfig();
      const recs = generateRecommendations(config, "customerPrice", { maxResults: 3 });
      
      if (recs.length >= 2) {
        expect(recs[0].scores.priceScore).toBeGreaterThanOrEqual(recs[1].scores.priceScore);
      }
    });
  });

  describe("Balanced recommendations", () => {
    it("returns recommendations sorted by balanced score", () => {
      const config = createTestConfig();
      const recs = generateRecommendations(config, "balanced", { maxResults: 3 });
      
      if (recs.length >= 2) {
        expect(recs[0].scores.balancedScore).toBeGreaterThanOrEqual(recs[1].scores.balancedScore);
      }
    });
  });

  describe("Quick recommendation helpers", () => {
    it("getMaxMarginRecommendation returns single best margin option", () => {
      const config = createTestConfig();
      const rec = getMaxMarginRecommendation(config);
      
      if (rec) {
        expect(rec.rank).toBe(1);
        expect(rec.calculatedResult.dealer.margin).toBeDefined();
      }
    });

    it("getBestPriceRecommendation returns single best price option", () => {
      const config = createTestConfig();
      const rec = getBestPriceRecommendation(config);
      
      if (rec) {
        expect(rec.rank).toBe(1);
        expect(rec.calculatedResult.totals.avgTermNet).toBeDefined();
      }
    });
  });

  describe("compareWithRecommendations", () => {
    it("returns current result and recommendations", () => {
      const config = createTestConfig();
      const comparison = compareWithRecommendations(config, 3);
      
      expect(comparison.current).toBeDefined();
      expect(comparison.recommendations).toBeDefined();
      expect(Array.isArray(comparison.recommendations)).toBe(true);
    });

    it("calculates potential margin gain", () => {
      const config = createTestConfig();
      const comparison = compareWithRecommendations(config, 3);
      
      expect(typeof comparison.potentialMarginGain).toBe("number");
      expect(comparison.potentialMarginGain).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Edge cases", () => {
    it("handles empty dataset gracefully", () => {
      const config = createTestConfig();
      config.meta.datasetVersion = "dummy-v0"; // Fallback dataset
      
      const recs = generateRecommendations(config, "margin");
      
      // Should not throw, return array (may be empty)
      expect(Array.isArray(recs)).toBe(true);
    });

    it("filters same product line when requested", () => {
      const config = createTestConfig();
      config.mobile.tariffId = "PRIME_M";
      
      const recs = generateRecommendations(config, "margin", {
        sameProductLineOnly: true,
        maxResults: 10,
      });
      
      // All recommendations should be from PRIME line
      recs.forEach(rec => {
        expect(rec.tariffId.startsWith("PRIME")).toBe(true);
      });
    });
  });
});
