// ============================================
// Phase 2: Mobile Facts Tests
// Tests for correct tariff pricing and SUB filtering
// ============================================

import { describe, it, expect } from "vitest";
import { listMobileTariffs, listSubVariants, getMobileTariffFromCatalog } from "../engine/catalogResolver";

describe("Phase 2: Mobile Facts - Business Prime Prices", () => {
  const tariffs = listMobileTariffs("business-2025-09");

  it("1) Prime S baseNet should be 29€", () => {
    const primeS = tariffs.find(t => t.id === "PRIME_S");
    expect(primeS).toBeDefined();
    expect(primeS!.baseNet).toBe(29);
  });

  it("2) Prime M baseNet should be 42€", () => {
    const primeM = tariffs.find(t => t.id === "PRIME_M");
    expect(primeM).toBeDefined();
    expect(primeM!.baseNet).toBe(42);
  });

  it("3) Prime L baseNet should be 49€", () => {
    const primeL = tariffs.find(t => t.id === "PRIME_L");
    expect(primeL).toBeDefined();
    expect(primeL!.baseNet).toBe(49);
  });

  it("4) Prime XL baseNet should be 59€", () => {
    const primeXL = tariffs.find(t => t.id === "PRIME_XL");
    expect(primeXL).toBeDefined();
    expect(primeXL!.baseNet).toBe(59);
  });
});

describe("Phase 2: Mobile Facts - SUB Variant Pricing", () => {
  const subVariants = listSubVariants("business-2025-09");

  it("5) SIM_ONLY should have 0€ add-on", () => {
    const simOnly = subVariants.find(sv => sv.id === "SIM_ONLY");
    expect(simOnly).toBeDefined();
    expect(simOnly!.monthlyAddNet).toBe(0);
  });

  it("6) BASIC_PHONE should have +5€ add-on", () => {
    const basicPhone = subVariants.find(sv => sv.id === "BASIC_PHONE");
    expect(basicPhone).toBeDefined();
    expect(basicPhone!.monthlyAddNet).toBe(5);
  });

  it("7) SMARTPHONE should have +10€ add-on", () => {
    const smartphone = subVariants.find(sv => sv.id === "SMARTPHONE");
    expect(smartphone).toBeDefined();
    expect(smartphone!.monthlyAddNet).toBe(10);
  });

  it("8) PREMIUM_SMARTPHONE should have +25€ add-on", () => {
    const premium = subVariants.find(sv => sv.id === "PREMIUM_SMARTPHONE");
    expect(premium).toBeDefined();
    expect(premium!.monthlyAddNet).toBe(25);
  });

  it("9) SPECIAL_PREMIUM_SMARTPHONE should have +40€ add-on", () => {
    const special = subVariants.find(sv => sv.id === "SPECIAL_PREMIUM_SMARTPHONE");
    expect(special).toBeDefined();
    expect(special!.monthlyAddNet).toBe(40);
  });
});

describe("Phase 2: Mobile Facts - Combined Pricing (Base + SUB)", () => {
  const tariffs = listMobileTariffs("business-2025-09");
  const subVariants = listSubVariants("business-2025-09");

  const getSubAddOn = (subId: string) => 
    subVariants.find(sv => sv.id === subId)?.monthlyAddNet ?? 0;

  it("10) Prime S + SMARTPHONE = 29 + 10 = 39€", () => {
    const primeS = tariffs.find(t => t.id === "PRIME_S");
    const total = primeS!.baseNet + getSubAddOn("SMARTPHONE");
    expect(total).toBe(39);
  });

  it("11) Prime M + PREMIUM_SMARTPHONE = 42 + 25 = 67€", () => {
    const primeM = tariffs.find(t => t.id === "PRIME_M");
    const total = primeM!.baseNet + getSubAddOn("PREMIUM_SMARTPHONE");
    expect(total).toBe(67);
  });

  it("12) Smart M + SMARTPHONE = 15 + 10 = 25€", () => {
    const smartM = tariffs.find(t => t.id === "BUSINESS_SMART_M");
    const total = smartM!.baseNet + getSubAddOn("SMARTPHONE");
    expect(total).toBe(25);
  });

  it("13) Smart Business Plus + SMARTPHONE = 13 + 10 = 23€", () => {
    const smartBizPlus = tariffs.find(t => t.id === "SMART_BUSINESS_PLUS");
    expect(smartBizPlus).toBeDefined();
    const total = smartBizPlus!.baseNet + getSubAddOn("SMARTPHONE");
    expect(total).toBe(23);
  });

  it("14) TeamDeal XS SIM-only = 9.50€", () => {
    const teamDealXS = tariffs.find(t => t.id === "TEAMDEAL_XS");
    expect(teamDealXS).toBeDefined();
    expect(teamDealXS!.baseNet).toBe(9.50);
  });

  it("15) TeamDeal XL SIM-only = 29.50€", () => {
    const teamDealXL = tariffs.find(t => t.id === "TEAMDEAL_XL");
    expect(teamDealXL).toBeDefined();
    expect(teamDealXL!.baseNet).toBe(29.50);
  });
});

