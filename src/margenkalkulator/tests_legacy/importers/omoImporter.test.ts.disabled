import { describe, it, expect } from "vitest";
import {
  normalizeOMORows,
  validateOMOMatrixRows,
  diffOMOMatrix,
  toEngineOMOMatrix,
  parseOMOValue,
} from "../../dataManager/importers/omoImporter";
import type { OMOMatrixRow } from "../../dataManager/types";

describe("OMO Matrix Importer", () => {
  describe("parseOMOValue", () => {
    it("parses numeric values", () => {
      expect(parseOMOValue(450)).toBe(450);
      expect(parseOMOValue("337.50")).toBe(337.5);
      expect(parseOMOValue("337,50")).toBe(337.5);
    });

    it("returns null for locked values", () => {
      expect(parseOMOValue("-")).toBeNull();
      expect(parseOMOValue("x")).toBeNull();
      expect(parseOMOValue("X")).toBeNull();
      expect(parseOMOValue("locked")).toBeNull();
      expect(parseOMOValue("")).toBeNull();
      expect(parseOMOValue(null)).toBeNull();
      expect(parseOMOValue(undefined)).toBeNull();
    });
  });

  describe("normalizeOMORows", () => {
    it("normalizes raw XLSX rows to OMOMatrixRow format", () => {
      const rawRows = [
        {
          tarif_id: "PRIME_M",
          omo_0: 450,
          omo_5: "427,50",
          omo_10: 405,
          omo_15: "382.50",
          omo_17_5: 371.25,
          omo_20: 360,
          omo_25: "337,50",
        },
      ];

      const result = normalizeOMORows(rawRows);

      expect(result).toHaveLength(1);
      expect(result[0].tariff_id).toBe("PRIME_M");
      expect(result[0].omo_0).toBe(450);
      expect(result[0].omo_5).toBe(427.5);
      expect(result[0].omo_10).toBe(405);
      expect(result[0].omo_15).toBe(382.5);
      expect(result[0].omo_17_5).toBe(371.25);
      expect(result[0].omo_20).toBe(360);
      expect(result[0].omo_25).toBe(337.5);
    });

    it("handles locked values as null", () => {
      const rawRows = [
        {
          tarif_id: "PRIME_S",
          omo_0: 350,
          omo_5: 332.5,
          omo_10: 315,
          omo_15: "-",
          omo_17_5: "-",
          omo_20: "x",
          omo_25: "locked",
        },
      ];

      const result = normalizeOMORows(rawRows);

      expect(result[0].omo_0).toBe(350);
      expect(result[0].omo_15).toBeNull();
      expect(result[0].omo_17_5).toBeNull();
      expect(result[0].omo_20).toBeNull();
      expect(result[0].omo_25).toBeNull();
    });
  });

  describe("validateOMOMatrixRows", () => {
    it("validates valid OMO matrix", () => {
      const rows: OMOMatrixRow[] = [
        {
          tariff_id: "PRIME_M",
          omo_0: 450,
          omo_5: 427.5,
          omo_10: 405,
          omo_15: 382.5,
          omo_17_5: 371.25,
          omo_20: 360,
          omo_25: 337.5,
        },
      ];

      const result = validateOMOMatrixRows(rows);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("detects duplicate tariff IDs", () => {
      const rows: OMOMatrixRow[] = [
        {
          tariff_id: "PRIME_M",
          omo_0: 450,
          omo_5: 427.5,
          omo_10: 405,
          omo_15: 382.5,
          omo_17_5: 371.25,
          omo_20: 360,
          omo_25: 337.5,
        },
        {
          tariff_id: "PRIME_M",
          omo_0: 450,
          omo_5: 427.5,
          omo_10: 405,
          omo_15: 382.5,
          omo_17_5: 371.25,
          omo_20: 360,
          omo_25: 337.5,
        },
      ];

      const result = validateOMOMatrixRows(rows);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes("Duplikat") || e.message.includes("doppelt"))).toBe(true);
    });
  });

  describe("diffOMOMatrix", () => {
    it("detects added tariffs", () => {
      const current: OMOMatrixRow[] = [
        {
          tariff_id: "PRIME_M",
          omo_0: 450,
          omo_5: 427.5,
          omo_10: 405,
          omo_15: 382.5,
          omo_17_5: 371.25,
          omo_20: 360,
          omo_25: 337.5,
        },
      ];

      const next: OMOMatrixRow[] = [
        ...current,
        {
          tariff_id: "PRIME_L",
          omo_0: 550,
          omo_5: 522.5,
          omo_10: 495,
          omo_15: 467.5,
          omo_17_5: 453.75,
          omo_20: 440,
          omo_25: 412.5,
        },
      ];

      const result = diffOMOMatrix(current, next);

      expect(result.summary.added).toBe(1);
    });

    it("detects changed values", () => {
      const current: OMOMatrixRow[] = [
        {
          tariff_id: "PRIME_M",
          omo_0: 450,
          omo_5: 427.5,
          omo_10: 405,
          omo_15: 382.5,
          omo_17_5: 371.25,
          omo_20: 360,
          omo_25: 337.5,
        },
      ];

      const next: OMOMatrixRow[] = [
        {
          tariff_id: "PRIME_M",
          omo_0: 460, // Changed
          omo_5: 437,  // Changed
          omo_10: 405,
          omo_15: 382.5,
          omo_17_5: 371.25,
          omo_20: 360,
          omo_25: 337.5,
        },
      ];

      const result = diffOMOMatrix(current, next);

      expect(result.summary.changed).toBe(1);
    });
  });

  describe("toEngineOMOMatrix", () => {
    it("converts OMOMatrixRow to engine format", () => {
      const row: OMOMatrixRow = {
        tariff_id: "PRIME_M",
        omo_0: 450,
        omo_5: 427.5,
        omo_10: 405,
        omo_15: 382.5,
        omo_17_5: 371.25,
        omo_20: 360,
        omo_25: 337.5,
      };

      const result = toEngineOMOMatrix(row);

      expect(result[0]).toBe(450);
      expect(result[5]).toBe(427.5);
      expect(result[10]).toBe(405);
      expect(result[15]).toBe(382.5);
      expect(result[17.5]).toBe(371.25);
      expect(result[20]).toBe(360);
      expect(result[25]).toBe(337.5);
    });

    it("preserves null values for locked rates", () => {
      const row: OMOMatrixRow = {
        tariff_id: "PRIME_S",
        omo_0: 350,
        omo_5: 332.5,
        omo_10: 315,
        omo_15: null,
        omo_17_5: null,
        omo_20: null,
        omo_25: null,
      };

      const result = toEngineOMOMatrix(row);

      expect(result[0]).toBe(350);
      expect(result[15]).toBeNull();
      expect(result[20]).toBeNull();
      expect(result[25]).toBeNull();
    });
  });
});
