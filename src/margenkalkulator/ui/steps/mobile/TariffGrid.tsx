// ============================================
// TariffGrid - Kompaktes Grid
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (tariffs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Signal className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Keine Tarife gefunden</p>
      </div>
    );
  }

  const bestsellerIndex = tariffs.length >= 3 ? Math.floor(tariffs.length / 2) : -1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
  );
}
