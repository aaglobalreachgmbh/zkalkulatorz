import { useMemo } from "react";
import { TrendingUp, TrendingDown, ShoppingCart, Euro, Sparkles, Zap } from "lucide-react";
import type { CalculationResult, ViewMode } from "../../engine/types";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { cn } from "@/lib/utils";
import type { QuantityBonusTier } from "@/margenkalkulator/hooks/useQuantityBonus";
import { AnimatedCurrency } from "./AnimatedCurrency";

interface LiveCalculationBarProps {
  result: CalculationResult;
  viewMode: ViewMode;
  quantity: number;
  quantityBonus?: number;
  /** Active quantity bonus tier info */
  quantityBonusTier?: Pick<QuantityBonusTier, "name" | "bonusPerContract" | "minQuantity"> | null;
  /** Total quantity including basket items */
  totalQuantity?: number;
  /** Next tier info for motivation teaser */
  nextBonusTier?: Pick<QuantityBonusTier, "name" | "bonusPerContract" | "minQuantity"> | null;
  className?: string;
  sticky?: boolean;
  compact?: boolean;
}

export function LiveCalculationBar({ 
  result, 
  viewMode,
  quantity,
  quantityBonus = 0,
  quantityBonusTier,
  totalQuantity,
  nextBonusTier,
  className,
  sticky = false,
  compact = false,
}: LiveCalculationBarProps) {
  const visibility = useSensitiveFieldsVisible(viewMode);
  const showDealerEconomics = visibility.showDealerEconomics;
  
  const avgMonthly = result.totals.avgTermNet;
  const margin = result.dealer.margin + quantityBonus;
  const provision = result.dealer.provisionBase;
  const hardwareEk = result.dealer.hardwareEkNet;
  const total24M = avgMonthly * 24 * quantity;
  
  const marginColor = useMemo(() => {
    if (margin >= 100) return "text-emerald-600 dark:text-emerald-400";
    if (margin >= 0) return "text-amber-600 dark:text-amber-400";
    return "text-destructive";
  }, [margin]);
  
  const marginBgColor = useMemo(() => {
    if (margin >= 100) return "bg-emerald-50 dark:bg-emerald-950/30";
    if (margin >= 0) return "bg-amber-50 dark:bg-amber-950/30";
    return "bg-destructive/10";
  }, [margin]);

  // Compact sticky version for bottom bar
  if (compact) {
    if (showDealerEconomics) {
      return (
        <div className={cn(
          "bg-slate-900 text-white p-3",
          sticky && "border-t border-slate-700 shadow-lg",
          className
        )}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-wider text-slate-400">Ø Monat</p>
                <p className="text-lg sm:text-xl font-bold">
                  <AnimatedCurrency value={avgMonthly} decimals={2} />
                </p>
              </div>
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-wider text-slate-400">Provision</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-400">
                  <AnimatedCurrency value={provision} variant="positive" decimals={0} />
                </p>
              </div>
              {quantityBonus > 0 && quantityBonusTier && (
                <div className="text-center hidden sm:block">
                  <p className="text-[9px] uppercase tracking-wider text-amber-400 flex items-center gap-1 justify-center">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    {quantityBonusTier.name}
                  </p>
                  <p className="text-lg font-bold text-amber-300">
                    <AnimatedCurrency value={quantityBonus} variant="positive" decimals={0} />
                  </p>
                  <p className="text-[8px] text-slate-500">
                    {quantityBonusTier.bonusPerContract}€ × {totalQuantity ?? quantity}
                  </p>
                </div>
              )}
              {/* Motivation teaser when close to next tier */}
              {!quantityBonusTier && nextBonusTier && totalQuantity && (
                <div className="text-center hidden sm:block">
                  <p className="text-[9px] uppercase tracking-wider text-amber-400/70 flex items-center gap-1 justify-center">
                    <Zap className="w-3 h-3" />
                    Fast da!
                  </p>
                  <p className="text-[10px] text-amber-400">
                    +{nextBonusTier.minQuantity - totalQuantity} bis {nextBonusTier.name}
                  </p>
                </div>
              )}
              {hardwareEk > 0 && (
                <div className="text-center hidden sm:block">
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">HW-EK</p>
                  <p className="text-lg font-bold text-amber-400">
                    <AnimatedCurrency value={hardwareEk} variant="negative" decimals={0} />
                  </p>
                </div>
              )}
            </div>
            <div className={cn("text-center rounded-lg px-3 py-1.5", marginBgColor)}>
              <p className="text-[9px] uppercase tracking-wider text-slate-300">Marge</p>
              <div className="flex items-center justify-center gap-1">
                {margin >= 0 ? (
                  <TrendingUp className={cn("w-3.5 h-3.5", marginColor)} />
                ) : (
                  <TrendingDown className={cn("w-3.5 h-3.5", marginColor)} />
                )}
                <p className={cn("text-lg sm:text-xl font-bold", marginColor)}>
                  <AnimatedCurrency value={margin} variant="margin" decimals={0} />
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Compact customer view
    return (
      <div className={cn(
        "bg-gradient-to-r from-primary/10 to-primary/5 border-t border-primary/20 p-3",
        sticky && "shadow-lg",
        className
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Ø Monat</p>
              <div className="flex items-center justify-center gap-1">
                <Euro className="w-3.5 h-3.5 text-primary" />
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  <AnimatedCurrency value={avgMonthly} decimals={2} className="[&]:inline" />
                </p>
              </div>
            </div>
            {quantity > 1 && (
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Verträge</p>
                <div className="flex items-center justify-center gap-1">
                  <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-lg font-bold tabular-nums text-foreground">{quantity}x</p>
                </div>
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">24 Mon. Gesamt</p>
            <p className="text-lg sm:text-xl font-bold text-foreground">
              <AnimatedCurrency value={total24M} decimals={0} />
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Full dealer view
  if (showDealerEconomics) {
    return (
      <div className={cn(
        "bg-slate-900 text-white rounded-xl p-4",
        className
      )}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {/* Avg Monthly */}
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
              Ø Monat
            </p>
            <p className="text-2xl font-bold">
              <AnimatedCurrency value={avgMonthly} decimals={2} />
            </p>
          </div>
          
          {/* Provision */}
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
              Provision
            </p>
            <p className="text-2xl font-bold text-emerald-400">
              <AnimatedCurrency value={provision} variant="positive" decimals={0} />
            </p>
          </div>
          
          {/* Hardware EK */}
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
              HW-EK
            </p>
            <p className="text-2xl font-bold text-amber-400">
              <AnimatedCurrency value={hardwareEk} variant="negative" decimals={0} />
            </p>
          </div>
          
          {/* Margin */}
          <div className={cn(
            "text-center rounded-lg py-2 -my-2",
            marginBgColor
          )}>
            <p className="text-[10px] uppercase tracking-wider text-slate-300 mb-1">
              Marge
            </p>
            <div className="flex items-center justify-center gap-1.5">
              {margin >= 0 ? (
                <TrendingUp className={cn("w-4 h-4", marginColor)} />
              ) : (
                <TrendingDown className={cn("w-4 h-4", marginColor)} />
              )}
              <p className={cn("text-2xl font-bold", marginColor)}>
                <AnimatedCurrency value={margin} variant="margin" decimals={0} />
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full customer view
  return (
    <div className={cn(
      "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4",
      className
    )}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
        {/* Avg Monthly */}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Ø Monatspreis
          </p>
          <div className="flex items-center justify-center gap-1.5">
            <Euro className="w-4 h-4 text-primary" />
            <p className="text-2xl font-bold text-foreground">
              <AnimatedCurrency value={avgMonthly} decimals={2} />
            </p>
          </div>
        </div>
        
        {/* Quantity */}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Verträge
          </p>
          <div className="flex items-center justify-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {quantity}x
            </p>
          </div>
        </div>
        
        {/* Total 24 Months */}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            24 Monate Gesamt
          </p>
          <p className="text-2xl font-bold text-foreground">
            <AnimatedCurrency value={total24M} decimals={0} />
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper to get summary text for the accordion
export function getStepSummary(
  step: "hardware" | "mobile" | "fixedNet",
  state: {
    hardware?: { name: string; ekNet: number };
    mobile?: { tariffId: string; quantity: number; contractType: string };
    fixedNet?: { enabled: boolean; productId: string };
  }
): string {
  switch (step) {
    case "hardware":
      if (!state.hardware?.name || state.hardware.name === "KEINE HARDWARE") {
        return "SIM Only";
      }
      return state.hardware.name;
      
    case "mobile":
      if (!state.mobile?.tariffId) {
        return "Kein Tarif gewählt";
      }
      const qty = state.mobile.quantity > 1 ? ` • ${state.mobile.quantity}x` : "";
      const type = state.mobile.contractType === "renewal" ? " (VVL)" : "";
      // Extract tariff name from ID (simplified)
      const tariffName = state.mobile.tariffId
        .replace(/_/g, " ")
        .replace(/prime/i, "Prime")
        .replace(/smart/i, "Smart");
      return `${tariffName}${qty}${type}`;
      
    case "fixedNet":
      if (!state.fixedNet?.enabled) {
        return "Nicht aktiv";
      }
      if (!state.fixedNet.productId) {
        return "Produkt wählen...";
      }
      // Extract product name from ID (simplified)
      return state.fixedNet.productId
        .replace(/_/g, " ")
        .replace(/CABLE/i, "Kabel")
        .replace(/DSL/i, "DSL")
        .replace(/FIBER/i, "Glasfaser");
      
    default:
      return "";
  }
}
