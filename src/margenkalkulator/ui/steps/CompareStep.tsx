import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CalculationResult, ViewMode, OfferOptionState } from "../../engine/types";
import { Eye, EyeOff, Printer, Link2Off, Smartphone, Signal, Wifi, Lock, LockKeyhole, Copy, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { DiscreteMarginIndicator } from "../components/DiscreteMarginIndicator";
import { PdfDownloadButton } from "../components/PdfDownloadButton";
import { AiOfferCheck } from "../components/AiOfferCheck";
import { CreateCalendarEventModal } from "../components/CreateCalendarEventModal";
import { QuickSaveOfferButton } from "../components/QuickSaveOfferButton";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { useFeature } from "@/hooks/useFeature";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DealerEconomicsExtended } from "../../engine/calculators/dealer";

interface CompareStepProps {
  option1: OfferOptionState;
  option2: OfferOptionState;
  result1: CalculationResult;
  result2: CalculationResult;
  activeOption: 1 | 2;
  viewMode: ViewMode;
  onActiveOptionChange: (option: 1 | 2) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onCopyOption: (from: 1 | 2, to: 1 | 2) => void;
}

export function CompareStep({
  option1,
  option2,
  result1,
  result2,
  activeOption,
  viewMode,
  onActiveOptionChange,
  onViewModeChange,
  onCopyOption,
}: CompareStepProps) {
  // Use centralized visibility hook instead of direct viewMode check
  const visibility = useSensitiveFieldsVisible(viewMode);
  const isCustomerMode = visibility.effectiveMode === "customer";
  const showDealerEconomics = visibility.showDealerEconomics;
  
  // Feature-Gating for Option 2
  const { enabled: option2Enabled, reason: option2Reason } = useFeature("compareOption2");
  
  return (
    <div className="space-y-6">
      {/* Dark Header Bar */}
      <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
            {isCustomerMode ? (
              visibility.isCustomerSessionActive ? (
                <Lock className="w-5 h-5 text-amber-400" />
              ) : (
                <Eye className="w-5 h-5 text-slate-300" />
              )
            ) : (
              <EyeOff className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">
              {isCustomerMode ? "Customer Presentation" : "Dealer Dashboard"}
            </h3>
            <p className="text-sm text-slate-400">
              {visibility.isCustomerSessionActive 
                ? "Kundensitzung aktiv: Alle Händlerdaten gesperrt" 
                : isCustomerMode 
                  ? "Kundenansicht: Nur Verkaufspreise" 
                  : "Händleransicht: Marge & Provision sichtbar"
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewModeChange(isCustomerMode ? "dealer" : "customer")}
            className="bg-slate-700 hover:bg-slate-600 text-white border-0"
            disabled={visibility.isCustomerSessionActive}
          >
            {visibility.isCustomerSessionActive ? "Gesperrt" : "Modus wechseln"}
          </Button>
          <QuickSaveOfferButton
            config={option1}
            result={result1}
            variant="secondary"
            size="sm"
          />
          <PdfDownloadButton 
            option={option1} 
            result={result1} 
            variant="secondary"
            type="customer"
            viewMode={viewMode}
          />
          <PdfDownloadButton 
            option={option1} 
            result={result1} 
            variant="secondary"
            type="dealer"
            viewMode={viewMode}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="bg-white text-slate-900 hover:bg-slate-100 border-0 gap-2"
          >
            <Printer className="w-4 h-4" />
            Drucken
          </Button>
          <CreateCalendarEventModal
            trigger={
              <Button variant="secondary" size="sm" className="gap-2">
                <Calendar className="w-4 h-4" />
                Termin
              </Button>
            }
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Offer Card */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border-2 border-primary/30 overflow-hidden">
            {/* Orange top border accent */}
            <div className="h-1 bg-gradient-to-r from-orange-400 to-orange-500" />
            
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Ihr Angebot</h2>
                  <p className="text-sm text-muted-foreground">
                    Gültig bis {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')}
                  </p>
                </div>
                {/* Diskreter Marge-Indikator - nur für Mitarbeiter erkennbar, nicht bei Kundensitzung */}
                {isCustomerMode && !visibility.isCustomerSessionActive && (
                  <DiscreteMarginIndicator margin={result1.dealer.margin} className="mt-2" />
                )}
              </div>

              {/* Positions */}
              <div className="space-y-4">
                <h3 className="font-semibold text-muted-foreground">Positionen</h3>
                
                {/* Hardware Position - Kundenansicht: kein EK anzeigen! */}
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <span>
                      {option1.hardware.name || "Keine Hardware"}
                    </span>
                  </div>
                  <span className="font-medium">
                    {option1.hardware.ekNet > 0 
                      ? (isCustomerMode ? "inklusive" : `EK: ${option1.hardware.ekNet.toFixed(2)} €`)
                      : "–"
                    }
                  </span>
                </div>

                {/* Mobile Position */}
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Signal className="w-5 h-5 text-muted-foreground" />
                    <span>Mobilfunk-Tarif</span>
                  </div>
                  <span className="font-medium">
                    {result1.totals.avgTermNet.toFixed(2)} € /mtl.
                  </span>
                </div>

                {/* Fixed Net Position (if enabled) */}
                {option1.fixedNet.enabled && (
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Wifi className="w-5 h-5 text-muted-foreground" />
                      <span>Festnetz</span>
                    </div>
                    <span className="font-medium">
                      inkl. im Ø Monatspreis
                    </span>
                  </div>
                )}
              </div>

              {/* Average Monthly Cost */}
              <div className="flex items-center justify-between pt-4 border-t-2 border-border">
                <span className="text-muted-foreground">Ø Kosten pro Monat (pro Vertrag)</span>
                <span className="text-4xl font-bold text-foreground">
                  {result1.totals.avgTermNet.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dealer Info Sidebar - controlled by visibility hook */}
        <div className="lg:col-span-1">
          {!showDealerEconomics ? (
            <div className="bg-card rounded-xl border border-border p-6 flex flex-col items-center justify-center h-full text-center">
              {visibility.isCustomerSessionActive ? (
                <>
                  <Lock className="w-12 h-12 text-amber-500/50 mb-4" />
                  <h4 className="font-medium text-muted-foreground">Kundensitzung aktiv</h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Händler-Daten sind während der Kundensitzung gesperrt.
                  </p>
                </>
              ) : (
                <>
                  <Link2Off className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <h4 className="font-medium text-muted-foreground">Händler-Daten verborgen</h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Wechseln Sie in den Dealer-Modus um Margen zu sehen.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h4 className="font-semibold">Händler-Kalkulation</h4>
              
              <div className="space-y-3">
                {/* Mobile Provision */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mobilfunk Provision</span>
                  <span className="font-medium">{result1.dealer.provisionBase.toFixed(2)} €</span>
                </div>
                
                {/* Fixed Net Provision (if enabled) */}
                {option1.fixedNet.enabled && result1.dealer.fixedNetProvision !== undefined && result1.dealer.fixedNetProvision > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Festnetz Provision</span>
                    <span className="font-medium text-emerald-600">+{result1.dealer.fixedNetProvision.toFixed(2)} €</span>
                  </div>
                )}
                
                {/* Push Bonus (if active) */}
                {(result1.dealer as DealerEconomicsExtended).pushBonus !== undefined && (result1.dealer as DealerEconomicsExtended).pushBonus! > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      Push-Bonus
                    </span>
                    <span className="font-medium text-emerald-600">+{(result1.dealer as DealerEconomicsExtended).pushBonus!.toFixed(2)} €</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hardware-EK</span>
                  <span className="font-medium">-{result1.dealer.hardwareEkNet.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Abzüge (OMO)</span>
                  <span className="font-medium">-{result1.dealer.deductions.toFixed(2)} €</span>
                </div>
                
                {/* Employee Deduction (if active) */}
                {(result1.dealer as DealerEconomicsExtended).employeeDeduction !== undefined && (result1.dealer as DealerEconomicsExtended).employeeDeduction! > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                      MA-Abzug
                    </span>
                    <span className="font-medium text-amber-600">-{(result1.dealer as DealerEconomicsExtended).employeeDeduction!.toFixed(2)} €</span>
                  </div>
                )}
                
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold">Netto-Marge</span>
                  <span className={`text-xl font-bold ${
                    result1.dealer.margin >= 0 ? "text-emerald-600" : "text-destructive"
                  }`}>
                    {result1.dealer.margin.toFixed(2)} €
                  </span>
                </div>
              </div>

              {result1.dealer.margin < 0 && (
                <p className="text-xs text-destructive">
                  Negative Marge: Hardware-Kosten übersteigen Provision.
                </p>
              )}
              
              {/* Push Bonus Badge */}
              {(result1.dealer as DealerEconomicsExtended).pushBonus !== undefined && (result1.dealer as DealerEconomicsExtended).pushBonus! > 0 && (
                <div className="pt-2">
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Push-Aktion aktiv
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KI-Angebots-Check - prominente Integration */}
      <div className="mt-6">
        <AiOfferCheck 
          config={option1} 
          result={result1} 
          compact={false} 
        />
      </div>
    </div>
  );
}
