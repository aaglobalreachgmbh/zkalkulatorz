// ============================================
// HardwareStep - Complete redesign (screen-7 reference)
// Grouped by CATEGORY (Smartphones, Tablets)
// Large cards with image, red specs, badges, 
// MONTHLY + ONE-TIME prices, full-width red CTA
// ============================================

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { HardwareState, DatasetVersion, ViewMode } from "../../../engine/types";
import { listHardwareItems } from "../../../engine/catalogResolver";
import { Smartphone, Tablet, Search, Upload, CreditCard } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  groupHardwareFamilies,
  type HardwareConfig,
  type HardwareFamily,
} from "../../../lib/hardwareGrouping";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { useHardwareImages } from "../../../hooks/useHardwareImages";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { usePOSMode } from "@/contexts/POSModeContext";
import { HardwareProductCard } from "./HardwareProductCard";
import { CollapsedHardwareSelection } from "./CollapsedHardwareSelection";
import { cn } from "@/lib/utils";

interface HardwareStepProps {
  value: HardwareState;
  onChange: (value: HardwareState) => void;
  onHardwareSelected?: () => void;
  datasetVersion?: DatasetVersion;
  viewMode?: ViewMode;
}

export function HardwareStep({
  value,
  onChange,
  onHardwareSelected,
  datasetVersion = "business-2025-09",
  viewMode = "dealer",
}: HardwareStepProps) {
  const visibility = useSensitiveFieldsVisible(viewMode);
  const showHardwareEk = visibility.showHardwareEk;
  const showDealerOptions = visibility.showDealerEconomics;
  const { isPOSMode } = usePOSMode();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const hasSelection = value.name && value.name !== "";
  const { imageMap } = useHardwareImages();

  const getHardwareImage = (hardwareId: string, familyId?: string): string => {
    if (imageMap.has(hardwareId)) return imageMap.get(hardwareId)!;
    if (familyId && imageMap.has(familyId)) return imageMap.get(familyId)!;
    return "";
  };

  const hardwareItems = useMemo(() => listHardwareItems(datasetVersion), [datasetVersion]);

  const families = useMemo(() => {
    const filtered = hardwareItems.filter(item => {
      if (item.category === "custom" || item.id === "no_hardware") return false;
      const searchLower = searchQuery.toLowerCase();
      return searchQuery === "" ||
        item.brand.toLowerCase().includes(searchLower) ||
        item.model.toLowerCase().includes(searchLower);
    });
    return groupHardwareFamilies(filtered);
  }, [hardwareItems, searchQuery]);

  // Group families by CATEGORY (Smartphones, Tablets) instead of brand
  const categoryGroups = useMemo(() => {
    const smartphones: HardwareFamily[] = [];
    const tablets: HardwareFamily[] = [];

    for (const family of families) {
      if (family.category === "tablet") {
        tablets.push(family);
      } else {
        smartphones.push(family);
      }
    }

    const groups: { key: string; label: string; icon: typeof Smartphone; families: HardwareFamily[] }[] = [];
    if (smartphones.length > 0) groups.push({ key: "smartphones", label: "Smartphones", icon: Smartphone, families: smartphones });
    if (tablets.length > 0) groups.push({ key: "tablets", label: "Tablets", icon: Tablet, families: tablets });
    return groups;
  }, [families]);

  const selectedConfigId = useMemo(() => {
    const found = hardwareItems.find(h =>
      h.category !== "custom" && h.category !== "none" && `${h.brand} ${h.model}` === value.name
    );
    return found?.id || null;
  }, [value.name, hardwareItems]);

  const handleSimOnlySelect = () => {
    onChange({ ...value, name: "KEINE HARDWARE", ekNet: 0 });
    setIsCollapsed(true);
    onHardwareSelected?.();
  };

  const handleConfigSelect = (config: HardwareConfig, brand: string) => {
    onChange({ ...value, name: `${brand} ${config.fullModel}`, ekNet: config.ekNet });
    setIsCollapsed(true);
    onHardwareSelected?.();
  };

  const updateField = <K extends keyof HardwareState>(field: K, fieldValue: HardwareState[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const isSimOnlySelected = value.name === "KEINE HARDWARE";

  // --- RENDER ---

  return (
    <div className="space-y-8">
      {/* Collapsed State */}
      {isCollapsed && hasSelection && (
        <CollapsedHardwareSelection
          name={value.name}
          ekNet={value.ekNet}
          showEk={showHardwareEk}
          onExpand={() => setIsCollapsed(false)}
        />
      )}

      {/* Full Selection UI */}
      {!isCollapsed && (
        <>
          {/* Dealer options row */}
          {showDealerOptions && (
            <div className="flex items-center justify-end gap-4">
              <Link to="/data-manager/hardware">
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <Upload className="w-3.5 h-3.5" />
                  Hardware-Manager
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  Im Monatspreis
                  <HelpTooltip content="Hardware-Auswahl" />
                </span>
                <Switch
                  checked={value.amortize}
                  onCheckedChange={(checked) => updateField("amortize", checked)}
                />
              </div>
            </div>
          )}

          {/* Category Sections */}
          {categoryGroups.map(({ key, label, families: catFamilies }) => (
            <div key={key}>
              {/* Category heading - bold, large like screenshot */}
              <h3 className="text-2xl font-bold text-foreground mb-5">{label}</h3>

              {/* 2-column grid of large product cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catFamilies.flatMap((family) =>
                  family.subModels.flatMap((subModel) =>
                    subModel.configs.map((config) => (
                      <HardwareProductCard
                        key={config.id}
                        config={config}
                        brand={family.brand}
                        familyName={family.familyName}
                        subModelName={subModel.subModelName}
                        imageUrl={getHardwareImage(config.id, family.familyId)}
                        isSelected={selectedConfigId === config.id}
                        showEk={showHardwareEk}
                        onSelect={() => handleConfigSelect(config, family.brand)}
                      />
                    ))
                  )
                )}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {families.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">Keine Geräte gefunden</p>
              <p className="text-sm mt-1">Versuche andere Filteroptionen</p>
            </div>
          )}
        </>
      )}

      {/* Hardware im Monatspreis */}
      {showDealerOptions && value.amortize && value.ekNet > 0 && (
        <div className="p-4 bg-muted/50 rounded-xl border border-border flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Hardware im Monatspreis</p>
            <p className="text-xs text-muted-foreground">
              {value.ekNet.toFixed(2)} € EK auf {value.amortMonths || 24} Monate verteilt
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold font-mono text-foreground">
              +{((value.ekNet || 0) / (value.amortMonths || 24)).toFixed(2)} €
            </p>
            <p className="text-xs text-muted-foreground">pro Monat</p>
          </div>
        </div>
      )}
    </div>
  );
}
