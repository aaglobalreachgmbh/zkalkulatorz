// ============================================
// Price Period Breakdown Component
// Displays price periods as cards with average price calculation
// Supports DGRV (12-month BP-free) contracts
// ============================================

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingDown, Gift, Calendar, Info, Sparkles } from "lucide-react";
import { AnimatedCurrency } from "./AnimatedCurrency";
import { DgrvBadge } from "./DgrvBadge";
import type { Period, CalculationResult } from "../../engine/types";
import { cn } from "@/lib/utils";

interface PricePeriodBreakdownProps {
  result: CalculationResult;
  termMonths?: number;
  className?: string;
  compact?: boolean;
}

export function PricePeriodBreakdown({
  result,
  termMonths = 24,
  className,
  compact = false,
}: PricePeriodBreakdownProps) {
  const { periods, totals } = result;
  
  // Analyze periods for DGRV detection
  const periodAnalysis = useMemo(() => {
    if (!periods || periods.length === 0) {
      return { isDgrv: false, freeMonths: 0, hasFreePhase: false };
    }
    
    // Find free periods (0€ monthly)
    const freePeriodsMonths = periods
      .filter(p => p.monthly.net === 0 || p.monthly.net < 0.01)
      .reduce((sum, p) => sum + (p.toMonth - p.fromMonth + 1), 0);
    
    // DGRV = 12 months BP-free
    const isDgrv = freePeriodsMonths >= 12;
    const hasFreePhase = freePeriodsMonths > 0;
    
    return {
      isDgrv,
      freeMonths: freePeriodsMonths,
      hasFreePhase,
    };
  }, [periods]);
  
  // Format period label for display
  const formatPeriodLabel = (period: Period) => {
    if (period.fromMonth === period.toMonth) {
      return `Monat ${period.fromMonth}`;
    }
    return `Monat ${period.fromMonth}–${period.toMonth}`;
  };
  
  // Determine period type for styling
  const getPeriodType = (period: Period) => {
    if (period.monthly.net === 0 || period.monthly.net < 0.01) {
      return "free";
    }
    // If this is a discounted period (check against last period as "normal" price)
    const lastPeriod = periods[periods.length - 1];
    if (period.monthly.net < lastPeriod.monthly.net) {
      return "discounted";
    }
    return "normal";
  };
  
  // Get description for period
  const getPeriodDescription = (period: Period, type: "free" | "discounted" | "normal") => {
    switch (type) {
      case "free":
        return periodAnalysis.isDgrv ? "BP befreit (DGRV)" : "BP befreit";
      case "discounted":
        return "Aktionspreis";
      default:
        return "Normalpreis";
    }
  };
  
  if (!periods || periods.length === 0) {
    return null;
  }
  
  // Compact view - just show inline summary
  if (compact && periods.length === 1) {
    return null; // No need for breakdown with single period
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with DGRV Badge */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Preisübersicht
        </h3>
        {periodAnalysis.isDgrv && <DgrvBadge />}
      </div>
      
      {/* Period Cards Grid */}
      <div className={cn(
        "grid gap-3",
        periods.length === 1 ? "grid-cols-1" : 
        periods.length === 2 ? "grid-cols-2" : 
        "grid-cols-2 md:grid-cols-3"
      )}>
        {periods.map((period, idx) => {
          const periodType = getPeriodType(period);
          const description = getPeriodDescription(period, periodType);
          
          return (
            <Card 
              key={idx} 
              className={cn(
                "relative overflow-hidden transition-all",
                periodType === "free" && "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30",
                periodType === "discounted" && "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30"
              )}
            >
              {/* Accent stripe for free periods */}
              {periodType === "free" && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-500" />
              )}
              
              <CardContent className={cn("p-4", compact && "p-3")}>
                {/* Period Label */}
                <p className="text-sm text-muted-foreground font-medium">
                  {formatPeriodLabel(period)}
                </p>
                
                {/* Price */}
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={cn(
                    "text-2xl font-bold",
                    periodType === "free" && "text-emerald-600 dark:text-emerald-400",
                    periodType === "discounted" && "text-amber-600 dark:text-amber-400",
                    periodType === "normal" && "text-foreground"
                  )}>
                    {periodType === "free" ? (
                      <>0,00</>
                    ) : (
                      <AnimatedCurrency value={period.monthly.net} decimals={2} />
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground">€/mtl.</span>
                </div>
                
                {/* Description Badge */}
                <div className="mt-2">
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs",
                      periodType === "free" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
                      periodType === "discounted" && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                    )}
                  >
                    {periodType === "free" && <Gift className="w-3 h-3 mr-1" />}
                    {periodType === "discounted" && <TrendingDown className="w-3 h-3 mr-1" />}
                    {description}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Average Price Highlight */}
      {periods.length > 1 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Ø Durchschnitt pro Monat
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 cursor-help">
                        Berechnet über {termMonths} Monate Laufzeit
                        <Info className="w-3 h-3" />
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Der Durchschnittspreis berücksichtigt alle Aktionszeiträume 
                        und zeigt die effektiven monatlichen Kosten über die gesamte Laufzeit.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-3xl font-bold text-primary">
                  <AnimatedCurrency value={totals.avgTermNet} decimals={2} />
                </span>
                <span className="text-lg text-muted-foreground ml-1">€</span>
              </div>
            </div>
            
            {/* Savings indicator for DGRV/promo */}
            {periodAnalysis.hasFreePhase && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <Gift className="w-4 h-4" />
                  <span>
                    {periodAnalysis.freeMonths} Monate kostenfrei
                    {periodAnalysis.isDgrv && " (DGRV-Berechtigung)"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
