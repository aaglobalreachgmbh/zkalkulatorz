// ============================================
// Pro-Dashboard: Upsell Recommendations Panel
// Modul 2.6 - Empfehlungen aus der UpsellEngine
// ============================================

import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  Smartphone, 
  Home, 
  Users, 
  Briefcase, 
  Calendar, 
  SlidersHorizontal,
  ChevronRight,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UpsellRecommendation, UpsellType } from "../../engine/upsellEngine";
import { formatCurrency } from "../../lib/formatters";

interface UpsellRecommendationsPanelProps {
  /** Liste der Empfehlungen */
  recommendations: UpsellRecommendation[];
  /** Callback wenn Empfehlung angewendet werden soll */
  onApply?: (type: UpsellType) => void;
  /** Kompakte Ansicht */
  compact?: boolean;
  /** Max. Anzahl angezeigter Empfehlungen */
  maxItems?: number;
}

const ICON_MAP: Record<UpsellType, typeof TrendingUp> = {
  tariff_upgrade: TrendingUp,
  hardware_downgrade: Smartphone,
  sim_only: SlidersHorizontal,
  gigakombi: Home,
  teamdeal: Users,
  soho: Briefcase,
  term_extension: Calendar,
};

const PRIORITY_CONFIG = {
  1: { bg: "bg-destructive/10", border: "border-destructive/30", badge: "bg-destructive" },
  2: { bg: "bg-warning/10", border: "border-warning/30", badge: "bg-warning" },
  3: { bg: "bg-info/10", border: "border-info/30", badge: "bg-info" },
};

export function UpsellRecommendationsPanel({
  recommendations,
  onApply,
  compact = false,
  maxItems = 5,
}: UpsellRecommendationsPanelProps) {
  const displayRecs = recommendations.slice(0, maxItems);

  if (displayRecs.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-warning" />
          <span className="text-sm font-medium text-foreground">
            {displayRecs.length} Optimierungstipps
          </span>
        </div>
        <div className="space-y-2">
          {displayRecs.slice(0, 2).map((rec, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground truncate">
                {rec.title}
              </span>
              <span className="text-success font-medium">
                +{formatCurrency(rec.potentialMarginGain)}
              </span>
            </div>
          ))}
          {displayRecs.length > 2 && (
            <div className="text-xs text-muted-foreground">
              +{displayRecs.length - 2} weitere...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <Lightbulb className="w-5 h-5 text-warning" />
        <div>
          <h3 className="text-sm font-medium text-foreground">
            Optimierungsempfehlungen
          </h3>
          <p className="text-xs text-muted-foreground">
            {displayRecs.length} Möglichkeiten zur Margenverbesserung
          </p>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="divide-y divide-border">
        {displayRecs.map((rec, index) => (
          <RecommendationItem
            key={index}
            recommendation={rec}
            onApply={onApply}
          />
        ))}
      </div>

      {/* Total Potential */}
      <div className="px-5 py-4 bg-muted/30 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Maximales Potenzial:
          </span>
          <span className="text-lg font-bold text-success">
            +{formatCurrency(
              displayRecs.reduce((sum, rec) => sum + rec.potentialMarginGain, 0)
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

function RecommendationItem({
  recommendation,
  onApply,
}: {
  recommendation: UpsellRecommendation;
  onApply?: (type: UpsellType) => void;
}) {
  const Icon = ICON_MAP[recommendation.type] || TrendingUp;
  const priorityConfig = PRIORITY_CONFIG[recommendation.priority];

  return (
    <div
      className={cn(
        "p-4 hover:bg-muted/30 transition-colors",
        recommendation.priority === 1 && "bg-destructive/5"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            priorityConfig.bg
          )}
        >
          <Icon className="w-5 h-5 text-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-foreground truncate">
              {recommendation.title}
            </h4>
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded text-white",
                priorityConfig.badge
              )}
            >
              P{recommendation.priority}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {recommendation.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {recommendation.action}
            </span>
            <span className="text-sm font-semibold text-success">
              +{formatCurrency(recommendation.potentialMarginGain)}
            </span>
          </div>
        </div>

        {/* Action */}
        {onApply && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0"
            onClick={() => onApply(recommendation.type)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
