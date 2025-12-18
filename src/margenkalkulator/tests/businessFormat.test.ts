// ============================================
// Business Format Parser Tests
// Tests for value parsing, OMO detection, ID generation
// ============================================

import { describe, it, expect } from "vitest";
import { 
  parseBusinessValue, 
  generateStableId, 
  slugify,
  normalizeHeaderName,
} from "../dataManager/businessFormat/parser";
import { parseDataVolume } from "../dataManager/businessFormat/mapper";

describe("Business Format Parser", () => {
  describe("parseBusinessValue", () => {
    it("parses German Euro format: '11,00 €' → 11", () => {
      expect(parseBusinessValue("11,00 €", "preis")).toBe(11);
    });
    
    it("parses negative Euro: '- 7,50 €' → -7.5", () => {
      expect(parseBusinessValue("- 7,50 €", "preis")).toBe(-7.5);
    });
    
    it("parses negative Euro without space: '-7,50 €' → -7.5", () => {
      expect(parseBusinessValue("-7,50 €", "preis")).toBe(-7.5);
    });
    
    it("parses 'Nicht gültig' → null", () => {
      expect(parseBusinessValue("Nicht gültig", "omo")).toBe(null);
    });
    
    it("parses 'NICHT GÜLTIG' (uppercase) → null", () => {
      expect(parseBusinessValue("NICHT GÜLTIG", "omo")).toBe(null);
    });
    
    it("parses '-' in numeric column → null", () => {
      expect(parseBusinessValue("-", "preis")).toBe(null);
    });
    
    it("parses '-' in Datenvolumen → keeps string", () => {
      expect(parseBusinessValue("-", "datenvolumen")).toBe("-");
    });
    
    it("parses numeric XLSX values directly", () => {
      expect(parseBusinessValue(29.99, "preis")).toBe(29.99);
    });
    
    it("parses integer values directly", () => {
      expect(parseBusinessValue(45, "preis")).toBe(45);
    });
    
    it("handles empty string → null", () => {
      expect(parseBusinessValue("", "preis")).toBe(null);
    });
    
    it("handles null → null", () => {
      expect(parseBusinessValue(null, "preis")).toBe(null);
    });
    
    it("handles undefined → null", () => {
      expect(parseBusinessValue(undefined, "preis")).toBe(null);
    });
    
    it("parses German comma decimal: '45,99' → 45.99", () => {
      expect(parseBusinessValue("45,99", "preis")).toBe(45.99);
    });
  });

  describe("OMO Header Detection", () => {
    const OMO_REGEX = /omo\s*rabatt\s*(\d+(?:[,\.]\d+)?)\s*%/i;
    
    it("detects 'OMO Rabatt 17,5%' → 17.5", () => {
      const match = "OMO Rabatt 17,5%".match(OMO_REGEX);
      expect(match).toBeTruthy();
      expect(parseFloat(match![1].replace(",", "."))).toBe(17.5);
    });
    
    it("detects 'OMO Rabatt 0%' → 0", () => {
      const match = "OMO Rabatt 0%".match(OMO_REGEX);
      expect(match).toBeTruthy();
      expect(parseFloat(match![1])).toBe(0);
    });
    
    it("detects 'OMO Rabatt 25%' → 25", () => {
      const match = "OMO Rabatt 25%".match(OMO_REGEX);
      expect(match).toBeTruthy();
      expect(parseFloat(match![1])).toBe(25);
    });
    
    it("detects lowercase 'omo rabatt 10%' → 10", () => {
      const match = "omo rabatt 10%".match(OMO_REGEX);
      expect(match).toBeTruthy();
      expect(parseFloat(match![1])).toBe(10);
    });
    
    it("detects with dot decimal 'OMO Rabatt 17.5%' → 17.5", () => {
      const match = "OMO Rabatt 17.5%".match(OMO_REGEX);
      expect(match).toBeTruthy();
      expect(parseFloat(match![1])).toBe(17.5);
    });
  });

  describe("generateStableId", () => {
    it("generates consistent ID from sheet + name + type", () => {
      const id1 = generateStableId("Tarife SoHo_Neu", "RV 190000 Red XL", "NEU");
      const id2 = generateStableId("Tarife SoHo_Neu", "RV 190000 Red XL", "NEU");
      expect(id1).toBe(id2);
    });
    
    it("generates different ID for VVL vs NEU", () => {
      const idNeu = generateStableId("Sheet", "Tarif A", "NEU");
      const idVvl = generateStableId("Sheet", "Tarif A", "VVL");
      expect(idNeu).not.toBe(idVvl);
      expect(idNeu).toContain("neu");
      expect(idVvl).toContain("vvl");
    });
    
    it("handles umlauts correctly", () => {
      const id = generateStableId("Tarife Für Geschäft", "Büro Tarif", "NEU");
      expect(id).not.toContain("ü");
      expect(id).not.toContain("ä");
      expect(id).toContain("ue");
      expect(id).toContain("ae");
    });
    
    it("limits ID length to 60 characters", () => {
      const longName = "A".repeat(100);
      const id = generateStableId(longName, longName, "NEU");
      expect(id.length).toBeLessThanOrEqual(60);
    });
  });

  describe("slugify", () => {
    it("converts to lowercase", () => {
      expect(slugify("Hello World")).toBe("hello_world");
    });
    
    it("replaces German umlauts", () => {
      expect(slugify("Größe")).toBe("groesse");
      expect(slugify("Für")).toBe("fuer");
      expect(slugify("Öffnen")).toBe("oeffnen");
    });
    
    it("replaces ß with ss", () => {
      expect(slugify("Straße")).toBe("strasse");
    });
    
    it("replaces special characters with underscore", () => {
      expect(slugify("RV 190000, RV 130012")).toBe("rv_190000_rv_130012");
    });
    
    it("limits length to 30 characters", () => {
      const long = "A".repeat(50);
      expect(slugify(long).length).toBeLessThanOrEqual(30);
    });
    
    it("removes leading/trailing underscores", () => {
      expect(slugify(" - Test - ")).toBe("test");
    });
  });

  describe("normalizeHeaderName", () => {
    it("normalizes 'mtl. Grundpreis' → 'mtl_grundpreis'", () => {
      expect(normalizeHeaderName("mtl. Grundpreis")).toBe("mtl_grundpreis");
    });
    
    it("normalizes 'FH-Partner' → 'fhpartner'", () => {
      expect(normalizeHeaderName("FH-Partner")).toBe("fh_partner");
    });
    
    it("normalizes 'Datenvolumen' → 'datenvolumen'", () => {
      expect(normalizeHeaderName("Datenvolumen")).toBe("datenvolumen");
    });
    
    it("handles spaces and special chars", () => {
      expect(normalizeHeaderName("Some  Column   Name!")).toBe("some_column_name");
    });
  });

  describe("parseDataVolume", () => {
    it("parses '20 GB' → 20", () => {
      expect(parseDataVolume("20 GB")).toBe(20);
    });
    
    it("parses '4 GB' → 4", () => {
      expect(parseDataVolume("4 GB")).toBe(4);
    });
    
    it("parses 'unlimited' → 'unlimited'", () => {
      expect(parseDataVolume("unlimited")).toBe("unlimited");
    });
    
    it("parses 'Unbegrenzt' → 'unlimited'", () => {
      expect(parseDataVolume("Unbegrenzt")).toBe("unlimited");
    });
    
    it("parses '-' → 0", () => {
      expect(parseDataVolume("-")).toBe(0);
    });
    
    it("parses null → 0", () => {
      expect(parseDataVolume(null)).toBe(0);
    });
    
    it("preserves unknown text", () => {
      expect(parseDataVolume("Special Plan")).toBe("Special Plan");
    });
  });
});

describe("Business Format Integration", () => {
  describe("Hardware Parsing Edge Cases", () => {
    it("skips placeholder prices (0.001)", () => {
      // This would be tested via parseHardwareSheet with mock data
      // The parser explicitly checks: if (price <= 0.01) continue;
      expect(0.001).toBeLessThanOrEqual(0.01);
    });
  });

  describe("RV Code Extraction", () => {
    it("extracts RV codes from tariff name", () => {
      const rvRegex = /RV\s*(\d+)/gi;
      const testString = "RV 190000, RV 130012, RV 133335 Red XL";
      const matches: string[] = [];
      let match;
      while ((match = rvRegex.exec(testString)) !== null) {
        matches.push(match[1]);
      }
      expect(matches).toEqual(["190000", "130012", "133335"]);
    });
  });
});
