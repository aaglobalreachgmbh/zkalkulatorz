// ============================================
// Smart-Advisor Panel
// Vollständige Empfehlungsliste
// ============================================

import { useState } from "react";
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Check,
  Smartphone,
  Users,
  Wifi,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { SmartRecommendation, RecommendationType } from "../../engine/smartAdvisorEngine";

interface SmartAdvisorProps {
  recommendations: SmartRecommendation[];
  currentBaseline: {
    customerMonthly: number;
    dealerMargin: number;
  };
  onApplyRecommendation: (recommendation: SmartRecommendation) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_ICONS: Record<RecommendationType, React.ReactNode> = {
  sim_only: <Smartphone className="w-4 h-4" />,
  cheaper_hardware: <Smartphone className="w-4 h-4" />,
  tariff_downgrade: <TrendingDown className="w-4 h-4" />,
  tariff_upgrade: <TrendingUp className="w-4 h-4" />,
  teamdeal: <Users className="w-4 h-4" />,
  gigakombi: <Wifi className="w-4 h-4" />,
  promo: <Tag className="w-4 h-4" />,
  bundle: <Users className="w-4 h-4" />,
};

const TYPE_LABELS: Record<RecommendationType, string> = {
  sim_only: "SIM-Only",
  cheaper_hardware: "Günstigere Hardware",
  tariff_downgrade: "Sparsamerer Tarif",
  tariff_upgrade: "Höherer Tarif",
  teamdeal: "TeamDeal",
  gigakombi: "GigaKombi",
  promo: "Aktionstarif",
  bundle: "Bundle",
};

const RANK_BADGES = ["🥇", "🥈", "🥉"];

export function SmartAdvisor({
  recommendations,
  currentBaseline,
  onApplyRecommendation,
  open,
  onOpenChange,
}: SmartAdvisorProps) {
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const handleApply = (rec: SmartRecommendation) => {
    setAppliedId(rec.id);
    onApplyRecommendation(rec);
    // Dialog nach kurzer Verzögerung schließen
    setTimeout(() => {
      onOpenChange(false);
      setAppliedId(null);
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Smart-Advisor
              </DialogTitle>
              <DialogDescription>
                {recommendations.length > 0
                  ? `${recommendations.length} bessere Konfiguration${recommendations.length > 1 ? 'en' : ''} gefunden`
                  : 'Keine besseren Optionen verfügbar'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Current Baseline */}
        <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Aktuelle Konfiguration:</span>
          <div className="flex items-center gap-4">
            <span>
              Kunde: <strong>{currentBaseline.customerMonthly.toFixed(2)}€/mtl.</strong>
            </span>
            <span>
              Marge: <strong className={currentBaseline.dealerMargin >= 0 ? "text-emerald-600" : "text-destructive"}>
                {currentBaseline.dealerMargin.toFixed(0)}€
              </strong>
            </span>
          </div>
        </div>

        {/* Recommendations List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3 py-2">
            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Ihre aktuelle Konfiguration ist bereits optimal!</p>
              </div>
            ) : (
              recommendations.map((rec, index) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  rank={index}
                  isApplied={appliedId === rec.id}
                  onApply={() => handleApply(rec)}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Recommendation Card
// ============================================

interface RecommendationCardProps {
  recommendation: SmartRecommendation;
  rank: number;
  isApplied: boolean;
  onApply: () => void;
}

function RecommendationCard({
  recommendation,
  rank,
  isApplied,
  onApply,
}: RecommendationCardProps) {
  const isTopThree = rank < 3;
  const rankBadge = isTopThree ? RANK_BADGES[rank] : null;

  return (
    <Card className={`overflow-hidden transition-all ${
      isApplied 
        ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' 
        : rank === 0 
          ? 'ring-1 ring-amber-300 dark:ring-amber-700' 
          : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Rank & Icon */}
          <div className="flex flex-col items-center gap-1">
            {rankBadge && (
              <span className="text-lg">{rankBadge}</span>
            )}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              rank === 0 
                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                : 'bg-muted text-muted-foreground'
            }`}>
              {TYPE_ICONS[recommendation.type]}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">
                {recommendation.configuration[0]?.tariffName || TYPE_LABELS[recommendation.type]}
              </span>
              <Badge variant="outline" className="text-xs">
                {TYPE_LABELS[recommendation.type]}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              {recommendation.details}
            </p>

            {/* Metrics */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Kunde:</span>
                <strong>{recommendation.customerMonthly.toFixed(2)}€/mtl.</strong>
                {recommendation.customerSavings > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ↓{recommendation.customerSavings.toFixed(0)}€
                  </span>
                )}
                {recommendation.customerSavings < 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    ↑{Math.abs(recommendation.customerSavings).toFixed(0)}€
                  </span>
                )}
              </span>
              
              <span className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Marge:</span>
                <strong className={recommendation.dealerMargin >= 0 ? "text-emerald-600" : "text-destructive"}>
                  {recommendation.dealerMargin.toFixed(0)}€
                </strong>
                {recommendation.marginGain > 0 && (
                  <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    +{recommendation.marginGain.toFixed(0)}€
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Apply Button */}
          <Button
            size="sm"
            onClick={onApply}
            disabled={isApplied}
            className={isApplied 
              ? 'bg-emerald-500 hover:bg-emerald-500' 
              : 'bg-primary hover:bg-primary/90'
            }
          >
            {isApplied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Übernommen
              </>
            ) : (
              <>
                Übernehmen
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Inline Panel (für Integration ohne Modal)
// ============================================

interface SmartAdvisorPanelProps {
  recommendations: SmartRecommendation[];
  currentBaseline: {
    customerMonthly: number;
    dealerMargin: number;
  };
  onApplyRecommendation: (recommendation: SmartRecommendation) => void;
  onClose?: () => void;
}

export function SmartAdvisorPanel({
  recommendations,
  currentBaseline,
  onApplyRecommendation,
  onClose,
}: SmartAdvisorPanelProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-lg">Smart-Advisor Empfehlungen</CardTitle>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              {recommendations.length}
            </Badge>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {recommendations.slice(0, 3).map((rec, index) => (
          <div 
            key={rec.id}
            className="flex items-center justify-between p-3 bg-background rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{RANK_BADGES[index] || "•"}</span>
              <div>
                <div className="font-medium text-sm">{rec.reason}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-emerald-600">+{rec.marginGain.toFixed(0)}€ Marge</span>
                  {rec.customerSavings > 0 && (
                    <span>• Kunde spart {rec.customerSavings.toFixed(0)}€</span>
                  )}
                </div>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => onApplyRecommendation(rec)}>
              Übernehmen
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
