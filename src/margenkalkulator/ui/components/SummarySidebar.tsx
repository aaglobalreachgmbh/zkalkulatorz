// ============================================
// Summary Sidebar - Hero KPI Pattern
// Phase 5B.3: Refactored for minimal footprint
// ============================================

import { Plus, Check, ShoppingBag, LayoutGrid, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { useOfferBasket } from "../../contexts/OfferBasketContext";
import { useCalculator } from "../../context/CalculatorContext";
import { PdfDownloadButton } from "./PdfDownloadButton";
import { CreateCalendarEventModal } from "./CreateCalendarEventModal";
import { CompactConfigSummary } from "./CompactConfigSummary";
import { MarginProgressBar } from "./MarginProgressBar";
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

  // Generate tariff name for basket
  const tariffName = useMemo(() => {
    if (!result) return "";
    const parts = [option.mobile.tariffId?.replace(/_/g, " ") || "Tarif"];
    if (option.mobile.quantity > 1) parts.push(`(×${option.mobile.quantity})`);
    if (option.hardware.ekNet > 0) parts.push(`+ ${option.hardware.name}`);
    return parts.join(" ");
  }, [option, result]);

  // Check if already in basket
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

  // Early return for no result
  if (!result) {
    return (
      <div className={cn("bg-card border border-border rounded-xl p-6 text-center", className)}>
        <p className="text-muted-foreground text-sm">Wähle einen Tarif aus</p>
      </div>
    );
  }

  const margin = result.dealer.margin + quantityBonus;
  const avgMonthly = result.totals.avgTermNet;
  const hasTariff = !!option.mobile.tariffId;

  return (
    <div className={cn("bg-card border border-border rounded-xl sticky top-4 overflow-hidden flex flex-col", className)}>
      {/* Hero KPI Header */}
      <div className="p-5 text-center border-b border-border">
        <p className="text-4xl font-bold tracking-tight">
          <AnimatedCurrency value={avgMonthly} decimals={2} />
        </p>
        <p className="text-xs text-muted-foreground mt-1">Ø monatlich netto</p>
      </div>

      {/* Compact Config Summary */}
      <div className="p-4 border-b border-border">
        <CompactConfigSummary />
      </div>

      {/* Dealer Economics (Secured) */}
      {visibility.showDealerEconomics && (
        <div className="p-4 border-b border-border">
          <MarginProgressBar margin={margin} />
        </div>
      )}

      {/* Actions Dropdown */}
      <div className="p-4 border-b border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2 text-muted-foreground">
              <LayoutGrid className="w-4 h-4" />
              Export & Aktionen
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Dokumente</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <div className="w-full p-0">
                <PdfDownloadButton
                  option={option}
                  result={result}
                  variant="outline"
                  size="sm"
                  type="customer"
                  viewMode={effectiveViewMode}
                  className="w-full justify-start px-2 py-1.5 h-auto font-normal"
                />
              </div>
            </DropdownMenuItem>
            {visibility.showDealerEconomics && (
              <DropdownMenuItem asChild>
                <div className="w-full p-0">
                  <PdfDownloadButton
                    option={option}
                    result={result}
                    variant="outline"
                    size="sm"
                    type="dealer"
                    viewMode={effectiveViewMode}
                    className="w-full justify-start px-2 py-1.5 h-auto font-normal"
                  />
                </div>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Tools</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
              <div className="w-full p-0">
                <CreateCalendarEventModal
                  trigger={
                    <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm">
                      <Calendar className="w-4 h-4" />
                      Termin erstellen
                    </button>
                  }
                />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Primary CTA Footer */}
      <div className="p-4 mt-auto bg-muted/30">
        {hasTariff ? (
          isAlreadyAdded ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 py-2 px-3 bg-[hsl(var(--status-success)/0.1)] rounded-lg border border-[hsl(var(--status-success)/0.2)]">
                <Check className="w-4 h-4 text-[hsl(var(--status-success))]" />
                <span className="text-sm font-medium text-[hsl(var(--status-success))]">Im Angebot</span>
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
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold shadow-lg"
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
            className="w-full mt-3 gap-2 bg-[hsl(var(--status-success))] hover:bg-[hsl(var(--status-success)/0.9)] text-white"
          >
            <FileText className="w-5 h-5" />
            Gesamtangebot ({items.length})
          </Button>
        )}
      </div>
    </div>
  );
}
