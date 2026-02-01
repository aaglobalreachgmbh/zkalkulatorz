// ============================================
// Mobile Action Footer - Context-Driven
// Phase 5A: Refactored to use useCalculator()
// ============================================

import { Plus, Check, ShoppingBag, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOfferBasket } from "../../contexts/OfferBasketContext";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { useCalculator } from "../../context/CalculatorContext";
import { toast } from "sonner";
import { fireConfetti } from "@/lib/confetti";
import { useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AnimatedCurrency } from "./AnimatedCurrency";

interface MobileActionFooterProps {
  onResetForNewTariff?: () => void;
}

export function MobileActionFooter({
  onResetForNewTariff,
}: MobileActionFooterProps) {
  // === ALL HOOKS AT TOP (Before any returns) ===
  const {
    option1: option,
    result1: result,
    effectiveViewMode,
    quantityBonusForOption1: quantityBonus,
  } = useCalculator();

  const { addItem, items } = useOfferBasket();
  const visibility = useSensitiveFieldsVisible(effectiveViewMode);

  // Generate a descriptive name for this tariff
  const tariffName = useMemo(() => {
    if (!result) return "";
    const tariffBreakdown = result.breakdown.find((b) => b.ruleId === "base");
    const baseName =
      tariffBreakdown?.label?.replace(" Grundpreis", "") || option.mobile.tariffId;

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
  const isAlreadyAdded = useMemo(() => items.some(
    (item) =>
      item.option.mobile.tariffId === option.mobile.tariffId &&
      item.option.hardware.name === option.hardware.name &&
      item.option.mobile.contractType === option.mobile.contractType
  ), [items, option]);

  const handleAdd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!result) return;
    addItem(tariffName, option, result);
    toast.success(`"${tariffName}" zum Angebot hinzugefügt`, { duration: 2000 });
    fireConfetti({ duration: 1000, quick: true });

    // Reset for next tariff after adding
    if (onResetForNewTariff) {
      setTimeout(() => onResetForNewTariff(), 500);
    }
  }, [addItem, tariffName, option, result, onResetForNewTariff]);

  const marginColorClass = useMemo(() => {
    if (!result) return "";
    const margin = result.dealer.margin + quantityBonus;
    if (margin >= 100) return "text-[hsl(var(--status-success))]";
    if (margin >= 0) return "text-[hsl(var(--status-warning))]";
    return "text-[hsl(var(--status-error))]";
  }, [result, quantityBonus]);

  // === DERIVED VALUES ===
  const showDealerEconomics = visibility.showDealerEconomics;
  const hasTariff = !!option.mobile.tariffId;

  // Don't render if no tariff selected or no result (AFTER all hooks)
  if (!hasTariff || !result) {
    return null;
  }

  const avgMonthly = result.totals.avgTermNet;
  const margin = result.dealer.margin + quantityBonus;
  const quantity = option.mobile.quantity;

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Left: Price Summary */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Monthly Price */}
        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Ø/Monat
          </span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-bold tabular-nums text-foreground">
              <AnimatedCurrency value={avgMonthly} decimals={2} />
            </span>
            <span className="text-sm text-muted-foreground">€</span>
          </div>
        </div>

        {/* Quantity Badge */}
        {quantity > 1 && (
          <Badge variant="secondary" className="h-7 px-2">
            {quantity}×
          </Badge>
        )}

        {/* Margin (Dealer only) */}
        {showDealerEconomics && (
          <div className="flex items-center gap-1">
            {margin >= 0 ? (
              <TrendingUp className={cn("w-4 h-4", marginColorClass)} />
            ) : (
              <TrendingDown className={cn("w-4 h-4", marginColorClass)} />
            )}
            <span className={cn("text-lg font-bold tabular-nums", marginColorClass)}>
              <AnimatedCurrency value={margin} variant="margin" decimals={0} />
            </span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Basket Indicator */}
        {items.length > 0 && (
          <div className="flex items-center gap-1.5 bg-muted rounded-full px-2 py-1">
            <ShoppingBag className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold tabular-nums">{items.length}</span>
          </div>
        )}

        {/* Primary CTA */}
        {isAlreadyAdded ? (
          <Badge
            variant="outline"
            className="bg-[hsl(var(--status-success)/0.1)] text-[hsl(var(--status-success))] border-[hsl(var(--status-success)/0.3)] py-1.5 px-3"
          >
            <Check className="w-4 h-4 mr-1" />
            Im Angebot
          </Badge>
        ) : (
          <Button
            size="sm"
            onClick={handleAdd}
            className={cn(
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "shadow-md font-semibold gap-1.5"
            )}
          >
            <Plus className="w-4 h-4" />
            Hinzufügen
          </Button>
        )}
      </div>
    </div>
  );
}
