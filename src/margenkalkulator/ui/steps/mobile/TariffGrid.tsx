// ============================================
// TariffGrid - Kompakte Tabellen-Liste (Enterprise CPQ Style)
// Horizontal rows with column headers
// ============================================

import { Signal } from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { TariffCard } from "./TariffCard";
import type { MobileTariff } from "@/margenkalkulator";

interface TariffGridProps {
  tariffs: MobileTariff[];
  selectedTariffId: string;
  isLoading?: boolean;
  onSelect: (tariffId: string) => void;
}

export function TariffGrid({
  tariffs,
  selectedTariffId,
  isLoading = false,
  onSelect,
}: TariffGridProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border overflow-hidden space-y-px bg-muted/20">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} className="h-11 rounded-none" />
        ))}
      </div>
    );
  }

  if (tariffs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border border-border rounded-lg">
        <Signal className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-xs">Keine Tarife gefunden</p>
      </div>
    );
  }

  const bestsellerIndex = tariffs.length >= 3 ? Math.floor(tariffs.length / 2) : -1;

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      {/* Column Headers */}
      <div className="flex items-center gap-3 px-4 py-1.5 bg-muted/30 border-b border-border">
        <div className="w-3.5" />
        <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tarif</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-16 text-center">Daten</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-[70px] text-right">Preis</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-[68px] text-center">Aktion</span>
      </div>

      {/* Tariff Rows */}
      <div className="divide-y divide-border">
        {tariffs.map((tariff, idx) => (
          <TariffCard
            key={tariff.id}
            tariff={tariff}
            isSelected={selectedTariffId === tariff.id}
            isBestseller={idx === bestsellerIndex}
            index={idx}
            onSelect={() => onSelect(tariff.id)}
          />
        ))}
      </div>
    </div>
  );
}
