// ============================================
// Summary Sidebar - Overview Only
// ============================================
//
// Simplified sidebar showing only:
// - Configuration overview (Hardware, Tarif, Festnetz)
// - Active discounts
// - Dealer economics (when in dealer mode)
// - PRIMARY CTA (Add to Offer) - ALWAYS VISIBLE
//
// Actions moved to FloatingActionBar for better UX.
// ============================================

import { Smartphone, Signal, Wifi, Check, Tag, FileText, Calendar, LayoutGrid, Plus, Sparkles, ShoppingBag, AlertCircle } from "lucide-react";
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
import type { OfferOptionState, CalculationResult, ViewMode } from "../../engine/types";
import { getMobileTariffFromCatalog } from "../../engine/catalogResolver";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { useOfferBasket } from "../../contexts/OfferBasketContext";
import { PdfDownloadButton } from "./PdfDownloadButton";
import { CreateCalendarEventModal } from "./CreateCalendarEventModal";
import { MarginBadge } from "./MarginBadge";
import { AnimatedCurrency } from "./AnimatedCurrency";
import { cn } from "@/lib/utils";
import { getProfitabilityStatus, calculateMarginPercent } from "../../lib/formatters";
import { toast } from "sonner";
import { fireConfetti } from "@/lib/confetti";
import { useMemo } from "react";

interface SummarySidebarProps {
  option: OfferOptionState;
  result: CalculationResult;
  viewMode: ViewMode;
  quantityBonus?: number;
  onResetForNewTariff?: () => void;
  className?: string;
}

