// ============================================
// TariffCard - Kompakte vertikale Karte
// ============================================

import { Check, X, Signal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MobileTariff, TariffFamily } from "@/margenkalkulator";

const TARIFF_SUBTITLES: Record<string, string> = {
  prime: "Maximale Performance",
  business_smart: "Der smarte Allrounder",
  smart_business: "Flexibel & effizient",
  teamdeal: "Perfekt für Teams",
  gigamobil: "Maximales Datenvolumen",
  consumer_smart: "Günstig & zuverlässig",
};

interface TariffCardProps {
  tariff: MobileTariff;
  isSelected: boolean;
  isCompact?: boolean;
  isBestseller?: boolean;
  onSelect: () => void;
}

export function TariffCard({
  tariff,
  isSelected,
  isCompact = false,
  isBestseller = false,
  onSelect,
}: TariffCardProps) {
  const isUnlimited = tariff.dataVolumeGB === "unlimited";
  const dataLabel = isUnlimited ? "Unlimited" : `${tariff.dataVolumeGB ?? "?"} GB`;
  const subtitle = TARIFF_SUBTITLES[tariff.family || "prime"] || "Business Tarif";

  const displayPrice = (tariff.family === "consumer_smart" || tariff.family === "gigamobil")
    ? tariff.baseNet * 1.19
    : tariff.baseNet;

  const displayFeatures = (tariff.features || []).slice(0, 2);
  while (displayFeatures.length < 2) {
    displayFeatures.push("");
  }

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative flex flex-col w-full text-left transition-all duration-150 rounded-lg border bg-card overflow-hidden",
        "hover:shadow-sm hover:border-primary/40",
        isSelected
          ? "border-[hsl(var(--status-success))] ring-2 ring-[hsl(var(--status-success)/0.2)]"
          : isBestseller
            ? "border-primary/30 ring-1 ring-primary/10"
            : "border-border"
      )}
    >
      {/* Bestseller Badge */}
      {isBestseller && !isSelected && (
        <div className="absolute top-2 right-2 z-10">
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
            Bestseller
          </span>
        </div>
      )}

      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-[hsl(var(--status-success))] rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-card" />
        </div>
      )}

      {/* Header + Data Badge */}
      <div className="p-3 pb-2">
        <h3 className="font-bold text-sm text-foreground leading-tight">
          {tariff.name || tariff.id.replace(/_/g, " ")}
        </h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary mt-1.5">
          <Signal className="w-2.5 h-2.5" />
          {dataLabel}
        </span>
      </div>

      {/* Features (2 lines) */}
      <div className="px-3 py-1.5 space-y-1 flex-1">
        {displayFeatures.map((feat, i) => {
          const has = feat.length > 0;
          return (
            <div key={i} className="flex items-center gap-1.5">
              {has ? (
                <div className="w-3.5 h-3.5 rounded-full bg-[hsl(var(--status-success)/0.15)] flex items-center justify-center shrink-0">
                  <Check className="w-2 h-2 text-[hsl(var(--status-success))]" />
                </div>
              ) : (
                <div className="w-3.5 h-3.5 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <X className="w-2 h-2 text-muted-foreground" />
                </div>
              )}
              <span className={cn("text-xs", has ? "text-foreground" : "text-muted-foreground")}>
                {has ? feat : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer: Price + CTA inline */}
      <div className="p-3 pt-2 mt-auto border-t border-border/50 flex items-center justify-between gap-2">
        <div>
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Mtl.</span>
          <div className="flex items-baseline gap-0.5">
            <span className="font-bold text-lg text-foreground">{displayPrice.toFixed(2)}</span>
            <span className="text-xs font-semibold text-muted-foreground">€</span>
          </div>
        </div>
        <div
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap",
            isSelected
              ? "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))]"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isSelected ? "Gewählt ✓" : "Zum Angebot"}
        </div>
      </div>
    </button>
  );
}
