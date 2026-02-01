// ============================================
// HardwareGrid - Grid container with SIM Only card
// Phase 6: Extracted from HardwareStep
// ============================================

import { Smartphone, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { HardwareCard } from "./HardwareCard";
import type { HardwareFamily, HardwareSubModel, HardwareConfig } from "../../../lib/hardwareGrouping";

interface SelectedInfo {
  type: "simOnly" | "config";
  family?: HardwareFamily;
  subModel?: HardwareSubModel;
  config?: HardwareConfig;
}

interface HardwareGridProps {
  families: HardwareFamily[];
  selectedInfo: SelectedInfo | null;
  showSimOnly: boolean;
  showHardwareEk: boolean;
  isPOSMode: boolean;
  isMobile: boolean;
  openPopoverId: string | null;
  onPopoverChange: (id: string | null) => void;
  onSimOnlySelect: () => void;
  onConfigSelect: (config: HardwareConfig, brand: string) => void;
  getImage: (id: string, familyId?: string) => string;
}

export function HardwareGrid({
  families,
  selectedInfo,
  showSimOnly,
  showHardwareEk,
  isPOSMode,
  isMobile,
  openPopoverId,
  onPopoverChange,
  onSimOnlySelect,
  onConfigSelect,
  getImage,
}: HardwareGridProps) {
  return (
    <>
      <div className={cn(
        "grid gap-2 sm:gap-3 lg:gap-4",
        isPOSMode && isMobile
          ? "grid-cols-2"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      )}>
        {/* SIM Only Card */}
        {showSimOnly && (
          <button
            onClick={onSimOnlySelect}
            className={cn(
              "relative p-4 rounded-lg border bg-card text-left transition-all duration-200",
              "hover:border-primary/50 hover:shadow-sm",
              selectedInfo?.type === "simOnly"
                ? "border-primary ring-1 ring-primary/20 bg-primary/5"
                : "border-border"
            )}
          >
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <div className="p-3 bg-muted rounded-full">
                <Smartphone className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">SIM Only</p>
                <p className="text-xs text-muted-foreground">Kein Gerät</p>
              </div>
            </div>

            {selectedInfo?.type === "simOnly" && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </button>
        )}

        {/* Family Cards */}
        {families.map((family) => {
          const isSelected = selectedInfo?.type === "config" && selectedInfo.family?.familyId === family.familyId;
          const selectedConfig = isSelected ? selectedInfo.config || null : null;
          const selectedSubModel = isSelected ? selectedInfo.subModel || null : null;

          return (
            <HardwareCard
              key={family.familyId}
              family={family}
              isSelected={isSelected}
              selectedSubModel={selectedSubModel}
              selectedConfig={selectedConfig}
              showHardwareEk={showHardwareEk}
              isOpen={openPopoverId === family.familyId}
              onOpenChange={(open) => onPopoverChange(open ? family.familyId : null)}
              onConfigSelect={onConfigSelect}
              getImage={getImage}
            />
          );
        })}
      </div>

      {/* Empty State */}
      {families.length === 0 && !showSimOnly && (
        <div className="text-center py-12 text-muted-foreground">
          <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Keine Geräte gefunden</p>
          <p className="text-sm">Versuche andere Filteroptionen</p>
        </div>
      )}
    </>
  );
}
