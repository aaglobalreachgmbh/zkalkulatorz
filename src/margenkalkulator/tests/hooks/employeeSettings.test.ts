// ============================================
// Unit Tests: Employee Settings Utilities
// ============================================

import { describe, it, expect } from "vitest";
import { applyEmployeeDeduction, isTariffBlocked, type EmployeeSettings } from "@/margenkalkulator/hooks/useEmployeeSettings";

// Helper to create test settings
function createSettings(overrides: Partial<EmployeeSettings> = {}): EmployeeSettings {
  return {
    id: "1",
    userId: "u1",
    tenantId: "t1",
    provisionDeduction: 0,
    provisionDeductionType: "fixed",
    blockedTariffs: [],
    featureOverrides: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// Test: applyEmployeeDeduction
// ============================================

describe("applyEmployeeDeduction", () => {
  it("applies fixed deduction correctly", () => {
    const settings = createSettings({ provisionDeduction: 30, provisionDeductionType: "fixed" });
    expect(applyEmployeeDeduction(400, settings)).toBe(370);
  });

  it("applies percentage deduction correctly", () => {
    const settings = createSettings({ provisionDeduction: 10, provisionDeductionType: "percent" });
    expect(applyEmployeeDeduction(400, settings)).toBe(360);
  });

  it("returns original provision when settings is null", () => {
    expect(applyEmployeeDeduction(400, null)).toBe(400);
  });

  it("returns original provision when deduction is 0", () => {
    const settings = createSettings({ provisionDeduction: 0 });
    expect(applyEmployeeDeduction(400, settings)).toBe(400);
  });

  it("clamps result to 0 (never negative)", () => {
    const settings = createSettings({ provisionDeduction: 500, provisionDeductionType: "fixed" });
    expect(applyEmployeeDeduction(400, settings)).toBe(0);
  });
});

// ============================================
// Test: isTariffBlocked
// ============================================

describe("isTariffBlocked", () => {
  it("returns true when tariff is in blocked list", () => {
    const settings = createSettings({ blockedTariffs: ["PRIME_XL", "PRIME_L"] });
    expect(isTariffBlocked("PRIME_XL", settings)).toBe(true);
    expect(isTariffBlocked("PRIME_L", settings)).toBe(true);
  });

  it("returns false when tariff is not in blocked list", () => {
    const settings = createSettings({ blockedTariffs: ["PRIME_XL"] });
    expect(isTariffBlocked("PRIME_M", settings)).toBe(false);
  });

  it("returns false when blocked_tariffs is empty", () => {
    const settings = createSettings({ blockedTariffs: [] });
    expect(isTariffBlocked("PRIME_M", settings)).toBe(false);
  });

  it("returns false when settings is null", () => {
    expect(isTariffBlocked("PRIME_M", null)).toBe(false);
  });
});
