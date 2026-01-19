// ============================================
// Slice B Tests: Promo/Action Logic
// 10 new test cases for time-based promos
// ============================================

import { describe, it, expect } from "vitest";
import {
  calculateOffer,
  calculateMobileBaseForMonth,
  calculateMobileMonthlyForMonth,
  calculateFixedNetMonthlyForMonth,
  isPromoValid,
  isFixedPromoValid,
  createDefaultOptionState,
} from "../engine";
import type { Promo, MobileTariff, FixedNetProduct, OfferOptionState } from "../engine/types";

// ============================================
// Test Data
// ============================================

const mockTariffPrimeM: MobileTariff = {
  id: "PRIME_M",
  name: "Business Prime M",
  baseNet: 39.99,
  features: [],
  provisionBase: 300,
  deductionRate: 0.1,
  tier: "M",
  productLine: "PRIME",
};

const mockPromoAbsOff: Promo = {
  id: "PRIME_AKTION_M",
  type: "ABS_OFF_BASE",
  appliesTo: "mobile",
  label: "Prime M Aktion (−10€/mtl.)",
  durationMonths: 24,
  value: 0,
  amountNetPerMonth: 10,
  validFromISO: "2025-09-01",
  validUntilISO: "2025-12-18",
};

const mockPromoNoValidity: Promo = {
  id: "12X50",
  type: "PCT_OFF_BASE",
  appliesTo: "mobile",
  label: "12×50% auf Base",
  durationMonths: 12,
  value: 0.5,
};

const mockFixedProduct: FixedNetProduct = {
  id: "RBI_100",
  name: "Red Business Internet Cable 100",
  monthlyNet: 29.90,
  oneTimeNet: 28.30,
  features: [],
  productLine: "RBI",
  speed: 100,
  routerType: "VODAFONE_STATION",
  promo: {
    type: "INTRO_PRICE",
    durationMonths: 6,
    value: 19.90,
    validFromISO: "2025-11-26",
    validUntilISO: "2026-01-28",
  },
};

const mockSubVariant = { id: "SIM_ONLY", label: "SIM-Only", monthlyAddNet: 0 };

// ============================================
// Test 1: ABS_OFF_BASE active (asOf within validity)
// ============================================
describe("Slice B: ABS_OFF_BASE Promo", () => {
  it("applies absolute discount when asOfISO is within validity period", () => {
    const base = calculateMobileBaseForMonth(
      mockTariffPrimeM,
      mockPromoAbsOff,
      1, // month
      "2025-12-17" // within validity
    );
    
    // 39.99 - 10 = 29.99
    expect(base).toBeCloseTo(29.99, 2);
  });

  // ============================================
  // Test 2: ABS_OFF_BASE expired (asOf after validUntil)
  // ============================================
  it("does NOT apply discount when asOfISO is after validity", () => {
    const base = calculateMobileBaseForMonth(
      mockTariffPrimeM,
      mockPromoAbsOff,
      1,
      "2025-12-19" // after validUntilISO
    );
    
    // Full price, no discount
    expect(base).toBeCloseTo(39.99, 2);
  });

  // ============================================
  // Test 3: ABS_OFF_BASE not yet valid (asOf before validFrom)
  // ============================================
  it("does NOT apply discount when asOfISO is before validity", () => {
    const base = calculateMobileBaseForMonth(
      mockTariffPrimeM,
      mockPromoAbsOff,
      1,
      "2025-08-15" // before validFromISO
    );
    
    expect(base).toBeCloseTo(39.99, 2);
  });

  it("SUB add-on is not affected by ABS_OFF_BASE promo", () => {
    const subVariantWithCost = { id: "SUB10", label: "SUB10", monthlyAddNet: 10 };
    
    const totalWithPromo = calculateMobileMonthlyForMonth(
      mockTariffPrimeM,
      subVariantWithCost,
      mockPromoAbsOff,
      1, // quantity
      1, // month
      "2025-12-17"
    );
    
    // Base: 39.99 - 10 = 29.99, SUB: +10 = 39.99
    expect(totalWithPromo).toBeCloseTo(39.99, 2);
  });
});

