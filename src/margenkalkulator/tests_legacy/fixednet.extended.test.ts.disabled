// ============================================
// Phase 2 Fixed Net Extended Tests
// ============================================

import { describe, it, expect } from "vitest";
import { 
  listFixedNetByAccessType, 
  getFixedNetProductFromCatalog,
  checkGKEligibility,
  getCatalog,
} from "../engine/catalogResolver";
import { calculateGigaKombi } from "../engine/benefitsEngine";
import { fixedNetDSLProducts } from "../data/business/v2025_09/fixedNetDSL";
import { fixedNetFiberProducts } from "../data/business/v2025_09/fixedNetFiber";
import { 
  komfortRegioPhoneTiers, 
  komfortRegioInternetOptions,
  komfortFTTHPhoneTiers,
  komfortFTTHInternetOptions,
  calculateKomfortMonthly,
} from "../data/business/v2025_09/fixedNetKomfort";
import type { FixedNetState } from "../engine/types";

const DATASET = "business-2025-09" as const;

describe("Phase 2 Slice B: DSL Products", () => {
  it("1) DSL 16 has correct base price 24.95€", () => {
    const product = getFixedNetProductFromCatalog(DATASET, "DSL_16");
    expect(product).toBeDefined();
    expect(product?.monthlyNet).toBe(24.95);
    expect(product?.accessType).toBe("DSL");
  });

  it("2) DSL 250 has correct base price 44.95€", () => {
    const product = getFixedNetProductFromCatalog(DATASET, "DSL_250");
    expect(product).toBeDefined();
    expect(product?.monthlyNet).toBe(44.95);
  });

  it("3) DSL products have router included at 0€", () => {
    const product = getFixedNetProductFromCatalog(DATASET, "DSL_100");
    expect(product?.includesRouter).toBe(true);
    expect(product?.oneTimeNet).toBe(0);
  });

  it("4) DSL products have fixed IP as optional +5€/mo", () => {
    const product = getFixedNetProductFromCatalog(DATASET, "DSL_50");
    expect(product?.fixedIpIncluded).toBe(false);
    expect(product?.fixedIpAddonNet).toBe(5.00);
  });
});

describe("Phase 2 Slice B: Glasfaser Products", () => {
  it("5) Glasfaser 300 has correct base price 44.90€", () => {
    const product = getFixedNetProductFromCatalog(DATASET, "FIBER_300");
    expect(product).toBeDefined();
    expect(product?.monthlyNet).toBe(44.90);
    expect(product?.accessType).toBe("FIBER");
  });

  it("6) Glasfaser 1000 has fixed IP included", () => {
    const product = getFixedNetProductFromCatalog(DATASET, "FIBER_1000");
    expect(product?.fixedIpIncluded).toBe(true);
    expect(product?.monthlyNet).toBe(64.90);
  });
});

describe("Phase 2 Slice B: Komfort-Anschluss Plus", () => {
  it("7) Komfort Regio XL + Internet 100 = 29.90 + 15.00 = 44.90€", () => {
    const phoneTier = komfortRegioPhoneTiers.find(t => t.tier === "XL");
    const internetOpt = komfortRegioInternetOptions.find(o => o.speed === 100);
    
    expect(phoneTier?.monthlyNet).toBe(29.90);
    expect(internetOpt?.addonNet).toBe(15.00);
    
    const total = calculateKomfortMonthly(phoneTier, internetOpt, false);
    expect(total).toBeCloseTo(44.90, 2);
  });

  it("8) Komfort FTTH L + Internet 300 + Fixed IP = 24.90 + 25.00 + 5.00 = 54.90€", () => {
    const phoneTier = komfortFTTHPhoneTiers.find(t => t.tier === "L");
    const internetOpt = komfortFTTHInternetOptions.find(o => o.speed === 300);
    
    const total = calculateKomfortMonthly(phoneTier, internetOpt, true);
    expect(total).toBeCloseTo(54.90, 2);
  });
});

describe("Phase 2 Slice B: Cable Products with new fields", () => {
  it("9) Cable products have accessType=CABLE", () => {
    const products = listFixedNetByAccessType(DATASET, "CABLE");
    expect(products.length).toBeGreaterThan(0);
    products.forEach(p => {
      expect(p.accessType).toBe("CABLE");
    });
  });

  it("10) Cable products have expertSetupAvailable=true", () => {
    const product = getFixedNetProductFromCatalog(DATASET, "RBI_300");
    expect(product?.expertSetupAvailable).toBe(true);
  });

  it("11) Cable 500/1000 have fixed IP included", () => {
    const rbi500 = getFixedNetProductFromCatalog(DATASET, "RBI_500");
    const rbi1000 = getFixedNetProductFromCatalog(DATASET, "RBI_1000");
    expect(rbi500?.fixedIpIncluded).toBe(true);
    expect(rbi1000?.fixedIpIncluded).toBe(true);
  });
});

