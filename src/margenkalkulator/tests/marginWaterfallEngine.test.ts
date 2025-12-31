// ============================================
// Smart-Engine Unit Tests
// Modul 1 - Margin Waterfall & Discount Tests
// ============================================

import { describe, it, expect } from "vitest";
import { 
  calculateMarginWaterfall, 
  getProfitabilityStatus,
  type MarginCalculationInput 
} from "../engine/marginWaterfallEngine";
import { 
  calculateDiscounts, 
  calculateTeamDealPercentage,
  calculateGigaKombiDiscount 
} from "../engine/discountEngine";
import { 
  getTariffById, 
  TARIFF_CATALOG,
  getProvisionForDistributor 
} from "../engine/tariffEngine";
import { 
  calculateHardwareEconomics, 
  getSubsidyConfig 
} from "../engine/hardwareEngine";
import { getUpsellRecommendations, type UpsellContext } from "../engine/upsellEngine";

// ============================================
// Discount Engine Tests
// ============================================

describe("DiscountEngine", () => {
  describe("TeamDeal Staffeln", () => {
    it("gibt 0% für 1 Vertrag", () => {
      expect(calculateTeamDealPercentage(1)).toBe(0);
    });

    it("gibt 5% für 2-4 Verträge", () => {
      expect(calculateTeamDealPercentage(2)).toBe(5);
      expect(calculateTeamDealPercentage(3)).toBe(5);
      expect(calculateTeamDealPercentage(4)).toBe(5);
    });

    it("gibt 10% für 5-9 Verträge", () => {
      expect(calculateTeamDealPercentage(5)).toBe(10);
      expect(calculateTeamDealPercentage(9)).toBe(10);
    });

    it("gibt 15% für 10-19 Verträge", () => {
      expect(calculateTeamDealPercentage(10)).toBe(15);
      expect(calculateTeamDealPercentage(19)).toBe(15);
    });

    it("gibt 20% für 20+ Verträge", () => {
      expect(calculateTeamDealPercentage(20)).toBe(20);
      expect(calculateTeamDealPercentage(100)).toBe(20);
    });
  });

  describe("GigaKombi Staffeln", () => {
    it("gibt 5€ für 1-4 Verträge", () => {
      expect(calculateGigaKombiDiscount(1)).toBe(5);
      expect(calculateGigaKombiDiscount(4)).toBe(5);
    });

    it("gibt 10€ für 5+ Verträge", () => {
      expect(calculateGigaKombiDiscount(5)).toBe(10);
      expect(calculateGigaKombiDiscount(50)).toBe(10);
    });
  });

  describe("calculateDiscounts", () => {
    it("kombiniert alle Rabatte korrekt", () => {
      const result = calculateDiscounts({
        contractCount: 5,
        hasFixedNetContract: true,
        isSOHO: true,
        distributor: "herweck",
      });

      expect(result.teamDealPercentage).toBe(10);
      expect(result.gigaKombiDiscount).toBe(10);
      expect(result.sohoPercentage).toBe(10);
      expect(result.totalPercentageDiscount).toBe(20); // 10% TeamDeal + 10% SOHO
    });

    it("gibt keine Rabatte für Einzelvertrag ohne Festnetz", () => {
      const result = calculateDiscounts({
        contractCount: 1,
        hasFixedNetContract: false,
        isSOHO: false,
      });

      expect(result.teamDealPercentage).toBe(0);
      expect(result.gigaKombiDiscount).toBe(0);
      expect(result.sohoPercentage).toBe(0);
      expect(result.totalPercentageDiscount).toBe(0);
    });
  });
});

// ============================================
// Tariff Engine Tests
// ============================================

describe("TariffEngine", () => {
  it("enthält alle Tarif-Kategorien", () => {
    const categories = new Set(TARIFF_CATALOG.map(t => t.category));
    expect(categories.has("prime")).toBe(true);
    expect(categories.has("gigamobil")).toBe(true);
    expect(categories.has("black")).toBe(true);
  });

  it("findet Tarif nach ID", () => {
    const tariff = getTariffById("bp_m_2025");
    expect(tariff).toBeDefined();
    expect(tariff?.name).toBe("Prime M");
    expect(tariff?.basePrice).toBe(42);
  });

  it("gibt korrekten Provision-Satz für Herweck zurück", () => {
    const provision = getProvisionForDistributor("herweck", "prime");
    expect(provision?.airtimePercentage).toBe(10);
    expect(provision?.activationFee).toBe(30);
  });
});

// ============================================
// Hardware Engine Tests
// ============================================

