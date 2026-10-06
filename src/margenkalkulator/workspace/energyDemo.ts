// ============================================
// Energie-Kreuzgeschäft – ERFUNDENE Beispieltarife (Demo).
// Keine echten Anbieter, Preise oder Provisionen.
// ============================================

export type EnergyKind = "strom" | "gas";

export interface EnergyTariff {
  id: string;
  kind: EnergyKind;
  name: string;
  /** Arbeitspreis netto in €/kWh */
  workPriceNet: number;
  /** Grundpreis netto in €/Monat */
  basePriceNet: number;
  /** geschätzte Händlerprovision (Demo) */
  demoProvision: number;
}

export const ENERGY_TARIFFS: EnergyTariff[] = [
  { id: "s1", kind: "strom", name: "Gewerbestrom Basis (Demo)", workPriceNet: 0.249, basePriceNet: 12.9, demoProvision: 60 },
  { id: "s2", kind: "strom", name: "Gewerbestrom Öko (Demo)", workPriceNet: 0.262, basePriceNet: 9.9, demoProvision: 80 },
  { id: "g1", kind: "gas", name: "Gewerbegas Basis (Demo)", workPriceNet: 0.089, basePriceNet: 14.9, demoProvision: 50 },
  { id: "g2", kind: "gas", name: "Gewerbegas Fix24 (Demo)", workPriceNet: 0.094, basePriceNet: 9.9, demoProvision: 70 },
];

export interface EnergyInput {
  tariffId: string;
  kwhPerYear: number;
  currentMonthlyNet: number;
}

export interface EnergyResult {
  tariff: EnergyTariff;
  monthlyNet: number;
  currentMonthlyNet: number;
  savingMonthly: number;
  saving24: number;
}

export function calcEnergy(input: EnergyInput): EnergyResult | null {
  const tariff = ENERGY_TARIFFS.find((t) => t.id === input.tariffId);
  if (!tariff || !(input.kwhPerYear > 0)) return null;
  const monthlyNet = Math.round(((input.kwhPerYear * tariff.workPriceNet) / 12 + tariff.basePriceNet) * 100) / 100;
  const current = Math.max(0, input.currentMonthlyNet || 0);
  const savingMonthly = current > 0 ? Math.round((current - monthlyNet) * 100) / 100 : 0;
  return { tariff, monthlyNet, currentMonthlyNet: current, savingMonthly, saving24: Math.round(savingMonthly * 24 * 100) / 100 };
}

export const formatEur = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
