// ============================================
// Pro-Dashboard: Margin Breakdown Widget
// Modul 2.1 - Stacked Bar Chart der Wasserfalllogik
// ============================================

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { MarginCalculationOutput, MarginBreakdownItem } from "../../engine/marginWaterfallEngine";
import { formatCurrency } from "../../lib/formatters";

interface MarginBreakdownWidgetProps {
  marginData: MarginCalculationOutput;
  showRecommendation?: boolean;
  compact?: boolean;
}

const CATEGORY_COLORS = {
  provision: "bg-success",
  discount: "bg-warning",
  hardware: "bg-info",
  total: "bg-primary",
};

const CATEGORY_LABELS = {
  provision: "Provision",
  discount: "Rabatt",
  hardware: "Hardware",
  total: "Gesamt",
};

export function MarginBreakdownWidget({
  marginData,
  showRecommendation = true,
  compact = false,
}: MarginBreakdownWidgetProps) {
  // Filter and prepare breakdown items (exclude the total row for display)
  const displayItems = useMemo(() => {
    return marginData.breakdown.filter((item) => item.category !== "total");
  }, [marginData.breakdown]);

  // Calculate max value for bar scaling
  const maxAmount = useMemo(() => {
    const amounts = displayItems.map((item) => Math.abs(item.amount));
    return Math.max(...amounts, 1);
  }, [displayItems]);

  // Calculate totals by category
  const categoryTotals = useMemo(() => {
    const totals = { provision: 0, discount: 0, hardware: 0 };
    displayItems.forEach((item) => {
      if (item.category in totals) {
        totals[item.category as keyof typeof totals] += item.amount;
      }
    });
    return totals;
  }, [displayItems]);

  const statusConfig = {
    positive: { icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
    warning: { icon: Minus, color: "text-warning", bg: "bg-warning/10" },
    critical: { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
  };

  const config = statusConfig[marginData.profitabilityStatus];
  const StatusIcon = config.icon;

  if (compact) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">Margen-Breakdown</span>
          <div className={cn("flex items-center gap-1 px-2 py-1 rounded-md", config.bg)}>
            <StatusIcon className={cn("w-3.5 h-3.5", config.color)} />
            <span className={cn("text-sm font-semibold", config.color)}>
              {formatCurrency(marginData.netMarginTotal)}
            </span>
          </div>
        </div>

        {/* Compact summary bars */}
        <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-muted">
          {categoryTotals.provision > 0 && (
            <div
              className="bg-success transition-all"
              style={{
                width: `${(categoryTotals.provision / (categoryTotals.provision + Math.abs(categoryTotals.hardware))) * 100}%`,
              }}
            />
          )}
          {categoryTotals.hardware < 0 && (
            <div
              className="bg-destructive transition-all"
              style={{
                width: `${(Math.abs(categoryTotals.hardware) / (categoryTotals.provision + Math.abs(categoryTotals.hardware))) * 100}%`,
              }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">
          Margen-Breakdown
        </h3>
        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg", config.bg)}>
          <StatusIcon className={cn("w-4 h-4", config.color)} />
          <span className={cn("font-semibold", config.color)}>
            {formatCurrency(marginData.netMarginTotal)}
          </span>
        </div>
      </div>

      {/* Breakdown Items */}
      <TooltipProvider>
        <div className="space-y-2.5">
          {displayItems.map((item, index) => (
            <BreakdownRow
              key={index}
              item={item}
              maxAmount={maxAmount}
            />
          ))}
        </div>
      </TooltipProvider>

      {/* Divider */}
      <div className="border-t border-border my-4" />

      {/* Total Row */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">Netto-Marge:</span>
        <div className="flex items-center gap-2">
          <span className={cn("text-lg font-bold", config.color)}>
            {formatCurrency(marginData.netMarginTotal)}
          </span>
          <span className={cn("text-sm", marginData.profitabilityStatus === "critical" ? "text-destructive" : "text-success")}>
            {marginData.profitabilityStatus === "critical" ? "❌" : marginData.profitabilityStatus === "warning" ? "⚠️" : "✅"}
          </span>
        </div>
      </div>

      {/* Status Description */}
      <p className={cn("text-sm mt-2", config.color)}>
        {marginData.statusDescription}
      </p>

      {/* Recommendation */}
      {showRecommendation && marginData.profitabilityStatus !== "positive" && (
        <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm">
          <span className="font-medium text-foreground">💡 Empfehlung: </span>
          <span className="text-muted-foreground">
            {marginData.profitabilityStatus === "critical"
              ? "Sub-Stufe reduzieren oder SIM-Only anbieten"
              : "Tarif-Upgrade oder zusätzliche Services vorschlagen"}
          </span>
        </div>
      )}
    </div>
  );
}

function BreakdownRow({
  item,
  maxAmount,
}: {
  item: MarginBreakdownItem;
  maxAmount: number;
}) {
  const isPositive = item.amount >= 0;
  const barWidth = (Math.abs(item.amount) / maxAmount) * 100;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-3 cursor-help group">
          {/* Label */}
          <div className="w-48 flex-shrink-0 text-sm text-muted-foreground truncate">
            {item.label}
          </div>

          {/* Bar */}
          <div className="flex-1 h-5 relative">
            <div className="absolute inset-0 bg-muted rounded" />
            <div
              className={cn(
                "absolute h-full rounded transition-all group-hover:opacity-80",
                isPositive ? "bg-success" : "bg-destructive"
              )}
              style={{ width: `${Math.min(barWidth, 100)}%` }}
            />
          </div>

          {/* Amount */}
          <div
            className={cn(
              "w-24 text-right text-sm font-medium tabular-nums",
              isPositive ? "text-success" : "text-destructive"
            )}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(item.amount)}
          </div>

          {/* Info icon if has tooltip */}
          {item.info && (
            <Info className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </TooltipTrigger>
      {item.info && (
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{item.info}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