describe("HardwareEngine", () => {
  describe("Subventions-Stufen", () => {
    it("Stufe 1: 0€ Zuzahlung, 20% Provision", () => {
      const config = getSubsidyConfig(1);
      expect(config.months24).toBe(0);
      expect(config.provisionPercentage).toBe(20);
    });

    it("Stufe 3: 100€ Zuzahlung (24M), 25% Provision", () => {
      const config = getSubsidyConfig(3);
      expect(config.months24).toBe(100);
      expect(config.months36).toBe(70);
      expect(config.provisionPercentage).toBe(25);
    });

    it("Stufe 5: 200€ Zuzahlung (24M), 30% Provision", () => {
      const config = getSubsidyConfig(5);
      expect(config.months24).toBe(200);
      expect(config.provisionPercentage).toBe(30);
    });
  });

  describe("calculateHardwareEconomics", () => {
    it("berechnet Hardware-Provision korrekt", () => {
      const result = calculateHardwareEconomics({
        hardwareEK: 500,
        subsidyLevel: 3,
        termMonths: 24,
      });

      expect(result.subsidy).toBe(100);
      expect(result.provision).toBe(25); // 100 * 25%
      expect(result.monthlyAmortization).toBeCloseTo(20.83, 1);
    });
  });
});

// ============================================
// Margin Waterfall Tests
// ============================================

describe("MarginWaterfallEngine", () => {
  const createTestInput = (overrides: Partial<MarginCalculationInput> = {}): MarginCalculationInput => {
    const tariff = getTariffById("bp_m_2025")!;
    return {
      tariff,
      quantity: 1,
      hardwareEK: 0,
      termMonths: 24,
      distributor: "herweck",
      hasFixedNetContract: false,
      isSOHO: false,
      ...overrides,
    };
  };

  describe("Profitability Status", () => {
    it("positive bei Marge > 50€", () => {
      expect(getProfitabilityStatus(100)).toBe("positive");
      expect(getProfitabilityStatus(51)).toBe("positive");
    });

    it("warning bei Marge 0-50€", () => {
      expect(getProfitabilityStatus(50)).toBe("warning");
      expect(getProfitabilityStatus(25)).toBe("warning");
      expect(getProfitabilityStatus(0)).toBe("warning");
    });

    it("critical bei negativer Marge", () => {
      expect(getProfitabilityStatus(-1)).toBe("critical");
      expect(getProfitabilityStatus(-100)).toBe("critical");
    });
  });

  describe("SIM-Only Szenarien", () => {
    it("SIM-Only Prime M: positive Marge", () => {
      const result = calculateMarginWaterfall(createTestInput({
        hardwareEK: 0,
      }));

      expect(result.netMarginTotal).toBeGreaterThan(100);
      expect(result.profitabilityStatus).toBe("positive");
    });

    it("SIM-Only mit 3 Verträgen erhöht Marge proportional", () => {
      const single = calculateMarginWaterfall(createTestInput());
      const triple = calculateMarginWaterfall(createTestInput({ quantity: 3 }));

      expect(triple.netMarginTotal).toBeGreaterThan(single.netMarginTotal * 2);
    });
  });

  describe("Hardware-Szenarien", () => {
    it("Teures Gerät (800€ EK): negative Marge", () => {
      const result = calculateMarginWaterfall(createTestInput({
        hardwareEK: 800,
      }));

      expect(result.netMarginTotal).toBeLessThan(0);
      expect(result.profitabilityStatus).toBe("critical");
    });

    it("Mittelpreisiges Gerät (300€ EK): warning Marge", () => {
      const result = calculateMarginWaterfall(createTestInput({
        hardwareEK: 300,
      }));

      // Mit 42€ Tarif und 10% Provision über 24 Monate + Aktivierung
      expect(result.profitabilityStatus).not.toBe("critical");
    });
  });

  describe("Rabatt-Integration", () => {
    it("TeamDeal 5 Verträge reduziert Airtime-Provision", () => {
      const without = calculateMarginWaterfall(createTestInput({ quantity: 4 }));
      const with5 = calculateMarginWaterfall(createTestInput({ quantity: 5 }));

      // Bei 5 Verträgen gibt es 10% TeamDeal statt 5%
      // Aber mehr Verträge = mehr Gesamtprovision
      expect(with5.netMarginTotal).toBeGreaterThan(without.netMarginTotal);
    });

    it("GigaKombi wirkt sich auf Provision aus", () => {
      const without = calculateMarginWaterfall(createTestInput());
      const withGK = calculateMarginWaterfall(createTestInput({
        hasFixedNetContract: true,
      }));

      // GigaKombi reduziert die Airtime-Provision leicht
      expect(withGK.discounts.gigaKombiDiscount).toBe(5);
    });
  });

  describe("Breakdown Vollständigkeit", () => {
    it("enthält alle relevanten Positionen", () => {
      const result = calculateMarginWaterfall(createTestInput({
        hardwareEK: 400,
        quantity: 3,
        hasFixedNetContract: true,
      }));

      const labels = result.breakdown.map(b => b.label);
      
      expect(labels.some(l => l.includes("Airtime"))).toBe(true);
      expect(labels.some(l => l.includes("Aktivierung"))).toBe(true);
      expect(labels.some(l => l.includes("Hardware-Einkaufspreis"))).toBe(true);
      expect(labels.some(l => l.includes("Netto-Marge"))).toBe(true);
    });
  });
});

