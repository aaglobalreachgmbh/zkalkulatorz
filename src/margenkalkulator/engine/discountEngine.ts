// ============================================
// Smart-Engine: Discount Calculation
// Modul 1.2 - TeamDeal, GigaKombi, SOHO Rabatte
// ============================================

import type { Distributor } from "./tariffEngine";

/**
 * Kontext für Rabattberechnung
 */
export interface DiscountContext {
  /** Anzahl Verträge im Angebot */
  contractCount: number;
  /** Hat Kunde bereits Festnetzvertrag? */
  hasFixedNetContract: boolean;
  /** Ist Kunde Einzelunternehmer/Freiberufler? */
  isSOHO: boolean;
  /** Distributor */
  distributor?: Distributor;
}

/**
 * Rabatt-Ergebnis mit Aufschlüsselung
 */
export interface DiscountResult {
  /** TeamDeal-Rabatt in % (auf Airtime) */
  teamDealPercentage: number;
  /** GigaKombi-Rabatt pauschal in € */
  gigaKombiDiscount: number;
  /** SOHO-Rabatt in % (auf Airtime) */
  sohoPercentage: number;
  /** Gesamt-Prozent-Rabatt (TeamDeal + SOHO) */
  totalPercentageDiscount: number;
  /** Aufschlüsselung für UI */
  breakdown: DiscountBreakdownItem[];
}

/**
 * Einzelposten der Rabatt-Aufschlüsselung
 */
export interface DiscountBreakdownItem {
  /** Rabatt-Typ */
  type: "teamdeal" | "gigakombi" | "soho";
  /** Anzeige-Label */
  label: string;
  /** Rabatt-Wert (% oder €) */
  value: number;
  /** Einheit */
  unit: "percent" | "euro";
  /** Beschreibung */
  description: string;
}

// ============================================
// TeamDeal Staffeln
// ============================================

const TEAMDEAL_TIERS = [
  { minContracts: 1, maxContracts: 1, percentage: 0 },
  { minContracts: 2, maxContracts: 4, percentage: 5 },
  { minContracts: 5, maxContracts: 9, percentage: 10 },
  { minContracts: 10, maxContracts: 19, percentage: 15 },
  { minContracts: 20, maxContracts: Infinity, percentage: 20 },
];

// ============================================
// GigaKombi Staffeln
// ============================================

// GigaKombi Business: Pauschal 5€ Rabatt (keine Staffelung)
// + Unlimited Datenvolumen für bis zu 10 Business Prime SIMs
const GIGAKOMBI_DISCOUNT_NET = 5;

// ============================================
// Main Discount Calculation
// ============================================

/**
 * Berechnet alle anwendbaren Rabatte
 */
export function calculateDiscounts(context: DiscountContext): DiscountResult {
  const breakdown: DiscountBreakdownItem[] = [];
  
  // 1. TeamDeal berechnen
  const teamDealPercentage = calculateTeamDealPercentage(context.contractCount);
  if (teamDealPercentage > 0) {
    breakdown.push({
      type: "teamdeal",
      label: `TeamDeal (${context.contractCount} Verträge)`,
      value: teamDealPercentage,
      unit: "percent",
      description: getTeamDealDescription(context.contractCount),
    });
  }

  // 2. GigaKombi berechnen
  let gigaKombiDiscount = 0;
  if (context.hasFixedNetContract) {
    gigaKombiDiscount = calculateGigaKombiDiscount(context.contractCount);
    breakdown.push({
      type: "gigakombi",
      label: "GigaKombi Business",
      value: gigaKombiDiscount,
      unit: "euro",
      description: `${gigaKombiDiscount}€/Monat Rabatt bei Festnetz + Mobilfunk`,
    });
  }

  // 3. SOHO berechnen
  let sohoPercentage = 0;
  if (context.isSOHO) {
    sohoPercentage = 10;
    breakdown.push({
      type: "soho",
      label: "SOHO-Vorteil",
      value: sohoPercentage,
      unit: "percent",
      description: "10% Rabatt für Einzelunternehmer/Freiberufler",
    });
  }

  // Gesamt-Prozent-Rabatt (additiv)
  const totalPercentageDiscount = teamDealPercentage + sohoPercentage;

  return {
    teamDealPercentage,
    gigaKombiDiscount,
    sohoPercentage,
    totalPercentageDiscount,
    breakdown,
  };
}

