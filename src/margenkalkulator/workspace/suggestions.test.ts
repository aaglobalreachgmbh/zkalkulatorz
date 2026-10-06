import { describe, it, expect } from "vitest";
import { deviceClassFromEk, suggestTariffs, suggestSubVariant } from "./suggestions";
import type { MobileTariff } from "../engine/types";

const t = (id: string, tier: MobileTariff["tier"], prov: number, base = 30): MobileTariff =>
  ({ id, name: id, baseNet: base, features: [], provisionBase: prov, deductionRate: 0, tier }) as MobileTariff;

describe("suggestions", () => {
  it("classifies devices", () => {
    expect(deviceClassFromEk(0)).toBe("simonly");
    expect(deviceClassFromEk(900)).toBe("premium");
  });
  it("is deterministic and prefers matching tier", () => {
    const list = [t("S", "S", 100), t("L", "L", 100), t("M", "M", 100)];
    const a = suggestTariffs(900, list);
    expect(a[0].tariff.id).toBe("L");
    expect(suggestTariffs(900, list)).toEqual(a);
  });
  it("boosts preferred tariffs", () => {
    const list = [t("S", "S", 100), t("L", "L", 100)];
    const r = suggestTariffs(900, list, { goals: [], preferredTariffIds: ["S"] });
    expect(r[0].tariff.id).toBe("L");
    expect(r.find((x) => x.tariff.id === "S")?.reasons).toContain("Hausfavorit");
  });
  it("picks available sub variant", () => {
    expect(suggestSubVariant(900, ["SIM_ONLY", "SUB10"])).toBe("SUB10");
  });
});
