import { describe, it, expect } from "vitest";
import {
  normalizeTeamDealRows,
  validateTeamDealRows,
  diffTeamDeal,
  type TeamDealRow,
} from "../../dataManager/importers/teamDealImporter";

describe("TeamDeal Importer", () => {
  describe("normalizeTeamDealRows", () => {
    it("normalizes raw XLSX rows to TeamDealRow format", () => {
      const rawRows = [
        {
          id: "TEAMDEAL_XS",
          tier: "XS",
          datenvolumen_gb: 10,
          preis_sim_only: "9,50",
          preis_sub5: "14,50",
          preis_sub10: "19,50",
          provision_sim: 55,
          provision_sub5: 120,
          provision_sub10: 170,
          aktiv: "ja",
        },
      ];

      const result = normalizeTeamDealRows(rawRows);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("TEAMDEAL_XS");
      expect(result[0].tier).toBe("XS");
      expect(result[0].dataVolumeGB).toBe(10);
      expect(result[0].priceSIMOnly).toBe(9.5);
      expect(result[0].priceSUB5).toBe(14.5);
      expect(result[0].priceSUB10).toBe(19.5);
      expect(result[0].provisionSIMOnly).toBe(55);
      expect(result[0].provisionSUB5).toBe(120);
      expect(result[0].provisionSUB10).toBe(170);
      expect(result[0].active).toBe(true);
    });
  });

  describe("validateTeamDealRows", () => {
    it("validates valid TeamDeal rows", () => {
      const rows: TeamDealRow[] = [
        {
          id: "TEAMDEAL_XS",
          tier: "XS",
          dataVolumeGB: 10,
          priceSIMOnly: 9.5,
          priceSUB5: 14.5,
          priceSUB10: 19.5,
          provisionSIMOnly: 55,
          provisionSUB5: 120,
          provisionSUB10: 170,
          active: true,
        },
      ];

      const result = validateTeamDealRows(rows);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("detects missing required fields", () => {
      const rows: TeamDealRow[] = [
        {
          id: "",
          tier: "XS",
          dataVolumeGB: 10,
          priceSIMOnly: 9.5,
          priceSUB5: 14.5,
          priceSUB10: 19.5,
          provisionSIMOnly: 55,
          provisionSUB5: 120,
          provisionSUB10: 170,
          active: true,
        },
      ];

      const result = validateTeamDealRows(rows);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "id" || e.message.includes("ID"))).toBe(true);
    });

    it("detects duplicate IDs", () => {
      const rows: TeamDealRow[] = [
        {
          id: "TEAMDEAL_XS",
          tier: "XS",
          dataVolumeGB: 10,
          priceSIMOnly: 9.5,
          priceSUB5: 14.5,
          priceSUB10: 19.5,
          provisionSIMOnly: 55,
          provisionSUB5: 120,
          provisionSUB10: 170,
          active: true,
        },
        {
          id: "TEAMDEAL_XS",
          tier: "S",
          dataVolumeGB: 25,
          priceSIMOnly: 12.5,
          priceSUB5: 17.5,
          priceSUB10: 22.5,
          provisionSIMOnly: 85,
          provisionSUB5: 160,
          provisionSUB10: 225,
          active: true,
        },
      ];

      const result = validateTeamDealRows(rows);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes("Duplikat") || e.message.includes("doppelt"))).toBe(true);
    });
  });

  describe("diffTeamDeal", () => {
    it("detects added tariffs", () => {
      const current: TeamDealRow[] = [
        {
          id: "TEAMDEAL_XS",
          tier: "XS",
          dataVolumeGB: 10,
          priceSIMOnly: 9.5,
          priceSUB5: 14.5,
          priceSUB10: 19.5,
          provisionSIMOnly: 55,
          provisionSUB5: 120,
          provisionSUB10: 170,
          active: true,
        },
      ];

      const next: TeamDealRow[] = [
        ...current,
        {
          id: "TEAMDEAL_S",
          tier: "S",
          dataVolumeGB: 25,
          priceSIMOnly: 12.5,
          priceSUB5: 17.5,
          priceSUB10: 22.5,
          provisionSIMOnly: 85,
          provisionSUB5: 160,
          provisionSUB10: 225,
          active: true,
        },
      ];

      const result = diffTeamDeal(current, next);

      expect(result.summary.added).toBe(1);
      expect(result.summary.changed).toBe(0);
      expect(result.summary.removed).toBe(0);
    });

    it("detects changed provisions", () => {
      const current: TeamDealRow[] = [
        {
          id: "TEAMDEAL_XS",
          tier: "XS",
          dataVolumeGB: 10,
          priceSIMOnly: 9.5,
          priceSUB5: 14.5,
          priceSUB10: 19.5,
          provisionSIMOnly: 55,
          provisionSUB5: 120,
          provisionSUB10: 170,
          active: true,
        },
      ];

      const next: TeamDealRow[] = [
        {
          id: "TEAMDEAL_XS",
          tier: "XS",
          dataVolumeGB: 10,
          priceSIMOnly: 9.5,
          priceSUB5: 14.5,
          priceSUB10: 19.5,
          provisionSIMOnly: 60, // Changed
          provisionSUB5: 125,   // Changed
          provisionSUB10: 180,  // Changed
          active: true,
        },
      ];

      const result = diffTeamDeal(current, next);

      expect(result.summary.changed).toBe(1);
    });

    it("detects removed tariffs", () => {
      const current: TeamDealRow[] = [
        {
          id: "TEAMDEAL_XS",
          tier: "XS",
          dataVolumeGB: 10,
          priceSIMOnly: 9.5,
          priceSUB5: 14.5,
          priceSUB10: 19.5,
          provisionSIMOnly: 55,
          provisionSUB5: 120,
          provisionSUB10: 170,
          active: true,
        },
      ];

      const next: TeamDealRow[] = [];

      const result = diffTeamDeal(current, next);

      expect(result.summary.removed).toBe(1);
    });
  });
});
