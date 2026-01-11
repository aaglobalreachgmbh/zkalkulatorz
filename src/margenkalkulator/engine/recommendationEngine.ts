// ============================================
// Recommendation Engine - Margin-first Empfehlungen
// Phase 3: Recommendation Layer
// ============================================

import type { 
  OfferOptionState, 
  CalculationResult, 
  MobileTariff,
  ContractType,
  Catalog,
} from "./types";
import { calculateOffer } from "./offer";
import { getCatalog } from "./catalogResolver";

// ============================================
// Types
// ============================================

export type RecommendationScore = "margin" | "customerPrice" | "balanced";

export interface TariffRecommendation {
  tariffId: string;
  subVariantId: string;
  promoId: string;
  tariffName: string;
  scores: {
    marginScore: number;      // 0-100
    priceScore: number;       // 0-100
    balancedScore: number;    // 0-100
  };
  calculatedResult: CalculationResult;
  explanation: string;
  rank: number;
  /** Margin difference from current config */
  marginDelta: number;
  /** Monthly price difference from current config */
  priceDelta: number;
}

export interface RecommendationOptions {
  /** Exclude negative margin candidates (default: true) */
  excludeNegativeMargin?: boolean;
  /** Maximum results to return (default: 3) */
  maxResults?: number;
  /** Minimum margin threshold */
  minMargin?: number;
  /** Only same product line */
  sameProductLineOnly?: boolean;
  /** Include current config in comparison */
  includeCurrentConfig?: boolean;
}

// ============================================
// Score Calculation
// ============================================

/**
 * Berechnet Scores für einen Tarif-Kandidaten
 */
function scoreTariffCandidate(
  result: CalculationResult,
  baseResult: CalculationResult,
  allResults: CalculationResult[]
): { marginScore: number; priceScore: number } {
  // Margin Score: Higher margin = higher score
  const margins = allResults.map(r => r.dealer.margin);
  const minMargin = Math.min(...margins);
  const maxMargin = Math.max(...margins);
  const marginRange = maxMargin - minMargin || 1;
  const marginScore = ((result.dealer.margin - minMargin) / marginRange) * 100;
  
  // Price Score: Lower price = higher score (inverted)
  const prices = allResults.map(r => r.totals.avgTermNet);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const priceScore = ((maxPrice - result.totals.avgTermNet) / priceRange) * 100;
  
  return {
    marginScore: Math.max(0, Math.min(100, marginScore)),
    priceScore: Math.max(0, Math.min(100, priceScore)),
  };
}

/**
 * Berechnet Balance-Score (Gewichtung Marge + Preis)
 */
function calculateBalancedScore(marginScore: number, priceScore: number): number {
  // 60% Marge, 40% Preis für Händler-optimierte Balance
  return marginScore * 0.6 + priceScore * 0.4;
}

// ============================================
// Explanation Generation
// ============================================

function generateExplanation(
  rec: Partial<TariffRecommendation>,
  scoreType: RecommendationScore
): string {
  const margin = rec.calculatedResult?.dealer.margin ?? 0;
  const price = rec.calculatedResult?.totals.avgTermNet ?? 0;
  
  switch (scoreType) {
    case "margin":
      if (margin > 200) {
        return `Sehr hohe Marge von ${margin.toFixed(0)}€ - optimale Händlerrendite`;
      }
      if (margin > 100) {
        return `Gute Marge von ${margin.toFixed(0)}€ bei fairer Kundenkonditionen`;
      }
      if (margin >= 0) {
        return `Positive Marge von ${margin.toFixed(0)}€ - solides Angebot`;
      }
      return `Negative Marge - Hardware-Subvention von ${Math.abs(margin).toFixed(0)}€`;
      
    case "customerPrice":
      return `Attraktiver Monatspreis von ${price.toFixed(2)}€ für den Kunden`;
      
    case "balanced":
      return `Ausgewogenes Verhältnis: ${price.toFixed(2)}€/Monat bei ${margin.toFixed(0)}€ Marge`;
      
    default:
      return "";
  }
}

// ============================================
// Main Recommendation Function
// ============================================

/**
 * Generiert Top-N Empfehlungen basierend auf Score-Typ
 */