describe("Phase 2 Slice C: GigaKombi Benefits Engine", () => {
  const catalog = getCatalog(DATASET);
  
  it("12) GK eligible when Prime + Cable", () => {
    const fixedNetState: FixedNetState = {
      enabled: true,
      accessType: "CABLE",
      productId: "RBI_300",
    };
    
    const result = calculateGigaKombi(
      [{ tariffId: "PRIME_M", quantity: 1 }],
      fixedNetState,
      catalog
    );
    
    expect(result.eligible).toBe(true);
    expect(result.unlimitedLinesCount).toBe(1);
  });

  it("13) GK not eligible when Prime + Komfort (not GK-eligible)", () => {
    const fixedNetState: FixedNetState = {
      enabled: true,
      accessType: "KOMFORT_REGIO",
      productId: "KOMFORT_REGIO_L",
    };
    
    const result = calculateGigaKombi(
      [{ tariffId: "PRIME_M", quantity: 1 }],
      fixedNetState,
      catalog
    );
    
    expect(result.eligible).toBe(false);
    expect(result.explanation).toContain("nicht GigaKombi-berechtigt");
  });

  it("14) GK unlimitedLinesCount capped at 10", () => {
    const fixedNetState: FixedNetState = {
      enabled: true,
      accessType: "DSL",
      productId: "DSL_100",
    };
    
    const result = calculateGigaKombi(
      [{ tariffId: "PRIME_L", quantity: 15 }],
      fixedNetState,
      catalog
    );
    
    expect(result.eligible).toBe(true);
    expect(result.unlimitedLinesCount).toBe(10);
    expect(result.explanation).toContain("10 von 15");
  });

  it("15) GK priority: L before M before S", () => {
    const fixedNetState: FixedNetState = {
      enabled: true,
      accessType: "FIBER",
      productId: "FIBER_300",
    };
    
    // Mix of L, M, S - should prioritize L first
    const result = calculateGigaKombi(
      [
        { tariffId: "PRIME_S", quantity: 5 },
        { tariffId: "PRIME_L", quantity: 3 },
        { tariffId: "PRIME_M", quantity: 4 },
      ],
      fixedNetState,
      catalog
    );
    
    expect(result.eligible).toBe(true);
    expect(result.unlimitedLinesCount).toBe(10);
    // First 3 should be L, then 4 M, then 3 S (capped at 10)
    expect(result.primeLinesSorted.slice(0, 3).every(id => id === "PRIME_L")).toBe(true);
    expect(result.primeLinesSorted.slice(3, 7).every(id => id === "PRIME_M")).toBe(true);
  });

  it("16) GK not eligible without fixed net", () => {
    const fixedNetState: FixedNetState = {
      enabled: false,
      productId: "",
    };
    
    const result = calculateGigaKombi(
      [{ tariffId: "PRIME_M", quantity: 1 }],
      fixedNetState,
      catalog
    );
    
    expect(result.eligible).toBe(false);
    expect(result.explanation).toBe("Kein Festnetz gewählt");
  });

  it("17) GK not eligible without Prime tariff", () => {
    const fixedNetState: FixedNetState = {
      enabled: true,
      accessType: "CABLE",
      productId: "RBI_300",
    };
    
    const result = calculateGigaKombi(
      [{ tariffId: "BUSINESS_SMART_M", quantity: 3 }],
      fixedNetState,
      catalog
    );
    
    expect(result.eligible).toBe(false);
    expect(result.explanation).toBe("Kein Business Prime im Angebot");
  });
});

describe("Phase 2: Access Type Filtering", () => {
  const catalog = getCatalog(DATASET);
  
  it("18) listFixedNetByAccessType returns only matching products", () => {
    const dslProducts = listFixedNetByAccessType(DATASET, "DSL");
    const fiberProducts = listFixedNetByAccessType(DATASET, "FIBER");
    const cableProducts = listFixedNetByAccessType(DATASET, "CABLE");
    
    expect(dslProducts.length).toBe(5);  // 5 DSL speeds
    expect(fiberProducts.length).toBe(4); // 4 Fiber speeds
    expect(cableProducts.length).toBe(8); // 4 RBI + 4 RBIP
    
    dslProducts.forEach(p => expect(p.accessType).toBe("DSL"));
    fiberProducts.forEach(p => expect(p.accessType).toBe("FIBER"));
    cableProducts.forEach(p => expect(p.accessType).toBe("CABLE"));
  });

  it("19) checkGKEligibility returns false for Komfort access types", () => {
    const primeTariff = catalog.mobileTariffs.find(t => t.productLine === "PRIME");
    
    expect(checkGKEligibility(primeTariff, true, "CABLE")).toBe(true);
    expect(checkGKEligibility(primeTariff, true, "DSL")).toBe(true);
    expect(checkGKEligibility(primeTariff, true, "FIBER")).toBe(true);
    expect(checkGKEligibility(primeTariff, true, "KOMFORT_REGIO")).toBe(false);
    expect(checkGKEligibility(primeTariff, true, "KOMFORT_FTTH")).toBe(false);
  });
});

describe("Phase 2: Data Integrity", () => {
  it("20) All DSL products have sources defined", () => {
    fixedNetDSLProducts.forEach(product => {
      expect(product.sources).toBeDefined();
      expect(product.sources!.length).toBeGreaterThan(0);
      expect(product.sources![0].url).toContain("vodafone.de");
    });
  });

  it("21) All Fiber products have sources defined", () => {
    fixedNetFiberProducts.forEach(product => {
      expect(product.sources).toBeDefined();
      expect(product.sources!.length).toBeGreaterThan(0);
    });
  });
});
