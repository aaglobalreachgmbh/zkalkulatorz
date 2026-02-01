// ============================================
// TariffFilters - Family tabs and results count
// Phase 6: Extracted from MobileStep
// ============================================

import { Badge } from "@/components/ui/badge";
import { Ban } from "lucide-react";
import type { TariffFamily } from "@/margenkalkulator";

const FAMILY_LABELS: Record<TariffFamily, string> = {
  prime: "BUSINESS TARIF",
  business_smart: "BUSINESS SMART",
  smart_business: "SMART BUSINESS",
  teamdeal: "TEAMDEAL",
  gigamobil: "GIGAMOBIL",
  consumer_smart: "SMART TARIF",
};

interface TariffFiltersProps {
  selectedFamily: TariffFamily | "all";
  onFamilyChange: (family: TariffFamily | "all") => void;
  families: TariffFamily[];
  filteredCount: number;
  blockedCount: number;
}

export function TariffFilters({
  selectedFamily,
  onFamilyChange,
  families,
  filteredCount,
  blockedCount,
}: TariffFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Family Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onFamilyChange("all")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedFamily === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Alle Tarife
        </button>
        {families.map((family) => (
          <button
            key={family}
            onClick={() => onFamilyChange(family)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedFamily === family
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {FAMILY_LABELS[family]}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{filteredCount} Tarif{filteredCount !== 1 ? "e" : ""} verfügbar</span>
        {blockedCount > 0 && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Ban className="w-3 h-3" />
            {blockedCount} gesperrt
          </Badge>
        )}
      </div>
    </div>
  );
}
