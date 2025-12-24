// ============================================
// Unit Tests: Hardware Calculator Module
// ============================================

import { describe, it, expect } from "vitest";
import { calculateHardwareAmortization } from "../../engine/calculators/hardware";

// ============================================
// Test: calculateHardwareAmortization
// ============================================

describe("calculateHardwareAmortization", () => {
  describe("returns 0 when amortization disabled", () => {
    it("returns 0 when amortize is false", () => {
      expect(calculateHardwareAmortization(240, false, 24)).toBe(0);
    });

    it("returns 0 when ekNet is 0", () => {
      expect(calculateHardwareAmortization(0, true, 24)).toBe(0);
    });

    it("returns 0 when ekNet is negative", () => {
      expect(calculateHardwareAmortization(-100, true, 24)).toBe(0);
    });

    it("returns 0 when amortMonths is 0", () => {
      expect(calculateHardwareAmortization(240, true, 0)).toBe(0);
    });

    it("returns 0 when amortMonths is negative", () => {
      expect(calculateHardwareAmortization(240, true, -12)).toBe(0);
    });
  });

  describe("calculates amortization correctly", () => {
    it("divides ekNet by amortMonths", () => {
      // 240€ / 24 months = 10€/month
      expect(calculateHardwareAmortization(240, true, 24)).toBe(10);
    });

    it("handles 12-month amortization", () => {
      // 240€ / 12 months = 20€/month
      expect(calculateHardwareAmortization(240, true, 12)).toBe(20);
    });

    it("handles single month amortization", () => {
      // 240€ / 1 month = 240€/month
      expect(calculateHardwareAmortization(240, true, 1)).toBe(240);
    });
  });

  describe("rounding behavior", () => {
    it("rounds to 2 decimal places", () => {
      // 100€ / 3 months = 33.333... → 33.33
      expect(calculateHardwareAmortization(100, true, 3)).toBe(33.33);
    });

    it("rounds 0.005 correctly", () => {
      // 1€ / 200 months = 0.005 → 0.01 (rounds up)
      expect(calculateHardwareAmortization(1, true, 200)).toBe(0.01);
    });

    it("handles large amounts", () => {
      // 1200€ / 24 months = 50€/month
      expect(calculateHardwareAmortization(1200, true, 24)).toBe(50);
    });

    it("handles fractional amounts", () => {
      // 999.99€ / 24 months = 41.66625 → 41.67
      expect(calculateHardwareAmortization(999.99, true, 24)).toBe(41.67);
    });
  });

  describe("edge cases", () => {
    it("handles very small amounts", () => {
      // 0.01€ / 24 months = 0.000416... → 0
      expect(calculateHardwareAmortization(0.01, true, 24)).toBe(0);
    });

    it("handles large month counts", () => {
      // 1200€ / 120 months (10 years) = 10€/month
      expect(calculateHardwareAmortization(1200, true, 120)).toBe(10);
    });
  });
});
