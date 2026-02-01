// ============================================
// TariffGrid - Grid container for tariff cards
// Phase 6: Extracted from MobileStep
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {[...Array(8)].map((_, i) => (
          <SkeletonCard key={i} className="h-full" />
        ))}
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {tariffs.map((tariff) => (
        <TariffCard
          key={tariff.id}
          tariff={tariff}
          isSelected={selectedTariffId === tariff.id}
          isCompact={isCompact}
          onSelect={() => onSelect(tariff.id)}
        />
      ))}
    </div>
  );
}
