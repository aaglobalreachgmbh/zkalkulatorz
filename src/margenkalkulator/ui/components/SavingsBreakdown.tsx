import { useMemo } from "react";
import { Percent, Calendar, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CalculationResult } from "../../engine/types";
import { cn } from "@/lib/utils";

interface SavingsBreakdownProps {
  result: CalculationResult;
  className?: string;
}

export function SavingsBreakdown({ result, className }: SavingsBreakdownProps) {
  const periods = result.periods;
  
  // Calculate savings based on periods
  const savingsInfo = useMemo(() => {
    if (!periods || periods.length <= 1) return null;
    
    // Find the "normal" price (usually the last period)
    const normalPeriod = periods[periods.length - 1];
    const normalPrice = normalPeriod.monthly.net;
    
    // Check for discounted periods
    const discountedPeriods = periods.filter(p => p.monthly.net < normalPrice);
    
    if (discountedPeriods.length === 0) return null;
    
    // Calculate total savings
    let totalSavings = 0;
    const breakdown: Array<{
      label: string;
      months: number;
      price: number;
      savings: number;
    }> = [];
    
    periods.forEach((period) => {
      const months = period.toMonth - period.fromMonth + 1;
      const savings = (normalPrice - period.monthly.net) * months;
      totalSavings += savings;
      
      breakdown.push({
        label: period.label || `Monate ${period.fromMonth}-${period.toMonth}`,
        months,
        price: period.monthly.net,
        savings,
      });
    });
    
    return {
      normalPrice,
      totalSavings,
      breakdown,
      avgPrice: result.totals.avgTermNet,
    };
  }, [periods, result.totals.avgTermNet]);
  
  if (!savingsInfo || savingsInfo.totalSavings <= 0) {
    return null;
  }

  return (
    <div className={cn(
      "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20",
      "border border-emerald-200 dark:border-emerald-800 rounded-xl p-5",
      className
    )}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
          <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">
            Ihre Ersparnis
          </h4>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            Dank aktiver Aktion
          </p>
        </div>
      </div>
      
      {/* Period Breakdown */}
      <div className="space-y-2 mb-4">
        {savingsInfo.breakdown.map((period, index) => (
          <div 
            key={index}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg",
              period.savings > 0 
                ? "bg-emerald-200/50 dark:bg-emerald-800/30" 
                : "bg-white/50 dark:bg-slate-800/50"
            )}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{period.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm">
                {period.price.toFixed(2)} €
              </span>
              {period.savings > 0 && (
                <Badge 
                  variant="secondary" 
                  className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                >
                  -{period.savings.toFixed(0)} €
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary */}
      <div className="border-t border-emerald-300 dark:border-emerald-700 pt-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-emerald-700 dark:text-emerald-400">
            Ø Durchschnittspreis
          </span>
          <span className="font-bold text-lg">
            {savingsInfo.avgPrice.toFixed(2)} €/Monat
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5" />
            Gesamtersparnis (24 Monate)
          </span>
          <span className="font-bold text-xl text-emerald-600 dark:text-emerald-400">
            {savingsInfo.totalSavings.toFixed(0)} €
          </span>
        </div>
      </div>
    </div>
  );
}
