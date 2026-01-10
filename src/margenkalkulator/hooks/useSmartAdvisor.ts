// ============================================
// Smart-Advisor Hook
// React hook für Tarifempfehlungen
// ============================================

import { useMemo } from "react";
import type { OfferOptionState, CalculationResult } from "../engine/types";
import {
  findOptimalConfigurations,
  hasOptimizationPotential,
  getQuickOptimizationHint,
  type SmartAdvisorResult,
  type SmartAdvisorConstraints,
} from "../engine/smartAdvisorEngine";

export interface UseSmartAdvisorOptions {
  enabled?: boolean;
  constraints?: SmartAdvisorConstraints;
}

export interface UseSmartAdvisorReturn extends SmartAdvisorResult {
  isEnabled: boolean;
  quickHint: string | null;
  hasQuickPotential: boolean;
}

/**
 * Hook für Smart-Advisor Empfehlungen
 * 
 * @param currentConfig - Aktuelle Angebotskonfiguration
 * @param currentResult - Aktuelles Berechnungsergebnis
 * @param options - Optionale Einstellungen
 * @returns Empfehlungen und Hilfsfunktionen
 */
export function useSmartAdvisor(
  currentConfig: OfferOptionState | null,
  currentResult: CalculationResult | null,
  options: UseSmartAdvisorOptions = {}
): UseSmartAdvisorReturn {
  const { enabled = true, constraints = {} } = options;

  // Quick check für Badge (ohne vollständige Berechnung)
  const hasQuickPotential = useMemo(() => {
    if (!enabled || !currentConfig || !currentResult) return false;
    return hasOptimizationPotential(currentConfig, currentResult);
  }, [enabled, currentConfig, currentResult]);

  // Quick hint für Tooltip
  const quickHint = useMemo(() => {
    if (!enabled || !currentConfig || !currentResult) return null;
    return getQuickOptimizationHint(currentConfig, currentResult);
  }, [enabled, currentConfig, currentResult]);

  // Vollständige Empfehlungen (nur wenn Quick-Check positiv)
  const advisorResult = useMemo<SmartAdvisorResult>(() => {
    if (!enabled || !currentConfig || !currentResult) {
      return {
        recommendations: [],
        hasBetterOptions: false,
        bestRecommendation: null,
        currentBaseline: { customerMonthly: 0, dealerMargin: 0 },
      };
    }

    // Nur vollständige Berechnung wenn Quick-Check positiv
    if (!hasQuickPotential) {
      return {
        recommendations: [],
        hasBetterOptions: false,
        bestRecommendation: null,
        currentBaseline: {
          customerMonthly: currentResult.totals.avgTermNet,
          dealerMargin: currentResult.dealer.margin,
        },
      };
    }

    return findOptimalConfigurations(currentConfig, currentResult, constraints);
  }, [enabled, currentConfig, currentResult, hasQuickPotential, constraints]);

  return {
    ...advisorResult,
    isEnabled: enabled,
    quickHint,
    hasQuickPotential,
  };
}
