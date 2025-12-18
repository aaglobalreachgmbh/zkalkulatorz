// ============================================
// Data Manager Tests
// Tests for validation, diff, and adapter logic
// ============================================

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { 
  validateParsedSheets,
  validateDataset,
  type ValidationResult 
} from "../dataManager/validator";
import { diffDatasets, type DiffResult } from "../dataManager/diff";
import { mapCanonicalToCatalog, transformToCanonical } from "../dataManager/adapter";
import type { CanonicalDataset, ParsedSheets } from "../dataManager/types";

describe("Data Manager - Validator", () => {
  describe("validateParsedSheets", () => {
    it("catches missing meta sheet", () => {
      const sheets: ParsedSheets = {};
      const result = validateParsedSheets(sheets);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.sheet === "meta")).toBe(true);
    });

    it("catches missing required fields in mobile_tariffs", () => {
      const sheets: ParsedSheets = {
        meta: [{ datasetversion: "test-v1", validfromiso: "2025-01-01" }],
        mobile_tariffs: [
          { id: "T1", name: "Test" }, // missing base_sim_only_net and family
        ],
      };
      const result = validateParsedSheets(sheets);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "base_sim_only_net")).toBe(true);
    });

    it("catches duplicate IDs in mobile_tariffs", () => {
      const sheets: ParsedSheets = {
        meta: [{ datasetversion: "test-v1", validfromiso: "2025-01-01" }],
        mobile_tariffs: [
          { id: "T1", family: "prime", name: "Test1", base_sim_only_net: 10 },
          { id: "T1", family: "prime", name: "Test2", base_sim_only_net: 20 },
        ],
      };
      const result = validateParsedSheets(sheets);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes("Doppelte ID"))).toBe(true);
    });

    it("catches negative prices", () => {
      const sheets: ParsedSheets = {
        meta: [{ datasetversion: "test-v1", validfromiso: "2025-01-01" }],
        mobile_tariffs: [
          { id: "T1", family: "prime", name: "Test", base_sim_only_net: -10 },
        ],
      };
      const result = validateParsedSheets(sheets);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes("Negativ"))).toBe(true);
    });

    it("validates successfully with correct data", () => {
      const sheets: ParsedSheets = {
        meta: [{ datasetversion: "test-v1", validfromiso: "2025-01-01" }],
        mobile_tariffs: [
          { id: "T1", family: "prime", name: "Prime S", base_sim_only_net: 29 },
          { id: "T2", family: "prime", name: "Prime M", base_sim_only_net: 42 },
        ],
        sub_variants: [
          { id: "SIM_ONLY", label: "SIM only", monthly_add_net: 0 },
        ],
      };
      const result = validateParsedSheets(sheets);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("catches invalid foreign key references", () => {
      const sheets: ParsedSheets = {
        meta: [{ datasetversion: "test-v1", validfromiso: "2025-01-01" }],
        mobile_tariffs: [
          { id: "T1", family: "prime", name: "Test", base_sim_only_net: 29 },
        ],
        mobile_features: [
          { tariff_id: "T_NONEXISTENT", key: "feature1", label_short: "Test Feature" },
        ],
      };
      const result = validateParsedSheets(sheets);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes("Ungültige Referenz"))).toBe(true);
    });
  });

  describe("validateDataset", () => {
    it("catches missing datasetVersion", () => {
      const dataset: Partial<CanonicalDataset> = {
        meta: { validFromISO: "2025-01-01", verifiedAtISO: "2025-01-01" } as any,
      };
      const result = validateDataset(dataset);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "datasetVersion")).toBe(true);
    });

    it("catches duplicate tariff IDs", () => {
      const dataset: Partial<CanonicalDataset> = {
        meta: { datasetVersion: "test-v1", validFromISO: "2025-01-01", verifiedAtISO: "2025-01-01" },
        mobileTariffs: [
          { id: "T1", family: "prime", name: "Test1", base_sim_only_net: 10, minTermMonths: 24, data_de: 20, eu_rule: "numeric", active: true },
          { id: "T1", family: "prime", name: "Test2", base_sim_only_net: 20, minTermMonths: 24, data_de: 50, eu_rule: "numeric", active: true },
        ],
      };
      const result = validateDataset(dataset);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes("Doppelte ID"))).toBe(true);
    });
  });
});

