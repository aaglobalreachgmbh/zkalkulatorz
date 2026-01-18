// ============================================
// Unit Tests: Promo Calculator Module
// ============================================

import { describe, it, expect } from "vitest";
import { isPromoValid, isFixedPromoValid, resolveTeamDealPricing } from "../../engine/calculators/promo";
import type { Promo, MobileTariff } from "../../engine/types";
import { TEAMDEAL_FALLBACK } from "../../config";

// ============================================
// Test: isPromoValid
// ============================================

describe("isPromoValid", () => {
  it("returns true for undefined promo", () => {
    expect(isPromoValid(undefined, "2025-01-15")).toBe(true);
  });

  it("returns true for NONE type promo", () => {
    const promo: Promo = {
      id: "NONE",
      label: "Keine Aktion",
      type: "NONE",
      value: 0,
      durationMonths: 0,
    };
    expect(isPromoValid(promo, "2025-01-15")).toBe(true);
  });

  it("returns true for promo without validity dates", () => {
    const promo: Promo = {
      id: "TEST",
      label: "Test Promo",
      type: "INTRO_PRICE",
      value: 10,
      durationMonths: 6,
    };
    expect(isPromoValid(promo, "2025-01-15")).toBe(true);
  });

  it("returns true when asOfISO is within validity period", () => {
    const promo: Promo = {
      id: "TEST",
      label: "Test Promo",
      type: "INTRO_PRICE",
      value: 10,
      durationMonths: 6,
      validFromISO: "2025-01-01",
      validUntilISO: "2025-12-31",
    };
    expect(isPromoValid(promo, "2025-06-15")).toBe(true);
  });

  it("returns false when asOfISO is before validFrom", () => {
    const promo: Promo = {
      id: "TEST",
      label: "Test Promo",
      type: "INTRO_PRICE",
      value: 10,
      durationMonths: 6,
      validFromISO: "2025-01-01",
      validUntilISO: "2025-12-31",
    };
    expect(isPromoValid(promo, "2024-12-31")).toBe(false);
  });

  it("returns false when asOfISO is after validUntil", () => {
    const promo: Promo = {
      id: "TEST",
      label: "Test Promo",
      type: "INTRO_PRICE",
      value: 10,
      durationMonths: 6,
      validFromISO: "2025-01-01",
      validUntilISO: "2025-12-31",
    };
    expect(isPromoValid(promo, "2026-01-01")).toBe(false);
  });

  it("returns true when asOfISO is on validFrom boundary", () => {
    const promo: Promo = {
      id: "TEST",
      label: "Test Promo",
      type: "INTRO_PRICE",
      value: 10,
      durationMonths: 6,
      validFromISO: "2025-01-01",
      validUntilISO: "2025-12-31",
    };
    expect(isPromoValid(promo, "2025-01-01")).toBe(true);
  });

  it("returns true when asOfISO is on validUntil boundary", () => {
    const promo: Promo = {
      id: "TEST",
      label: "Test Promo",
      type: "INTRO_PRICE",
      value: 10,
      durationMonths: 6,
      validFromISO: "2025-01-01",
      validUntilISO: "2025-12-31",
    };
    expect(isPromoValid(promo, "2025-12-31")).toBe(true);
  });

  it("returns true when asOfISO is undefined (backward compat)", () => {
    const promo: Promo = {
      id: "TEST",
      label: "Test Promo",
      type: "INTRO_PRICE",
      value: 10,
      durationMonths: 6,
      validFromISO: "2025-01-01",
      validUntilISO: "2025-12-31",
    };
    expect(isPromoValid(promo, undefined)).toBe(true);
  });
});

// ============================================
// Test: isFixedPromoValid
// ============================================

describe("isFixedPromoValid", () => {
  it("returns true for undefined promo", () => {
    expect(isFixedPromoValid(undefined, "2025-01-15")).toBe(true);
  });

  it("returns true for NONE type promo", () => {
    const promo = { type: "NONE" as const, durationMonths: 0, value: 0 };
    expect(isFixedPromoValid(promo, "2025-01-15")).toBe(true);
  });

  it("returns true when within validity period", () => {
    const promo = {
      type: "INTRO_PRICE" as const,
      value: 20,
      durationMonths: 6,
      validFromISO: "2025-01-01",
      validUntilISO: "2025-12-31",
    };
    expect(isFixedPromoValid(promo, "2025-06-15")).toBe(true);
  });

  it("returns false when outside validity period", () => {
    const promo = {
      type: "INTRO_PRICE" as const,
      value: 20,
      durationMonths: 6,
      validFromISO: "2025-01-01",
      validUntilISO: "2025-12-31",
    };
    expect(isFixedPromoValid(promo, "2026-01-01")).toBe(false);
  });
});

// ============================================
// Test: resolveTeamDealPricing
// ============================================

describe("resolveTeamDealPricing", () => {
  const teamDealTariff: MobileTariff = {
    id: "TD_M",
    family: "teamdeal",
    tier: "M",
    name: "TeamDeal M",
    baseNet: 20,
    dataVolumeGB: "unlimited",
    provisionBase: 200,
    deductionRate: 0.08,
    features: ["Unlimited Data", "TeamDeal Benefit"],
  };

  const primeTariff: MobileTariff = {
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

  it("returns base price for non-TeamDeal tariff", () => {
    const result = resolveTeamDealPricing(primeTariff, true);
    expect(result.effectiveNet).toBe(35);
    expect(result.dataVolumeGB).toBe(20);
    expect(result.isFallback).toBe(false);
  });

  it("returns base price for TeamDeal with primeOnAccount=true", () => {
    const result = resolveTeamDealPricing(teamDealTariff, true);
    expect(result.effectiveNet).toBe(20);
    expect(result.dataVolumeGB).toBe("unlimited");
    expect(result.isFallback).toBe(false);
  });

  it("returns fallback for TeamDeal with primeOnAccount=false", () => {
    const result = resolveTeamDealPricing(teamDealTariff, false);
    expect(result.effectiveNet).toBe(TEAMDEAL_FALLBACK.PRICE_NET);
    expect(result.dataVolumeGB).toBe(TEAMDEAL_FALLBACK.DATA_GB);
    expect(result.isFallback).toBe(true);
  });

  it("uses fallback values 13€ and 1GB", () => {
    const result = resolveTeamDealPricing(teamDealTariff, false);
    expect(result.effectiveNet).toBe(13);
    expect(result.dataVolumeGB).toBe(1);
  });
});
