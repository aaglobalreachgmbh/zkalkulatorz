// ============================================
// KI-Experte: useAiOfferAnalysis Hook
// Modul 3 - Intelligente Verkaufsargumente
// ============================================

import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { OfferOptionState, CalculationResult } from "@/margenkalkulator/engine/types";
import { getUpsellRecommendations, type UpsellRecommendation, type UpsellContext } from "@/margenkalkulator/engine/upsellEngine";
import { bridgeToMarginWaterfall, createUpsellContext, type BridgeOptions } from "@/margenkalkulator/engine/marginBridge";
import { getTariffById } from "@/margenkalkulator/engine/tariffEngine";

// ============================================
// Types
// ============================================

export interface AiSuggestion {
  type: "hardware" | "tariff_upgrade" | "gigakombi" | "teamdeal" | "soho" | "sim_only" | "promo";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  potentialGain: number;
  estimatedTime: "< 1 Minute" | "1-5 Minuten" | "> 5 Minuten";
  actionSteps: string[];
  id: string;
  applied?: boolean;
}

export interface AiAnalysis {
  overallScore: "good" | "warning" | "critical";
  marginStatus: {
    status: "positive" | "negative" | "low";
    amount: number;
    perContract: number;
    message: string;
  };
  suggestions: AiSuggestion[];
  summary: string;
}