// ============================================
// Test 4: INTRO_PRICE 6M (Cable 100)
// ============================================
describe("Slice B: INTRO_PRICE Fixed Net", () => {
  it("applies intro price for months 1-6, then normal price", () => {
    const asOf = "2025-12-17";
    
    const month1 = calculateFixedNetMonthlyForMonth(mockFixedProduct, 1, asOf);
    const month6 = calculateFixedNetMonthlyForMonth(mockFixedProduct, 6, asOf);
    const month7 = calculateFixedNetMonthlyForMonth(mockFixedProduct, 7, asOf);
    
    expect(month1).toBeCloseTo(19.90, 2);
    expect(month6).toBeCloseTo(19.90, 2);
    expect(month7).toBeCloseTo(29.90, 2); // normal price
  });

  // ============================================
  // Test 5: INTRO_PRICE 12M (Cable 300)
  // ============================================
  it("applies 12-month intro price correctly", () => {
    const cable300: FixedNetProduct = {
      ...mockFixedProduct,
      id: "RBI_300",
      monthlyNet: 39.90,
      promo: {
        type: "INTRO_PRICE",
        durationMonths: 12,
        value: 19.90,
        validFromISO: "2025-11-26",
        validUntilISO: "2026-01-28",
      },
    };
    const asOf = "2025-12-17";
    
    const month1 = calculateFixedNetMonthlyForMonth(cable300, 1, asOf);
    const month12 = calculateFixedNetMonthlyForMonth(cable300, 12, asOf);
    const month13 = calculateFixedNetMonthlyForMonth(cable300, 13, asOf);
    
    expect(month1).toBeCloseTo(19.90, 2);
    expect(month12).toBeCloseTo(19.90, 2);
    expect(month13).toBeCloseTo(39.90, 2);
  });
});

// ============================================
// Test 6: Mobile ABS + Fixed INTRO period splitting
// ============================================
describe("Slice B: Period Splitting", () => {
  it("merges periods when price does not change (no promo)", () => {
    const state = createDefaultOptionState();
    state.meta.asOfISO = "2025-12-17";
    state.mobile.promoId = "NONE";
    state.fixedNet.enabled = false;
    
    const result = calculateOffer(state);
    
    // Should be 1 period when no promo
    expect(result.periods.length).toBe(1);
    expect(result.periods[0].fromMonth).toBe(1);
    expect(result.periods[0].toMonth).toBe(24);
  });

  // ============================================
  // Test 7: No promos = exactly 1 period 1-24
  // ============================================
  it("creates single period 1-24 when no promos active", () => {
    const state = createDefaultOptionState();
    state.meta.asOfISO = "2025-12-17";
    state.mobile.promoId = "NONE";
    state.fixedNet.enabled = false;
    
    const result = calculateOffer(state);
    
    expect(result.periods.length).toBe(1);
    expect(result.periods[0].label).toBe("Monat 1–24");
  });
});

// ============================================
// Test 8: Fixed one-time fees add correctly
// ============================================
describe("Slice B: One-Time Fees", () => {
  it("includes fixed one-time fees (setup + shipping = 28.30€)", () => {
    const state = createDefaultOptionState();
    state.meta.asOfISO = "2025-12-17";
    state.fixedNet.enabled = true;
    state.fixedNet.productId = "RBI_100";
    
    const result = calculateOffer(state);
    
    // One-time should include setup + shipping
    expect(result.oneTime.length).toBeGreaterThan(0);
    expect(result.oneTime[0].net).toBeCloseTo(28.30, 2);
  });
});

