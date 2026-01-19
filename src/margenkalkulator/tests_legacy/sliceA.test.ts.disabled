// ============================================
// MargenKalkulator Phase 2 - Slice A Tests
// ============================================
// Run: npx vitest run src/margenkalkulator/tests/sliceA.test.ts

import { describe, it, expect } from "vitest";
import {
  calculateOffer,
  createDefaultOptionState,
  getMobileTariffFromCatalog,
  getFixedNetProductFromCatalog,
  getPromoFromCatalog,
  checkGKEligibility,
  getOMODeduction,
} from "../engine";
import { TAX, TERM, CURRENCY, DATASETS } from "../config";
import type { OfferOptionState } from "../engine/types";

// ============================================
// Helper: Create state with business dataset
// ============================================
function createBusinessState(): OfferOptionState {
  return {
    meta: {
      currency: CURRENCY.DEFAULT,
      vatRate: TAX.VAT_RATE,
      termMonths: TERM.DEFAULT_MONTHS,
      datasetVersion: DATASETS.CURRENT,
    },
    hardware: {
      name: "",
      ekNet: 0,
      amortize: false,
      amortMonths: TERM.AMORT_MONTHS,
    },
    mobile: {
      tariffId: "PRIME_M",
      subVariantId: "SIM_ONLY",
      promoId: "NONE",
      contractType: "new",
      quantity: 1,
    },
    fixedNet: {
      enabled: false,
      productId: "RBI_100",
    },
  };
}

// ============================================
// Test 1: Prime M + SUB10 + 12×50
// Periods should discount base only, SUB at full price
// ============================================
describe("Slice A: Prime + SUB10 + 12×50 Promo", () => {
  it("should apply 50% discount only to base for first 12 months", () => {
    const state = createBusinessState();
    state.mobile.tariffId = "PRIME_M"; // base = 39.99
    state.mobile.subVariantId = "SUB10"; // +10
    state.mobile.promoId = "12X50"; // 50% off base for 12 months

    const result = calculateOffer(state);
    
    // Period 1-12: base * 0.5 + SUB = 19.995 + 10 = 29.995 ≈ 30.00
    // Period 13-24: base + SUB = 39.99 + 10 = 49.99
    expect(result.periods.length).toBe(2);
    expect(result.periods[0].fromMonth).toBe(1);
    expect(result.periods[0].toMonth).toBe(12);
    expect(result.periods[0].monthly.net).toBeCloseTo(29.995, 2);
    
    expect(result.periods[1].fromMonth).toBe(13);
    expect(result.periods[1].toMonth).toBe(24);
    expect(result.periods[1].monthly.net).toBeCloseTo(49.99, 2);
  });

  it("should never discount SUB add-on", () => {
    const state = createBusinessState();
    state.mobile.tariffId = "PRIME_M";
    state.mobile.subVariantId = "SUB10";
    state.mobile.promoId = "12X50";

    const result = calculateOffer(state);
    
    // Difference between periods should be 50% of base only
    // Period 1: 19.995 + 10 = 29.995
    // Period 2: 39.99 + 10 = 49.99
    // Difference = 19.995 (which is 50% of base 39.99)
    const diff = result.periods[1].monthly.net - result.periods[0].monthly.net;
    expect(diff).toBeCloseTo(19.995, 2);
  });
});

// ============================================
// Test 2: Prime L + OMO25
// Constant discount, provision deduction
// ============================================
describe("Slice A: Prime L + OMO25 Promo", () => {
  it("should apply 25% discount permanently (single period)", () => {
    const state = createBusinessState();
    state.mobile.tariffId = "PRIME_L"; // base = 49.99
    state.mobile.promoId = "OMO25"; // 25% off for full term

    const result = calculateOffer(state);
    
    // OMO25 = 25% off for 24 months = full term = single period
    expect(result.periods.length).toBe(1);
    
    // Monthly = 49.99 * 0.75 = 37.4925
    expect(result.periods[0].monthly.net).toBeCloseTo(37.4925, 2);
    expect(result.periods[0].fromMonth).toBe(1);
    expect(result.periods[0].toMonth).toBe(24);
  });

  it("should deduct OMO provision from dealer economics", () => {
    const state = createBusinessState();
    state.mobile.tariffId = "PRIME_L"; // provision = 450, omoDeduction = 100
    state.mobile.promoId = "OMO25";

    const result = calculateOffer(state);
    
    // provisionBase = 450
    // deductions = 0 (deductionRate) + 100 (OMO) = 100
    // provisionAfter = 450 - 100 = 350
    expect(result.dealer.provisionBase).toBe(450);
    expect(result.dealer.deductions).toBe(100);
    expect(result.dealer.provisionAfter).toBe(350);
  });

  it("should clamp provision to 0 when OMO deduction exceeds base", () => {
    const state = createBusinessState();
    state.mobile.tariffId = "PRIME_S"; // provision = 250, omoDeduction = 50
    state.mobile.promoId = "OMO25";
    state.hardware.ekNet = 500; // Force high hardware cost

    const result = calculateOffer(state);
    
    // provisionAfter = 250 - 50 = 200
    expect(result.dealer.provisionAfter).toBe(200);
    // margin = 200 - 500 = -300
    expect(result.dealer.margin).toBe(-300);
  });
});