export interface UseAiOfferAnalysisReturn {
  analysis: AiAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
  analyzeOffer: () => Promise<void>;
  applyRecommendation: (suggestion: AiSuggestion) => Partial<OfferOptionState> | null;
  combinedRecommendations: AiSuggestion[];
  trackOutcome: (suggestionId: string, wasApplied: boolean, actualGain?: number) => void;
  appliedSuggestions: Set<string>;
  simulatedMargin: number | null;
  reset: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export function useAiOfferAnalysis(
  config: OfferOptionState,
  result: CalculationResult
): UseAiOfferAnalysisReturn {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [simulatedMargin, setSimulatedMargin] = useState<number | null>(null);

  // Get local upsell recommendations
  const localRecommendations = useMemo(() => {
    const tariff = getTariffById(config.mobile.tariffId);
    if (!tariff) return [];
    
    const bridgeOptions: BridgeOptions = {
      tariffId: config.mobile.tariffId,
      quantity: config.mobile.quantity,
      hardwareEK: config.hardware.ekNet,
      termMonths: 24,
      hasFixedNetContract: config.fixedNet.enabled,
      isSOHO: false,
    };
    
    const marginOutput = bridgeToMarginWaterfall(bridgeOptions);
    if (!marginOutput) return [];
    
    const upsellContext = createUpsellContext(bridgeOptions, marginOutput);
    if (!upsellContext) return [];
    
    return getUpsellRecommendations(upsellContext);
  }, [config]);

  // Convert local recommendations to AI format
  const localToAiFormat = useCallback((recs: UpsellRecommendation[]): AiSuggestion[] => {
    return recs.map((rec, i) => ({
      id: `local-${rec.type}-${i}`,
      type: rec.type as AiSuggestion["type"],
      priority: rec.priority === 1 ? "high" : rec.priority === 2 ? "medium" : "low",
      title: rec.title,
      description: rec.description,
      potentialGain: rec.potentialMarginGain,
      estimatedTime: rec.type === "hardware_downgrade" || rec.type === "sim_only" 
        ? "< 1 Minute" 
        : rec.type === "tariff_upgrade" || rec.type === "gigakombi" 
          ? "1-5 Minuten" 
          : "> 5 Minuten",
      actionSteps: [rec.action],
    }));
  }, []);

  // Analyze offer with AI
  const analyzeOffer = useCallback(async () => {
    if (!user) return;
    
    if (!navigator.onLine) {
      setError("Keine Internetverbindung");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);

    try {
      // Build margin data for AI using bridge
      const bridgeOptions: BridgeOptions = {
        tariffId: config.mobile.tariffId,
        quantity: config.mobile.quantity,
        hardwareEK: config.hardware.ekNet,
        termMonths: 24,
        hasFixedNetContract: config.fixedNet.enabled,
        isSOHO: false,
      };
      const marginOutput = bridgeToMarginWaterfall(bridgeOptions);
      
      const hw = config.hardware as { selectedId?: string; id?: string; brand?: string; model?: string; ekNet?: number };
      
      const response = await supabase.functions.invoke("ai-offer-check", {
        body: {
          hardware: {
            selectedId: hw?.selectedId || hw?.id,
            brand: hw?.brand,
            model: hw?.model,
            ekNet: hw?.ekNet,
          },
          mobile: {
            tariffId: config.mobile.tariffId,
            tariffName: config.mobile.tariffId, // Will be resolved by tariff engine
            subVariantId: config.mobile.subVariantId,
            contractType: config.mobile.contractType,
            quantity: config.mobile.quantity,
            promoId: config.mobile.promoId,
            isSOHO: false, // TODO: Add SOHO to config
          },
          fixedNet: {
            enabled: config.fixedNet.enabled,
            productId: config.fixedNet.productId,
            accessType: config.fixedNet.accessType,
          },
          result: {
            totals: result.totals,
            dealer: result.dealer,
            gkEligible: result.gkEligible,
          },
          marginData: marginOutput ? {
            netMarginTotal: marginOutput.netMarginTotal,
            marginPerContract: marginOutput.netMarginPerContract,
            profitabilityStatus: marginOutput.profitabilityStatus,
            airtimeProvisionTotal: marginOutput.airtimeProvisionTotal,
            activationFeeTotal: marginOutput.activationFeeTotal,
            hardwareProvisionTotal: marginOutput.hardwareProvision,
            hardwareEKTotal: marginOutput.hardwareEK,
          } : null,
          localRecommendations: localRecommendations.map(rec => ({
            type: rec.type,
            title: rec.title,
            description: rec.description,
            potentialMarginGain: rec.potentialMarginGain,
          })),
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const aiAnalysis = response.data?.analysis;
      if (aiAnalysis) {
        // Add IDs to suggestions
        const suggestionsWithIds = aiAnalysis.suggestions.map((s: any, i: number) => ({
          ...s,
          id: `ai-${s.type}-${i}`,
        }));
        
        setAnalysis({
          ...aiAnalysis,
          suggestions: suggestionsWithIds,
        });
        
        // Set initial simulated margin
        setSimulatedMargin(aiAnalysis.marginStatus.amount);
      }
    } catch (err) {
      console.error("AI Offer Analysis error:", err);
      setError(err instanceof Error ? err.message : "Analyse fehlgeschlagen");
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, config, result, localRecommendations]);

  // Combine AI and local recommendations
  const combinedRecommendations = useMemo((): AiSuggestion[] => {
    const localFormatted = localToAiFormat(localRecommendations);
    
    if (!analysis) return localFormatted;
    
    // Merge: AI suggestions take priority, but include local ones not covered
    const aiTypes = new Set(analysis.suggestions.map(s => s.type));
    const uniqueLocal = localFormatted.filter(s => !aiTypes.has(s.type));
    
    const combined = [...analysis.suggestions, ...uniqueLocal];
    
    // Sort by priority and gain
    return combined.sort((a, b) => {
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.potentialGain - a.potentialGain;
    }).slice(0, 5);
  }, [analysis, localRecommendations, localToAiFormat]);

  // Apply a recommendation - returns partial state to merge
  const applyRecommendation = useCallback((suggestion: AiSuggestion): Partial<OfferOptionState> | null => {
    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
    
    // Update simulated margin
    setSimulatedMargin(prev => (prev ?? 0) + suggestion.potentialGain);
    
    // Return state changes based on suggestion type
    switch (suggestion.type) {
      case "sim_only":
        return {
          hardware: {
            ...config.hardware,
            selectedId: "SIM_ONLY",
            name: "KEINE HARDWARE",
            ekNet: 0,
          } as any,
        };
      
      case "gigakombi":
        return {
          fixedNet: {
            ...config.fixedNet,
            enabled: true,
          },
        };
      
      case "teamdeal":
        // Suggest adding more contracts
        return {
          mobile: {
            ...config.mobile,
            quantity: Math.min(config.mobile.quantity + 2, 20),
          },
        };
      
      case "tariff_upgrade":
        // Try to find next tier tariff
        const currentTariff = getTariffById(config.mobile.tariffId);
        if (currentTariff) {
          const tierOrder = ["S", "M", "L", "XL"];
          const currentIdx = tierOrder.indexOf(currentTariff.tier);
          if (currentIdx < tierOrder.length - 1) {
            // Find upgrade in same family
            const upgradeTier = tierOrder[currentIdx + 1];
            const upgradeId = config.mobile.tariffId.replace(
              new RegExp(`_${currentTariff.tier}$`),
              `_${upgradeTier}`
            );
            return {
              mobile: {
                ...config.mobile,
                tariffId: upgradeId,
              },
            };
          }
        }
        return null;
      
      default:
        // For other types, just mark as applied (no auto-change)
        return null;
    }
  }, [config]);

  // Track outcome for learning
  const trackOutcome = useCallback((suggestionId: string, wasApplied: boolean, actualGain?: number) => {
    // TODO: Implement learning system (Aufgabe 3.4)
    console.log("Track outcome:", { suggestionId, wasApplied, actualGain });
  }, []);

  // Reset
  const reset = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setAppliedSuggestions(new Set());
    setSimulatedMargin(null);
  }, []);

  return {
    analysis,
    isAnalyzing,
    error,
    analyzeOffer,
    applyRecommendation,
    combinedRecommendations,
    trackOutcome,
    appliedSuggestions,
    simulatedMargin,
    reset,
  };
}