// ============================================
// Test 9: Router included appears in breakdown
// ============================================
describe("Slice B: Router Inclusion", () => {
  it("shows router as included (0€) in breakdown", () => {
    const state = createDefaultOptionState();
    state.meta.asOfISO = "2025-12-17";
    state.fixedNet.enabled = true;
    state.fixedNet.productId = "RBI_100";
    
    const result = calculateOffer(state);
    
    const routerItem = result.breakdown.find(b => b.ruleId === "router_included");
    expect(routerItem).toBeDefined();
    expect(routerItem?.net).toBe(0);
    expect(routerItem?.label).toContain("inklusive");
  });
});

// ============================================
// Test 10: Determinism - same asOfISO = same result
// ============================================
describe("Slice B: Determinism", () => {
  it("produces identical results for identical asOfISO", () => {
    const state1 = createDefaultOptionState();
    state1.meta.asOfISO = "2025-12-17";
    state1.mobile.promoId = "PRIME_AKTION_M";
    state1.fixedNet.enabled = true;
    state1.fixedNet.productId = "RBI_100";
    
    const state2 = createDefaultOptionState();
    state2.meta.asOfISO = "2025-12-17";
    state2.mobile.promoId = "PRIME_AKTION_M";
    state2.fixedNet.enabled = true;
    state2.fixedNet.productId = "RBI_100";
    
    const result1 = calculateOffer(state1);
    const result2 = calculateOffer(state2);
    
    expect(result1.totals.sumTermNet).toBe(result2.totals.sumTermNet);
    expect(result1.totals.avgTermNet).toBe(result2.totals.avgTermNet);
    expect(result1.periods.length).toBe(result2.periods.length);
  });

  it("produces different results for different asOfISO when promo validity differs", () => {
    const stateValid = createDefaultOptionState();
    stateValid.meta.asOfISO = "2025-12-17"; // within validity
    stateValid.mobile.promoId = "PRIME_AKTION_M";
    stateValid.fixedNet.enabled = false;
    
    const stateExpired = createDefaultOptionState();
    stateExpired.meta.asOfISO = "2025-12-20"; // after validity
    stateExpired.mobile.promoId = "PRIME_AKTION_M";
    stateExpired.fixedNet.enabled = false;
    
    const resultValid = calculateOffer(stateValid);
    const resultExpired = calculateOffer(stateExpired);
    
    // Expired should have higher cost (no discount)
    expect(resultExpired.totals.sumTermNet).toBeGreaterThan(resultValid.totals.sumTermNet);
  });
});

// ============================================
// Promo Validity Helper Tests
// ============================================
describe("Slice B: isPromoValid helper", () => {
  it("returns true for NONE promo type", () => {
    const nonePromo: Promo = { id: "NONE", type: "NONE", label: "", durationMonths: 0, value: 0 };
    expect(isPromoValid(nonePromo, "2025-12-17")).toBe(true);
  });

  it("returns true when no validity dates set", () => {
    expect(isPromoValid(mockPromoNoValidity, "2025-12-17")).toBe(true);
  });

  it("returns true when no asOfISO provided (backward compat)", () => {
    expect(isPromoValid(mockPromoAbsOff, undefined)).toBe(true);
  });

  it("returns false when asOf is before validFrom", () => {
    expect(isPromoValid(mockPromoAbsOff, "2025-08-31")).toBe(false);
  });

  it("returns false when asOf is after validUntil", () => {
    expect(isPromoValid(mockPromoAbsOff, "2025-12-19")).toBe(false);
  });
});

// ============================================
// Promo Expired Breakdown Test
// ============================================
describe("Slice B: Expired Promo Breakdown", () => {
  it("includes promo_expired in breakdown when promo is expired", () => {
    const state = createDefaultOptionState();
    state.meta.asOfISO = "2025-12-20"; // after validity
    state.mobile.promoId = "PRIME_AKTION_M";
    state.fixedNet.enabled = false;
    
    const result = calculateOffer(state);
    
    const expiredItem = result.breakdown.find(b => b.ruleId === "promo_expired");
    expect(expiredItem).toBeDefined();
    expect(expiredItem?.label).toContain("abgelaufen");
  });
});
