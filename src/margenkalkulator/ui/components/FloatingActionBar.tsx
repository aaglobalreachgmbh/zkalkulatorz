// ============================================
// Floating Action Bar - Always-Visible Actions
// ============================================
//
// Sticky footer bar with:
// - Live price display (always visible)
// - "Add to Offer" button (prominent) with disable states
// - Basket badge (shows item count)
// - Works on Desktop + Mobile
//
// Replaces some sidebar functionality for better UX.
// ============================================

import { Plus, Check, ShoppingBag, Euro, TrendingUp, TrendingDown, Sparkles, AlertCircle } from "lucide-react";
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
    if (margin >= 100) return "text-emerald-400";
    if (margin >= 0) return "text-amber-400";
    return "text-red-400";
  }, [margin]);

  return (
    <div className={cn(
      "bg-slate-900 text-white border-t border-slate-700 shadow-lg",
      className
    )}>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {/* Left: Price Info */}
        <div className="flex items-center gap-4 lg:gap-6">
          {/* Monthly Price */}
          <div className="text-center min-w-[80px]">
            <p className="text-[9px] uppercase tracking-wider text-slate-400">Ø Monat</p>
            <div className="flex items-center justify-center gap-1">
              <Euro className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-lg font-bold">
                <AnimatedCurrency value={avgMonthly} decimals={2} />
              </p>
            </div>
          </div>
          
          {/* Quantity Badge */}
          {quantity > 1 && (
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-wider text-slate-400">Verträge</p>
              <p className="text-lg font-bold tabular-nums">{quantity}x</p>
            </div>
          )}
          
          {/* Dealer: Margin */}
          {showDealerEconomics && (
            <div className="text-center hidden sm:block">
              <p className="text-[9px] uppercase tracking-wider text-slate-400">Marge</p>
              <div className="flex items-center justify-center gap-1">
                {margin >= 0 ? (
                  <TrendingUp className={cn("w-3.5 h-3.5", marginColor)} />
                ) : (
                  <TrendingDown className={cn("w-3.5 h-3.5", marginColor)} />
                )}
                <p className={cn("text-lg font-bold", marginColor)}>
                  <AnimatedCurrency value={margin} variant="margin" decimals={0} />
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Center/Right: Action Button + Basket */}
        <div className="flex items-center gap-3">
          {/* Basket Badge */}
          {items.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-800 rounded-full px-3 py-1.5">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium">{items.length}</span>
            </div>
          )}
          
          {/* Add to Offer Button with Disable State */}
          {hasTariff ? (
            isAlreadyAdded ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Im Angebot
                </Badge>
                {onResetForNewTariff && (
                  <Button
                    size="sm"
                    onClick={onResetForNewTariff}
                    className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Weiteren Tarif</span>
                  </Button>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleAdd}
                className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5 font-semibold shadow-lg shadow-amber-500/30"
              >
                <Plus className="w-4 h-4" />
                <span>Zum Angebot</span>
                <Sparkles className="w-3.5 h-3.5 hidden sm:inline animate-pulse" />
              </Button>
            )
          ) : (
            /* Disabled state with tooltip explaining why */
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="sm"
                    disabled
                    className="opacity-50 cursor-not-allowed gap-1.5"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Zum Angebot</span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-800 text-white border-slate-700">
                <p>{disableReason}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
