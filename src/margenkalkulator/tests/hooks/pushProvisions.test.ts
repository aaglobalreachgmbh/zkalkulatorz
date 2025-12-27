// ============================================
// Unit Tests: Push Provisions Utilities
// ============================================

import { describe, it, expect } from "vitest";

// Since usePushProvisions is a React hook that uses Supabase,
// we test the pure utility functions and logic here.

// ============================================
// Test: Push Provision Matching Logic
// ============================================

type PushProvision = {
  id: string;
  tariffId: string;
  tariffFamily?: string;
  contractType?: "new" | "renewal";
  bonusAmount: number;
  bonusType: "fixed" | "percentage";
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  scopeType: "all" | "team" | "user";
  scopeId?: string;
};

// Pure function to match provisions (extracted logic)
function matchProvisionToTariff(
  provision: PushProvision,
  tariffId: string,
  contractType?: "new" | "renewal",
  today: Date = new Date()
): boolean {
  // Must be active
  if (!provision.isActive) return false;
  
  // Check validity dates
  const validFrom = new Date(provision.validFrom);
  if (today < validFrom) return false;
  
  if (provision.validUntil) {
    const validUntil = new Date(provision.validUntil);
    if (today > validUntil) return false;
  }
  
  // Match tariff
  if (provision.tariffId !== "*" && provision.tariffId !== tariffId) {
    return false;
  }
  
  // Match contract type (if specified)
  if (provision.contractType && contractType && provision.contractType !== contractType) {
    return false;
  }
  
  return true;
}

// Pure function to calculate bonus amount
function calculateBonusFromProvisions(
  provisions: PushProvision[],
  baseProvision: number = 0
): number {
  let totalBonus = 0;
  
  for (const provision of provisions) {
    if (provision.bonusType === "percentage") {
      totalBonus += Math.round(baseProvision * (provision.bonusAmount / 100) * 100) / 100;
    } else {
      totalBonus += provision.bonusAmount;
    }
  }
  
  return Math.round(totalBonus * 100) / 100;
}

describe("matchProvisionToTariff", () => {
  const baseProvision: PushProvision = {
    id: "1",
    tariffId: "PRIME_M",
    bonusAmount: 25,
    bonusType: "fixed",
    validFrom: "2024-01-01",
    isActive: true,
    scopeType: "all",
  };

  it("matches when tariff ID is exact match", () => {
    const result = matchProvisionToTariff(baseProvision, "PRIME_M", undefined, new Date("2024-06-01"));
    expect(result).toBe(true);
  });

  it("matches when tariff ID is wildcard", () => {
    const wildcardProvision = { ...baseProvision, tariffId: "*" };
    const result = matchProvisionToTariff(wildcardProvision, "ANY_TARIFF", undefined, new Date("2024-06-01"));
    expect(result).toBe(true);
  });

  it("does not match when tariff ID differs", () => {
    const result = matchProvisionToTariff(baseProvision, "PRIME_L", undefined, new Date("2024-06-01"));
    expect(result).toBe(false);
  });

  it("does not match when provision is inactive", () => {
    const inactiveProvision = { ...baseProvision, isActive: false };
    const result = matchProvisionToTariff(inactiveProvision, "PRIME_M", undefined, new Date("2024-06-01"));
    expect(result).toBe(false);
  });

  it("does not match before validFrom date", () => {
    const result = matchProvisionToTariff(baseProvision, "PRIME_M", undefined, new Date("2023-12-31"));
    expect(result).toBe(false);
  });

  it("does not match after validUntil date", () => {
    const expiredProvision = { ...baseProvision, validUntil: "2024-03-31" };
    const result = matchProvisionToTariff(expiredProvision, "PRIME_M", undefined, new Date("2024-04-01"));
    expect(result).toBe(false);
  });

  it("matches contract type when specified", () => {
    const newOnlyProvision = { ...baseProvision, contractType: "new" as const };
    expect(matchProvisionToTariff(newOnlyProvision, "PRIME_M", "new", new Date("2024-06-01"))).toBe(true);
    expect(matchProvisionToTariff(newOnlyProvision, "PRIME_M", "renewal", new Date("2024-06-01"))).toBe(false);
  });

  it("matches any contract type when not specified in provision", () => {
    expect(matchProvisionToTariff(baseProvision, "PRIME_M", "new", new Date("2024-06-01"))).toBe(true);
    expect(matchProvisionToTariff(baseProvision, "PRIME_M", "renewal", new Date("2024-06-01"))).toBe(true);
  });
});

describe("calculateBonusFromProvisions", () => {
  it("sums fixed bonuses", () => {
    const provisions: PushProvision[] = [
      { id: "1", tariffId: "PRIME_M", bonusAmount: 25, bonusType: "fixed", validFrom: "2024-01-01", isActive: true, scopeType: "all" },
      { id: "2", tariffId: "PRIME_M", bonusAmount: 15, bonusType: "fixed", validFrom: "2024-01-01", isActive: true, scopeType: "all" },
    ];
    expect(calculateBonusFromProvisions(provisions)).toBe(40);
  });

  it("calculates percentage bonus based on base provision", () => {
    const provisions: PushProvision[] = [
      { id: "1", tariffId: "PRIME_M", bonusAmount: 10, bonusType: "percentage", validFrom: "2024-01-01", isActive: true, scopeType: "all" },
    ];
    // 10% of 400 = 40
    expect(calculateBonusFromProvisions(provisions, 400)).toBe(40);
  });

  it("combines fixed and percentage bonuses", () => {
    const provisions: PushProvision[] = [
      { id: "1", tariffId: "PRIME_M", bonusAmount: 20, bonusType: "fixed", validFrom: "2024-01-01", isActive: true, scopeType: "all" },
      { id: "2", tariffId: "PRIME_M", bonusAmount: 5, bonusType: "percentage", validFrom: "2024-01-01", isActive: true, scopeType: "all" },
    ];
    // 20 + (5% of 400 = 20) = 40
    expect(calculateBonusFromProvisions(provisions, 400)).toBe(40);
  });

  it("returns 0 for empty provisions array", () => {
    expect(calculateBonusFromProvisions([])).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    const provisions: PushProvision[] = [
      { id: "1", tariffId: "PRIME_M", bonusAmount: 7, bonusType: "percentage", validFrom: "2024-01-01", isActive: true, scopeType: "all" },
    ];
    // 7% of 333.33 = 23.3331 → 23.33
    expect(calculateBonusFromProvisions(provisions, 333.33)).toBe(23.33);
  });
});
