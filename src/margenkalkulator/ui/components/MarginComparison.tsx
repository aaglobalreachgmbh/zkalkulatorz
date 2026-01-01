// ============================================
// Pro-Dashboard: Margin Comparison (A/B Testing)
// Modul 2.5 - Vergleich zweier Konfigurationen
// ============================================

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Trophy, Download, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MarginCalculationOutput, ProfitabilityStatus } from "../../engine/marginWaterfallEngine";
import type { TariffDefinition } from "../../engine/tariffEngine";

interface OptionConfig {
  label: string;
  marginData: MarginCalculationOutput;
  tariff: TariffDefinition;
  hardware: {
    name: string;
    ek: number;
  };
}

interface MarginComparisonProps {
  /** Option A (z.B. aktuell) */
  optionA: OptionConfig;
  /** Option B (z.B. optimiert) */
  optionB: OptionConfig;
  /** Callback zum Tauschen */
  onSwap?: () => void;
  /** Callback zum Exportieren */
  onExport?: () => void;
  /** Kompakte Ansicht */
  compact?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

const STATUS_CONFIG: Record<ProfitabilityStatus, { color: string; bgLight: string; emoji: string }> = {
  positive: { color: "text-success", bgLight: "bg-success/10", emoji: "✅" },
  warning: { color: "text-warning", bgLight: "bg-warning/10", emoji: "⚠️" },
  critical: { color: "text-destructive", bgLight: "bg-destructive/10", emoji: "❌" },
};

export function MarginComparison({
  optionA,
  optionB,
  onSwap,
  onExport,
  compact = false,
}: MarginComparisonProps) {
  const marginDiff = optionB.marginData.netMarginTotal - optionA.marginData.netMarginTotal;
  const winner = marginDiff > 0 ? "B" : marginDiff < 0 ? "A" : "tie";

  const configA = STATUS_CONFIG[optionA.marginData.profitabilityStatus];
  const configB = STATUS_CONFIG[optionB.marginData.profitabilityStatus];

  if (compact) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">
            Margen-Vergleich
          </span>
          {winner !== "tie" && (
            <div className="flex items-center gap-1 text-xs">
              <Trophy className="w-3.5 h-3.5 text-warning" />
              <span className="font-medium">Option {winner}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className={cn("px-2 py-1 rounded", configA.bgLight)}>
            <span className={configA.color}>
              {formatCurrency(optionA.marginData.netMarginTotal)}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className={cn("px-2 py-1 rounded", configB.bgLight)}>
            <span className={configB.color}>
              {formatCurrency(optionB.marginData.netMarginTotal)}
            </span>
          </div>
          <span className={cn("font-semibold", marginDiff > 0 ? "text-success" : "text-destructive")}>
            {marginDiff > 0 ? "+" : ""}{formatCurrency(marginDiff)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Margen-Vergleich
        </h3>
        <div className="flex items-center gap-2">
          {onSwap && (
            <Button variant="ghost" size="sm" onClick={onSwap}>
              <ArrowLeftRight className="w-4 h-4 mr-1" />
              Tauschen
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 divide-x divide-border">
        {/* Option A */}
        <OptionColumn
          option={optionA}
          config={configA}
          isWinner={winner === "A"}
          label="A"
        />

        {/* Option B */}
        <OptionColumn
          option={optionB}
          config={configB}
          isWinner={winner === "B"}
          label="B"
        />
      </div>

      {/* Difference Footer */}
      <div className="px-5 py-4 bg-muted/30 border-t border-border">
        <div className="flex items-center justify-center gap-4">
          <span className="text-sm text-muted-foreground">Differenz:</span>
          <span
            className={cn(
              "text-lg font-bold",
              marginDiff > 0 ? "text-success" : marginDiff < 0 ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {marginDiff > 0 ? "+" : ""}{formatCurrency(marginDiff)}
          </span>
          {winner !== "tie" && (
            <span className="text-sm text-muted-foreground">
              (Option {winner} gewinnt!)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function OptionColumn({
  option,
  config,
  isWinner,
  label,
}: {
  option: OptionConfig;
  config: { color: string; bgLight: string; emoji: string };
  isWinner: boolean;
  label: string;
}) {
  return (
    <div className={cn("p-5 space-y-4", isWinner && "bg-success/5")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Option {label}
          </span>
          {isWinner && (
            <Trophy className="w-4 h-4 text-warning" />
          )}
        </div>
        <span className="text-xs text-muted-foreground">{option.label}</span>
      </div>

      {/* Config Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tarif:</span>
          <span className="font-medium text-foreground">{option.tariff.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Hardware:</span>
          <span className="font-medium text-foreground truncate max-w-[120px]">
            {option.hardware.name || "SIM-Only"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sub-Stufe:</span>
          <span className="font-medium text-foreground">{option.tariff.subsidyLevel}</span>
        </div>
      </div>

      {/* Margin Display */}
      <div className={cn("p-4 rounded-lg text-center", config.bgLight)}>
        <div className="text-xs text-muted-foreground mb-1">Marge</div>
        <div className={cn("text-xl font-bold", config.color)}>
          {formatCurrency(option.marginData.netMarginTotal)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {config.emoji} {option.marginData.marginPercentage.toFixed(1)}%
        </div>
      </div>

      {/* Breakdown Summary */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Airtime:</span>
          <span className="text-success">
            +{formatCurrency(option.marginData.airtimeProvisionTotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Aktivierung:</span>
          <span className="text-success">
            +{formatCurrency(option.marginData.activationFeeTotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Hardware-EK:</span>
          <span className="text-destructive">
            -{formatCurrency(option.marginData.hardwareEK)}
          </span>
        </div>
      </div>
    </div>
  );
}