// ============================================
// Test 3: RBI 100 - Intro price for 6 months
// ============================================
describe("Slice A: RBI 100 Cable", () => {
  it("should apply intro price for first 6 months, then list price", () => {
    const state = createBusinessState();
    state.mobile.promoId = "NONE"; // No mobile promo to simplify
    state.fixedNet.enabled = true;
    state.fixedNet.productId = "RBI_100"; // list = 29.99, intro = 19.99 for 6 months

    const result = calculateOffer(state);
    
    // Should have 2 periods: 1-6 (intro), 7-24 (list)
    expect(result.periods.length).toBe(2);
    
    // Period 1-6: mobile (39.99) + fixed intro (19.99) = 59.98
    expect(result.periods[0].fromMonth).toBe(1);
    expect(result.periods[0].toMonth).toBe(6);
    expect(result.periods[0].monthly.net).toBeCloseTo(39.99 + 19.99, 2);
    
    // Period 7-24: mobile (39.99) + fixed list (29.99) = 69.98
    expect(result.periods[1].fromMonth).toBe(7);
    expect(result.periods[1].toMonth).toBe(24);
    expect(result.periods[1].monthly.net).toBeCloseTo(39.99 + 29.99, 2);
  });

  it("should have setup waived (no one-time cost)", () => {
    const state = createBusinessState();
    state.fixedNet.enabled = true;
    state.fixedNet.productId = "RBI_100"; // setupWaived = true

    const result = calculateOffer(state);
    
    // Setup is waived, so oneTime should be empty
    expect(result.oneTime.length).toBe(0);
    
    // Breakdown should show "Bereitstellung erlassen"
    const setupWaivedItem = result.breakdown.find(b => b.ruleId === "fixed_setup_waived");
    expect(setupWaivedItem).toBeDefined();
    expect(setupWaivedItem?.net).toBe(0);
  });
});

// ============================================
// Test 4: RBIP 300 - 50% off for 24 months
// ============================================
describe("Slice A: RBIP 300 Cable", () => {
  it("should apply 50% discount for full 24 months", () => {
    const state = createBusinessState();
    state.mobile.tariffId = "PRIME_S"; // base = 29.99
    state.mobile.promoId = "NONE";
    state.fixedNet.enabled = true;
    state.fixedNet.productId = "RBIP_300"; // list = 44.99, 50% off for 24 months

    const result = calculateOffer(state);
    
    // 50% off for full term = single period
    expect(result.periods.length).toBe(1);
    
    // Monthly = mobile (29.99) + fixed (44.99 * 0.5 = 22.495) = 52.485
    expect(result.periods[0].monthly.net).toBeCloseTo(29.99 + 22.495, 2);
  });

  it("should include FRITZ!Box in breakdown", () => {
    const state = createBusinessState();
    state.fixedNet.enabled = true;
    state.fixedNet.productId = "RBIP_300"; // routerType = FRITZBOX

    const result = calculateOffer(state);
    
    const routerItem = result.breakdown.find(b => b.ruleId === "router_included");
    expect(routerItem).toBeDefined();
    expect(routerItem?.label).toContain("FRITZ!Box");
    expect(routerItem?.net).toBe(0);
  });
});

