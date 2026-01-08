import { useState } from "react";
import { Smartphone, Signal, Wifi, Check, Calendar, Tag, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { OfferOptionState, CalculationResult, ViewMode } from "../../engine/types";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { PdfDownloadButton } from "./PdfDownloadButton";
import { QuickSaveOfferButton } from "./QuickSaveOfferButton";
import { CreateCalendarEventModal } from "./CreateCalendarEventModal";
import { MarginBadge } from "./MarginBadge";
import { AddToOfferButton } from "./AddToOfferButton";
import { AnimatedCurrency } from "./AnimatedCurrency";
import { cn } from "@/lib/utils";
import { getProfitabilityStatus, calculateMarginPercent } from "../../lib/formatters";

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
  const [isExpanded, setIsExpanded] = useState(false);
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

  return (
    <div className={cn(
      "bg-card border border-border rounded-xl sticky top-4 max-h-[calc(100vh-6rem)] overflow-hidden",
      className
    )}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {/* Collapsed Header - Always visible */}
        <CollapsibleTrigger className="w-full">
          <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-base">Zusammenfassung</h3>
              {hasTariff && (
                <Badge variant="secondary" className="text-xs">
                  {option.mobile.quantity}x
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Quick KPIs in collapsed state */}
              <div className="text-right">
                <p className="text-lg font-bold">
                  <AnimatedCurrency value={avgMonthly} decimals={2} />
                </p>
                <p className="text-xs text-muted-foreground/70">Ø/Monat</p>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        
        {/* Expanded Content */}
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
            {/* Components List */}
            <div className="space-y-3 pt-2 border-t border-border">
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
              <div className="space-y-1.5">
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
            
            {/* Dealer Economics */}
            {showDealerEconomics && (
              <div className="space-y-2 pt-3 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground/70">Provision</span>
                  <span className="font-medium text-emerald-600">
                    <AnimatedCurrency value={provision} variant="positive" decimals={0} />
                  </span>
                </div>
                {quantityBonus > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground/70 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      On-Top Bonus
                    </span>
                    <span className="font-medium text-amber-600">
                      <AnimatedCurrency value={quantityBonus} variant="positive" decimals={0} />
                    </span>
                  </div>
                )}
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
            )}
            
            {/* Action Buttons */}
            <div className="space-y-2 pt-3 border-t border-border">
              {/* Add to Offer Button - prominent for Cross-Selling */}
              {hasTariff && (
                <AddToOfferButton
                  option={option}
                  result={result}
                  onResetForNewTariff={onResetForNewTariff}
                  className="w-full"
                />
              )}
              
              <QuickSaveOfferButton
                config={option}
                result={result}
                variant="default"
                size="sm"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <PdfDownloadButton 
                  option={option} 
                  result={result} 
                  variant="outline"
                  size="sm"
                  type="customer"
                  viewMode={viewMode}
                />
                {showDealerEconomics && (
                  <PdfDownloadButton 
                    option={option} 
                    result={result} 
                    variant="outline"
                    size="sm"
                    type="dealer"
                    viewMode={viewMode}
                  />
                )}
              </div>
              
              <CreateCalendarEventModal
                trigger={
                  <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground/70 hover:text-foreground">
                    <Calendar className="w-4 h-4" />
                    Termin erstellen
                  </Button>
                }
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
