// ============================================
// Unit Tests: OMO-Matrix Source-of-Truth Logic
// ============================================

import { describe, it, expect } from "vitest";
import {
  getProvisionFromOMOMatrix,
  calculateDealerEconomics,
  getFHPartnerBonus,
} from "../../engine/calculators/dealer";
import type { MobileTariff } from "../../engine/types";

// ============================================
// Test Fixtures
// ============================================

const tariffWithMatrix: MobileTariff = {
  id: "PRIME_M_MATRIX",
  family: "prime",
  tier: "M",
  name: "Business Prime M (mit OMO-Matrix)",
  baseNet: 35,
  dataVolumeGB: 20,
  provisionBase: 350,
  provisionRenewal: 175,
  deductionRate: 0.08,
  omoMatrix: {
    0: 350,    // Keine Ermäßigung
    5: 332,    // 5% OMO
    10: 315,   // 10% OMO
    15: null,  // GESPERRT
    17.5: 289, // 17.5% OMO
    20: 280,   // 20% OMO
    25: 262,   // 25% OMO
  },
  omoMatrixRenewal: {
    0: 175,
    5: 166,
    10: 157,
    15: null,
    17.5: 144,
    20: 140,
    25: 131,
  },
  fhPartnerNet: 25,
  features: ["50 GB Daten", "EU-Roaming"],
};

const tariffWithoutMatrix: MobileTariff = {
  id: "PRIME_S_NO_MATRIX",
  family: "prime",
  tier: "S",
  name: "Business Prime S (ohne OMO-Matrix)",
  baseNet: 25,
  dataVolumeGB: 10,
  provisionBase: 300,
  provisionRenewal: 150,
  deductionRate: 0.08,
  // KEINE omoMatrix → Fallback auf prozentuale Berechnung
  features: ["20 GB Daten"],
};

// ============================================
// Test: getProvisionFromOMOMatrix
// ============================================

describe("getProvisionFromOMOMatrix", () => {
  describe("Matrix Source-of-Truth", () => {
    it("returns matrix value for OMO 0%", () => {
      const result = getProvisionFromOMOMatrix(tariffWithMatrix, 0, "new");
      expect(result?.source).toBe("matrix");
      expect(result?.provision).toBe(350);
    });

    it("returns matrix value for OMO 25%", () => {
      const result = getProvisionFromOMOMatrix(tariffWithMatrix, 25, "new");
      expect(result?.source).toBe("matrix");
      expect(result?.provision).toBe(262);
    });

    it("returns undefined for locked OMO rate (15%)", () => {
      const result = getProvisionFromOMOMatrix(tariffWithMatrix, 15, "new");
      expect(result).toBeUndefined();
    });

    it("uses omoMatrixRenewal for renewals", () => {
      const result = getProvisionFromOMOMatrix(tariffWithMatrix, 25, "renewal");
      expect(result?.source).toBe("matrix");
      expect(result?.provision).toBe(131);
    });
  });

  describe("Fallback to Percentage Calculation", () => {
    it("calculates percentage when no matrix exists", () => {
      const result = getProvisionFromOMOMatrix(tariffWithoutMatrix, 25, "new");
      expect(result?.source).toBe("calculated");
      // 300 * (1 - 0.25) = 225
      expect(result?.provision).toBe(225);
    });

    it("returns full provision for 0% when no matrix", () => {
      const result = getProvisionFromOMOMatrix(tariffWithoutMatrix, 0, "new");
      expect(result?.source).toBe("calculated");
      expect(result?.provision).toBe(300);
    });

    it("calculates percentage for renewals without matrix", () => {
      const result = getProvisionFromOMOMatrix(tariffWithoutMatrix, 10, "renewal");
      expect(result?.source).toBe("calculated");
      // 150 * (1 - 0.10) = 135
      expect(result?.provision).toBe(135);
    });
  });

  describe("Edge Cases", () => {
    it("returns undefined for undefined tariff", () => {
      const result = getProvisionFromOMOMatrix(undefined, 10, "new");
      expect(result).toBeUndefined();
    });
  });
});

// ============================================
// Test: calculateDealerEconomics with OMO-Matrix
// ============================================

