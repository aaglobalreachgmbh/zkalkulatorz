// ============================================
// Enhanced OMO Rate Selector Component
// Mit Sperrlogik für ungültige Stufen aus OMO-Matrix
// ============================================

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Percent, Lock, AlertTriangle } from "lucide-react";
import type { MobileTariff } from "@/margenkalkulator/engine/types";

// Erweitert um 30% und 35% (Dataset-driven)
export type OMORate = 0 | 5 | 10 | 15 | 17.5 | 20 | 25 | 30 | 35;

interface OMORateSelectorEnhancedProps {
  value: OMORate;
  onChange: (rate: OMORate) => void;
  tariff: MobileTariff | undefined;
  contractType: "new" | "renewal";
  disabled?: boolean;
}

// Alle möglichen OMO-Stufen inkl. 30%/35% (werden nur angezeigt wenn im Dataset)
const ALL_OMO_RATES: OMORate[] = [0, 5, 10, 15, 17.5, 20, 25, 30, 35];

const OMO_RATE_LABELS: Record<OMORate, string> = {
  0: "Kein OMO",
  5: "OMO 5%",
  10: "OMO 10%",
  15: "OMO 15%",
  17.5: "OMO 17,5%",
  20: "OMO 20%",
  25: "OMO 25%",
  30: "OMO 30%",
  35: "OMO 35%",
};

/**
 * Holt den Provisionswert aus der OMO-Matrix
 * 
 * REGEL: XLSX ist Source-of-Truth
 * - Wenn Matrix vorhanden und Wert existiert → absoluter Wert
 * - Wenn null oder undefined → Stufe ist gesperrt
 * - Wenn keine Matrix → prozentuale Berechnung (Fallback)
 */
function getOMOProvisionFromMatrix(
  tariff: MobileTariff | undefined,
  omoRate: OMORate,
  contractType: "new" | "renewal"
): { provision: number | null; source: "matrix" | "calculated" | "locked" } {
  if (!tariff) {
    return { provision: null, source: "locked" };
  }

  // Prüfe auf OMO-Matrix
  if (tariff.omoMatrix) {
    const matrixValue = tariff.omoMatrix[omoRate];
    
    // Null oder undefined in Matrix = gesperrt
    if (matrixValue === null || matrixValue === undefined) {
      return { provision: null, source: "locked" };
    }
    
    // Wert aus Matrix (Source-of-Truth)
    return { provision: matrixValue, source: "matrix" };
  }
  
  // Kein Matrix vorhanden → Fallback auf Berechnung
  const baseProvision = contractType === "renewal" && tariff.provisionRenewal !== undefined
    ? tariff.provisionRenewal
    : tariff.provisionBase;
  
  if (omoRate === 0) {
    return { provision: baseProvision, source: "calculated" };
  }
  
  // Prozentuale Berechnung
  const calculatedProvision = Math.round(baseProvision * (1 - omoRate / 100) * 100) / 100;
  return { provision: calculatedProvision, source: "calculated" };
}

/**
 * Prüft welche OMO-Stufen verfügbar sind
 */
function getAvailableRates(
  tariff: MobileTariff | undefined,
  contractType: "new" | "renewal"
): Map<OMORate, { provision: number; source: "matrix" | "calculated" }> {
  const available = new Map<OMORate, { provision: number; source: "matrix" | "calculated" }>();
  
  for (const rate of ALL_OMO_RATES) {
    const result = getOMOProvisionFromMatrix(tariff, rate, contractType);
    if (result.provision !== null && result.source !== "locked") {
      available.set(rate, { provision: result.provision, source: result.source });
    }
  }
  
  return available;
}

/**
 * Enhanced OMO Rate Selector
 * 
 * FEATURES:
 * - Zeigt verfügbare OMO-Stufen basierend auf Tarif-Matrix
 * - Sperrt ungültige Stufen (Matrix-Wert = null)
 * - Zeigt Provision nach Abzug an
 * - Warnung wenn Matrix fehlt (prozentuale Berechnung)
 */
export function OMORateSelectorEnhanced({
  value,
  onChange,
  tariff,
  contractType,
  disabled,
}: OMORateSelectorEnhancedProps) {
  const availableRates = getAvailableRates(tariff, contractType);
  const currentResult = getOMOProvisionFromMatrix(tariff, value, contractType);
  
  // Kein Tarif oder keine Provision → nicht anzeigen
  if (!tariff || availableRates.size === 0) {
    return null;
  }

  // Alle Werte aus Berechnung = Warnung
  const allCalculated = Array.from(availableRates.values()).every(v => v.source === "calculated");
  
  // Aktuelle Auswahl ungültig → Reset auf 0
  if (!availableRates.has(value) && availableRates.has(0)) {
    onChange(0);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Percent className="w-4 h-4 text-muted-foreground" />
        <Label className="text-sm text-muted-foreground">OMO-Rabattstufe</Label>
        {!allCalculated && (
          <Badge variant="outline" className="text-xs">
            XLSX-Werte
          </Badge>
        )}
      </div>
      
      <Select
        value={String(value)}
        onValueChange={(v) => onChange(parseFloat(v) as OMORate)}
        disabled={disabled || availableRates.size <= 1}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="OMO-Stufe wählen" />
        </SelectTrigger>
        <SelectContent>
          {ALL_OMO_RATES.map((rate) => {
            const rateInfo = availableRates.get(rate);
            const isLocked = !rateInfo;
            
            return (
              <SelectItem
                key={rate}
                value={String(rate)}
                disabled={isLocked}
                className={isLocked ? "opacity-50" : ""}
              >
                <div className="flex items-center justify-between gap-4 w-full">
                  <div className="flex items-center gap-2">
                    {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                    <span className={isLocked ? "text-muted-foreground" : ""}>
                      {OMO_RATE_LABELS[rate]}
                    </span>
                  </div>
                  {rateInfo && (
                    <span className="text-xs text-muted-foreground">
                      → {rateInfo.provision}€
                    </span>
                  )}
                  {isLocked && (
                    <span className="text-xs text-muted-foreground">
                      Nicht verfügbar
                    </span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Aktuelle Provision anzeigen */}
      {currentResult.provision !== null && value > 0 && (
        <p className="text-xs text-muted-foreground">
          Provision nach OMO-Abzug: <strong>{currentResult.provision}€</strong>
          {currentResult.source === "calculated" && " (berechnet)"}
        </p>
      )}

      {/* Warnung wenn keine Matrix vorhanden */}
      {allCalculated && (
        <Alert variant="default" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Keine OMO-Matrix im Tarif. Werte werden prozentual berechnet.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Export die Hilfsfunktion für die Engine
export { getOMOProvisionFromMatrix };
