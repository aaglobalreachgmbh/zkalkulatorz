// ============================================
// AI Offer Check Component - Proaktive Angebotsanalyse
// ============================================

import { useState, useEffect } from "react";
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Wifi,
  Users,
  Smartphone,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import type { OfferOptionState, CalculationResult } from "@/margenkalkulator/engine/types";
import { useAuth } from "@/hooks/useAuth";

interface OfferAnalysis {
  overallScore: "good" | "warning" | "critical";
  marginStatus: {
    status: "positive" | "negative" | "low";
    amount: number;
    message: string;
  };
  suggestions: Array<{
    type: "upsell" | "gigakombi" | "teamdeal" | "hardware" | "promo";
    title: string;
    description: string;
    potentialGain: number;
  }>;
  summary: string;
}

interface AiOfferCheckProps {
  config: OfferOptionState;
  result: CalculationResult;
  compact?: boolean;
}

const typeIcons = {
  upsell: TrendingUp,
  gigakombi: Wifi,
  teamdeal: Users,
  hardware: Smartphone,
  promo: Gift,
};

const typeColors = {
  upsell: "text-blue-500",
  gigakombi: "text-purple-500",
  teamdeal: "text-green-500",
  hardware: "text-amber-500",
  promo: "text-pink-500",
};

export function AiOfferCheck({ config, result, compact = false }: AiOfferCheckProps) {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<OfferAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzedConfig, setLastAnalyzedConfig] = useState<string>("");

  // Create a hash of the config to detect changes
  const hw = config.hardware as { selectedId?: string; id?: string; ekNet?: number } | undefined;
  const configHash = JSON.stringify({
    hardware: hw?.selectedId || hw?.id,
    tariff: config.mobile?.tariffId,
    subVariant: config.mobile?.subVariantId,
    quantity: config.mobile?.quantity,
    fixedNet: config.fixedNet?.enabled,
  });

  const analyzeOffer = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke("ai-offer-check", {
        body: {
          hardware: {
            selectedId: hw?.selectedId || hw?.id,
            ekNet: hw?.ekNet,
          },
          mobile: {
            tariffId: config.mobile?.tariffId,
            subVariantId: config.mobile?.subVariantId,
            contractType: config.mobile?.contractType,
            quantity: config.mobile?.quantity,
            promoId: config.mobile?.promoId,
          },
          fixedNet: {
            enabled: config.fixedNet?.enabled,
            productId: config.fixedNet?.productId,
            accessType: config.fixedNet?.accessType,
          },
          result: {
            totals: result.totals,
            dealer: result.dealer,
            gkEligible: result.gkEligible,
          },
        },
      });
      if (response.error) {
        throw new Error(response.error.message);
      }

      setAnalysis(response.data?.analysis || null);
      setLastAnalyzedConfig(configHash);
      setIsOpen(true);
    } catch (err) {
      console.error("AI Offer Check error:", err);
      setError(err instanceof Error ? err.message : "Analyse fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if config has changed since last analysis
  const configChanged = configHash !== lastAnalyzedConfig;

  if (!user) return null;

  // Compact mode: Just a button
  if (compact) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={analyzeOffer}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        KI-Check
      </Button>
    );
  }

  const scoreColors = {
    good: "bg-green-500/10 border-green-500/30 text-green-600",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-600",
    critical: "bg-red-500/10 border-red-500/30 text-red-600",
  };

  const scoreIcons = {
    good: CheckCircle2,
    warning: AlertTriangle,
    critical: AlertTriangle,
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">KI-Angebots-Check</CardTitle>
                <p className="text-xs text-muted-foreground">Optimierungsvorschläge</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {analysis && !configChanged && (
                <Badge className={scoreColors[analysis.overallScore]}>
                  {analysis.overallScore === "good" && "Optimal"}
                  {analysis.overallScore === "warning" && "Verbesserbar"}
                  {analysis.overallScore === "critical" && "Kritisch"}
                </Badge>
              )}
              <Button
                variant={analysis && !configChanged ? "ghost" : "default"}
                size="sm"
                onClick={analyzeOffer}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analysiere...
                  </>
                ) : analysis && !configChanged ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <span className="flex items-center gap-1 cursor-pointer">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Details
                      </span>
                    </CollapsibleTrigger>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {configChanged ? "Neu analysieren" : "Analysieren"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-2 space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}

            {analysis && (
              <>
                {/* Summary */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-foreground">{analysis.summary}</p>
                </div>

                {/* Margin Status */}
                <div className={`p-3 rounded-lg border ${
                  analysis.marginStatus.status === "positive" 
                    ? "bg-green-500/10 border-green-500/30" 
                    : analysis.marginStatus.status === "low"
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-red-500/10 border-red-500/30"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Marge</span>
                    <span className={`text-sm font-bold ${
                      analysis.marginStatus.status === "positive" 
                        ? "text-green-600" 
                        : analysis.marginStatus.status === "low"
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}>
                      {analysis.marginStatus.amount >= 0 ? "+" : ""}{analysis.marginStatus.amount.toFixed(0)}€
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{analysis.marginStatus.message}</p>
                </div>

                {/* Suggestions */}
                {analysis.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Vorschläge ({analysis.suggestions.length})
                    </p>
                    {analysis.suggestions.map((suggestion, index) => {
                      const Icon = typeIcons[suggestion.type] || Lightbulb;
                      const colorClass = typeColors[suggestion.type] || "text-primary";
                      
                      return (
                        <div 
                          key={index} 
                          className="p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 ${colorClass}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-foreground">{suggestion.title}</p>
                                {suggestion.potentialGain > 0 && (
                                  <Badge variant="outline" className="text-green-600 border-green-500/30 shrink-0">
                                    +{suggestion.potentialGain.toFixed(0)}€
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {analysis.suggestions.length === 0 && analysis.overallScore === "good" && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-600">Angebot ist optimal konfiguriert!</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
