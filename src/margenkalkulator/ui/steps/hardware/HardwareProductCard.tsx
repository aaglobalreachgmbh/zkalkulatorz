// ============================================
// HardwareProductCard - Large product card
// Design: screen-7.png reference (1:1)
// Image left, specs in primary, badges, 
// MONTHLY + ONE-TIME prices, full-width red CTA
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

  // Build specs line like "Unlimited 5G Data | 128GB Space Black"
  const specsParts = [
    config.connectivity || "5G",
    config.storage !== "Standard" ? config.storage : null,
  ].filter(Boolean);
  const specsLine = specsParts.join(" | ");

  // Determine badges based on category context
  const badges = [
    { label: "Stock Available", variant: "success" as const },
    { label: "24 Month Contract", variant: "neutral" as const },
  ];

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-card transition-all duration-200 cursor-pointer overflow-hidden",
        "hover:shadow-md hover:border-primary/30",
        isSelected
          ? "border-[hsl(var(--status-success))] ring-2 ring-[hsl(var(--status-success)/0.2)]"
          : "border-border"
      )}
      onClick={onSelect}
    >
      {/* Selected badge */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-[hsl(var(--status-success))] flex items-center justify-center shadow-md">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Main content: Image + Details side by side */}
      <div className="flex items-stretch p-4 gap-4">
        {/* Image */}
        <div className="w-[140px] h-[140px] flex-shrink-0 bg-muted/20 rounded-lg flex items-center justify-center overflow-hidden relative">
          {/* HARDWARE label overlay */}
          <div className="absolute top-2 left-2 bg-foreground/80 text-background text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
            HARDWARE
          </div>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayName}
              className="w-full h-full object-contain mix-blend-multiply p-2"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <Smartphone
            className={cn(
              "w-12 h-12 text-muted-foreground/30",
              imageUrl ? "hidden" : ""
            )}
          />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Name */}
          <div>
            <h4 className="text-lg font-bold text-foreground leading-tight">
              {brand} {displayName}
            </h4>
            {/* Specs in primary/red color */}
            {specsLine && (
              <p className="text-sm text-primary font-medium mt-1">{specsLine}</p>
            )}
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-3">
            {badges.map((badge) => (
              <span
                key={badge.label}
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                  badge.variant === "success"
                    ? "border-[hsl(var(--status-success))] text-[hsl(var(--status-success))] bg-[hsl(var(--status-success)/0.05)]"
                    : "border-border text-muted-foreground bg-muted/30"
                )}
              >
                {badge.label}
              </span>
            ))}
          </div>

          {/* Prices row: MONTHLY + ONE-TIME */}
          <div className="flex items-end gap-6 mt-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                MONTHLY
              </span>
              <p className="text-xl font-bold text-foreground">
                {showEk ? `${config.ekNet.toFixed(2)} €` : "—"}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                ONE-TIME
              </span>
              <p className="text-xl font-bold text-foreground">
                0.00 €
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width CTA button */}
      <div className="px-4 pb-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={cn(
            "w-full py-3 rounded-lg text-sm font-semibold transition-colors",
            isSelected
              ? "bg-[hsl(var(--status-success))] hover:bg-[hsl(var(--status-success)/0.9)] text-white"
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          )}
        >
          {isSelected ? "Selected ✓" : "Add to Offer"}
        </button>
      </div>
    </div>
  );
}
