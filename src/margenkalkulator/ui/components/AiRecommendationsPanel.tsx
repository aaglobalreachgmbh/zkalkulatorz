// ============================================
// KI-Experte: AI Recommendations Panel
// Modul 3 - Intelligentes Empfehlungs-Widget
// ============================================

import { useState, useCallback, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Smartphone,
  Wifi,
  Users,
  Briefcase,
  Clock,
  ChevronRight,
  RefreshCw,
  Zap,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { OfferOptionState, CalculationResult } from "@/margenkalkulator/engine/types";
import { useAiOfferAnalysis, type AiSuggestion } from "@/margenkalkulator/hooks/useAiOfferAnalysis";

// ============================================
// Types
// ============================================

interface AiRecommendationsPanelProps {
  config: OfferOptionState;
  result: CalculationResult;
  onApplyRecommendation?: (changes: Partial<OfferOptionState>) => void;
  compact?: boolean;
}

// ============================================
// Icons & Styling
// ============================================

const TYPE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  hardware: Smartphone,
  hardware_downgrade: Smartphone,
  tariff_upgrade: TrendingUp,
  gigakombi: Wifi,
  teamdeal: Users,
  soho: Briefcase,
  sim_only: Smartphone,
  promo: Zap,
};

const PRIORITY_STYLES = {
  high: {
    badge: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800",
    ring: "ring-red-500/20",
    label: "SOFORT",
    icon: "🔴",
  },
  medium: {
    badge: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800",
    ring: "ring-amber-500/20",
    label: "SCHNELL",
    icon: "🟡",
  },
  low: {
    badge: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800",
    ring: "ring-blue-500/20",
    label: "OPTIONAL",
    icon: "🟢",
  },
};

const SCORE_STYLES = {
  good: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-600",
    icon: CheckCircle2,
    label: "Optimal",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-600",
    icon: AlertTriangle,
    label: "Verbesserbar",
  },
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-600",
    icon: XCircle,
    label: "Kritisch",
  },
};

// ============================================
// Component
// ============================================

