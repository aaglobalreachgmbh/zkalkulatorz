import { Smartphone, Signal, Wifi, Check, X, Save, FileText, Mail, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OfferOptionState, CalculationResult, ViewMode } from "../../engine/types";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { PdfDownloadButton } from "./PdfDownloadButton";
import { QuickSaveOfferButton } from "./QuickSaveOfferButton";
import { CreateCalendarEventModal } from "./CreateCalendarEventModal";
import { MarginBadge } from "./MarginBadge";
import { cn } from "@/lib/utils";
import { getProfitabilityStatus, calculateMarginPercent } from "../../lib/formatters";

interface SummarySidebarProps {
  option: OfferOptionState;
  result: CalculationResult;
  viewMode: ViewMode;
  className?: string;
}

export function SummarySidebar({ 
  option, 
  result, 
  viewMode,
  className 
}: SummarySidebarProps) {
  const visibility = useSensitiveFieldsVisible(viewMode);
  const showDealerEconomics = visibility.showDealerEconomics;
  
  const margin = result.dealer.margin;
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
      "bg-card border border-border rounded-xl p-5 space-y-5 sticky top-4 max-h-[calc(100vh-6rem)] overflow-y-auto",
      className
    )}>
      <h3 className="font-semibold text-lg">Zusammenfassung</h3>
      
      {/* Components List */}
      <div className="space-y-3">
        {/* Hardware */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            hasHardware ? "bg-primary/10" : "bg-muted"
          )}>
            <Smartphone className={cn(
              "w-4 h-4",
              hasHardware ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Hardware</p>
            <p className="font-medium truncate">
              {option.hardware.name || "SIM Only"}
            </p>
            {showDealerEconomics && hasHardware && (
              <p className="text-xs text-muted-foreground">
                EK: {option.hardware.ekNet.toFixed(2)} €
              </p>
            )}
          </div>
        </div>
        
        {/* Mobile Tariff */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            hasTariff ? "bg-primary/10" : "bg-muted"
          )}>
            <Signal className={cn(
              "w-4 h-4",
              hasTariff ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Mobilfunk</p>
            <p className="font-medium truncate">
              {option.mobile.tariffId
                ? option.mobile.tariffId.replace(/_/g, " ")
                : "Kein Tarif gewählt"}
            </p>
            {hasTariff && (
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs">
                  {option.mobile.quantity}x
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {option.mobile.contractType === "new" ? "Neu" : "VVL"}
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        {/* Fixed Net */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            hasFixedNet ? "bg-primary/10" : "bg-muted"
          )}>
            <Wifi className={cn(
              "w-4 h-4",
              hasFixedNet ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Festnetz</p>
            <p className="font-medium">
              {hasFixedNet ? "Aktiv" : "Nicht aktiv"}
            </p>
            {hasFixedNet && option.fixedNet.productId && (
              <p className="text-xs text-muted-foreground truncate">
                {option.fixedNet.productId.replace(/_/g, " ")}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* GigaKombi Status */}
      {isGigaKombiEligible && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              GigaKombi aktiv
            </span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            -5€/Monat auf Mobilfunk
          </p>
        </div>
      )}
      
      {/* Active Discounts Section */}
      {(teamDealActive || isGigaKombiEligible) && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Aktive Rabatte
          </p>
          {teamDealActive && (
            <div className="flex justify-between text-sm">
              <span>TeamDeal ({quantity}x)</span>
              <span className="text-emerald-600 font-medium">-{teamDealPercentage}%</span>
            </div>
          )}
          {isGigaKombiEligible && (
            <div className="flex justify-between text-sm">
              <span>GigaKombi</span>
              <span className="text-emerald-600 font-medium">-5€/Monat</span>
            </div>
          )}
        </div>
      )}
      
      {/* Divider */}
      <div className="border-t border-border" />
      
      {/* Totals */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Ø Monat</span>
          <span className="text-xl font-bold">{avgMonthly.toFixed(2)} €</span>
        </div>
        
        {showDealerEconomics && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Provision</span>
              <span className="font-medium text-emerald-600">+{provision.toFixed(0)} €</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="font-semibold">Marge</span>
              <MarginBadge margin={margin} marginPercentage={marginPercent} size="lg" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {profitabilityStatus === "critical" && "⚠️ Verlustrisiko!"}
              {profitabilityStatus === "warning" && "💡 Optimierungspotenzial"}
              {profitabilityStatus === "positive" && "✅ Gute Marge"}
            </p>
          </>
        )}
      </div>
      
      {/* Divider */}
      <div className="border-t border-border" />
      
      {/* Action Buttons */}
      <div className="space-y-2">
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
            <Button variant="ghost" size="sm" className="w-full gap-2">
              <Calendar className="w-4 h-4" />
              Termin erstellen
            </Button>
          }
        />
      </div>
    </div>
  );
}
