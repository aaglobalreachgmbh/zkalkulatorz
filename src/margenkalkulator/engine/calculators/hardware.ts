// ============================================
// Hardware Calculation Module
// Handles hardware amortization calculations
// ============================================

// ============================================
// Hardware Amortization
// ============================================

/**
 * Calculate hardware amortization per month
 * @param ekNet - Hardware purchase price (net)
 * @param amortize - Whether to amortize
 * @param amortMonths - Number of months to amortize over
 * @returns Monthly amortization amount (net)
 */
export function calculateHardwareAmortization(
  ekNet: number,
  amortize: boolean,
  amortMonths: number
): number {
  if (!amortize || ekNet <= 0 || amortMonths <= 0) {
    return 0;
  }
  return Math.round((ekNet / amortMonths) * 100) / 100;
}
