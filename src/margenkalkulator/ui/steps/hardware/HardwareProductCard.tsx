// ============================================
// HardwareProductCard - Kompakte 44px Tabellenzeile
// Enterprise CPQ Style: identisch zu TariffCard
// Brand-Pill | Modell | Specs | Preis | Wählen
// ============================================

import { Check } from "lucide-react";
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
  index?: number;
  isCurrent?: boolean; // visually pre-selected (came back from phase B)
}

// Brand-Farben für Brand-Pills
const BRAND_COLORS: Record<string, string> = {
  Apple: "bg-slate-800 text-slate-100",
  Samsung: "bg-blue-700 text-blue-50",
  Google: "bg-green-700 text-green-50",
  Xiaomi: "bg-orange-600 text-orange-50",
  OnePlus: "bg-red-700 text-red-50",
  Motorola: "bg-indigo-700 text-indigo-50",
  Nokia: "bg-sky-700 text-sky-50",
  Sony: "bg-zinc-700 text-zinc-50",
  Oppo: "bg-teal-700 text-teal-50",
  Huawei: "bg-pink-700 text-pink-50",
};

function getBrandColor(brand: string): string {
  return BRAND_COLORS[brand] || "bg-muted text-muted-foreground";
}

export function HardwareProductCard({
  config,
  brand,
  familyName,
  subModelName,
  isSelected,
  showEk,
  onSelect,
  index,
  isCurrent = false,
}: HardwareProductCardProps) {
  const displayModel = subModelName ? `${familyName} ${subModelName}` : familyName;

  // Specs: Storage + Connectivity
  const specParts = [
    config.storage !== "Standard" ? config.storage : null,
    config.connectivity || null,
  ].filter(Boolean);
  const specsLabel = specParts.join(" · ");

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors group min-h-[44px]",
        isSelected
          ? "bg-[hsl(var(--status-success)/0.08)] hover:bg-[hsl(var(--status-success)/0.12)]"
          : isCurrent
          ? "bg-primary/5 hover:bg-primary/10"
          : "hover:bg-muted/40"
      )}
      onClick={onSelect}
      title={`${brand} ${displayModel}${showEk ? ` — EK: ${config.ekNet.toFixed(2)} €` : ""}`}
    >
      {/* Selected indicator OR index number */}
      <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
        {isSelected ? (
          <div className="w-4.5 h-4.5 rounded-full bg-[hsl(var(--status-success))] flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        ) : index !== undefined && index < 9 ? (
          <span className="text-[10px] text-muted-foreground/40 group-hover:text-muted-foreground/60 font-mono">
            {index + 1}
          </span>
        ) : null}
      </div>

      {/* Model name */}
      <span className={cn(
        "flex-1 text-sm font-medium truncate",
        isSelected ? "text-[hsl(var(--status-success))]" : "text-foreground"
      )}>
        {displayModel}
      </span>

      {/* Specs badge */}
      {specsLabel && (
        <span className="text-[11px] text-muted-foreground w-24 text-center shrink-0 hidden sm:block">
          {specsLabel}
        </span>
      )}

      {/* Price */}
      <span className={cn(
        "text-sm font-bold w-20 text-right shrink-0 tabular-nums",
        isSelected ? "text-[hsl(var(--status-success))]" : "text-foreground"
      )}>
        {showEk ? `${config.ekNet.toFixed(2)} €` : "—"}
      </span>

      {/* Action button */}
      <div className="w-[68px] flex justify-center shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className={cn(
            "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors",
            isSelected
              ? "bg-[hsl(var(--status-success))] text-white"
              : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
          )}
        >
          {isSelected ? "✓" : "Wählen"}
        </button>
      </div>
    </div>
  );
}

// ============================================
// BrandGroupHeader - Trennbalken mit Brand-Pill
// ============================================
export function BrandGroupHeader({ brand }: { brand: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-muted/30 border-b border-t border-border">
      <span className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
        getBrandColor(brand)
      )}>
        {brand}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
