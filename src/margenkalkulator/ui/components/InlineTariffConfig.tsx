// ============================================
// Inline Tariff Config - Discounts + Add directly at tariff
// ============================================
//
// Appears below selected tariff with:
// - Discount/Promo selection as toggle buttons
// - Live price update with animation
// - "Add to Offer" CTA
//
// Eliminates need to scroll for promos or add action.
// ============================================

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Check, Tag, Sparkles, TrendingDown, AlertTriangle } from "lucide-react";
import { AnimatedCurrency } from "./AnimatedCurrency";
import { useOfferBasket } from "../../contexts/OfferBasketContext";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { toast } from "sonner";
import { fireConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";
import type { 
  MobileTariff, 
  Promo, 
  MobileState, 
  OfferOptionState, 
  CalculationResult,
  ViewMode 
} from "../../engine/types";

interface InlineTariffConfigProps {
  tariff: MobileTariff;
  mobileState: MobileState;
  promos: Promo[];
  /** Full offer option for basket */
  fullOption: OfferOptionState;
  /** Pre-calculated result */
  result: CalculationResult;
  viewMode: ViewMode;
  quantityBonus?: number;
  onPromoChange: (promoId: string) => void;
  onOmoChange?: (omoRate: number) => void;
  onAddedToOffer?: () => void;
}

export function InlineTariffConfig({
  tariff,
  mobileState,
  promos,
  fullOption,
  result,
  viewMode,
  quantityBonus = 0,
  onPromoChange,
  onOmoChange,
  onAddedToOffer,
}: InlineTariffConfigProps) {
  const { addItem, items } = useOfferBasket();
  const visibility = useSensitiveFieldsVisible(viewMode);
  const showDealerEconomics = visibility.showDealerEconomics;
  
  // Calculate prices
  const basePrice = tariff.baseNet;
  const avgMonthly = result.totals.avgTermNet;
  const margin = result.dealer.margin + quantityBonus;
  const hasDiscount = avgMonthly < basePrice;
  const savingsPerMonth = basePrice - avgMonthly;
  const savingsPercent = basePrice > 0 ? (savingsPerMonth / basePrice) * 100 : 0;
  
  // OMO is active?
  const omoActive = (mobileState.omoRate ?? 0) > 0;
  
  // Generate tariff name for basket
  const tariffName = useMemo(() => {
    const parts = [tariff.name];
    if (mobileState.quantity > 1) {
      parts.push(`(×${mobileState.quantity})`);
    }
    if (fullOption.hardware.ekNet > 0) {
      parts.push(`+ ${fullOption.hardware.name}`);
    }
    return parts.join(" ");
  }, [tariff, mobileState.quantity, fullOption.hardware]);
  
  // Check if already in basket
  const isAlreadyAdded = items.some(
    item => 
      item.option.mobile.tariffId === mobileState.tariffId &&
      item.option.hardware.name === fullOption.hardware.name &&
      item.option.mobile.contractType === mobileState.contractType
  );
  
  const handleAdd = () => {
    addItem(tariffName, fullOption, result);
    toast.success(`"${tariffName}" zum Angebot hinzugefügt`, {
      description: mobileState.quantity > 1 ? `${mobileState.quantity} Verträge` : undefined,
    });
    fireConfetti({ duration: 1500 });
    onAddedToOffer?.();
  };
  
  // Filter promos - simple list for toggle buttons
  const availablePromos = promos.filter(p => p.id !== "NONE");
  const selectedPromo = promos.find(p => p.id === mobileState.promoId);
  const hasSelectedPromo = mobileState.promoId && mobileState.promoId !== "NONE";
  
  const marginColor = margin >= 100 ? "text-emerald-600" : margin >= 0 ? "text-amber-600" : "text-red-600";
  
  return (
    <div className="mt-4 p-5 rounded-xl border-2 border-primary/30 bg-primary/5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-primary" />
          <span className="font-semibold text-primary">{tariff.name} ausgewählt</span>
          {mobileState.quantity > 1 && (
            <Badge variant="secondary">{mobileState.quantity}x</Badge>
          )}
        </div>
      </div>
      
      {/* OMO Warning */}
      {omoActive && (
        <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
            OMO-Rate ({mobileState.omoRate}%) aktiv – Rabatte deaktiviert
          </AlertDescription>
        </Alert>
      )}
      
      {/* Discount Toggle Buttons */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Rabatt wählen</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* No Discount */}
          <button
            onClick={() => onPromoChange("NONE")}
            disabled={omoActive}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
              !hasSelectedPromo && !omoActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50",
              omoActive && "opacity-50 cursor-not-allowed"
            )}
          >
            Kein Rabatt
          </button>
          
          {/* Available Promos */}
          {availablePromos.map((promo) => {
            const isSelected = mobileState.promoId === promo.id;
            const isDisabled = omoActive;
            
            // Short label for button
            let shortLabel = promo.label;
            if (promo.type === "PCT_OFF_BASE") {
              shortLabel = `-${(promo.value * 100).toFixed(0)}%`;
            } else if (promo.type === "ABS_OFF_BASE" && promo.amountNetPerMonth) {
              shortLabel = `-${promo.amountNetPerMonth}€`;
            } else if (promo.type === "INTRO_PRICE") {
              shortLabel = `${promo.durationMonths}M gratis`;
            }
            
            return (
              <button
                key={promo.id}
                onClick={() => {
                  if (!isDisabled) {
                    // Reset OMO when selecting promo
                    if (omoActive && onOmoChange) {
                      onOmoChange(0);
                    }
                    onPromoChange(promo.id);
                  }
                }}
                disabled={isDisabled}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary/50",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {shortLabel}
              </button>
            );
          })}
        </div>
        
        {/* Promo description */}
        {selectedPromo && selectedPromo.id !== "NONE" && (
          <p className="text-xs text-muted-foreground mt-2">
            {selectedPromo.type === "INTRO_PRICE" && `${selectedPromo.durationMonths} Monate Grundgebühr entfällt`}
            {selectedPromo.type === "PCT_OFF_BASE" && `${(selectedPromo.value * 100).toFixed(0)}% Rabatt für ${selectedPromo.durationMonths} Monate`}
            {selectedPromo.type === "ABS_OFF_BASE" && `−${selectedPromo.amountNetPerMonth}€/mtl. für ${selectedPromo.durationMonths} Monate`}
          </p>
        )}
      </div>
      
      {/* Price Display */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card rounded-lg border border-border mb-4">
        {/* Left: Price */}
        <div className="flex items-baseline gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ø Monatspreis</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                <AnimatedCurrency value={avgMonthly} decimals={2} />
              </span>
              <span className="text-muted-foreground">€</span>
            </div>
          </div>
          
          {/* Savings Badge */}
          {hasDiscount && (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1">
              <TrendingDown className="w-3 h-3" />
              -{savingsPercent.toFixed(0)}%
            </Badge>
          )}
        </div>
        
        {/* Right: Margin (Dealer only) */}
        {showDealerEconomics && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Marge</p>
            <p className={cn("text-2xl font-bold", marginColor)}>
              <AnimatedCurrency value={margin} variant="margin" decimals={0} />
            </p>
          </div>
        )}
      </div>
      
      {/* CTA Button */}
      <div className="flex gap-3">
        {isAlreadyAdded ? (
          <div className="flex items-center gap-3 flex-1">
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 py-2 px-4">
              <Check className="w-4 h-4 mr-2" />
              Im Angebot enthalten
            </Badge>
            {onAddedToOffer && (
              <Button
                variant="outline"
                onClick={onAddedToOffer}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Weiteren Tarif
              </Button>
            )}
          </div>
        ) : (
          <Button
            size="lg"
            onClick={handleAdd}
            className="flex-1 bg-primary hover:bg-primary/90 gap-2 font-semibold text-base shadow-lg shadow-primary/30"
          >
            <Plus className="w-5 h-5" />
            Zum Angebot hinzufügen
            <Sparkles className="w-4 h-4 animate-pulse" />
          </Button>
        )}
      </div>
    </div>
  );
}
