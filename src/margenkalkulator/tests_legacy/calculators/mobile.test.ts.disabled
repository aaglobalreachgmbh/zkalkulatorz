// ============================================
// Unit Tests: Mobile Calculator Module
// ============================================

import { describe, it, expect } from "vitest";
import { calculateMobileBaseForMonth, calculateMobileMonthlyForMonth } from "../../engine/calculators/mobile";
import type { MobileTariff, Promo, SubVariant } from "../../engine/types";
import { TEAMDEAL_FALLBACK } from "../../config";

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
  deductionRate: 0.08,
  features: ["50 GB Daten", "EU-Roaming"],
};

const teamDealTariff: MobileTariff = {
  id: "TD_M",
  family: "teamdeal",
  tier: "M",
  name: "TeamDeal M",
  baseNet: 20,
  dataVolumeGB: "unlimited",
  provisionBase: 200,
  deductionRate: 0.08,
  features: ["Unlimited Data"],
};

const noPromo: Promo = {
  id: "NONE",
  label: "Keine Aktion",
  type: "NONE",
  value: 0,
  durationMonths: 0,
};

const introPromo: Promo = {
  id: "INTRO",
  label: "Einführungspreis",
  type: "INTRO_PRICE",
  value: 19.99,
  durationMonths: 6,
};

const pctPromo: Promo = {
  id: "PCT50",
  label: "50% Rabatt",
  type: "PCT_OFF_BASE",
  value: 0.5,
  durationMonths: 3,
};

const absPromo: Promo = {
  id: "ABS5",
  label: "5€ Rabatt",
  type: "ABS_OFF_BASE",
  value: 0,
  amountNetPerMonth: 5,
  durationMonths: 6,
};

const expiredPromo: Promo = {
  id: "EXPIRED",
  label: "Abgelaufene Aktion",
  type: "INTRO_PRICE",
  value: 9.99,
  durationMonths: 12,
  validFromISO: "2024-01-01",
  validUntilISO: "2024-12-31",
};

const simOnlyVariant: SubVariant = {
  id: "SIM_ONLY",
  label: "SIM-Only",
  monthlyAddNet: 0,
};

const hardwareVariant: SubVariant = {
  id: "WITH_HW",
  label: "Mit Hardware",
  monthlyAddNet: 10,
};

// ============================================
// Test: calculateMobileBaseForMonth
// ============================================

describe("calculateMobileBaseForMonth", () => {
  it("returns baseNet when no promo", () => {
    expect(calculateMobileBaseForMonth(baseTariff, noPromo, 1)).toBe(35);
    expect(calculateMobileBaseForMonth(baseTariff, noPromo, 12)).toBe(35);
    expect(calculateMobileBaseForMonth(baseTariff, noPromo, 24)).toBe(35);
  });

  it("applies INTRO_PRICE during promo period", () => {
    expect(calculateMobileBaseForMonth(baseTariff, introPromo, 1)).toBe(19.99);
    expect(calculateMobileBaseForMonth(baseTariff, introPromo, 6)).toBe(19.99);
  });

  it("reverts to baseNet after INTRO_PRICE promo period", () => {
    expect(calculateMobileBaseForMonth(baseTariff, introPromo, 7)).toBe(35);
    expect(calculateMobileBaseForMonth(baseTariff, introPromo, 24)).toBe(35);
  });

  it("applies PCT_OFF_BASE correctly", () => {
    // 50% off 35€ = 17.50€
    expect(calculateMobileBaseForMonth(baseTariff, pctPromo, 1)).toBe(17.5);
    expect(calculateMobileBaseForMonth(baseTariff, pctPromo, 3)).toBe(17.5);
  });

  it("reverts to baseNet after PCT_OFF_BASE promo period", () => {
    expect(calculateMobileBaseForMonth(baseTariff, pctPromo, 4)).toBe(35);
  });

  it("applies ABS_OFF_BASE correctly", () => {
    // 35€ - 5€ = 30€
    expect(calculateMobileBaseForMonth(baseTariff, absPromo, 1)).toBe(30);
    expect(calculateMobileBaseForMonth(baseTariff, absPromo, 6)).toBe(30);
  });

  it("clamps ABS_OFF_BASE at 0 (no negative prices)", () => {
    const bigAbsPromo: Promo = {
      id: "ABS50",
      label: "50€ Rabatt",
      type: "ABS_OFF_BASE",
      value: 0,
      amountNetPerMonth: 50,
      durationMonths: 6,
    };
    expect(calculateMobileBaseForMonth(baseTariff, bigAbsPromo, 1)).toBe(0);
  });

  it("returns baseNet for expired promo (time-based validity)", () => {
    // Promo expired 2024-12-31, asOfISO is 2025-01-15
    expect(calculateMobileBaseForMonth(baseTariff, expiredPromo, 1, "2025-01-15")).toBe(35);
  });

  it("applies promo when within validity period", () => {
    const validPromo: Promo = {
      id: "VALID",
      label: "Gültige Aktion",
      type: "INTRO_PRICE",
      value: 9.99,
      durationMonths: 6,
      validFromISO: "2025-01-01",
      validUntilISO: "2025-12-31",
    };
    expect(calculateMobileBaseForMonth(baseTariff, validPromo, 1, "2025-06-15")).toBe(9.99);
  });
});

