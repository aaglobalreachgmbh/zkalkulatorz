import { describe, it, expect } from "vitest";
import {
  normalizeFixedNetRows,
  validateFixedNetRows,
  diffFixedNet,
} from "../../dataManager/importers/fixedNetImporter";
import type { FixedNetProductRow } from "../../dataManager/types";

describe("FixedNet Importer", () => {
  describe("normalizeFixedNetRows", () => {
    it("normalizes raw XLSX rows to FixedNetProductRow format", () => {
      const rawRows = [
        {
          id: "CABLE_250",
          name: "Red Internet & Phone 250 Cable",
          zugangsart: "CABLE",
          speed: 250,
          mtl_netto: "29,99",
          router_included: "ja",
          aktiv: "ja",
        },
      ];

      const result = normalizeFixedNetRows(rawRows);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("CABLE_250");
      expect(result[0].name).toBe("Red Internet & Phone 250 Cable");
      expect(result[0].access_type).toBe("CABLE");
      expect(result[0].speed).toBe(250);
      expect(result[0].monthly_net).toBe(29.99);
      expect(result[0].router_included).toBe(true);
      expect(result[0].active).toBe(true);
    });

    it("handles various access types", () => {
      const rawRows = [
        { id: "DSL_100", name: "DSL 100", zugangsart: "DSL", speed: 100, mtl_netto: 34.99, router_included: "ja", aktiv: "ja" },
        { id: "FIBER_500", name: "Fiber 500", zugangsart: "FIBER", speed: 500, mtl_netto: 49.99, router_included: "ja", aktiv: "ja" },
        { id: "KOMFORT_100", name: "Komfort 100", zugangsart: "KOMFORT_REGIO", speed: 100, mtl_netto: 59.99, router_included: "ja", aktiv: "ja" },
      ];

      const result = normalizeFixedNetRows(rawRows);

      expect(result[0].access_type).toBe("DSL");
      expect(result[1].access_type).toBe("FIBER");
      expect(result[2].access_type).toBe("KOMFORT_REGIO");
    });
  });

  describe("validateFixedNetRows", () => {
    it("validates valid fixed net products", () => {
      const rows: FixedNetProductRow[] = [
        {
          id: "CABLE_250",
          name: "Red Internet & Phone 250 Cable",
          access_type: "CABLE",
          minTermMonths: 24,
          monthly_net: 29.99,
          speed: 250,
          router_included: true,
          one_time_setup_net: 0,
          one_time_shipping_net: 8.4,
          fixed_ip_included: false,
          active: true,
        },
      ];

      const result = validateFixedNetRows(rows);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("detects missing required fields", () => {
      const rows: FixedNetProductRow[] = [
        {
          id: "",
          name: "Test",
          access_type: "CABLE",
          minTermMonths: 24,
          monthly_net: 29.99,
          speed: 250,
          router_included: true,
          one_time_setup_net: 0,
          one_time_shipping_net: 8.4,
          fixed_ip_included: false,
          active: true,
        },
      ];

      const result = validateFixedNetRows(rows);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "id")).toBe(true);
    });

    it("detects invalid access types", () => {
      const rows: FixedNetProductRow[] = [
        {
          id: "INVALID_1",
          name: "Invalid Product",
          access_type: "INVALID",
          minTermMonths: 24,
          monthly_net: 29.99,
          speed: 250,
          router_included: true,
          one_time_setup_net: 0,
          one_time_shipping_net: 8.4,
          fixed_ip_included: false,
          active: true,
        },
      ];

      const result = validateFixedNetRows(rows);

      expect(result.isValid).toBe(false);
    });

    it("detects duplicate IDs", () => {
      const baseRow: FixedNetProductRow = {
        id: "CABLE_250",
        name: "Red Internet & Phone 250 Cable",
        access_type: "CABLE",
        minTermMonths: 24,
        monthly_net: 29.99,
        speed: 250,
        router_included: true,
        one_time_setup_net: 0,
        one_time_shipping_net: 8.4,
        fixed_ip_included: false,
        active: true,
      };

      const rows: FixedNetProductRow[] = [baseRow, { ...baseRow }];

      const result = validateFixedNetRows(rows);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes("Duplikat") || e.message.includes("doppelt") || e.message.includes("Doppelte"))).toBe(true);
    });
  });

  describe("diffFixedNet", () => {
    const baseProduct: FixedNetProductRow = {
      id: "CABLE_250",
      name: "Red Internet & Phone 250 Cable",
      access_type: "CABLE",
      minTermMonths: 24,
      monthly_net: 29.99,
      speed: 250,
      router_included: true,
      one_time_setup_net: 0,
      one_time_shipping_net: 8.4,
      fixed_ip_included: false,
      active: true,
    };

    it("detects added products", () => {
      const current: FixedNetProductRow[] = [baseProduct];
      const next: FixedNetProductRow[] = [
        baseProduct,
        { ...baseProduct, id: "CABLE_500", name: "Cable 500", speed: 500 },
      ];

      const result = diffFixedNet(current, next);

      expect(result.summary.added).toBe(1);
    });

    it("detects changed products", () => {
      const current: FixedNetProductRow[] = [baseProduct];
      const next: FixedNetProductRow[] = [
        { ...baseProduct, monthly_net: 34.99 },
      ];

      const result = diffFixedNet(current, next);

      expect(result.summary.changed).toBe(1);
    });

    it("detects removed products", () => {
      const current: FixedNetProductRow[] = [
        baseProduct,
        { ...baseProduct, id: "CABLE_500", name: "Cable 500" },
      ];
      const next: FixedNetProductRow[] = [baseProduct];

      const result = diffFixedNet(current, next);

      expect(result.summary.removed).toBe(1);
    });

    it("returns empty diff for identical data", () => {
      const current: FixedNetProductRow[] = [baseProduct];
      const next: FixedNetProductRow[] = [{ ...baseProduct }];

      const result = diffFixedNet(current, next);

      expect(result.summary.added).toBe(0);
      expect(result.summary.changed).toBe(0);
      expect(result.summary.removed).toBe(0);
    });
  });
});
