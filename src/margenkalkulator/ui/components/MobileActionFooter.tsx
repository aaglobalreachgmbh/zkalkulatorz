// ============================================
// Mobile Action Footer - Mobile CTA Component
// Phase 3: Migration - Replaces FloatingActionBar for mobile
// ============================================

import { Plus, Check, ShoppingBag, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OfferOptionState, CalculationResult, ViewMode } from "../../engine/types";
import { useOfferBasket } from "../../contexts/OfferBasketContext";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { toast } from "sonner";
import { fireConfetti } from "@/lib/confetti";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AnimatedCurrency } from "./AnimatedCurrency";

interface MobileActionFooterProps {
  option: OfferOptionState;
  result: CalculationResult | null;
  viewMode: ViewMode;
  quantityBonus?: number;
  onResetForNewTariff?: () => void;
}

export function MobileActionFooter({
  option,
  result,
  viewMode,
  quantityBonus = 0,
  onResetForNewTariff,
}: MobileActionFooterProps) {
  const { addItem, items } = useOfferBasket();
  const visibility = useSensitiveFieldsVisible(viewMode);
  const showDealerEconomics = visibility.showDealerEconomics;

  // Don't render if no tariff selected or no result
  const hasTariff = !!option.mobile.tariffId;
  if (!hasTariff || !result) {
    return null;
  }

  const avgMonthly = result.totals.avgTermNet;
  const margin = result.dealer.margin + quantityBonus;
  const quantity = option.mobile.quantity;

  // Generate a descriptive name for this tariff
  const tariffName = useMemo(() => {
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
  const isAlreadyAdded = items.some(
    (item) =>
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
              <TrendingUp className={cn("w-4 h-4", marginColor)} />
            ) : (
              <TrendingDown className={cn("w-4 h-4", marginColor)} />
            )}
            <span className={cn("text-lg font-bold tabular-nums", marginColor)}>
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
            className="bg-emerald-500/10 text-emerald-600 border-emerald-200 py-1.5 px-3"
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