export function generateRecommendations(
  baseConfig: OfferOptionState,
  scoreType: RecommendationScore = "margin",
  options: RecommendationOptions = {}
): TariffRecommendation[] {
  const {
    excludeNegativeMargin = true,
    maxResults = 3,
    minMargin = -Infinity,
    sameProductLineOnly = false,
    includeCurrentConfig = false,
  } = options;
  
  // Lade Dataset
  const dataset: Catalog = getCatalog(baseConfig.meta.datasetVersion);
  if (!dataset?.mobileTariffs) {
    console.warn("[RecommendationEngine] No dataset available");
    return [];
  }
  
  // Berechne Basis-Ergebnis
  const baseResult = calculateOffer(baseConfig);
  
  // Sammle alle Kandidaten
  const candidates: Array<{
    tariff: MobileTariff;
    config: OfferOptionState;
    result: CalculationResult;
  }> = [];
  
  // Filtere Tarife
  const currentTariff = dataset.mobileTariffs.find(t => t.id === baseConfig.mobile.tariffId);
  const tariffs = sameProductLineOnly && currentTariff?.productLine
    ? dataset.mobileTariffs.filter(t => t.productLine === currentTariff.productLine)
    : dataset.mobileTariffs;
  
  for (const tariff of tariffs) {
    // Skip TeamDeal (benötigt Prime-Check)
    if (tariff.productLine === "TEAMDEAL") continue;
    
    // Erstelle Config-Variante
    const candidateConfig: OfferOptionState = {
      ...baseConfig,
      mobile: {
        ...baseConfig.mobile,
        tariffId: tariff.id,
        // Keep other settings (subVariant, promo, etc.)
      },
    };
    
    try {
      const result = calculateOffer(candidateConfig);
      
      // Filter: Negative Marge?
      if (excludeNegativeMargin && result.dealer.margin < 0) {
        continue;
      }
      
      // Filter: Mindestmarge?
      if (result.dealer.margin < minMargin) {
        continue;
      }
      
      candidates.push({ tariff, config: candidateConfig, result });
    } catch (e) {
      console.warn(`[RecommendationEngine] Error calculating ${tariff.id}:`, e);
    }
  }
  
  // Berechne Scores
  const allResults = candidates.map(c => c.result);
  
  const scored: TariffRecommendation[] = candidates.map(({ tariff, config, result }) => {
    const { marginScore, priceScore } = scoreTariffCandidate(result, baseResult, allResults);
    const balancedScore = calculateBalancedScore(marginScore, priceScore);
    
    return {
      tariffId: tariff.id,
      tariffName: tariff.name,
      subVariantId: config.mobile.subVariantId,
      promoId: config.mobile.promoId,
      scores: { marginScore, priceScore, balancedScore },
      calculatedResult: result,
      marginDelta: result.dealer.margin - baseResult.dealer.margin,
      priceDelta: result.totals.avgTermNet - baseResult.totals.avgTermNet,
      explanation: "",
      rank: 0,
    };
  });
  
  // Sortiere nach gewähltem Score-Typ
  const sortKey = `${scoreType}Score` as keyof TariffRecommendation["scores"];
  scored.sort((a, b) => b.scores[sortKey] - a.scores[sortKey]);
  
  // Skip current config if not included
  const filtered = includeCurrentConfig
    ? scored
    : scored.filter(s => s.tariffId !== baseConfig.mobile.tariffId);
  
  // Top N mit Erklärungen
  const topN = filtered.slice(0, maxResults).map((rec, index) => ({
    ...rec,
    rank: index + 1,
    explanation: generateExplanation(rec, scoreType),
  }));
  
  return topN;
}

// ============================================
// Quick Recommendation Helpers
// ============================================

/**
 * Schnelle Empfehlung für maximale Marge
 */
export function getMaxMarginRecommendation(
  baseConfig: OfferOptionState
): TariffRecommendation | null {
  const recs = generateRecommendations(baseConfig, "margin", { maxResults: 1 });
  return recs[0] ?? null;
}

/**
 * Schnelle Empfehlung für besten Kundenpreis
 */
export function getBestPriceRecommendation(
  baseConfig: OfferOptionState
): TariffRecommendation | null {
  const recs = generateRecommendations(baseConfig, "customerPrice", { 
    maxResults: 1,
    excludeNegativeMargin: false, // Bei Preis-Optimierung auch negative Marge
  });
  return recs[0] ?? null;
}

/**
 * Vergleicht aktuelle Config mit Empfehlungen
 */
export function compareWithRecommendations(
  baseConfig: OfferOptionState,
  maxComparisons: number = 3
): {
  current: CalculationResult;
  recommendations: TariffRecommendation[];
  potentialMarginGain: number;
} {
  const current = calculateOffer(baseConfig);
  const recommendations = generateRecommendations(baseConfig, "margin", {
    maxResults: maxComparisons,
    excludeNegativeMargin: true,
  });
  
  const bestRecommendation = recommendations[0];
  const potentialMarginGain = bestRecommendation
    ? bestRecommendation.calculatedResult.dealer.margin - current.dealer.margin
    : 0;
  
  return {
    current,
    recommendations,
    potentialMarginGain: Math.max(0, potentialMarginGain),
  };
}

export default {
  generateRecommendations,
  getMaxMarginRecommendation,
  getBestPriceRecommendation,
  compareWithRecommendations,
};
