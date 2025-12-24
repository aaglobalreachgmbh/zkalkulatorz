// ============================================
// Unit Tests: Dealer Calculator Module
// ============================================

import { describe, it, expect } from "vitest";
import { getOMODeduction, calculateDealerEconomics, calculateDealerEconomicsLegacy } from "../../engine/calculators/dealer";
import type { MobileTariff } from "../../engine/types";

// ============================================
// Test Fixtures
// ============================================

const baseTariff: MobileTariff = {
  id: "PRIME_M",
  family: "prime",
  tier: "M",
  name: "Business Prime M",
  baseNet: 35,
  dataVolumeGB: 20,
  provisionBase: 400,
  provisionRenewal: 200,
  deductionRate: 0.08,
  omoDeduction: 50,
  features: ["50 GB Daten", "EU-Roaming"],
};

const tariffWithoutRenewal: MobileTariff = {
  id: "PRIME_S",
  family: "prime",
  tier: "S",
  name: "Business Prime S",
  baseNet: 25,
  dataVolumeGB: 10,
  provisionBase: 300,
  deductionRate: 0.08,
  features: ["20 GB Daten"],
};

// ============================================
// Test: getOMODeduction
// ============================================

describe("getOMODeduction", () => {
  it("returns 0 when promoId is not OMO25", () => {
    expect(getOMODeduction(baseTariff, "NONE")).toBe(0);
    expect(getOMODeduction(baseTariff, "INTRO")).toBe(0);
    expect(getOMODeduction(baseTariff, "")).toBe(0);
  });

  it("returns omoDeduction when promoId is OMO25", () => {
    expect(getOMODeduction(baseTariff, "OMO25")).toBe(50);
  });

  it("returns 0 when tariff is undefined", () => {
    expect(getOMODeduction(undefined, "OMO25")).toBe(0);
  });

  it("returns 0 when tariff has no omoDeduction", () => {
    expect(getOMODeduction(tariffWithoutRenewal, "OMO25")).toBe(0);
  });
});

// ============================================
// Test: calculateDealerEconomics
// ============================================

describe("calculateDealerEconomics", () => {
  describe("provision calculation", () => {
    it("uses provisionBase for new contracts", () => {
      const result = calculateDealerEconomics(baseTariff, "new", 1, 0);
      expect(result.provisionBase).toBe(400);
    });

    it("uses provisionRenewal for renewals when available", () => {
      const result = calculateDealerEconomics(baseTariff, "renewal", 1, 0);
      expect(result.provisionBase).toBe(200);
    });

    it("falls back to provisionBase for renewals when provisionRenewal not defined", () => {
      const result = calculateDealerEconomics(tariffWithoutRenewal, "renewal", 1, 0);
      expect(result.provisionBase).toBe(300);
    });

    it("multiplies provision by quantity", () => {
      const result = calculateDealerEconomics(baseTariff, "new", 5, 0);
      expect(result.provisionBase).toBe(2000);
    });
  });

  describe("deduction calculation", () => {
    it("applies deduction rate correctly", () => {
      // 400 * 0.08 = 32
      const result = calculateDealerEconomics(baseTariff, "new", 1, 0);
      expect(result.deductions).toBe(32);
    });

    it("adds OMO25 deduction when applicable", () => {
      // Base deduction: 400 * 0.08 = 32
      // OMO deduction: 50
      // Total: 82
      const result = calculateDealerEconomics(baseTariff, "new", 1, 0, "OMO25");
      expect(result.deductions).toBe(82);
    });

    it("scales OMO25 deduction by quantity", () => {
      // Base deduction: 2000 * 0.08 = 160
      // OMO deduction: 50 * 5 = 250
      // Total: 410
      const result = calculateDealerEconomics(baseTariff, "new", 5, 0, "OMO25");
      expect(result.deductions).toBe(410);
    });
  });

  describe("provisionAfter calculation", () => {
    it("calculates provisionAfter correctly", () => {
      // 400 - 32 = 368
      const result = calculateDealerEconomics(baseTariff, "new", 1, 0);
      expect(result.provisionAfter).toBe(368);
    });

    it("clamps provisionAfter at 0 (never negative)", () => {
      const lowTariff: MobileTariff = {
        id: "LOW",
        family: "prime",
        tier: "XS",
        name: "Low Tariff",
        baseNet: 10,
        dataVolumeGB: 1,
        provisionBase: 50,
        deductionRate: 0.9, // 90% deduction
        omoDeduction: 100, // More than provision
        features: ["Minimal"],
      };
      const result = calculateDealerEconomics(lowTariff, "new", 1, 0, "OMO25");
      expect(result.provisionAfter).toBe(0);
    });
  });

  describe("margin calculation", () => {
    it("calculates margin as provisionAfter minus hardwareEkNet", () => {
      // provisionAfter: 368, hardwareEkNet: 200
      // margin: 168
      const result = calculateDealerEconomics(baseTariff, "new", 1, 200);
      expect(result.margin).toBe(168);
    });

    it("allows negative margin", () => {
      // provisionAfter: 368, hardwareEkNet: 800
      // margin: -432
      const result = calculateDealerEconomics(baseTariff, "new", 1, 800);
      expect(result.margin).toBe(-432);
    });

    it("returns negative margin equal to hardwareEkNet when tariff undefined", () => {
      const result = calculateDealerEconomics(undefined, "new", 1, 500);
      expect(result.margin).toBe(-500);
    });
  });

  describe("undefined tariff handling", () => {
    it("returns safe defaults when tariff is undefined", () => {
      const result = calculateDealerEconomics(undefined, "new", 5, 300);
      expect(result.provisionBase).toBe(0);
      expect(result.deductions).toBe(0);
      expect(result.provisionAfter).toBe(0);
      expect(result.hardwareEkNet).toBe(300);
      expect(result.margin).toBe(-300);
    });
  });

  describe("rounding", () => {
    it("rounds margin to 2 decimal places", () => {
      const oddTariff: MobileTariff = {
        id: "ODD",
        family: "prime",
        tier: "M",
        name: "Odd Tariff",
        baseNet: 33.33,
        dataVolumeGB: 15,
        provisionBase: 333.33,
        deductionRate: 0.08,
        features: ["Test"],
      };
      const result = calculateDealerEconomics(oddTariff, "new", 1, 100);
      // Should be rounded to 2 decimals
      expect(result.margin).toBe(Math.round((333.33 * 0.92 - 100) * 100) / 100);
    });
  });
});

// ============================================
// Test: calculateDealerEconomicsLegacy
// ============================================

describe("calculateDealerEconomicsLegacy", () => {
  it("uses new contract type and NONE promo as defaults", () => {
    const legacy = calculateDealerEconomicsLegacy(baseTariff, 1, 200);
    const modern = calculateDealerEconomics(baseTariff, "new", 1, 200, "NONE");
    
    expect(legacy).toEqual(modern);
  });
});
