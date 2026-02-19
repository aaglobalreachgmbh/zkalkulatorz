// ============================================
// TariffCard - Enterprise CPQ Horizontal Row
// Compact single-line: Name | Data | Price | CTA
// ============================================

import { Signal, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MobileTariff } from "@/margenkalkulator";

interface TariffCardProps {
  tariff: MobileTariff;
  isSelected: boolean;
  isBestseller?: boolean;
  index?: number; // for keyboard shortcut hint
  onSelect: () => void;
}

export function TariffCard({
  tariff,
  isSelected,
  isBestseller = false,
  index,
  onSelect,
}: TariffCardProps) {
  const isUnlimited = tariff.dataVolumeGB === "unlimited";
  const dataLabel = isUnlimited ? "Unlimited" : `${tariff.dataVolumeGB ?? "?"} GB`;

  const displayPrice = (tariff.family === "consumer_smart" || tariff.family === "gigamobil")
    ? tariff.baseNet * 1.19
    : tariff.baseNet;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-100",
        "hover:bg-muted/50 group",
        isSelected
          ? "bg-[hsl(var(--status-success)/0.08)] border-l-2 border-[hsl(var(--status-success))]"
          : isBestseller
            ? "border-l-2 border-primary/30"
            : "border-l-2 border-transparent"
      )}
    >
      {/* Keyboard shortcut hint */}
      {index !== undefined && index < 9 && (
        <span className="hidden group-hover:flex w-4 h-4 items-center justify-center text-[9px] font-bold rounded bg-muted text-muted-foreground shrink-0">
          {index + 1}
        </span>
      )}
      {index !== undefined && index < 9 && (
        <span className="flex group-hover:hidden w-4 h-4 items-center justify-center shrink-0">
          <Signal className="w-3 h-3 text-muted-foreground" />
        </span>
      )}
      {(index === undefined || index >= 9) && (
        <Signal className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      )}

      {/* Tariff Name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm font-semibold text-foreground truncate">
          {tariff.name || tariff.id.replace(/_/g, " ")}
        </span>
        {isBestseller && !isSelected && (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
            Top
          </span>
        )}
        {isSelected && (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))]">
            Aktiv
          </span>
        )}
      </div>

      {/* Data Badge */}
      <span className={cn(
        "shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
        isUnlimited
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground"
      )}>
        {isUnlimited && <Zap className="w-2.5 h-2.5" />}
        {dataLabel}
      </span>

      {/* Price */}
      <div className="shrink-0 text-right min-w-[70px]">
        <span className="text-sm font-bold text-foreground">{displayPrice.toFixed(2)}</span>
        <span className="text-[10px] text-muted-foreground ml-0.5">€/mtl.</span>
      </div>

      {/* CTA */}
      <div
        className={cn(
          "shrink-0 px-3 py-1 rounded-md text-xs font-semibold transition-colors",
          isSelected
            ? "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))]"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {isSelected ? "Gewählt ✓" : "Wählen"}
      </div>
    </button>
  );
}
