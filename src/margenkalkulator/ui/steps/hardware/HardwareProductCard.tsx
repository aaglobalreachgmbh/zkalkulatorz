// ============================================
// HardwareProductCard - Horizontal product card
// New design: image left, details right, red CTA
// ============================================

import { Check, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HardwareConfig } from "../../../lib/hardwareGrouping";

interface HardwareProductCardProps {
  config: HardwareConfig;
  brand: string;
  familyName: string;
  subModelName: string;
  imageUrl: string;
  isSelected: boolean;
  showEk: boolean;
  onSelect: () => void;
}

export function HardwareProductCard({
  config,
  brand,
  familyName,
  subModelName,
  imageUrl,
  isSelected,
  showEk,
  onSelect,
}: HardwareProductCardProps) {
  const displayName = subModelName
    ? `${familyName} ${subModelName}`
    : familyName;

  const specsLine = [
    config.storage !== "Standard" ? config.storage : null,
    config.connectivity,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "relative flex items-stretch gap-4 rounded-xl border p-4 transition-all duration-200 cursor-pointer",
        "bg-card hover:border-primary/40 hover:shadow-sm",
        isSelected
          ? "border-[hsl(var(--status-success))] bg-[hsl(var(--status-success)/0.05)] ring-1 ring-[hsl(var(--status-success)/0.2)]"
          : "border-border"
      )}
      onClick={onSelect}
    >
      {/* Selected badge */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[hsl(var(--status-success))] flex items-center justify-center shadow-sm">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      {/* Image */}
      <div className="w-24 h-24 flex-shrink-0 bg-muted/30 rounded-lg flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayName}
            className="w-full h-full object-contain mix-blend-multiply p-1"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <Smartphone
          className={cn(
            "w-10 h-10 text-muted-foreground/30",
            imageUrl ? "hidden" : ""
          )}
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight truncate">
            {displayName}
          </p>
          {specsLine && (
            <p className="text-xs text-muted-foreground mt-0.5">{specsLine}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[hsl(var(--status-success)/0.1)] text-[hsl(var(--status-success))]">
              Verfügbar
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
              24 Mon. Vertrag
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between mt-2">
          <div>
            {showEk && (
              <>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  EK Netto
                </span>
                <p className="text-base font-bold text-foreground font-mono">
                  {config.ekNet.toFixed(2)} €
                </p>
              </>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isSelected
                ? "bg-[hsl(var(--status-success))] text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            {isSelected ? "Ausgewählt ✓" : "Zum Angebot"}
          </button>
        </div>
      </div>
    </div>
  );
}