export function AiRecommendationsPanel({
  config,
  result,
  onApplyRecommendation,
  compact = false,
}: AiRecommendationsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  
  const {
    analysis,
    isAnalyzing,
    error,
    analyzeOffer,
    applyRecommendation,
    combinedRecommendations,
    appliedSuggestions,
    simulatedMargin,
    reset,
  } = useAiOfferAnalysis(config, result);

  // Auto-open when analysis is done
  useEffect(() => {
    if (analysis) setIsOpen(true);
  }, [analysis]);

  // Handle apply recommendation
  const handleApply = useCallback((suggestion: AiSuggestion) => {
    const changes = applyRecommendation(suggestion);
    if (changes && onApplyRecommendation) {
      onApplyRecommendation(changes);
    }
  }, [applyRecommendation, onApplyRecommendation]);

  // Format currency
  const formatCurrency = (amount: number) => {
    const sign = amount >= 0 ? "+" : "";
    return `${sign}${amount.toFixed(0)}€`;
  };

  // Compact mode: Just a button
  if (compact) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={analyzeOffer}
        disabled={isAnalyzing}
        className="gap-2"
      >
        {isAnalyzing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        KI-Berater
      </Button>
    );
  }

  const scoreStyle = analysis ? SCORE_STYLES[analysis.overallScore] : null;
  const ScoreIcon = scoreStyle?.icon || AlertTriangle;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            {/* Header Left */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold">KI-Verkaufsberater</CardTitle>
                <p className="text-xs text-muted-foreground truncate">
                  Intelligente Optimierungsvorschläge
                </p>
              </div>
            </div>

            {/* Header Right */}
            <div className="flex items-center gap-2 shrink-0">
              {analysis && (
                <Badge className={cn("gap-1", scoreStyle?.bg, scoreStyle?.border, scoreStyle?.text)}>
                  <ScoreIcon className="w-3 h-3" />
                  {scoreStyle?.label}
                </Badge>
              )}
              
              <Button
                variant={analysis ? "ghost" : "default"}
                size="sm"
                onClick={analysis ? undefined : analyzeOffer}
                disabled={isAnalyzing}
                className="gap-1.5"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Analysiere...</span>
                  </>
                ) : analysis ? (
                  <CollapsibleTrigger asChild>
                    <span className="flex items-center gap-1 cursor-pointer">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      Details
                    </span>
                  </CollapsibleTrigger>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analysieren
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Loading Skeleton */}
        {isAnalyzing && (
          <CardContent className="pt-2">
            <div className="space-y-3 animate-pulse">
              <div className="h-12 bg-muted rounded-lg" />
              <div className="h-20 bg-muted rounded-lg" />
              <div className="h-16 bg-muted rounded-lg" />
            </div>
          </CardContent>
        )}

        <CollapsibleContent>
          <CardContent className="pt-2 space-y-4">
            {/* Error State */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={analyzeOffer} className="mt-2 gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Erneut versuchen
                </Button>
              </div>
            )}

            {analysis && (
              <>
                {/* Margin Status Header */}
                <div className={cn(
                  "p-4 rounded-xl border-2",
                  analysis.marginStatus.status === "positive"
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : analysis.marginStatus.status === "low"
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-red-500/10 border-red-500/30"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Analyse: Marge ist</span>
                    <span className={cn(
                      "text-lg font-bold",
                      analysis.marginStatus.status === "positive"
                        ? "text-emerald-600"
                        : analysis.marginStatus.status === "low"
                          ? "text-amber-600"
                          : "text-red-600"
                    )}>
                      {analysis.marginStatus.status === "positive" ? "POSITIV" : 
                       analysis.marginStatus.status === "low" ? "GERING" : "KRITISCH"}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      "text-2xl font-bold tabular-nums",
                      analysis.marginStatus.amount >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {formatCurrency(analysis.marginStatus.amount)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({formatCurrency(analysis.marginStatus.perContract)}/Vertrag)
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{analysis.marginStatus.message}</p>
                </div>

                {/* Recommendations List */}
                {combinedRecommendations.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        TOP-EMPFEHLUNGEN
                      </p>
                      {appliedSuggestions.size > 0 && simulatedMargin !== null && (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                          Nach Umsetzung: {formatCurrency(simulatedMargin)}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      {combinedRecommendations.slice(0, 4).map((suggestion, index) => {
                        const Icon = TYPE_ICONS[suggestion.type] || TrendingUp;
                        const priorityStyle = PRIORITY_STYLES[suggestion.priority];
                        const isApplied = appliedSuggestions.has(suggestion.id);
                        const isExpanded = expandedSuggestion === suggestion.id;

                        return (
                          <div
                            key={suggestion.id}
                            className={cn(
                              "p-3 rounded-xl border transition-all duration-200",
                              isApplied
                                ? "bg-emerald-500/10 border-emerald-500/30"
                                : "bg-card border-border hover:border-primary/30 hover:shadow-sm"
                            )}
                          >
                            {/* Main Row */}
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <div className="pt-0.5">
                                <Checkbox
                                  checked={isApplied}
                                  onCheckedChange={() => !isApplied && handleApply(suggestion)}
                                  disabled={isApplied}
                                  className={cn(
                                    "transition-colors",
                                    isApplied && "bg-emerald-500 border-emerald-500"
                                  )}
                                />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-lg">{priorityStyle.icon}</span>
                                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", priorityStyle.badge)}>
                                    {priorityStyle.label}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {suggestion.estimatedTime}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                  <Icon className="w-4 h-4 text-primary shrink-0" />
                                  <p className={cn(
                                    "text-sm font-medium",
                                    isApplied && "line-through text-muted-foreground"
                                  )}>
                                    {suggestion.title}
                                  </p>
                                </div>

                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {suggestion.description}
                                </p>

                                {/* Action Steps (expandable) */}
                                {suggestion.actionSteps.length > 0 && (
                                  <Collapsible open={isExpanded} onOpenChange={() => setExpandedSuggestion(isExpanded ? null : suggestion.id)}>
                                    <CollapsibleTrigger asChild>
                                      <button className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline">
                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        {isExpanded ? "Schritte ausblenden" : "So geht's"}
                                      </button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground pl-4">
                                        {suggestion.actionSteps.map((step, i) => (
                                          <li key={i} className="flex items-start gap-2">
                                            <ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                                            {step}
                                          </li>
                                        ))}
                                      </ul>
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}
                              </div>

                              {/* Gain Badge */}
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                {suggestion.potentialGain > 0 && (
                                  <Badge 
                                    className={cn(
                                      "font-bold tabular-nums",
                                      isApplied
                                        ? "bg-emerald-500/20 text-emerald-600 border-emerald-300"
                                        : "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                    )}
                                  >
                                    +{suggestion.potentialGain.toFixed(0)}€
                                  </Badge>
                                )}
                                {isApplied && (
                                  <Check className="w-4 h-4 text-emerald-500" />
                                )}
                              </div>
                            </div>

                            {/* Apply Button (if not auto-applicable) */}
                            {!isApplied && onApplyRecommendation && (
                              <div className="mt-2 pt-2 border-t border-border/50">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full gap-2 text-xs"
                                  onClick={() => handleApply(suggestion)}
                                >
                                  <Zap className="w-3 h-3" />
                                  Empfehlung umsetzen
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-foreground leading-relaxed">{analysis.summary}</p>
                </div>

                {/* All Optimal */}
                {combinedRecommendations.length === 0 && analysis.overallScore === "good" && (
                  <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-emerald-600">
                      Angebot ist optimal konfiguriert!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Keine weiteren Optimierungen erforderlich.
                    </p>
                  </div>
                )}

                {/* Re-analyze Button */}
                <div className="flex justify-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { reset(); analyzeOffer(); }}
                    className="gap-2 text-xs text-muted-foreground"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Erneut analysieren
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}