describe("Data Manager - Diff", () => {
  it("detects added items", () => {
    const current = { mobileTariffs: [{ id: "T1" }] };
    const next = { mobileTariffs: [{ id: "T1" }, { id: "T2" }] };
    const result = diffDatasets(
      current as Record<string, { id: string }[]>,
      next as Record<string, { id: string }[]>
    );
    expect(result.added.length).toBe(1);
    expect(result.added[0].id).toBe("T2");
    expect(result.summary.totalAdded).toBe(1);
  });

  it("detects removed items with breakingRisk", () => {
    const current = { mobileTariffs: [{ id: "T1" }, { id: "T2" }] };
    const next = { mobileTariffs: [{ id: "T1" }] };
    const result = diffDatasets(
      current as Record<string, { id: string }[]>,
      next as Record<string, { id: string }[]>
    );
    expect(result.removed.length).toBe(1);
    expect(result.removed[0].id).toBe("T2");
    expect(result.breakingRisk).toBe(true);
    expect(result.summary.totalRemoved).toBe(1);
  });

  it("detects changed fields", () => {
    const current = { mobileTariffs: [{ id: "T1", name: "Old Name", baseNet: 29 }] };
    const next = { mobileTariffs: [{ id: "T1", name: "New Name", baseNet: 29 }] };
    const result = diffDatasets(
      current as Record<string, { id: string }[]>,
      next as Record<string, { id: string }[]>
    );
    expect(result.changed.length).toBe(1);
    expect(result.changed[0].id).toBe("T1");
    expect(result.changed[0].changes?.[0].field).toBe("name");
    expect(result.changed[0].changes?.[0].oldValue).toBe("Old Name");
    expect(result.changed[0].changes?.[0].newValue).toBe("New Name");
  });

  it("reports no changes for identical datasets", () => {
    const data = { mobileTariffs: [{ id: "T1", name: "Test", baseNet: 29 }] };
    const result = diffDatasets(
      data as Record<string, { id: string }[]>,
      data as Record<string, { id: string }[]>
    );
    expect(result.added).toHaveLength(0);
    expect(result.changed).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.breakingRisk).toBe(false);
  });

  it("handles multiple entity types", () => {
    const current = {
      mobileTariffs: [{ id: "M1" }],
      fixedNetProducts: [{ id: "F1" }, { id: "F2" }],
    };
    const next = {
      mobileTariffs: [{ id: "M1" }, { id: "M2" }],
      fixedNetProducts: [{ id: "F1" }],
    };
    const result = diffDatasets(
      current as Record<string, { id: string }[]>,
      next as Record<string, { id: string }[]>
    );
    expect(result.summary.totalAdded).toBe(1); // M2 added
    expect(result.summary.totalRemoved).toBe(1); // F2 removed
    expect(result.breakingRisk).toBe(true);
  });
});

