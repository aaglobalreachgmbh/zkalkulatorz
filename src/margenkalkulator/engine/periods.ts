// ============================================
// Period Management - Phase 1
// ============================================

import type { Period, Money } from "./types";

/**
 * Represents a period boundary (start or end of a promo)
 */
type PeriodBoundary = {
  month: number;
  source: string;
};

/**
 * Calculate gross from net using VAT rate
 */
export function calculateGross(net: number, vatRate: number): number {
  return Math.round((net * (1 + vatRate)) * 100) / 100;
}

/**
 * Create a Money object from net value
 */
export function createMoney(net: number, vatRate: number): Money {
  return {
    net: Math.round(net * 100) / 100,
    gross: calculateGross(net, vatRate),
  };
}

/**
 * Generate period label in German
 */
export function generatePeriodLabel(fromMonth: number, toMonth: number): string {
  if (fromMonth === toMonth) {
    return `Monat ${fromMonth}`;
  }
  return `Monat ${fromMonth}–${toMonth}`;
}

/**
 * Collect all unique period boundaries from different promo durations
 * Always includes month 1 as start and termMonths as end
 */
export function collectPeriodBoundaries(
  termMonths: number,
  mobilePromoDuration: number,
  fixedPromoDuration: number
): number[] {
  const boundaries = new Set<number>();
  
  // Always start at month 1
  boundaries.add(1);
  
  // Always end at termMonths
  boundaries.add(termMonths + 1); // +1 because we use it as exclusive end
  
  // Add mobile promo boundary
  if (mobilePromoDuration > 0 && mobilePromoDuration < termMonths) {
    boundaries.add(mobilePromoDuration + 1);
  }
  
  // Add fixed promo boundary
  if (fixedPromoDuration > 0 && fixedPromoDuration < termMonths) {
    boundaries.add(fixedPromoDuration + 1);
  }
  
  return Array.from(boundaries).sort((a, b) => a - b);
}

/**
 * Create periods from boundaries
 */
export function createPeriodsFromBoundaries(
  boundaries: number[],
  getMonthlyCost: (fromMonth: number, toMonth: number) => number,
  vatRate: number
): Period[] {
  const periods: Period[] = [];
  
  for (let i = 0; i < boundaries.length - 1; i++) {
    const fromMonth = boundaries[i];
    const toMonth = boundaries[i + 1] - 1; // -1 because boundaries are exclusive ends
    
    const monthlyNet = getMonthlyCost(fromMonth, toMonth);
    
    periods.push({
      fromMonth,
      toMonth,
      monthly: createMoney(monthlyNet, vatRate),
      label: generatePeriodLabel(fromMonth, toMonth),
    });
  }
  
  return periods;
}

/**
 * Calculate the total cost over all periods
 */
export function calculateTotalFromPeriods(periods: Period[]): { net: number; gross: number } {
  let totalNet = 0;
  let totalGross = 0;
  
  for (const period of periods) {
    const months = period.toMonth - period.fromMonth + 1;
    totalNet += period.monthly.net * months;
    totalGross += period.monthly.gross * months;
  }
  
  return {
    net: Math.round(totalNet * 100) / 100,
    gross: Math.round(totalGross * 100) / 100,
  };
}

/**
 * Calculate the weighted average monthly cost
 */
export function calculateAverageMonthly(periods: Period[], termMonths: number): number {
  const total = calculateTotalFromPeriods(periods);
  return Math.round((total.net / termMonths) * 100) / 100;
}