/**
 * Berechnet TeamDeal-Rabatt basierend auf Vertragsanzahl
 */
export function calculateTeamDealPercentage(contractCount: number): number {
  const tier = TEAMDEAL_TIERS.find(
    (t) => contractCount >= t.minContracts && contractCount <= t.maxContracts
  );
  return tier?.percentage ?? 0;
}

/**
 * Berechnet GigaKombi-Rabatt (pauschal 5€, keine Staffelung)
 * Zusätzlicher Vorteil: Unlimited Datenvolumen für bis zu 10 Prime-SIMs
 */
export function calculateGigaKombiDiscount(_contractCount: number): number {
  // GigaKombi Business: Immer 5€ pauschal, keine Staffelung
  return GIGAKOMBI_DISCOUNT_NET;
}

/**
 * TeamDeal-Beschreibung für UI
 */
export function getTeamDealDescription(contractCount: number): string {
  if (contractCount === 1) return "Kein Mengenrabatt bei Einzelvertrag";
  if (contractCount <= 4) return "5% Rabatt bei 2-4 Verträgen";
  if (contractCount <= 9) return "10% Rabatt bei 5-9 Verträgen";
  if (contractCount <= 19) return "15% Rabatt bei 10-19 Verträgen";
  return "20% Rabatt bei 20+ Verträgen";
}

/**
 * Nächste TeamDeal-Staffel ermitteln
 */
export function getNextTeamDealTier(
  contractCount: number
): { requiredContracts: number; newPercentage: number } | null {
  const currentIndex = TEAMDEAL_TIERS.findIndex(
    (t) => contractCount >= t.minContracts && contractCount <= t.maxContracts
  );
  
  const nextTier = TEAMDEAL_TIERS[currentIndex + 1];
  if (nextTier && nextTier.minContracts !== Infinity) {
    return {
      requiredContracts: nextTier.minContracts,
      newPercentage: nextTier.percentage,
    };
  }
  
  return null;
}

/**
 * Wendet Prozent-Rabatte auf Betrag an
 */
export function applyPercentageDiscount(
  amount: number,
  discountPercentage: number
): number {
  return amount * (1 - discountPercentage / 100);
}

/**
 * Berechnet gesparten Betrag durch Rabatte
 */
export function calculateSavings(
  monthlyAmount: number,
  termMonths: number,
  discounts: DiscountResult
): {
  monthlySavings: number;
  totalSavings: number;
  breakdown: { type: string; monthly: number; total: number }[];
} {
  const breakdown: { type: string; monthly: number; total: number }[] = [];
  
  // Prozent-Rabatte
  if (discounts.totalPercentageDiscount > 0) {
    const monthlySavingsPercent = monthlyAmount * (discounts.totalPercentageDiscount / 100);
    breakdown.push({
      type: "percent",
      monthly: monthlySavingsPercent,
      total: monthlySavingsPercent * termMonths,
    });
  }
  
  // GigaKombi pauschal
  if (discounts.gigaKombiDiscount > 0) {
    breakdown.push({
      type: "gigakombi",
      monthly: discounts.gigaKombiDiscount,
      total: discounts.gigaKombiDiscount * termMonths,
    });
  }
  
  const monthlySavings = breakdown.reduce((sum, b) => sum + b.monthly, 0);
  const totalSavings = breakdown.reduce((sum, b) => sum + b.total, 0);
  
  return { monthlySavings, totalSavings, breakdown };
}