describe("calculateDealerEconomics with OMO-Matrix", () => {
  describe("Matrix as Source-of-Truth", () => {
    it("uses matrix value directly (no additional deduction)", () => {
      const result = calculateDealerEconomics(
        tariffWithMatrix,
        "new",
        1,
        0,
        "NONE",
        { omoRate: 25 }
      );
      
      // Matrix sagt 262€ → das IST die Provision (kein zusätzlicher Abzug)
      expect(result.provisionBase).toBe(262);
      expect(result.deductions).toBe(0);
      expect(result.provisionAfter).toBe(262);
      expect(result.omoSource).toBe("matrix");
    });

    it("multiplies matrix value by quantity", () => {
      const result = calculateDealerEconomics(
        tariffWithMatrix,
        "new",
        5,
        0,
        "NONE",
        { omoRate: 25 }
      );
      
      // 262€ * 5 = 1310€
      expect(result.provisionBase).toBe(1310);
      expect(result.provisionAfter).toBe(1310);
    });

    it("returns 0 provision for locked OMO rate", () => {
      const result = calculateDealerEconomics(
        tariffWithMatrix,
        "new",
        1,
        0,
        "NONE",
        { omoRate: 15 }
      );
      
      // Matrix[15] = null → gesperrt
      expect(result.provisionBase).toBe(0);
      expect(result.provisionAfter).toBe(0);
    });

    it("calculates margin correctly with matrix value", () => {
      const result = calculateDealerEconomics(
        tariffWithMatrix,
        "new",
        1,
        200,
        "NONE",
        { omoRate: 25 }
      );
      
      // Provision: 262€, Hardware: 200€ → Margin: 62€
      expect(result.margin).toBe(62);
    });
  });

  describe("Fallback to Percentage Calculation", () => {
    it("applies deductionRate when no matrix", () => {
      const result = calculateDealerEconomics(
        tariffWithoutMatrix,
        "new",
        1,
        0,
        "NONE",
        { omoRate: 25 }
      );
      
      // Fallback: 300 * 0.75 = 225, dann deductionRate: 225 * 0.08 = 18
      // provisionAfter = 225 - 18 = 207
      expect(result.omoSource).toBe("calculated");
      expect(result.provisionBase).toBe(225);
      expect(result.deductions).toBe(18);
      expect(result.provisionAfter).toBe(207);
    });
  });

  describe("FH-Partner Bonus", () => {
    it("adds FH-Partner bonus to provision", () => {
      const result = calculateDealerEconomics(
        tariffWithMatrix,
        "new",
        1,
        0,
        "NONE",
        { omoRate: 0, isFHPartner: true }
      );
      
      // Matrix[0] = 350€, FH-Bonus = 25€
      expect(result.provisionAfter).toBe(375);
      expect(result.fhPartnerBonus).toBe(25);
    });

    it("scales FH-Partner bonus by quantity", () => {
      const result = calculateDealerEconomics(
        tariffWithMatrix,
        "new",
        3,
        0,
        "NONE",
        { omoRate: 0, isFHPartner: true }
      );
      
      // Matrix[0] = 350€ * 3 = 1050€, FH-Bonus = 25€ * 3 = 75€
      expect(result.provisionAfter).toBe(1125);
      expect(result.fhPartnerBonus).toBe(75);
    });

    it("does not add FH-Partner bonus when flag is false", () => {
      const result = calculateDealerEconomics(
        tariffWithMatrix,
        "new",
        1,
        0,
        "NONE",
        { omoRate: 0, isFHPartner: false }
      );
      
      expect(result.provisionAfter).toBe(350);
      expect(result.fhPartnerBonus).toBeUndefined();
    });
  });

  describe("Combined: OMO-Matrix + FH-Partner + Hardware", () => {
    it("calculates complete dealer economics correctly", () => {
      const result = calculateDealerEconomics(
        tariffWithMatrix,
        "new",
        2,
        500,
        "NONE",
        { omoRate: 25, isFHPartner: true }
      );
      
      // Matrix[25] = 262€ * 2 = 524€
      // FH-Bonus = 25€ * 2 = 50€
      // provisionAfter = 524 + 50 = 574€
      // margin = 574 - 500 = 74€
      expect(result.provisionBase).toBe(524);
      expect(result.fhPartnerBonus).toBe(50);
      expect(result.provisionAfter).toBe(574);
      expect(result.margin).toBe(74);
    });
  });
});

// ============================================
// Test: getFHPartnerBonus
// ============================================

describe("getFHPartnerBonus", () => {
  it("returns bonus when isFHPartner is true", () => {
    expect(getFHPartnerBonus(tariffWithMatrix, true)).toBe(25);
  });

  it("returns 0 when isFHPartner is false", () => {
    expect(getFHPartnerBonus(tariffWithMatrix, false)).toBe(0);
  });

  it("returns 0 when tariff has no fhPartnerNet", () => {
    expect(getFHPartnerBonus(tariffWithoutMatrix, true)).toBe(0);
  });

  it("returns 0 when tariff is undefined", () => {
    expect(getFHPartnerBonus(undefined, true)).toBe(0);
  });
});
