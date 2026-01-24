// ============================================
// Enterprise Floating Action Bar
// ============================================
//
// Full-width sticky footer with:
// - Subtle glass morphism effect
// - Clear visual hierarchy
// - Enterprise-grade spacing and typography
// - Prominent CTA with micro-interactions
// - Accessible focus states
// ============================================

import { Plus, Check, ShoppingBag, Euro, TrendingUp, TrendingDown, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useOfferBasket } from "../../contexts/OfferBasketContext";
import type { OfferOptionState, CalculationResult, ViewMode } from "../../engine/types";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { toast } from "sonner";
import { useMemo } from "react";
import { fireConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";
import { AnimatedCurrency } from "./AnimatedCurrency";

interface FloatingActionBarProps {
  option: OfferOptionState;
  result: CalculationResult;
  viewMode: ViewMode;
  quantityBonus?: number;
  onResetForNewTariff?: () => void;
  className?: string;
}

export function FloatingActionBar({
  option,
  result,
  viewMode,
  quantityBonus = 0,
  onResetForNewTariff,
  className
}: FloatingActionBarProps) {
  const { addItem, items } = useOfferBasket();
  const visibility = useSensitiveFieldsVisible(viewMode);
  const showDealerEconomics = visibility.showDealerEconomics;

  const avgMonthly = result.totals.avgTermNet;
  const margin = result.dealer.margin + quantityBonus;
  const hasTariff = !!option.mobile.tariffId;
  const quantity = option.mobile.quantity;

  // Determine disable reason
  const disableReason = useMemo(() => {
    if (!hasTariff) return "Bitte zuerst einen Tarif wählen";
    return null;
  }, [hasTariff]);

  // Generate a descriptive name for this tariff
  const tariffName = useMemo(() => {
    const tariffBreakdown = result.breakdown.find(b => b.ruleId === "base");
    const baseName = tariffBreakdown?.label?.replace(" Grundpreis", "") || option.mobile.tariffId;

    const parts = [baseName];

    if (option.mobile.quantity > 1) {
      parts.push(`(×${option.mobile.quantity})`);
    }

    if (option.hardware.ekNet > 0) {
      parts.push(`+ ${option.hardware.name}`);
    }

    return parts.join(" ");
  }, [option, result]);

  // Check if already added
  const isAlreadyAdded = items.some(
    item =>
      item.option.mobile.tariffId === option.mobile.tariffId &&
      item.option.hardware.name === option.hardware.name &&
      item.option.mobile.contractType === option.mobile.contractType
  );

  const handleAdd = () => {
    addItem(tariffName, option, result);
    toast.success(`"${tariffName}" zum Angebot hinzugefügt`, { duration: 2000 });
    fireConfetti({ duration: 1000, quick: true });

    // Reset for next tariff after adding
    if (onResetForNewTariff) {
      setTimeout(() => onResetForNewTariff(), 500);
    }
  };

  const marginColor = useMemo(() => {
    if (margin >= 100) return "text-emerald-500";
    if (margin >= 0) return "text-amber-500";
    return "text-red-500";
  }, [margin]);

  const marginBg = useMemo(() => {
    if (margin >= 100) return "bg-emerald-500/10";
    if (margin >= 0) return "bg-amber-500/10";
    return "bg-red-500/10";
  }, [margin]);

  return (
    <div className={cn(
      // Enterprise glass effect with subtle shadow
      "bg-background/95 backdrop-blur-xl border-t border-border/50",
      "shadow-[0_-4px_16px_rgba(0,0,0,0.08)]",
      className
    )}>
      <div className="flex items-center justify-between gap-4 px-4 py-3 max-w-4xl mx-auto">
        {/* Left: Metrics Grid */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Monthly Price - Primary Metric */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
              Ø/Monat
            </span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                <AnimatedCurrency value={avgMonthly} decimals={2} />
              </span>
              <span className="text-sm font-medium text-muted-foreground">€</span>
            </div>
          </div>

          {/* Quantity Badge */}
          {quantity > 1 && (
            <div className="flex flex-col items-center px-3 py-1 rounded-lg bg-muted/50">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
                Verträge
              </span>
              <span className="text-lg font-bold tabular-nums text-foreground">{quantity}×</span>
            </div>
          )}

          {/* Dealer: Margin - Enterprise styling */}
          {showDealerEconomics && (
            <div className={cn(
              "flex flex-col items-center px-3 py-1 rounded-lg hidden sm:flex",
              marginBg
            )}>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
                Marge
              </span>
              <div className="flex items-center gap-1">
                {margin >= 0 ? (
                  <TrendingUp className={cn("w-4 h-4", marginColor)} />
                ) : (
                  <TrendingDown className={cn("w-4 h-4", marginColor)} />
                )}
                <span className={cn("text-lg font-bold tabular-nums", marginColor)}>
                  <AnimatedCurrency value={margin} variant="margin" decimals={0} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Basket Indicator */}
          {items.length > 0 && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold tabular-nums">{items.length}</span>
            </div>
          )}

          {/* Primary CTA */}
          {hasTariff ? (
            isAlreadyAdded ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 py-1.5 px-3 font-medium">
                  <Check className="w-4 h-4 mr-1.5" />
                  Im Angebot
                </Badge>
                {onResetForNewTariff && (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (window.confirm("Möchtest du einen weiteren Tarif konfigurieren?")) {
                        onResetForNewTariff();
                      }
                    }}
                    className={cn(
                      "bg-primary hover:bg-primary/90 text-primary-foreground",
                      "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                      "transition-all duration-200 font-semibold gap-2"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Weiterer Tarif</span>
                    <ArrowRight className="w-4 h-4 hidden sm:inline" />
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={handleAdd}
                className={cn(
                  "bg-primary hover:bg-primary/90 text-primary-foreground",
                  "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5",
                  "transition-all duration-200 font-semibold gap-2 px-5"
                )}
              >
                <Plus className="w-4 h-4" />
                <span>Zum Angebot</span>
                <Sparkles className="w-4 h-4 hidden sm:inline animate-pulse" />
              </Button>
            )
          ) : (
            /* Disabled state with tooltip */
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    disabled
                    className="opacity-50 cursor-not-allowed gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Zum Angebot</span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{disableReason}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
