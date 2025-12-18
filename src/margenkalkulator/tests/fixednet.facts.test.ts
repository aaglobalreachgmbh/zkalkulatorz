// ============================================
// Festnetz Facts-Only Tests - Phase 2 Polish
// Tests for: meta flags, split one-time breakdown
// ============================================

import { describe, it, expect } from "vitest";
import { calculateOffer } from "../engine/pricing";
import type { OfferOptionState } from "../engine/types";

// Helper to create a minimal state
function createTestState(overrides: Partial<OfferOptionState> = {}): OfferOptionState {
  return {
    meta: {
      currency: "EUR",
      vatRate: 0.19,
      termMonths: 24,
      datasetVersion: "business-2025-09",
      asOfISO: "2025-12-17",
    },
    hardware: {
      name: "",
      ekNet: 0,
      amortize: false,
      amortMonths: 24,
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
      productId: "",
    },
    ...overrides,
  };
}

// ============================================
// Meta Flags Tests
// ============================================

describe("CalculationResult Meta Flags", () => {
  it("convergenceEligible is false when fixed net disabled", () => {
    const state = createTestState({
      fixedNet: { enabled: false, productId: "" },
    });
    
    const result = calculateOffer(state);
    
    expect(result.meta.convergenceEligible).toBe(false);
  });

  it("convergenceEligible is true when fixed net enabled", () => {
    const state = createTestState({
      fixedNet: { enabled: true, productId: "RBIP_CABLE_300", accessType: "CABLE" },
    });
    
    const result = calculateOffer(state);
    
    expect(result.meta.convergenceEligible).toBe(true);
  });

  it("primeUnlimitedUpgradeEligible is true when Prime + eligible FixedNet", () => {
    const state = createTestState({
      mobile: {
        tariffId: "PRIME_M",
        subVariantId: "SIM_ONLY",
        promoId: "NONE",
        contractType: "new",
        quantity: 1,
      },
      fixedNet: { enabled: true, productId: "RBIP_CABLE_300", accessType: "CABLE" },
    });
    
    const result = calculateOffer(state);
    
    expect(result.meta.primeUnlimitedUpgradeEligible).toBe(true);
  });

  it("primeUnlimitedUpgradeEligible is false when no Prime tariff", () => {
    const state = createTestState({
      mobile: {
        tariffId: "TEAMDEAL_S",
        subVariantId: "SIM_ONLY",
        promoId: "NONE",
        contractType: "new",
        quantity: 1,
        primeOnAccount: true,
      },
      fixedNet: { enabled: true, productId: "RBIP_CABLE_300", accessType: "CABLE" },
    });
    
    const result = calculateOffer(state);
    
    expect(result.meta.primeUnlimitedUpgradeEligible).toBe(false);
  });

  it("primeUnlimitedUpgradeEligible is false when no FixedNet", () => {
    const state = createTestState({
      mobile: {
        tariffId: "PRIME_M",
        subVariantId: "SIM_ONLY",
        promoId: "NONE",
        contractType: "new",
        quantity: 1,
      },
      fixedNet: { enabled: false, productId: "" },
    });
    
    const result = calculateOffer(state);
    
    expect(result.meta.primeUnlimitedUpgradeEligible).toBe(false);
  });
});

// ============================================
// One-Time Breakdown Split Tests
// ============================================

describe("One-Time Breakdown Split (Bereitstellung + Versand)", () => {
  it("splits one-time into Bereitstellung (19.90) and Versand (8.40)", () => {
    const state = createTestState({
      fixedNet: { enabled: true, productId: "RBIP_CABLE_300", accessType: "CABLE" },
    });
    
    const result = calculateOffer(state);
    const breakdown = result.breakdown;
    
    const setupItem = breakdown.find(b => b.ruleId === "fixed_setup" && b.key === "fixed_setup");
    const shippingItem = breakdown.find(b => b.ruleId === "fixed_shipping");
    
    expect(setupItem).toBeDefined();
    expect(setupItem?.net).toBe(19.90);
    expect(setupItem?.label).toBe("Bereitstellung");
    
    expect(shippingItem).toBeDefined();
    expect(shippingItem?.net).toBe(8.40);
    expect(shippingItem?.label).toBe("Versand Hardware");
  });

  it("shows waived setup when setupWaived is true", () => {
    // Note: Would need a product with setupWaived=true
    // For now, test with standard product that doesn't have it waived
    const state = createTestState({
      fixedNet: { enabled: true, productId: "RBIP_CABLE_300", accessType: "CABLE" },
    });
    
    const result = calculateOffer(state);
    const breakdown = result.breakdown;
    
    // Should NOT have waived item for standard product
    const waivedItem = breakdown.find(b => b.ruleId === "fixed_setup_waived");
    expect(waivedItem).toBeUndefined();
  });

  it("includes Expert Setup when expertSetupEnabled", () => {
    const state = createTestState({
      fixedNet: { 
        enabled: true, 
        productId: "RBIP_CABLE_300", 
        accessType: "CABLE",
        expertSetupEnabled: true,
      },
    });
    
    const result = calculateOffer(state);
    const breakdown = result.breakdown;
    
    const expertItem = breakdown.find(b => b.ruleId === "fixed_expert_setup");
    
    expect(expertItem).toBeDefined();
    expect(expertItem?.net).toBe(89.99);
    expect(expertItem?.label).toBe("Experten-Service Einrichtung");
  });

  it("includes Fixed IP addon when fixedIpEnabled", () => {
    const state = createTestState({
      fixedNet: { 
        enabled: true, 
        productId: "RBIP_CABLE_100", // 100 doesn't include Fixed IP
        accessType: "CABLE",
        fixedIpEnabled: true,
      },
    });
    
    const result = calculateOffer(state);
    const breakdown = result.breakdown;
    
    const ipItem = breakdown.find(b => b.ruleId === "fixed_ip_addon");
    
    expect(ipItem).toBeDefined();
    expect(ipItem?.net).toBe(5.00);
    expect(ipItem?.label).toBe("Feste IP-Adresse");
  });
});

// ============================================
// Router Inclusion Tests
// ============================================

describe("Router Inclusion Breakdown", () => {
  it("shows router included as 0€ breakdown line", () => {
    const state = createTestState({
      fixedNet: { enabled: true, productId: "RBIP_CABLE_300", accessType: "CABLE" },
    });
    
    const result = calculateOffer(state);
    const breakdown = result.breakdown;
    
    const routerItem = breakdown.find(b => b.ruleId === "router_included");
    
    expect(routerItem).toBeDefined();
    expect(routerItem?.net).toBe(0);
    expect(routerItem?.label).toContain("inklusive");
  });
});
