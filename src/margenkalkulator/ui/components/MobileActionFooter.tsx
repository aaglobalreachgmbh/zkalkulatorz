// ============================================
// MobileActionFooter - Screenshot Rebuild
// Flat, minimal mobile CTA bar
// ============================================

import { Plus, Check, ShoppingBag, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function MobileActionFooter({ onResetForNewTariff }: MobileActionFooterProps) {
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
    if (onResetForNewTariff) setTimeout(() => onResetForNewTariff(), 500);
  }, [addItem, tariffName, option, result, onResetForNewTariff]);

  const hasTariff = !!option.mobile.tariffId;
  if (!hasTariff || !result) return null;

  const avgMonthly = result.totals.avgTermNet;
  const margin = result.dealer.margin + quantityBonus;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Ø/Monat</span>
          <span className="block text-lg font-bold tabular-nums text-gray-900">
            <AnimatedCurrency value={avgMonthly} decimals={2} />
          </span>
        </div>
        {visibility.showDealerEconomics && (
          <div className="flex items-center gap-1">
            {margin >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-green-600" /> : <TrendingDown className="w-3.5 h-3.5 text-red-600" />}
            <span className={cn("text-base font-bold tabular-nums", margin >= 0 ? "text-green-600" : "text-red-600")}>
              <AnimatedCurrency value={margin} variant="margin" decimals={0} />
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {items.length > 0 && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5">
            <ShoppingBag className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-semibold tabular-nums">{items.length}</span>
          </div>
        )}
        {isAlreadyAdded ? (
          <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
            <Check className="w-4 h-4" /> Im Angebot
          </span>
        ) : (
          <Button
            size="sm"
            onClick={handleAdd}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Hinzufügen
          </Button>
        )}
      </div>
    </div>
  );
}
