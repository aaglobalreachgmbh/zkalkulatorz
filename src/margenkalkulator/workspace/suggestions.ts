// ============================================
// Vorschlagslogik für den Kalkulator-Einstieg (rein, ohne Engine-Eingriff)
// Gerät + Fokusprofil + Katalog → sortierte Tarif-/Aktionsvorschläge.
// Keine Preise werden berechnet; nur Auswahlhilfe. Kein throw.
// ============================================
import type { MobileTariff, Promo } from "../engine/types";

export type FocusGoal = "marge" | "vvl" | "festnetz" | "energie" | "einsteiger" | "premium";

export interface FocusProfile {
  goals: FocusGoal[];
  /** Tarif-IDs, die der Betrieb bevorzugt anbietet (leer = alle) */
  preferredTariffIds: string[];
}

export const DEFAULT_FOCUS: FocusProfile = { goals: ["marge"], preferredTariffIds: [] };

export const FOCUS_LABELS: Record<FocusGoal, string> = {
  marge: "Marge sichern",
  vvl: "Vertragsverlängerungen",
  festnetz: "Festnetz dazu",
  energie: "Strom/Gas Kreuzgeschäft",
  einsteiger: "Günstige Einstiegstarife",
  premium: "Premium & unbegrenzte Daten",
};

export type DeviceClass = "simonly" | "einstieg" | "mittel" | "premium";

/** Grobe Geräteklasse aus dem Netto-EK (nur für Vorschläge). */
export function deviceClassFromEk(ekNet: number): DeviceClass {
  if (!ekNet || ekNet <= 0) return "simonly";
  if (ekNet < 300) return "einstieg";
  if (ekNet < 750) return "mittel";
  return "premium";
}

export interface TariffSuggestion {
  tariff: MobileTariff;
  score: number;
  reasons: string[];
}

const TIER_RANK: Record<string, number> = { XS: 1, S: 2, M: 3, L: 4, XL: 5 };

/**
 * Bewertet Tarife für ein Gerät. Rein deterministisch, gleiche Eingabe → gleiche Ausgabe.
 */
export function suggestTariffs(
  ekNet: number,
  tariffs: MobileTariff[],
  focus: FocusProfile = DEFAULT_FOCUS,
  limit = 3,
  opts: { showDealerReasons?: boolean } = {},
): TariffSuggestion[] {
  const showDealer = opts.showDealerReasons ?? false;
  const cls = deviceClassFromEk(ekNet);
  const wantTier = cls === "premium" ? 4 : cls === "mittel" ? 3 : 2;
  const valid = (tariffs ?? []).filter(
    (t) => t && t.productLine !== "TEAMDEAL" && (t.minTermMonths ?? 24) >= 12,
  );
  // Business-Kalkulator: Privatkunden-Linien nur, wenn sonst nichts da ist oder Hausfavorit
  const business = valid.filter(
    (t) => !["GIGAMOBIL", "CONSUMER_SMART"].includes(t.productLine ?? "") || focus.preferredTariffIds.includes(t.id),
  );
  const pool = business.length ? business : valid;
  const scored = pool.map((t) => {
    const reasons: string[] = [];
    let score = 0;
    const tier = TIER_RANK[t.tier ?? "M"] ?? 3;
    score += 10 - Math.abs(tier - wantTier) * 3;
    if (Math.abs(tier - wantTier) === 0) reasons.push("passt zur Geräteklasse");
    if (focus.preferredTariffIds.includes(t.id)) {
      score += 6;
      reasons.push("Hausfavorit");
    }
    if (focus.goals.includes("marge")) {
      score += Math.min(6, (t.provisionBase ?? 0) / 100);
      if (showDealer && (t.provisionBase ?? 0) >= 300) reasons.push("starke Provision");
    }
    if (focus.goals.includes("premium") && t.dataVolumeGB === "unlimited") {
      score += 4;
      reasons.push("unbegrenzte Daten");
    }
    if (focus.goals.includes("einsteiger")) {
      score += Math.max(0, 5 - (t.baseNet ?? 0) / 10);
      if ((t.baseNet ?? 0) < 25) reasons.push("günstiger Einstieg");
    }
    if (focus.goals.includes("vvl") && (t.provisionRenewal ?? 0) > 0) score += 1;
    if (t.productLine === "PRIME") reasons.push("GigaKombi-fähig");
    return { tariff: t, score: Math.round(score * 10) / 10, reasons: reasons.slice(0, 3) };
  });
  return scored.sort((a, b) => b.score - a.score || a.tariff.id.localeCompare(b.tariff.id)).slice(0, limit);
}

/** Aktionen, die für mindestens einen der Tarife gelten (ohne "NONE"). */
export function suggestPromos(promos: Promo[], tariffIds: string[], limit = 3): Promo[] {
  return (promos ?? [])
    .filter((p) => p && p.id !== "NONE" && p.appliesTo !== "fixed")
    .filter((p) => {
      const ids = (p as Promo & { tariffIds?: string[] | "*" }).tariffIds;
      return !ids || ids === "*" || (Array.isArray(ids) && ids.some((id) => tariffIds.includes(id)));
    })
    .slice(0, limit);
}

/** Sub-Variante passend zur Geräteklasse, nur wenn im Katalog vorhanden. */
export function suggestSubVariant(ekNet: number, available: string[]): string {
  const cls = deviceClassFromEk(ekNet);
  const order: Record<DeviceClass, string[]> = {
    simonly: ["SIM_ONLY"],
    einstieg: ["BASIC_PHONE", "SUB5", "SMARTPHONE"],
    mittel: ["SMARTPHONE", "SUB10"],
    premium: ["PREMIUM_SMARTPHONE", "SPECIAL_PREMIUM_SMARTPHONE", "SUB10", "SMARTPHONE"],
  };
  return order[cls].find((id) => available.includes(id)) ?? available[0] ?? "SIM_ONLY";
}
