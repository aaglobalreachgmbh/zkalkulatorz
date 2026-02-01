// ============================================
// TariffCard - Individual tariff selection card
// Phase 6: Extracted from MobileStep
// ============================================

import { Signal, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MobileTariff, TariffFamily } from "@/margenkalkulator";

const FAMILY_LABELS: Record<TariffFamily, string> = {
  prime: "BUSINESS TARIF",
  business_smart: "BUSINESS SMART",
  smart_business: "SMART BUSINESS",
  teamdeal: "TEAMDEAL",
  gigamobil: "GIGAMOBIL",
  consumer_smart: "SMART TARIF",
};

const FAMILY_COLORS: Record<TariffFamily, string> = {
  prime: "text-primary",
  business_smart: "text-primary",
  smart_business: "text-blue-600",
  teamdeal: "text-[hsl(var(--status-warning))]",
  gigamobil: "text-[hsl(var(--status-error))]",
  consumer_smart: "text-[hsl(var(--status-success))]",
};

interface TariffCardProps {
  tariff: MobileTariff;
  isSelected: boolean;
  isCompact?: boolean;
  onSelect: () => void;
}

export function TariffCard({
  tariff,
  isSelected,
  isCompact = false,
  onSelect,
}: TariffCardProps) {
  const familyLabel = FAMILY_LABELS[tariff.family || "prime"];
  const familyColor = FAMILY_COLORS[tariff.family || "prime"];
  const isUnlimited = tariff.dataVolumeGB === "unlimited";

  // Consumer tariffs show gross price
  const displayPrice = (tariff.family === 'consumer_smart' || tariff.family === 'gigamobil')
    ? tariff.baseNet * 1.19
    : tariff.baseNet;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col h-full w-full text-left transition-all duration-200 rounded-lg border bg-card",
        "hover:border-primary/50 hover:shadow-sm",
        isSelected ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border"
      )}
    >
      {/* Selection Check */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}

      {/* Header - Family & Name */}
      <div className={cn("pb-2", isCompact ? "p-3" : "p-4")}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={cn(
              "font-bold uppercase tracking-wider mb-0.5",
              isCompact ? "text-[10px]" : "text-xs",
              familyColor
            )}>
              {familyLabel}
            </p>
            <h3 className={cn(
              "font-semibold text-foreground truncate max-w-[180px]",
              isCompact ? "text-sm" : "text-base"
            )}>
              {tariff.id.replace(/_/g, " ")}
            </h3>
          </div>
        </div>
      </div>

      {/* Data Volume - Main KPI */}
      <div className={cn(
        "border-t border-b bg-muted/5 flex items-center gap-3",
        isCompact ? "px-3 py-2" : "px-4 py-3"
      )}>
        <div className={cn(
          "rounded-full flex items-center justify-center shrink-0",
          isCompact ? "w-8 h-8 bg-primary/10" : "w-10 h-10 bg-primary/10"
        )}>
          {isUnlimited ? (
            <div className="text-primary font-bold text-xs">∞</div>
          ) : (
            <Signal className={cn("text-primary", isCompact ? "w-4 h-4" : "w-5 h-5")} />
          )}
        </div>
        <div>
          <span className={cn("block font-bold text-foreground leading-none", isCompact ? "text-lg" : "text-xl")}>
            {isUnlimited ? "Unlimited" : `${tariff.dataVolumeGB} GB`}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase font-medium">Datenvolumen</span>
        </div>
      </div>

      {/* Footer - Price */}
      <div className={cn(
        "mt-4 border-t border-border/50 bg-muted/10 rounded-b-lg",
        isCompact ? "p-2 mt-auto" : "p-3 mt-4"
      )}>
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground">Basispreis</span>
            <div className="flex items-baseline gap-0.5">
              <span className={cn("font-bold text-foreground", isCompact ? "text-base" : "text-lg")}>
                {displayPrice.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">€</span>
            </div>
          </div>
          <div className="text-right">
            {isSelected ? (
              <span className="text-xs font-bold text-primary">Ausgewählt</span>
            ) : (
              <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">Wählen →</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