export function SummarySidebar({
  option,
  result,
  viewMode,
  quantityBonus = 0,
  onResetForNewTariff,
  className
}: SummarySidebarProps) {
  const visibility = useSensitiveFieldsVisible(viewMode);
  const showDealerEconomics = visibility.showDealerEconomics;

  const margin = result.dealer.margin + quantityBonus;
  const avgMonthly = result.totals.avgTermNet;
  const provision = result.dealer.provisionBase;

  const hasHardware = option.hardware.ekNet > 0;
  const hasTariff = !!option.mobile.tariffId;
  const hasFixedNet = option.fixedNet.enabled;

  // Check if GigaKombi is eligible
  const isGigaKombiEligible = hasFixedNet &&
    option.mobile.tariffId.toLowerCase().includes("prime");

  // TeamDeal check
  const quantity = option.mobile.quantity;
  const teamDealActive = quantity >= 3;
  const teamDealPercentage = quantity >= 5 ? 10 : quantity >= 3 ? 5 : 0;

  // Profitability status
  const marginPerContract = margin / quantity;
  const profitabilityStatus = getProfitabilityStatus(marginPerContract);
  const marginPercent = calculateMarginPercent(margin, result.totals.sumTermNet);

  // === PRIMARY CTA LOGIC (Add to Offer) ===
  const { addItem, items } = useOfferBasket();

  // Generate a descriptive name for this tariff
  const tariffName = useMemo(() => {
    const tariffBreakdown = result.breakdown.find(b => b.ruleId === "base");
    const baseName = tariffBreakdown?.label?.replace(" Grundpreis", "") || option.mobile.tariffId;

    const parts = [baseName];
    if (option.mobile.quantity > 1) parts.push(`(×${option.mobile.quantity})`);
    if (option.hardware.ekNet > 0) parts.push(`+ ${option.hardware.name}`);

    return parts.join(" ");
  }, [option, result]);

  // Check if already added
  const isAlreadyAdded = items.some(
    item =>
      item.option.mobile.tariffId === option.mobile.tariffId &&
      item.option.hardware.name === option.hardware.name &&
      item.option.mobile.contractType === option.mobile.contractType
  );

  const handleAddToOffer = () => {
    addItem(tariffName, option, result);
    toast.success(`"${tariffName}" zum Angebot hinzugefügt`, { duration: 2000 });
    fireConfetti({ duration: 1000, quick: true });

    if (onResetForNewTariff) {
      setTimeout(() => onResetForNewTariff(), 500);
    }
  };

  return (
    <div className={cn(
      "bg-card border border-border rounded-xl sticky top-4 overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">Übersicht</h3>
          {hasTariff && (
            <Badge variant="secondary" className="text-xs">
              {option.mobile.quantity}x
            </Badge>
          )}
        </div>
        {/* Quick KPI */}
        <div className="mt-2 text-right">
          {hasTariff && result.totals.avgTermNet < (getMobileTariffFromCatalog(option.meta.datasetVersion, option.mobile.tariffId)?.baseNet ?? 0) && (
            <div className="flex items-center justify-end gap-2 mb-0.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Regulär:</span>
              <span className="text-xs text-muted-foreground line-through decoration-amber-500/50">
                <AnimatedCurrency value={getMobileTariffFromCatalog(option.meta.datasetVersion, option.mobile.tariffId)?.baseNet ?? 0} decimals={2} /> €
              </span>
            </div>
          )}
          <p className="text-2xl font-bold">
            <AnimatedCurrency value={avgMonthly} decimals={2} />
          </p>
          <p className="text-xs text-muted-foreground">Ø Monat (Effektiv)</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Components List */}
        <div className="space-y-3">
          {/* Hardware */}
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
              hasHardware ? "bg-primary/10" : "bg-muted/50"
            )}>
              <Smartphone className={cn(
                "w-3.5 h-3.5",
                hasHardware ? "text-primary" : "text-muted-foreground/50"
              )} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground/70">Hardware</p>
              <p className="font-medium text-sm truncate">
                {option.hardware.name || "SIM Only"}
              </p>
              {showDealerEconomics && hasHardware && (
                <p className="text-xs text-muted-foreground/70">
                  EK: <AnimatedCurrency value={option.hardware.ekNet} decimals={2} className="text-xs" />
                </p>
              )}
            </div>
          </div>

          {/* Mobile Tariff */}
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
              hasTariff ? "bg-primary/10" : "bg-muted/50"
            )}>
              <Signal className={cn(
                "w-3.5 h-3.5",
                hasTariff ? "text-primary" : "text-muted-foreground/50"
              )} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground/70">Mobilfunk</p>
              <p className="font-medium text-sm truncate">
                {option.mobile.tariffId
                  ? option.mobile.tariffId.replace(/_/g, " ")
                  : "Kein Tarif gewählt"}
              </p>
              {hasTariff && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs h-5">
                    {option.mobile.contractType === "new" ? "Neu" : "VVL"}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Net */}
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
              hasFixedNet ? "bg-primary/10" : "bg-muted/50"
            )}>
              <Wifi className={cn(
                "w-3.5 h-3.5",
                hasFixedNet ? "text-primary" : "text-muted-foreground/50"
              )} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground/70">Festnetz</p>
              <p className="font-medium text-sm">
                {hasFixedNet ? "Aktiv" : "Nicht aktiv"}
              </p>
              {hasFixedNet && option.fixedNet.productId && (
                <p className="text-xs text-muted-foreground/70 truncate">
                  {option.fixedNet.productId.replace(/_/g, " ")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* GigaKombi Status */}
        {isGigaKombiEligible && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                GigaKombi aktiv
              </span>
            </div>
          </div>
        )}

        {/* Active Discounts Section */}
        {(teamDealActive || isGigaKombiEligible) && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground/70 font-medium flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Aktive Rabatte
            </p>
            {teamDealActive && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground/70">TeamDeal ({quantity}x)</span>
                <span className="text-emerald-600 font-medium">-{teamDealPercentage}%</span>
              </div>
            )}
            {isGigaKombiEligible && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground/70">GigaKombi</span>
                <span className="text-emerald-600 font-medium">-5€/Monat</span>
              </div>
            )}
          </div>
        )}

        {/* Dealer Economics - STRICT SECURITY GATE */}
        {showDealerEconomics ? (
          <div className="space-y-2 pt-3 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground/70">Provision</span>
              <span className="font-medium text-emerald-600">
                <AnimatedCurrency value={provision} variant="positive" decimals={0} />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">Marge</span>
              <MarginBadge margin={margin} marginPercentage={marginPercent} size="md" />
            </div>
            <p className="text-xs text-muted-foreground/70">
              {profitabilityStatus === "critical" && "⚠️ Verlustrisiko!"}
              {profitabilityStatus === "warning" && "💡 Optimierungspotenzial"}
              {profitabilityStatus === "positive" && "✅ Gute Marge"}
            </p>
          </div>
        ) : null}

        {/* Secondary Actions (Actions Dropdown) */}
        <div className="space-y-2 pt-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full gap-2 text-muted-foreground/70 hover:text-foreground">
                <LayoutGrid className="w-4 h-4" />
                Export & Aktionen
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Dokumente</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <div className="w-full cursor-pointer focus:bg-accent focus:text-accent-foreground p-0">
                  <PdfDownloadButton
                    option={option}
                    result={result}
                    variant="outline"
                    size="sm"
                    type="customer"
                    viewMode={viewMode}
                    className="w-full justify-start px-2 py-1.5 h-auto font-normal"
                  />
                </div>
              </DropdownMenuItem>

              {/* Dealer PDF - Strictly Guarded */}
              {showDealerEconomics ? (
                <DropdownMenuItem asChild>
                  <div className="w-full cursor-pointer focus:bg-accent focus:text-accent-foreground p-0">
                    <PdfDownloadButton
                      option={option}
                      result={result}
                      variant="outline"
                      size="sm"
                      type="dealer"
                      viewMode={viewMode}
                      className="w-full justify-start px-2 py-1.5 h-auto font-normal"
                    />
                  </div>
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Tools</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                <div className="w-full p-0">
                  <CreateCalendarEventModal
                    trigger={
                      <button className="w-full flex items-center justify-start gap-2 px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors text-left">
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
      </div>

      {/* === PRIMARY CTA FOOTER (Always Visible) === */}
      <div className="p-4 border-t border-border bg-muted/30 sticky bottom-0">
        {hasTariff ? (
          isAlreadyAdded ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Im Angebot</span>
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
                  onClick={() => {
                    if (window.confirm("Möchtest du wirklich einen weiteren Tarif konfigurieren?")) {
                      onResetForNewTariff();
                    }
                  }}
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Weiteren Tarif hinzufügen
                </Button>
              )}
            </div>
          ) : (
            <Button
              size="lg"
              onClick={handleAddToOffer}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2 font-semibold shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-5 h-5" />
              Zum Angebot hinzufügen
              <Sparkles className="w-4 h-4 animate-pulse" />
            </Button>
          )
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block">
                <Button
                  size="lg"
                  disabled
                  className="w-full opacity-50 cursor-not-allowed gap-2"
                >
                  <AlertCircle className="w-5 h-5" />
                  Zum Angebot hinzufügen
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bitte zuerst einen Tarif wählen</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
