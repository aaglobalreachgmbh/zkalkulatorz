import { Button } from "@/components/ui/button";
import type { CalculationResult, ViewMode, OfferOptionState } from "../../engine/types";
import { Eye, EyeOff, Printer, Link2Off, Smartphone, Signal, Wifi, FileText } from "lucide-react";
import { DiscreteMarginIndicator } from "../components/DiscreteMarginIndicator";
import { PdfDownloadButton } from "../components/PdfDownloadButton";

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
  const isCustomerMode = viewMode === "customer";
  
  return (
    <div className="space-y-6">
      {/* Dark Header Bar */}
      <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
            {isCustomerMode ? (
              <Eye className="w-5 h-5 text-slate-300" />
            ) : (
              <EyeOff className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">
              {isCustomerMode ? "Customer Presentation" : "Dealer Dashboard"}
            </h3>
            <p className="text-sm text-slate-400">
              {isCustomerMode 
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
          >
            Modus wechseln
          </Button>
          <PdfDownloadButton 
            option={option1} 
            result={result1} 
            variant="secondary"
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
                {/* Diskreter Marge-Indikator - nur für Mitarbeiter erkennbar */}
                {isCustomerMode && (
                  <DiscreteMarginIndicator margin={result1.dealer.margin} className="mt-2" />
                )}
              </div>

              {/* Positions */}
              <div className="space-y-4">
                <h3 className="font-semibold text-muted-foreground">Positionen</h3>
                
                {/* Hardware Position */}
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <span>
                      {option1.hardware.name || "Keine Hardware"}
                    </span>
                  </div>
                  <span className="font-medium">
                    {option1.hardware.ekNet > 0 
                      ? `${option1.hardware.ekNet.toFixed(2)} €` 
                      : "0,00 €"
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

        {/* Dealer Info Sidebar */}
        <div className="lg:col-span-1">
          {isCustomerMode ? (
            <div className="bg-card rounded-xl border border-border p-6 flex flex-col items-center justify-center h-full text-center">
              <Link2Off className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h4 className="font-medium text-muted-foreground">Händler-Daten verborgen</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Wechseln Sie in den Dealer-Modus um Margen zu sehen.
              </p>
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
                    <span className="font-medium">+{result1.dealer.fixedNetProvision.toFixed(2)} €</span>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