// ============================================
// Test: calculateMobileMonthlyForMonth
// ============================================

describe("calculateMobileMonthlyForMonth", () => {
  it("adds SUB variant cost to base price", () => {
    // 35€ base + 10€ SUB add-on = 45€
    const result = calculateMobileMonthlyForMonth(
      baseTariff,
      hardwareVariant,
      noPromo,
      1,
      1
    );
    expect(result).toBe(45);
  });

  it("returns base price for SIM-Only variant", () => {
    const result = calculateMobileMonthlyForMonth(
      baseTariff,
      simOnlyVariant,
      noPromo,
      1,
      1
    );
    expect(result).toBe(35);
  });

  it("multiplies by quantity", () => {
    // (35€ + 10€) * 5 = 225€
    const result = calculateMobileMonthlyForMonth(
      baseTariff,
      hardwareVariant,
      noPromo,
      5,
      1
    );
    expect(result).toBe(225);
  });

  it("applies promo only to base, not SUB add-on", () => {
    // INTRO_PRICE: 19.99€ base + 10€ SUB = 29.99€
    const result = calculateMobileMonthlyForMonth(
      baseTariff,
      hardwareVariant,
      introPromo,
      1,
      1
    );
    expect(result).toBeCloseTo(29.99);
  });

  it("uses TeamDeal fallback when primeOnAccount=false", () => {
    // Fallback: 13€ + 0€ SUB = 13€
    const result = calculateMobileMonthlyForMonth(
      teamDealTariff,
      simOnlyVariant,
      noPromo,
      1,
      1,
      undefined,
      false
    );
    expect(result).toBe(TEAMDEAL_FALLBACK.PRICE_NET);
  });

  it("uses TeamDeal base price when primeOnAccount=true", () => {
    const result = calculateMobileMonthlyForMonth(
      teamDealTariff,
      simOnlyVariant,
      noPromo,
      1,
      1,
      undefined,
      true
    );
    expect(result).toBe(20);
  });

  it("calculates correctly over multiple months", () => {
    // Month 1-6: 19.99€ + 10€ = 29.99€
    // Month 7+: 35€ + 10€ = 45€
    expect(
      calculateMobileMonthlyForMonth(baseTariff, hardwareVariant, introPromo, 1, 1)
    ).toBeCloseTo(29.99);
    expect(
      calculateMobileMonthlyForMonth(baseTariff, hardwareVariant, introPromo, 1, 6)
    ).toBeCloseTo(29.99);
    expect(
      calculateMobileMonthlyForMonth(baseTariff, hardwareVariant, introPromo, 1, 7)
    ).toBe(45);
  });
});
