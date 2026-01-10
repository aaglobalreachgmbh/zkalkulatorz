// ============================================
// Smart-Advisor Badge
// Diskreter Hinweis auf Optimierungspotenzial
// ============================================

import { Lightbulb, TrendingUp, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SmartRecommendation } from "../../engine/smartAdvisorEngine";

interface SmartAdvisorBadgeProps {
  bestRecommendation: SmartRecommendation | null;
  totalRecommendations: number;
  quickHint: string | null;
  onShowDetails: () => void;
  compact?: boolean;
}

export function SmartAdvisorBadge({
  bestRecommendation,
  totalRecommendations,
  quickHint,
  onShowDetails,
  compact = false,
}: SmartAdvisorBadgeProps) {
  if (!bestRecommendation && !quickHint) {
    return null;
  }

  // Compact-Modus: Nur Icon mit Tooltip
  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowDetails}
            className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          >
            <Lightbulb className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <p className="font-medium">
            {totalRecommendations > 0
              ? `${totalRecommendations} bessere Option${totalRecommendations > 1 ? 'en' : ''} gefunden`
              : quickHint
            }
          </p>
          {bestRecommendation && (
            <p className="text-xs text-muted-foreground mt-1">
              Beste: +{bestRecommendation.marginGain.toFixed(0)}€ Marge
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  // Full-Modus: Card mit Details
  return (
    <div 
      className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onShowDetails}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-amber-900 dark:text-amber-100">
              Smart-Advisor
            </span>
            {totalRecommendations > 0 && (
              <Badge 
                variant="secondary" 
                className="bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-100"
              >
                {totalRecommendations} Option{totalRecommendations > 1 ? 'en' : ''}
              </Badge>
            )}
          </div>
          
          {bestRecommendation ? (
            <div className="space-y-1">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {bestRecommendation.reason}
              </p>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +{bestRecommendation.marginGain.toFixed(0)}€ Marge
                </span>
                {bestRecommendation.customerSavings > 0 && (
                  <span className="text-muted-foreground">
                    Kunde spart {bestRecommendation.customerSavings.toFixed(0)}€/mtl.
                  </span>
                )}
              </div>
            </div>
          ) : quickHint ? (
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {quickHint}
            </p>
          ) : null}
        </div>
        
        <ChevronRight className="w-5 h-5 text-amber-400 flex-shrink-0 mt-2" />
      </div>
    </div>
  );
}
