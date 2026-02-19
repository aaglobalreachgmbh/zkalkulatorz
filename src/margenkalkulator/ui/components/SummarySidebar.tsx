// ============================================
// SummarySidebar - Customer Totals + Dealer Margins + PDFs
// Redesign: Clean two-box layout from screenshot
// ============================================

import { Plus, Check, ShoppingBag, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { useOfferBasket } from "../../contexts/OfferBasketContext";
import { useCalculator } from "../../context/CalculatorContext";
import { PdfDownloadButton } from "./PdfDownloadButton";
import { AnimatedCurrency } from "./AnimatedCurrency";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fireConfetti } from "@/lib/confetti";
import { useMemo, useCallback } from "react";

interface SummarySidebarProps {
  onResetForNewTariff?: () => void;
  className?: string;
}

export function SummarySidebar({ onResetForNewTariff, className }: SummarySidebarProps) {
  const {
    option1: option,
    result1: result,
    effectiveViewMode,
    quantityBonusForOption1: quantityBonus,
    goToSection,
  } = useCalculator();

  const visibility = useSensitiveFieldsVisible(effectiveViewMode);
  const { addItem, items } = useOfferBasket();

  const tariffName = useMemo(() => {
    if (!result) return "";
    const parts = [option.mobile.tariffId?.replace(/_/g, " ") || "Tarif"];
    if (option.mobile.quantity > 1) parts.push(`(×${option.mobile.quantity})`);
    if (option.hardware.ekNet > 0) parts.push(`+ ${option.hardware.name}`);
    return parts.join(" ");
  }, [option, result]);

  const isAlreadyAdded = useMemo(() => items.some(
    item =>
      item.option.mobile.tariffId === option.mobile.tariffId &&
      item.option.hardware.name === option.hardware.name &&
      item.option.mobile.contractType === option.mobile.contractType
  ), [items, option]);

  const handleAddToOffer = useCallback(() => {
    if (!result) return;
    addItem(tariffName, option, result);
    toast.success(`"${tariffName}" zum Angebot hinzugefügt`, { duration: 2000 });
    fireConfetti({ duration: 1000, quick: true });
    if (onResetForNewTariff) setTimeout(() => onResetForNewTariff(), 500);
  }, [addItem, tariffName, option, result, onResetForNewTariff]);

  const handleGoToCheckout = useCallback(() => goToSection("compare"), [goToSection]);

  // Derived values
  const avgMonthly = result?.totals.avgTermNet ?? 0;
  const oneTimeCosts = result?.oneTime?.reduce((sum, item) => sum + item.net, 0) ?? 0;
  const total24M = avgMonthly * 24 * (option.mobile.quantity || 1);
  const margin = result ? result.dealer.margin + quantityBonus : 0;
  const provision = result?.dealer.provisionBase ?? 0;
  const hasTariff = !!option.mobile.tariffId;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Box 1: Customer Totals */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
          Customer Totals
        </h3>
        <div className="space-y-3">
          <TotalRow label="Avg. Monthly" value={avgMonthly} />
          <TotalRow label="One-Time Costs" value={oneTimeCosts} />
          <div className="border-t border-gray-100 pt-3">
            <TotalRow label="24-Month Total" value={total24M} bold />
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-3">
          *Includes all discounts and taxes
        </p>
      </div>

      {/* Box 2: Dealer Margins (Internal Only) */}
      {visibility.showDealerEconomics && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Dealer Margins
            </h3>
            <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] font-semibold">
              INTERNAL ONLY
            </Badge>
          </div>
          <div className="space-y-3">
            <TotalRow
              label="Total Margin"
              value={margin}
              colorize
            />
            <TotalRow
              label="Total Provision"
              value={provision}
            />
          </div>
        </div>
      )}

      {/* Box 3: PDF Export Buttons */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <PdfDownloadButton
            option={option}
            result={result}
            variant="default"
            size="default"
            type="customer"
            viewMode={effectiveViewMode}
            className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 font-medium"
          />
          {visibility.showDealerEconomics && (
            <PdfDownloadButton
              option={option}
              result={result}
              variant="outline"
              size="default"
              type="dealer"
              viewMode={effectiveViewMode}
              className="w-full gap-2 font-medium"
            />
          )}
          <p className="text-[11px] text-gray-400 text-center pt-1">
            Need help calculating margins?
          </p>
        </div>
      )}

      {/* Box 4: Primary CTA */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        {hasTariff ? (
          isAlreadyAdded ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 py-2.5 px-3 bg-green-50 rounded-lg border border-green-200">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Im Angebot</span>
                {items.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    <ShoppingBag className="w-3 h-3 mr-1" />
                    {items.length}
                  </Badge>
                )}
              </div>
              {onResetForNewTariff && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); onResetForNewTariff(); }}
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Weiteren Tarif
                </Button>
              )}
            </div>
          ) : (
            <Button
              size="lg"
              onClick={(e) => { e.stopPropagation(); handleAddToOffer(); }}
              className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 font-semibold shadow-md"
            >
              <Plus className="w-5 h-5" />
              Zum Angebot
            </Button>
          )
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="lg" disabled className="w-full opacity-50 gap-2">
                Zum Angebot
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bitte zuerst einen Tarif wählen</p>
            </TooltipContent>
          </Tooltip>
        )}

        {items.length > 0 && (
          <Button
            size="lg"
            variant="default"
            onClick={(e) => { e.stopPropagation(); handleGoToCheckout(); }}
            className="w-full mt-3 gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <FileText className="w-5 h-5" />
            Gesamtangebot ({items.length})
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Helper: Total Row ---
function TotalRow({
  label,
  value,
  bold = false,
  colorize = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
  colorize?: boolean;
}) {
  const isZero = Math.abs(value) < 0.01;
  const isNegative = value < 0;

  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-sm", bold ? "font-semibold text-gray-900" : "text-gray-600")}>
        {label}
      </span>
      <span
        className={cn(
          "text-sm tabular-nums font-medium",
          isZero && "text-gray-400",
          !isZero && !colorize && (bold ? "text-gray-900 font-semibold" : "text-gray-900"),
          colorize && !isZero && (isNegative ? "text-red-600 font-semibold" : "text-green-600 font-semibold")
        )}
      >
        <AnimatedCurrency value={value} decimals={2} />
      </span>
    </div>
  );
}
