// ============================================
// Unit Tests: Employee Deduction Module
// ============================================

import { describe, it, expect } from "vitest";
import { 
  applyEmployeeDeduction, 
  calculateEmployeeDeductionAmount,
  type EmployeeDeductionSettings 
} from "../../engine/calculators/dealer";

// ============================================
// Test: applyEmployeeDeduction
// ============================================

describe("applyEmployeeDeduction", () => {
  describe("fixed deduction", () => {
    it("subtracts fixed amount from provision", () => {
      const settings: EmployeeDeductionSettings = {
        deductionValue: 20,
        deductionType: "fixed",
      };
      expect(applyEmployeeDeduction(400, settings)).toBe(380);
    });

    it("returns 0 when deduction exceeds provision", () => {
      const settings: EmployeeDeductionSettings = {
        deductionValue: 500,
        deductionType: "fixed",
      };
      expect(applyEmployeeDeduction(400, settings)).toBe(0);
    });

    it("returns original provision when deduction is 0", () => {
      const settings: EmployeeDeductionSettings = {
        deductionValue: 0,
        deductionType: "fixed",
      };
      expect(applyEmployeeDeduction(400, settings)).toBe(400);
    });
  });

  describe("percentage deduction", () => {
    it("subtracts percentage from provision", () => {
      const settings: EmployeeDeductionSettings = {
        deductionValue: 10,
        deductionType: "percentage",
      };
      // 400 * 10% = 40, result = 360
      expect(applyEmployeeDeduction(400, settings)).toBe(360);
    });

    it("handles 5% deduction correctly", () => {
      const settings: EmployeeDeductionSettings = {
        deductionValue: 5,
        deductionType: "percentage",
      };
      // 400 * 5% = 20, result = 380
      expect(applyEmployeeDeduction(400, settings)).toBe(380);
    });

    it("returns 0 when percentage is 100%", () => {
      const settings: EmployeeDeductionSettings = {
        deductionValue: 100,
        deductionType: "percentage",
      };
      expect(applyEmployeeDeduction(400, settings)).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("returns original provision when settings is null", () => {
      expect(applyEmployeeDeduction(400, null)).toBe(400);
    });

    it("returns original provision when settings is undefined", () => {
      expect(applyEmployeeDeduction(400, undefined)).toBe(400);
    });

    it("rounds to 2 decimal places", () => {
      const settings: EmployeeDeductionSettings = {
        deductionValue: 7,
        deductionType: "percentage",
      };
      // 333.33 * 7% = 23.3331, result = 310.0069 → 310.01
      const result = applyEmployeeDeduction(333.33, settings);
      expect(result).toBe(310);
    });
  });
});

// ============================================
// Test: calculateEmployeeDeductionAmount
// ============================================

describe("calculateEmployeeDeductionAmount", () => {
  it("returns fixed deduction amount", () => {
    const settings: EmployeeDeductionSettings = {
      deductionValue: 25,
      deductionType: "fixed",
    };
    expect(calculateEmployeeDeductionAmount(400, settings)).toBe(25);
  });

  it("calculates percentage deduction amount", () => {
    const settings: EmployeeDeductionSettings = {
      deductionValue: 10,
      deductionType: "percentage",
    };
    expect(calculateEmployeeDeductionAmount(400, settings)).toBe(40);
  });

  it("caps fixed deduction at provision amount", () => {
    const settings: EmployeeDeductionSettings = {
      deductionValue: 500,
      deductionType: "fixed",
    };
    expect(calculateEmployeeDeductionAmount(400, settings)).toBe(400);
  });

  it("returns 0 for null settings", () => {
    expect(calculateEmployeeDeductionAmount(400, null)).toBe(0);
  });

  it("returns 0 for undefined settings", () => {
    expect(calculateEmployeeDeductionAmount(400, undefined)).toBe(0);
  });

  it("returns 0 when deduction value is 0", () => {
    const settings: EmployeeDeductionSettings = {
      deductionValue: 0,
      deductionType: "fixed",
    };
    expect(calculateEmployeeDeductionAmount(400, settings)).toBe(0);
  });
});
