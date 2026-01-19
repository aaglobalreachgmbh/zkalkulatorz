// ============================================
// MargenKalkulator Engine Tests - Phase 1
// ============================================
// Run: npx vitest run src/margenkalkulator/tests/pricing.test.ts

import { describe, it, expect } from "vitest";
import {
  calculateGross,
  calculateMobileBaseForMonth,
  calculateMobileMonthlyForMonth,
  calculateFixedNetMonthlyForMonth,
  calculateHardwareAmortization,
  calculateDealerEconomicsLegacy,
  calculateOffer,
  collectPeriodBoundaries,
  calculateAverageMonthly,
  calculateTotalFromPeriods,
  getMobileTariff,
  getSubVariant,
  getPromo,
  getFixedNetProduct,
  createDummyOptionState,
} from "../engine";
import { TAX } from "../config";
import type { OfferOptionState, Period } from "../engine/types";

// ============================================
// Test 1: VAT Calculation (net → gross)
// ============================================
describe("VAT Calculation", () => {
  it("should calculate gross from net with 19% VAT", () => {
    expect(calculateGross(100, TAX.VAT_RATE)).toBe(119);
    expect(calculateGross(25, TAX.VAT_RATE)).toBe(29.75);
    expect(calculateGross(0, TAX.VAT_RATE)).toBe(0);
  });

  it("should round to 2 decimal places", () => {
    expect(calculateGross(33.33, TAX.VAT_RATE)).toBe(39.66); // 33.33 * 1.19 = 39.6627
  });
});

// ============================================
// Test 2: SUB Addition (SIM vs SUB10)
// ============================================
describe("SUB Variant Addition", () => {
  const tariff = getMobileTariff("RED_BIZ_S")!;
  const simOnly = getSubVariant("SIM_ONLY")!;
  const sub10 = getSubVariant("SUB10")!;
  const noPromo = getPromo("NONE")!;

  it("should not add cost for SIM_ONLY", () => {
    const cost = calculateMobileMonthlyForMonth(tariff, simOnly, noPromo, 1, 1);
    expect(cost).toBe(25); // base only
  });

  it("should add €10 for SUB10", () => {
    const cost = calculateMobileMonthlyForMonth(tariff, sub10, noPromo, 1, 1);
    expect(cost).toBe(35); // 25 + 10
  });

  it("should multiply by quantity", () => {
    const cost = calculateMobileMonthlyForMonth(tariff, sub10, noPromo, 3, 1);
    expect(cost).toBe(105); // (25 + 10) * 3
  });
});

// ============================================
// Test 3: PCT_OFF_BASE reduces only base, not SUB
// ============================================
describe("PCT_OFF_BASE Promo", () => {
  const tariff = getMobileTariff("RED_BIZ_S")!; // base = 25
  const sub10 = getSubVariant("SUB10")!; // +10
  const pctOff = getPromo("PCT_OFF_BASE")!; // 50% off for 12 months

  it("should apply 50% discount only to base (not SUB) during promo period", () => {
    // Month 1 (promo active): base 25*0.5 = 12.5, SUB = 10, total = 22.5
    const cost = calculateMobileMonthlyForMonth(tariff, sub10, pctOff, 1, 1);
    expect(cost).toBe(22.5);
  });

  it("should return full price after promo expires", () => {
    // Month 13 (promo ended): base 25 + SUB 10 = 35
    const cost = calculateMobileMonthlyForMonth(tariff, sub10, pctOff, 1, 13);
    expect(cost).toBe(35);
  });

  it("should not affect SUB price during promo", () => {
    const baseOnly = calculateMobileBaseForMonth(tariff, pctOff, 1);
    expect(baseOnly).toBe(12.5); // 50% of 25

    const withSub = calculateMobileMonthlyForMonth(tariff, sub10, pctOff, 1, 1);
    expect(withSub - baseOnly).toBe(10); // SUB is always 10, never discounted
  });
});

