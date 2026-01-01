// ============================================
// Pro-Dashboard: Hardware Subvention Analysis
// Modul 2.3 - Hardware-Subventions-Analyse
// ============================================

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Smartphone, AlertTriangle, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getHardwareSubsidy } from "../../engine/tariffEngine";
import { calculateHardwareEconomics } from "../../engine/hardwareEngine";

interface HardwareSubventionAnalysisProps {
  /** Hardware-Informationen */
  hardware: {
    name: string;
    ekPrice: number;
  };
  /** Sub-Stufe (1-5) */
  subsidyLevel: 1 | 2 | 3 | 4 | 5;
  /** Vertragslaufzeit */
  termMonths: 24 | 36;
  /** Aktuelle Marge */
  currentMargin: number;
  /** Gesamte Airtime-Provision */
  totalAirtimeProvision?: number;
  /** Callback bei Hardware-Änderung */
  onHardwareChange?: (newEk: number) => void;
  /** Kompakte Ansicht */
  compact?: boolean;
}

interface HardwareAlternative {
  name: string;
  ekPrice: number;
  marginImpact: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(amount);
}

const HARDWARE_ALTERNATIVES: HardwareAlternative[] = [
  { name: "Samsung Galaxy S24", ekPrice: 380, marginImpact: 0 },
  { name: "Google Pixel 8", ekPrice: 320, marginImpact: 0 },
  { name: "iPhone SE (2024)", ekPrice: 280, marginImpact: 0 },
  { name: "SIM-Only", ekPrice: 0, marginImpact: 0 },
];

export function HardwareSubventionAnalysis({
  hardware,
  subsidyLevel,
  termMonths,
  currentMargin,
  totalAirtimeProvision = 0,
  onHardwareChange,
  compact = false,
}: HardwareSubventionAnalysisProps) {
  const [isOpen, setIsOpen] = useState(!compact);
  const [simulatedEk, setSimulatedEk] = useState(hardware.ekPrice);

  // Calculate hardware economics
  const hwEconomics = useMemo(() => {
    return calculateHardwareEconomics({
      hardwareEK: hardware.ekPrice,
      subsidyLevel,
      termMonths,
    });
  }, [hardware.ekPrice, subsidyLevel, termMonths]);

  // Calculate simulated economics
  const simulatedEconomics = useMemo(() => {
    return calculateHardwareEconomics({
      hardwareEK: simulatedEk,
      subsidyLevel,
      termMonths,
    });
  }, [simulatedEk, subsidyLevel, termMonths]);

  // Calculate alternatives with margin impact
  const alternatives = useMemo(() => {
    return HARDWARE_ALTERNATIVES.map((alt) => ({
      ...alt,
      marginImpact: hardware.ekPrice - alt.ekPrice,
    })).filter((alt) => alt.ekPrice < hardware.ekPrice);
  }, [hardware.ekPrice]);

  const subsidyConfig = getHardwareSubsidy(subsidyLevel);
  const netCost = hardware.ekPrice - hwEconomics.subsidy;
  const afterProvision = netCost - hwEconomics.provision;
  const isHardwareMoreThanProvision = hardware.ekPrice > totalAirtimeProvision;

  if (compact) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground truncate">
              {hardware.name || "Hardware"}
            </span>
          </div>
          <span
            className={cn(
              "text-sm font-semibold",
              afterProvision > 0 ? "text-destructive" : "text-success"
            )}
          >
            {formatCurrency(-afterProvision)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          EK: {formatCurrency(hardware.ekPrice)} | Sub-Stufe {subsidyLevel}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-primary" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-foreground">
                Hardware-Subventions-Analyse
              </h3>
              <p className="text-xs text-muted-foreground">
                {hardware.name || "Kein Gerät ausgewählt"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hardware.ekPrice > 0 && (
              <span
                className={cn(
                  "text-sm font-semibold",
                  currentMargin < 0 ? "text-destructive" : "text-success"
                )}
              >
                Netto: {formatCurrency(-afterProvision)}
              </span>
            )}
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-5 pb-5 pt-0 space-y-4">
            {/* Main Calculation */}
            {hardware.ekPrice > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gerät:</span>
                      <span className="font-medium text-foreground">
                        {hardware.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">EK-Preis:</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(hardware.ekPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sub-Stufe:</span>
                      <span className="font-medium text-foreground">
                        {subsidyLevel} ({subsidyConfig?.provisionPercentage || 0}%)
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subvention:</span>
                      <span className="font-medium text-success">
                        +{formatCurrency(hwEconomics.subsidy)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Provision:</span>
                      <span className="font-medium text-success">
                        +{formatCurrency(hwEconomics.provision)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Laufzeit:</span>
                      <span className="font-medium text-foreground">
                        {termMonths} Monate
                      </span>
                    </div>
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Netto-Kosten ({formatCurrency(hardware.ekPrice)} - {formatCurrency(hwEconomics.subsidy)}):
                    </span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(netCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Nach Provision ({formatCurrency(netCost)} - {formatCurrency(hwEconomics.provision)}):
                    </span>
                    <span
                      className={cn(
                        "font-semibold",
                        afterProvision > 0 ? "text-destructive" : "text-success"
                      )}
                    >
                      {formatCurrency(afterProvision)}
                    </span>
                  </div>
                </div>

                {/* Warning if hardware > provision */}
                {isHardwareMoreThanProvision && totalAirtimeProvision > 0 && (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-medium text-warning">
                        Warnung:
                      </span>{" "}
                      <span className="text-muted-foreground">
                        Hardware-EK ({formatCurrency(hardware.ekPrice)}) ist höher als die
                        Gesamtprovision ({formatCurrency(totalAirtimeProvision)}).
                      </span>
                    </div>
                  </div>
                )}

                {/* Simulator */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      EK-Simulator
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(simulatedEk)}
                    </span>
                  </div>
                  <Slider
                    value={[simulatedEk]}
                    onValueChange={(value) => setSimulatedEk(value[0])}
                    max={1200}
                    min={0}
                    step={50}
                    className="w-full"
                  />
                  {simulatedEk !== hardware.ekPrice && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Differenz zur aktuellen Hardware:
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          simulatedEk < hardware.ekPrice
                            ? "text-success"
                            : "text-destructive"
                        )}
                      >
                        {simulatedEk < hardware.ekPrice ? "+" : ""}
                        {formatCurrency(hardware.ekPrice - simulatedEk)} Marge
                      </span>
                    </div>
                  )}
                </div>

                {/* Alternatives */}
                {alternatives.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Lightbulb className="w-4 h-4 text-info" />
                      Alternativen:
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {alternatives.map((alt) => (
                        <button
                          key={alt.name}
                          onClick={() => onHardwareChange?.(alt.ekPrice)}
                          className="p-2 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors text-left"
                        >
                          <div className="text-sm font-medium text-foreground truncate">
                            {alt.name}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              EK: {formatCurrency(alt.ekPrice)}
                            </span>
                            <span className="text-xs font-semibold text-success">
                              +{formatCurrency(alt.marginImpact)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Smartphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  SIM-Only ausgewählt – keine Hardware-Kosten
                </p>
                <p className="text-xs text-success mt-1">
                  Maximale Marge durch entfallende Hardware-Subvention
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
