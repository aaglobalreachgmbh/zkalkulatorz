// ============================================
// TariffGrid - Vereinfachtes Grid mit Überschrift
// Komplett-Neuaufbau nach Screenshot-Vorlage
// ============================================

import { Signal } from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { TariffCard } from "./TariffCard";
import type { MobileTariff } from "@/margenkalkulator";

interface TariffGridProps {
  tariffs: MobileTariff[];
  selectedTariffId: string;
  isLoading?: boolean;
  isCompact?: boolean;
  onSelect: (tariffId: string) => void;
}

export function TariffGrid({
  tariffs,
  selectedTariffId,
  isLoading = false,
  isCompact = false,
  onSelect,
}: TariffGridProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">Verfügbare Tarife</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  if (tariffs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Signal className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Keine Tarife gefunden</p>
      </div>
    );
  }

  // Mark middle tariff as bestseller if 3+ tariffs
  const bestsellerIndex = tariffs.length >= 3 ? Math.floor(tariffs.length / 2) : -1;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">Verfügbare Tarife</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tariffs.map((tariff, idx) => (
          <TariffCard
            key={tariff.id}
            tariff={tariff}
            isSelected={selectedTariffId === tariff.id}
            isCompact={isCompact}
            isBestseller={idx === bestsellerIndex}
            onSelect={() => onSelect(tariff.id)}
          />
        ))}
      </div>
    </div>
  );
}
