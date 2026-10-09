// ============================================
// MobileActionFooter - Screenshot Rebuild
// Flat, minimal mobile CTA bar
// ============================================

import { Plus, Check, ShoppingBag, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
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
  onOpenBasket?: () => void;
}

export function MobileActionFooter({ onResetForNewTariff, onOpenBasket }: MobileActionFooterProps) {
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
  if ((!hasTariff || !result) && items.length === 0) return null;

  if (!hasTariff || !result) {
    return (
      <Button type="button" className="h-11 w-full gap-2" onClick={onOpenBasket}>
        <ShoppingBag className="h-4 w-4" />
        Angebotskorb öffnen
        <span className="rounded bg-primary-foreground/15 px-1.5 py-0.5 text-xs">{items.length}</span>
      </Button>
    );
  }

  const avgMonthly = result.totals.avgTermNet;
  const margin = result.dealer.margin + quantityBonus;

  return (
    <div className="flex min-h-12 items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Ø/Monat</span>
          <span className="block text-lg font-bold tabular-nums text-foreground">
            <AnimatedCurrency value={avgMonthly} decimals={2} />
          </span>
        </div>
        {visibility.showDealerEconomics && (
          <div className="hidden min-[390px]:flex items-center gap-1">
            {margin >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-margin-positive" /> : <TrendingDown className="w-3.5 h-3.5 text-margin-negative" />}
            <span className={cn("text-base font-bold tabular-nums", margin >= 0 ? "text-margin-positive" : "text-margin-negative")}>
              <AnimatedCurrency value={margin} variant="margin" decimals={0} />
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {items.length > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpenBasket}
            className="h-10 gap-1 px-2"
            aria-label={`Angebotskorb mit ${items.length} Positionen öffnen`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold tabular-nums">{items.length}</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
        {isAlreadyAdded ? (
          <Button size="sm" variant="outline" onClick={onOpenBasket} className="gap-1 text-xs font-semibold">
            <Check className="w-4 h-4" /> Öffnen
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleAdd}
            className="bg-brand hover:bg-brand/90 text-brand-foreground text-xs font-semibold gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Hinzufügen
          </Button>
        )}
      </div>
    </div>
  );
}