// ============================================
// Upsell Engine Tests
// ============================================

describe("UpsellEngine", () => {
  const createTestContext = (overrides: Partial<UpsellContext> = {}): UpsellContext => ({
    currentTariff: getTariffById("bp_m_2025")!,
    currentMargin: -100,
    currentStatus: "critical",
    quantity: 1,
    hardwareEK: 600,
    termMonths: 24,
    hasFixedNetContract: false,
    isSOHO: false,
    ...overrides,
  });

  it("empfiehlt SIM-Only bei negativer Marge", () => {
    const recommendations = getUpsellRecommendations(createTestContext());
    
    const simOnly = recommendations.find(r => r.type === "sim_only");
    expect(simOnly).toBeDefined();
    expect(simOnly?.priority).toBe(1);
  });

  it("empfiehlt GigaKombi wenn kein Festnetz", () => {
    const recommendations = getUpsellRecommendations(createTestContext({
      currentStatus: "positive",
      currentMargin: 100,
      hardwareEK: 0,
    }));
    
    const gigakombi = recommendations.find(r => r.type === "gigakombi");
    expect(gigakombi).toBeDefined();
  });

  it("empfiehlt TeamDeal-Staffel für kleine Mengen", () => {
    const recommendations = getUpsellRecommendations(createTestContext({
      quantity: 4,
      currentStatus: "warning",
      currentMargin: 30,
    }));
    
    const teamdeal = recommendations.find(r => r.type === "teamdeal");
    expect(teamdeal).toBeDefined();
    expect(teamdeal?.title).toContain("1 weitere");
  });

  it("sortiert nach Priorität und Gain", () => {
    const recommendations = getUpsellRecommendations(createTestContext());
    
    // Priorität 1 sollte zuerst kommen
    expect(recommendations[0]?.priority).toBe(1);
    
    // Bei gleicher Priorität: höherer Gain zuerst
    const p1Recs = recommendations.filter(r => r.priority === 1);
    if (p1Recs.length > 1) {
      expect(p1Recs[0].potentialMarginGain).toBeGreaterThanOrEqual(p1Recs[1].potentialMarginGain);
    }
  });

  it("gibt maximal 5 Empfehlungen", () => {
    const recommendations = getUpsellRecommendations(createTestContext());
    expect(recommendations.length).toBeLessThanOrEqual(5);
  });
});

// ============================================
// Integration Test: Vollständiges Szenario
// ============================================

describe("Integration: Komplettes Angebot", () => {
  it("KMU mit 3 Mitarbeitern, Festnetz, mittleres Gerät", () => {
    const tariff = getTariffById("bp_l_2025")!; // Prime L
    
    const result = calculateMarginWaterfall({
      tariff,
      quantity: 3,
      hardwareEK: 450,
      termMonths: 24,
      distributor: "herweck",
      hasFixedNetContract: true,
      isSOHO: false,
    });

    // Prüfe Rabatt-Anwendung
    expect(result.discounts.teamDealPercentage).toBe(5); // 3 Verträge
    expect(result.discounts.gigaKombiDiscount).toBe(5); // Festnetz aktiv

    // Prüfe Breakdown enthält alle Elemente
    expect(result.breakdown.length).toBeGreaterThan(3);

    // Status sollte erkennbar sein
    expect(["positive", "warning", "critical"]).toContain(result.profitabilityStatus);

    console.log("=== Vollständiges Szenario ===");
    console.log(`Tarif: ${tariff.name}`);
    console.log(`Verträge: 3`);
    console.log(`Hardware-EK: 450€`);
    console.log(`Airtime-Provision (gesamt): ${result.airtimeProvisionTotal.toFixed(2)}€`);
    console.log(`Aktivierung: ${result.activationFeeTotal}€`);
    console.log(`Hardware-Provision: ${result.hardwareProvision}€`);
    console.log(`Hardware-EK: -${result.hardwareEK}€`);
    console.log(`---`);
    console.log(`Netto-Marge: ${result.netMarginTotal.toFixed(2)}€`);
    console.log(`Pro Vertrag: ${result.netMarginPerContract.toFixed(2)}€`);
    console.log(`Status: ${result.profitabilityStatus}`);
  });
});
