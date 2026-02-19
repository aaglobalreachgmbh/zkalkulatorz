// ============================================
// MobileActionFooter - Redesign: Clean mobile CTA
// Same functionality, adapted to new visual system
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
  const {
    option1: option,
    result1: result,
    effectiveViewMode,
    quantityBonusForOption1: quantityBonus,
  } = useCalculator();

  const { addItem, items } = useOfferBasket();
  const visibility = useSensitiveFieldsVisible(effectiveViewMode);

  const tariffName = useMemo(() => {
    if (!result) return "";
    const parts = [option.mobile.tariffId || "Tarif"];
    if (option.mobile.quantity > 1) parts.push(`(×${option.mobile.quantity})`);
    if (option.hardware.ekNet > 0) parts.push(`+ ${option.hardware.name}`);
    return parts.join(" ");
  }, [option, result]);

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
    if (onResetForNewTariff) {
      setTimeout(() => onResetForNewTariff(), 500);
    }
  }, [addItem, tariffName, option, result, onResetForNewTariff]);

  // Derived
  const showDealerEconomics = visibility.showDealerEconomics;
  const hasTariff = !!option.mobile.tariffId;

  if (!hasTariff || !result) {
    return null;
  }

  const avgMonthly = result.totals.avgTermNet;
  const margin = result.dealer.margin + quantityBonus;

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Left: Price */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
            Ø/Monat
          </span>
          <span className="text-xl font-bold tabular-nums text-gray-900">
            <AnimatedCurrency value={avgMonthly} decimals={2} />
          </span>
        </div>

        {showDealerEconomics && (
          <div className="flex items-center gap-1">
            {margin >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={cn(
              "text-lg font-bold tabular-nums",
              margin >= 0 ? "text-green-600" : "text-red-600"
            )}>
              <AnimatedCurrency value={margin} variant="margin" decimals={0} />
            </span>
          </div>
        )}
      </div>

      {/* Right: CTA */}
      <div className="flex items-center gap-2">
        {items.length > 0 && (
          <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-2 py-1">
            <ShoppingBag className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold tabular-nums">{items.length}</span>
          </div>
        )}

        {isAlreadyAdded ? (
          <Badge className="bg-green-50 text-green-700 border-green-200 py-1.5 px-3">
            <Check className="w-4 h-4 mr-1" />
            Im Angebot
          </Badge>
        ) : (
          <Button
            size="sm"
            onClick={handleAdd}
            className="bg-red-600 hover:bg-red-700 text-white shadow-md font-semibold gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Hinzufügen
          </Button>
        )}
      </div>
    </div>
  );
}