describe("Data Manager - Adapter", () => {
  it("transforms parsed sheets to canonical format", () => {
    const sheets: ParsedSheets = {
      meta: [{ datasetversion: "test-v1", validfromiso: "2025-01-01", verifiedatiso: "2025-01-01" }],
      mobile_tariffs: [
        { id: "PRIME_S", family: "prime", name: "Prime S", base_sim_only_net: 29, data_de: 20, eu_rule: "numeric", eu_data_gb: 45, active: true },
      ],
      sub_variants: [
        { id: "SIM_ONLY", label: "SIM only", monthly_add_net: 0 },
      ],
    };
    
    const canonical = transformToCanonical(sheets);
    
    expect(canonical.meta.datasetVersion).toBe("test-v1");
    expect(canonical.mobileTariffs).toHaveLength(1);
    expect(canonical.mobileTariffs[0].id).toBe("PRIME_S");
    expect(canonical.mobileTariffs[0].base_sim_only_net).toBe(29);
    expect(canonical.subVariants).toHaveLength(1);
  });

  it("maps canonical format to catalog format", () => {
    const canonical: CanonicalDataset = {
      meta: { datasetVersion: "test-v1", validFromISO: "2025-01-01", verifiedAtISO: "2025-01-01" },
      subVariants: [{ id: "SIM_ONLY", label: "SIM only", monthly_add_net: 0 }],
      mobileTariffs: [{
        id: "PRIME_S",
        family: "prime",
        name: "Prime S",
        base_sim_only_net: 29,
        data_de: 20,
        eu_rule: "numeric",
        eu_data_gb: 45,
        active: true,
        minTermMonths: 24,
      }],
      fixedNetProducts: [],
      promos: [],
      hardwareCatalog: [],
      mobileFeatures: [],
      mobileDependencies: [],
    };
    
    const catalog = mapCanonicalToCatalog(canonical);
    
    expect(catalog.version).toBe("test-v1");
    expect(catalog.mobileTariffs).toHaveLength(1);
    expect(catalog.mobileTariffs[0].baseNet).toBe(29);
    expect(catalog.mobileTariffs[0].euRoamingHighspeedGB).toBe(45);
    expect(catalog.mobileTariffs[0].dataVolumeGB).toBe(20);
    expect(catalog.subVariants).toHaveLength(1);
    expect(catalog.subVariants[0].monthlyAddNet).toBe(0);
  });

  it("builds allowedSubVariants from SUB add prices", () => {
    const canonical: CanonicalDataset = {
      meta: { datasetVersion: "test-v1", validFromISO: "2025-01-01", verifiedAtISO: "2025-01-01" },
      subVariants: [],
      mobileTariffs: [{
        id: "T1",
        family: "prime",
        name: "Test",
        base_sim_only_net: 29,
        sub_basic_add_net: 5,
        sub_smartphone_add_net: 10,
        sub_premium_add_net: null,
        sub_special_premium_add_net: null,
        data_de: 20,
        eu_rule: "numeric",
        active: true,
        minTermMonths: 24,
      }],
      fixedNetProducts: [],
      promos: [],
      hardwareCatalog: [],
      mobileFeatures: [],
      mobileDependencies: [],
    };
    
    const catalog = mapCanonicalToCatalog(canonical);
    const tariff = catalog.mobileTariffs[0];
    
    expect(tariff.allowedSubVariants).toContain("SIM_ONLY");
    expect(tariff.allowedSubVariants).toContain("BASIC_PHONE");
    expect(tariff.allowedSubVariants).toContain("SMARTPHONE");
    expect(tariff.allowedSubVariants).not.toContain("PREMIUM_SMARTPHONE");
    expect(tariff.allowedSubVariants).not.toContain("SPECIAL_PREMIUM_SMARTPHONE");
  });

  it("filters out inactive tariffs", () => {
    const canonical: CanonicalDataset = {
      meta: { datasetVersion: "test-v1", validFromISO: "2025-01-01", verifiedAtISO: "2025-01-01" },
      subVariants: [],
      mobileTariffs: [
        { id: "T1", family: "prime", name: "Active", base_sim_only_net: 29, data_de: 20, eu_rule: "numeric", active: true, minTermMonths: 24 },
        { id: "T2", family: "prime", name: "Inactive", base_sim_only_net: 39, data_de: 50, eu_rule: "numeric", active: false, minTermMonths: 24 },
      ],
      fixedNetProducts: [],
      promos: [],
      hardwareCatalog: [],
      mobileFeatures: [],
      mobileDependencies: [],
    };
    
    const catalog = mapCanonicalToCatalog(canonical);
    
    expect(catalog.mobileTariffs).toHaveLength(1);
    expect(catalog.mobileTariffs[0].id).toBe("T1");
  });

  it("handles unlimited data volume", () => {
    const canonical: CanonicalDataset = {
      meta: { datasetVersion: "test-v1", validFromISO: "2025-01-01", verifiedAtISO: "2025-01-01" },
      subVariants: [],
      mobileTariffs: [{
        id: "T1",
        family: "prime",
        name: "Unlimited",
        base_sim_only_net: 59,
        data_de: "unlimited",
        eu_rule: "numeric",
        eu_data_gb: 95,
        active: true,
        minTermMonths: 24,
      }],
      fixedNetProducts: [],
      promos: [],
      hardwareCatalog: [],
      mobileFeatures: [],
      mobileDependencies: [],
    };
    
    const catalog = mapCanonicalToCatalog(canonical);
    
    expect(catalog.mobileTariffs[0].dataVolumeGB).toBe("unlimited");
  });
});