describe("Phase 2: Mobile Facts - allowedSubVariants Filtering", () => {
  it("16) Prime tariffs should allow all 5 SUB variants", () => {
    const primeS = getMobileTariffFromCatalog("business-2025-09", "PRIME_S");
    expect(primeS).toBeDefined();
    expect(primeS!.allowedSubVariants).toHaveLength(5);
    expect(primeS!.allowedSubVariants).toContain("SIM_ONLY");
    expect(primeS!.allowedSubVariants).toContain("BASIC_PHONE");
    expect(primeS!.allowedSubVariants).toContain("SMARTPHONE");
    expect(primeS!.allowedSubVariants).toContain("PREMIUM_SMARTPHONE");
    expect(primeS!.allowedSubVariants).toContain("SPECIAL_PREMIUM_SMARTPHONE");
  });

  it("17) TeamDeal tariffs should only allow SIM_ONLY", () => {
    const teamDealXS = getMobileTariffFromCatalog("business-2025-09", "TEAMDEAL_XS");
    expect(teamDealXS).toBeDefined();
    expect(teamDealXS!.allowedSubVariants).toHaveLength(1);
    expect(teamDealXS!.allowedSubVariants).toContain("SIM_ONLY");
  });

  it("18) Business Smart should allow SIM_ONLY, BASIC_PHONE, SMARTPHONE", () => {
    const smartM = getMobileTariffFromCatalog("business-2025-09", "BUSINESS_SMART_M");
    expect(smartM).toBeDefined();
    expect(smartM!.allowedSubVariants).toHaveLength(3);
    expect(smartM!.allowedSubVariants).toContain("SIM_ONLY");
    expect(smartM!.allowedSubVariants).toContain("BASIC_PHONE");
    expect(smartM!.allowedSubVariants).toContain("SMARTPHONE");
    // Premium variants NOT allowed
    expect(smartM!.allowedSubVariants).not.toContain("PREMIUM_SMARTPHONE");
    expect(smartM!.allowedSubVariants).not.toContain("SPECIAL_PREMIUM_SMARTPHONE");
  });

  it("19) Flex tariffs should only allow SIM_ONLY", () => {
    const smartFlex = getMobileTariffFromCatalog("business-2025-09", "BUSINESS_SMART_S_FLEX");
    expect(smartFlex).toBeDefined();
    expect(smartFlex!.allowedSubVariants).toHaveLength(1);
    expect(smartFlex!.allowedSubVariants).toContain("SIM_ONLY");
  });
});

describe("Phase 2: Mobile Facts - Prime Extended Fields", () => {
  it("20) Prime S should have correct EU/OneNumber/GigaDepot fields", () => {
    const primeS = getMobileTariffFromCatalog("business-2025-09", "PRIME_S");
    expect(primeS).toBeDefined();
    expect(primeS!.dataVolumeGB).toBe(20);
    expect(primeS!.euRoamingHighspeedGB).toBe(45);
    expect(primeS!.roamingPacketZone1GB).toBe(1);
    expect(primeS!.oneNumberIncludedCount).toBe(1);
    expect(primeS!.gigaDepot).toEqual({ status: "optional", priceNet: 3.95 });
  });

  it("21) Prime XL should have unlimited data and included GigaDepot", () => {
    const primeXL = getMobileTariffFromCatalog("business-2025-09", "PRIME_XL");
    expect(primeXL).toBeDefined();
    expect(primeXL!.dataVolumeGB).toBe("unlimited");
    expect(primeXL!.euRoamingHighspeedGB).toBe(95);
    expect(primeXL!.roamingPacketZone1GB).toBe(5);
    expect(primeXL!.gigaDepot).toEqual({ status: "included" });
  });

  it("22) Business Smart should have euRoamingNote instead of numeric EU GB", () => {
    const smartM = getMobileTariffFromCatalog("business-2025-09", "BUSINESS_SMART_M");
    expect(smartM).toBeDefined();
    expect(smartM!.euRoamingHighspeedGB).toBeUndefined();
    expect(smartM!.euRoamingNote).toBe("wie in DE");
  });
});
