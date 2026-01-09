// ============================================
// Sticky Price Bar - Always visible overview
// ============================================
//
// Compact bar at the top that:
// - Shows selected tariff + quantity
// - Shows live monthly price
// - Shows dealer margin (dealer mode only)
// - Has quick "Add to Offer" button
//
// Appears when a tariff is selected
// Uses position: sticky to stay visible while scrolling
// ============================================

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Signal, Plus, Check, ShoppingCart, TrendingDown, FileText } from "lucide-react";
import { AnimatedCurrency } from "./AnimatedCurrency";
import { PdfExportDialog } from "./PdfExportDialog";
import { useOfferBasket } from "../../contexts/OfferBasketContext";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { toast } from "sonner";
import { fireConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";
import type { 
  MobileTariff, 
  MobileState, 
  OfferOptionState, 
  CalculationResult,
  ViewMode,
  HardwareState
} from "../../engine/types";

interface StickyPriceBarProps {
  tariff: MobileTariff | undefined;
  mobileState: MobileState;
  hardware: HardwareState;
  fullOption: OfferOptionState;
  result: CalculationResult;
  viewMode: ViewMode;
  quantityBonus?: number;
  onAddedToOffer?: () => void;
}

export function StickyPriceBar({
  tariff,
  mobileState,
  hardware,
  fullOption,
  result,
  viewMode,
  quantityBonus = 0,
  onAddedToOffer,
}: StickyPriceBarProps) {
  const { addItem, items } = useOfferBasket();
  const visibility = useSensitiveFieldsVisible(viewMode);
  const showDealerEconomics = visibility.showDealerEconomics;
  
  // Don't render if no tariff selected
  if (!tariff) {
    return null;
  }
  
  // Calculate values
  const avgMonthly = result.totals.avgTermNet;
  const margin = result.dealer.margin + quantityBonus;
  const basePrice = tariff.baseNet;
  const hasDiscount = avgMonthly < basePrice;
  
  // Generate tariff name for basket
  const tariffName = useMemo(() => {
    const parts = [tariff.name];
    if (mobileState.quantity > 1) {
      parts.push(`(×${mobileState.quantity})`);
    }
    if (hardware.ekNet > 0) {
      parts.push(`+ ${hardware.name}`);
    }
    return parts.join(" ");
  }, [tariff, mobileState.quantity, hardware]);
  
  // Check if already in basket
  const isAlreadyAdded = items.some(
    item => 
      item.option.mobile.tariffId === mobileState.tariffId &&
      item.option.hardware.name === hardware.name &&
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
  
  const marginColor = margin >= 100 ? "text-emerald-600" : margin >= 0 ? "text-amber-600" : "text-red-600";
  
  return (
    <div className="sticky top-0 z-40 -mx-4 px-4 py-3 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Tariff info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {hardware.ekNet > 0 ? (
              <Smartphone className="w-4 h-4 text-primary" />
            ) : (
              <Signal className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground truncate">{tariff.name}</span>
              {mobileState.quantity > 1 && (
                <Badge variant="secondary" className="shrink-0">×{mobileState.quantity}</Badge>
              )}
            </div>
            {hardware.ekNet > 0 && (
              <p className="text-xs text-muted-foreground truncate">+ {hardware.name}</p>
            )}
          </div>
        </div>
        
        {/* Center: Price */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Ø Monat</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">
                <AnimatedCurrency value={avgMonthly} decimals={2} />
              </span>
              <span className="text-sm text-muted-foreground">€</span>
              {hasDiscount && (
                <TrendingDown className="w-4 h-4 text-emerald-500 ml-1" />
              )}
            </div>
          </div>
          
          {/* Margin (Dealer only) */}
          {showDealerEconomics && (
            <div className="text-right border-l border-border pl-4">
              <p className="text-xs text-muted-foreground">Marge</p>
              <span className={cn("text-xl font-bold", marginColor)}>
                <AnimatedCurrency value={margin} variant="margin" decimals={0} />
              </span>
            </div>
          )}
        </div>
        
        {/* Right: Actions */}
        <div className="shrink-0 flex items-center gap-2">
          {/* PDF Export Button */}
          <PdfExportDialog
            option={fullOption}
            result={result}
            viewMode={viewMode}
          >
            <Button variant="outline" size="sm" className="gap-1.5">
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">PDF</span>
            </Button>
          </PdfExportDialog>
          
          {/* Add to Offer Button */}
          {isAlreadyAdded ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 py-1.5 px-3">
              <Check className="w-4 h-4 mr-1.5" />
              Im Angebot
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={handleAdd}
              className="bg-primary hover:bg-primary/90 gap-1.5 font-medium shadow-md"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Hinzufügen</span>
              <Plus className="w-4 h-4 sm:hidden" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