// ============================================
// Test 4: INTRO_PRICE applies only in defined period
// ============================================
describe("INTRO_PRICE Promo", () => {
  const tariff = getMobileTariff("RED_BIZ_M")!; // base = 35
  const simOnly = getSubVariant("SIM_ONLY")!;
  const intro = getPromo("INTRO_PRICE")!; // €15 for 6 months

  it("should use intro price for first 6 months", () => {
    expect(calculateMobileMonthlyForMonth(tariff, simOnly, intro, 1, 1)).toBe(15);
    expect(calculateMobileMonthlyForMonth(tariff, simOnly, intro, 1, 6)).toBe(15);
  });

  it("should return to normal price after intro period", () => {
    expect(calculateMobileMonthlyForMonth(tariff, simOnly, intro, 1, 7)).toBe(35);
    expect(calculateMobileMonthlyForMonth(tariff, simOnly, intro, 1, 24)).toBe(35);
  });
});

// ============================================
// Test 5: Period Split with different promo lengths
// ============================================
describe("Period Splitting", () => {
  it("should create correct boundaries for mobile 12mo + fixed 6mo promos", () => {
    const boundaries = collectPeriodBoundaries(24, 12, 6);
    expect(boundaries).toEqual([1, 7, 13, 25]);
    // Periods: 1-6, 7-12, 13-24
  });

  it("should handle no promos (single period)", () => {
    const boundaries = collectPeriodBoundaries(24, 0, 0);
    expect(boundaries).toEqual([1, 25]);
    // Single period: 1-24
  });

  it("should handle only mobile promo", () => {
    const boundaries = collectPeriodBoundaries(24, 12, 0);
    expect(boundaries).toEqual([1, 13, 25]);
    // Periods: 1-12, 13-24
  });
});

// ============================================
// Test 6: One-time costs are summed correctly
// ============================================
describe("One-time Costs", () => {
  it("should include fixed net setup fee in oneTime array", () => {
    const state = createDummyOptionState();
    state.fixedNet.enabled = true;
    state.fixedNet.productId = "CABLE_250"; // oneTimeNet = 50

    const result = calculateOffer(state);
    expect(result.oneTime.length).toBe(1);
    expect(result.oneTime[0].net).toBe(50);
    expect(result.oneTime[0].gross).toBe(59.5); // 50 * 1.19
  });

  it("should have empty oneTime when no fixed net", () => {
    const state = createDummyOptionState();
    state.fixedNet.enabled = false;

    const result = calculateOffer(state);
    expect(result.oneTime.length).toBe(0);
  });
});

// ============================================
// Test 7: Ø24 calculation (weighted average)
// ============================================
describe("Average Monthly Calculation", () => {
  it("should calculate correct weighted average across periods", () => {
    const periods: Period[] = [
      { fromMonth: 1, toMonth: 6, monthly: { net: 10, gross: 11.9 } }, // 6 months
      { fromMonth: 7, toMonth: 24, monthly: { net: 20, gross: 23.8 } }, // 18 months
    ];
    
    // Total net = 6*10 + 18*20 = 60 + 360 = 420
    // Average = 420 / 24 = 17.5
    const avg = calculateAverageMonthly(periods, 24);
    expect(avg).toBe(17.5);
  });
});

// ============================================
// Test 8: Sum24 calculation
// ============================================
describe("Sum 24 Month Calculation", () => {
  it("should sum all periods correctly", () => {
    const periods: Period[] = [
      { fromMonth: 1, toMonth: 12, monthly: { net: 25, gross: 29.75 } },
      { fromMonth: 13, toMonth: 24, monthly: { net: 35, gross: 41.65 } },
    ];

    const totals = calculateTotalFromPeriods(periods);
    expect(totals.net).toBe(12 * 25 + 12 * 35); // 300 + 420 = 720
    expect(totals.gross).toBe(12 * 29.75 + 12 * 41.65); // 357 + 499.8 = 856.8
  });
});