// ============================================
// Test 5: GK Eligibility
// ============================================
describe("Slice A: GK Convergence Eligibility", () => {
  it("should be eligible when Prime + FixedNet enabled", () => {
    const state = createBusinessState();
    state.mobile.tariffId = "PRIME_L";
    state.fixedNet.enabled = true;
    state.fixedNet.productId = "RBI_100";

    const result = calculateOffer(state);
    
    expect(result.gkEligible).toBe(true);
    
    // Breakdown should contain GK benefit marker
    const gkItem = result.breakdown.find(b => b.ruleId === "gk_eligible");
    expect(gkItem).toBeDefined();
    expect(gkItem?.label).toContain("Unlimited");
  });

  it("should NOT be eligible when FixedNet disabled", () => {
    const state = createBusinessState();
    state.mobile.tariffId = "PRIME_L";
    state.fixedNet.enabled = false;

    const result = calculateOffer(state);
    
    expect(result.gkEligible).toBe(false);
  });

  it("should NOT be eligible for non-Prime tariffs", () => {
    // Using dummy dataset with non-Prime tariff
    const state: OfferOptionState = {
      meta: {
        currency: CURRENCY.DEFAULT,
        vatRate: TAX.VAT_RATE,
        termMonths: TERM.DEFAULT_MONTHS,
        datasetVersion: DATASETS.DUMMY,
      },
      hardware: { name: "", ekNet: 0, amortize: false, amortMonths: TERM.AMORT_MONTHS },
      mobile: {
        tariffId: "RED_BIZ_S", // Not Prime
        subVariantId: "SIM_ONLY",
        promoId: "NONE",
        contractType: "new",
        quantity: 1,
      },
      fixedNet: {
        enabled: true,
        productId: "CABLE_250",
      },
    };

    const result = calculateOffer(state);
    
    expect(result.gkEligible).toBe(false);
  });
});

// ============================================
// Test 6: Renewal Provision
// ============================================
describe("Slice A: Renewal Provision", () => {
  it("should use renewal provision when contract type is renewal", () => {
    const state = createBusinessState();
    state.mobile.tariffId = "PRIME_M"; // provisionBase = 350, provisionRenewal = 175
    state.mobile.contractType = "renewal";
    state.mobile.promoId = "NONE";

    const result = calculateOffer(state);
    
    // Should use renewal provision
    expect(result.dealer.provisionBase).toBe(175);
    expect(result.dealer.provisionAfter).toBe(175);
  });

  it("should use new provision when contract type is new", () => {
    const state = createBusinessState();
    state.mobile.tariffId = "PRIME_M";
    state.mobile.contractType = "new";
    state.mobile.promoId = "NONE";

    const result = calculateOffer(state);
    
    expect(result.dealer.provisionBase).toBe(350);
  });
});

// ============================================
// Test 7: Catalog Resolver Functions
// ============================================
describe("Slice A: Catalog Resolver", () => {
  it("should resolve Prime tariffs from business catalog", () => {
    const tariff = getMobileTariffFromCatalog("business-2025-09", "PRIME_M");
    
    expect(tariff).toBeDefined();
    expect(tariff?.name).toBe("Business Prime M");
    expect(tariff?.productLine).toBe("PRIME");
    expect(tariff?.tier).toBe("M");
  });

  it("should resolve OMO25 promo from business catalog", () => {
    const promo = getPromoFromCatalog("business-2025-09", "OMO25");
    
    expect(promo).toBeDefined();
    expect(promo?.value).toBe(0.25);
    expect(promo?.durationMonths).toBe(24);
  });

  it("should resolve RBI products from business catalog", () => {
    const product = getFixedNetProductFromCatalog("business-2025-09", "RBI_300");
    
    expect(product).toBeDefined();
    expect(product?.productLine).toBe("RBI");
    expect(product?.speed).toBe(300);
    expect(product?.setupWaived).toBe(true);
  });

  it("should check GK eligibility correctly", () => {
    const primeTariff = getMobileTariffFromCatalog("business-2025-09", "PRIME_L");
    
    expect(checkGKEligibility(primeTariff, true)).toBe(true);
    expect(checkGKEligibility(primeTariff, false)).toBe(false);
    expect(checkGKEligibility(undefined, true)).toBe(false);
  });

  it("should return correct OMO deduction", () => {
    const primeL = getMobileTariffFromCatalog("business-2025-09", "PRIME_L");
    
    expect(getOMODeduction(primeL, "OMO25")).toBe(100);
    expect(getOMODeduction(primeL, "NONE")).toBe(0);
    expect(getOMODeduction(primeL, "12X50")).toBe(0);
  });
});

// ============================================
// Test 8: Default State Uses Business Dataset
// ============================================
describe("Slice A: Default State", () => {
  it("should default to business-2025-09 dataset", () => {
    const state = createDefaultOptionState();
    
    expect(state.meta.datasetVersion).toBe(DATASETS.CURRENT);
    expect(state.mobile.tariffId).toBe("PRIME_S");
    expect(state.fixedNet.productId).toBe("RBI_100");
  });
});
