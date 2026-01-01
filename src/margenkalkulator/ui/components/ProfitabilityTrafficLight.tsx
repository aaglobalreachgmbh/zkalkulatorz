// ============================================
// Pro-Dashboard: Profitability Traffic Light
// Modul 2.4 - Ampel-Anzeige für Margen-Health
// ============================================

import { cn } from "@/lib/utils";
import type { ProfitabilityStatus } from "../../engine/marginWaterfallEngine";

interface ProfitabilityTrafficLightProps {
  /** Gesamte Netto-Marge */
  marginTotal: number;
  /** Marge in Prozent */
  marginPercentage: number;
  /** Status (positive/warning/critical) */
  profitabilityStatus: ProfitabilityStatus;
  /** Anzahl Verträge */
  contractCount: number;
  /** Optionale Empfehlung */
  recommendation?: string;
  /** Kompakte Ansicht */
  compact?: boolean;
}

const STATUS_CONFIG = {
  positive: {
    color: "bg-success",
    textColor: "text-success",
    bgLight: "bg-success/10",
    borderColor: "border-success/30",
    label: "POSITIV",
    emoji: "🟢",
    statusText: "Sehr gut!",
    actionText: "Verkaufen ✓",
  },
  warning: {
    color: "bg-warning",
    textColor: "text-warning",
    bgLight: "bg-warning/10",
    borderColor: "border-warning/30",
    label: "WARNING",
    emoji: "🟡",
    statusText: "Knapp, aber ok",
    actionText: "Optimieren ⚠️",
  },
  critical: {
    color: "bg-destructive",
    textColor: "text-destructive",
    bgLight: "bg-destructive/10",
    borderColor: "border-destructive/30",
    label: "KRITISCH",
    emoji: "🔴",
    statusText: "Verlust!",
    actionText: "Nicht verkaufen",
  },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function ProfitabilityTrafficLight({
  marginTotal,
  marginPercentage,
  profitabilityStatus,
  contractCount,
  recommendation,
  compact = false,
}: ProfitabilityTrafficLightProps) {
  const config = STATUS_CONFIG[profitabilityStatus];
  const marginPerContract = contractCount > 0 ? marginTotal / contractCount : 0;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-lg border",
          config.bgLight,
          config.borderColor
        )}
      >
        <span className="text-lg">{config.emoji}</span>
        <div className="flex-1 min-w-0">
          <span className={cn("font-semibold text-sm", config.textColor)}>
            {config.label}
          </span>
          <span className="text-muted-foreground text-sm ml-2">
            {formatCurrency(marginPerContract)}/Vertrag
          </span>
        </div>
        <span className={cn("text-sm font-medium", config.textColor)}>
          {marginPercentage.toFixed(1)}%
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-all",
        config.bgLight,
        config.borderColor
      )}
    >
      {/* Header */}
      <div className="text-sm font-medium text-muted-foreground mb-4">
        Profitabilität
      </div>

      {/* Main Status */}
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">{config.emoji}</div>
        <div className={cn("text-xl font-bold", config.textColor)}>
          {config.label}
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Marge pro Vertrag:</span>
          <span className={cn("font-semibold", config.textColor)}>
            {formatCurrency(marginPerContract)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Marge gesamt:</span>
          <span className={cn("font-semibold", config.textColor)}>
            {formatCurrency(marginTotal)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Margin %:</span>
          <span className={cn("font-semibold", config.textColor)}>
            {marginPercentage >= 0 ? "+" : ""}
            {marginPercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Status & Action */}
      <div className="border-t border-border pt-3 space-y-1">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Status:</span>
          <span className="font-medium text-foreground">{config.statusText}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Empfehlung:</span>
          <span className={cn("font-medium", config.textColor)}>
            {recommendation || config.actionText}
          </span>
        </div>
      </div>
    </div>
  );
}