// ============================================
// Test 9: provisionAfter clamped to ≥ 0
// ============================================
describe("Provision Clamping", () => {
  it("should clamp provisionAfter to 0 when deductions exceed base", () => {
    // Create a mock tariff with high deduction rate
    const dealer = calculateDealerEconomicsLegacy(
      { 
        id: "TEST", 
        name: "Test", 
        baseNet: 10, 
        features: [], 
        provisionBase: 100, 
        deductionRate: 2 // 200% deduction (impossible in reality, but tests clamping)
      },
      1,
      0
    );
    
    expect(dealer.provisionAfter).toBe(0); // clamped, not negative
  });

  it("should calculate normal provision when deductions are reasonable", () => {
    const tariff = getMobileTariff("RED_BIZ_S")!;
    const dealer = calculateDealerEconomicsLegacy(tariff, 1, 0);
    
    expect(dealer.provisionBase).toBe(200);
    expect(dealer.deductions).toBe(20); // 10% of 200
    expect(dealer.provisionAfter).toBe(180);
  });
});

// ============================================
// Test 10: Margin = provisionAfter - hardwareEkNet
// ============================================
describe("Margin Calculation", () => {
  it("should calculate margin as provisionAfter minus hardware EK", () => {
    const tariff = getMobileTariff("RED_BIZ_M")!; // provision 300
    const dealer = calculateDealerEconomicsLegacy(tariff, 1, 150);
    
    // provisionBase = 300, deductions = 30 (10%), provisionAfter = 270
    // margin = 270 - 150 = 120
    expect(dealer.margin).toBe(120);
  });

  it("should allow negative margin when hardware exceeds provision", () => {
    const tariff = getMobileTariff("RED_BIZ_S")!; // provision 200
    const dealer = calculateDealerEconomicsLegacy(tariff, 1, 500);
    
    // provisionAfter = 180, margin = 180 - 500 = -320
    expect(dealer.margin).toBe(-320);
  });
});

// ============================================
// Test 11: Breakdown contains required entries
// ============================================
describe("Breakdown Generation", () => {
  it("should include base, sub, promo, provision, and margin entries", () => {
    const state = createDummyOptionState();
    state.mobile.tariffId = "RED_BIZ_M";
    state.mobile.subVariantId = "SUB10";
    state.mobile.promoId = "PCT_OFF_BASE";
    state.hardware.ekNet = 100;

    const result = calculateOffer(state);
    const ruleIds = result.breakdown.map((b) => b.ruleId);

    expect(ruleIds).toContain("base");
    expect(ruleIds).toContain("sub_add");
    expect(ruleIds).toContain("promo_pct_off_base");
    expect(ruleIds).toContain("provision_base");
    expect(ruleIds).toContain("deductions");
    expect(ruleIds).toContain("provision_after");
    expect(ruleIds).toContain("hardware_ek");
    expect(ruleIds).toContain("margin");
  });

  it("should include fixed net breakdown when enabled", () => {
    const state = createDummyOptionState();
    state.fixedNet.enabled = true;
    state.fixedNet.productId = "CABLE_250";

    const result = calculateOffer(state);
    const ruleIds = result.breakdown.map((b) => b.ruleId);

    expect(ruleIds).toContain("fixed_base");
    expect(ruleIds).toContain("fixed_setup");
    expect(ruleIds).toContain("fixed_promo");
  });
});

// ============================================
// Test 12: Hardware Amortization
// ============================================
describe("Hardware Amortization", () => {
  it("should calculate correct monthly amortization", () => {
    expect(calculateHardwareAmortization(240, true, 24)).toBe(10);
    expect(calculateHardwareAmortization(240, true, 12)).toBe(20);
  });

  it("should return 0 when amortization disabled", () => {
    expect(calculateHardwareAmortization(240, false, 24)).toBe(0);
  });

  it("should return 0 when EK is 0", () => {
    expect(calculateHardwareAmortization(0, true, 24)).toBe(0);
  });

  it("should include amortization in monthly periods", () => {
    const state = createDummyOptionState();
    state.hardware.ekNet = 240;
    state.hardware.amortize = true;
    state.hardware.amortMonths = 24;
    state.mobile.promoId = "NONE";
    state.fixedNet.enabled = false;

    const result = calculateOffer(state);
    
    // Mobile base (25) + amortization (10) = 35
    expect(result.periods[0].monthly.net).toBe(35);
  });
});
