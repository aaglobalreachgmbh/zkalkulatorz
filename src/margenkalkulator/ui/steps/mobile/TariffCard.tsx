// ============================================
// TariffCard - Vertikale Feature-Karte
// Komplett-Neuaufbau nach Screenshot-Vorlage
// ============================================

import { Check, X, Signal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MobileTariff, TariffFamily } from "@/margenkalkulator";

const TARIFF_SUBTITLES: Record<string, string> = {
  prime: "Für maximale Performance",
  business_smart: "Der smarte Allrounder",
  smart_business: "Flexibel und effizient",
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

  // Consumer tariffs show gross price
  const displayPrice = (tariff.family === "consumer_smart" || tariff.family === "gigamobil")
    ? tariff.baseNet * 1.19
    : tariff.baseNet;

  // Show up to 3 features, pad with placeholders
  const displayFeatures = (tariff.features || []).slice(0, 3);
  while (displayFeatures.length < 3) {
    displayFeatures.push("");
  }

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative flex flex-col w-full text-left transition-all duration-200 rounded-xl border bg-card overflow-hidden",
        "hover:shadow-md hover:border-primary/40",
        isSelected
          ? "border-[hsl(var(--status-success))] ring-2 ring-[hsl(var(--status-success)/0.2)]"
          : isBestseller
            ? "border-primary/30 ring-1 ring-primary/10"
            : "border-border"
      )}
    >
      {/* Bestseller Badge */}
      {isBestseller && !isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
            Bestseller
          </span>
        </div>
      )}

      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10 w-6 h-6 bg-[hsl(var(--status-success))] rounded-full flex items-center justify-center shadow-sm">
          <Check className="w-3.5 h-3.5 text-card" />
        </div>
      )}

      {/* Header */}
      <div className={cn("p-5 pb-3", isCompact && "p-4 pb-2")}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className={cn("font-bold text-foreground", isCompact ? "text-base" : "text-lg")}>
              {tariff.name || tariff.id.replace(/_/g, " ")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
        {/* Data Badge */}
        <div className="mt-3">
          <span className={cn(
            "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full",
            "bg-primary/10 text-primary"
          )}>
            <Signal className="w-3 h-3" />
            {dataLabel}
          </span>
        </div>
      </div>

      {/* Feature List */}
      <div className="px-5 py-3 space-y-2 flex-1">
        {displayFeatures.map((feat, i) => {
          const hasFeature = feat.length > 0;
          return (
            <div key={i} className="flex items-center gap-2.5">
              {hasFeature ? (
                <div className="w-4 h-4 rounded-full bg-[hsl(var(--status-success)/0.15)] flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-[hsl(var(--status-success))]" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <X className="w-2.5 h-2.5 text-muted-foreground" />
                </div>
              )}
              <span className={cn("text-sm", hasFeature ? "text-foreground" : "text-muted-foreground")}>
                {hasFeature ? feat : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer: Price + CTA */}
      <div className={cn("p-5 pt-3 mt-auto border-t border-border/50", isCompact && "p-4 pt-2")}>
        <div className="mb-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Monatlich</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={cn("font-bold text-foreground", isCompact ? "text-xl" : "text-2xl")}>
              {displayPrice.toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">€</span>
          </div>
        </div>
        <div
          className={cn(
            "w-full py-2.5 rounded-lg text-center text-sm font-semibold transition-colors",
            isSelected
              ? "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))]"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isSelected ? "Ausgewählt ✓" : "Zum Angebot"}
        </div>
      </div>
    </button>
  );
}
