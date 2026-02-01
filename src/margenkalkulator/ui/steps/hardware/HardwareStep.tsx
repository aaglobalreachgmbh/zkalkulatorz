// ============================================
// HardwareStep - Orchestrator Component
// Phase 6: Refactored from 621 LOC to ~180 LOC
// ============================================

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { HardwareState, DatasetVersion, ViewMode } from "../../../engine/types";
import { listHardwareItems } from "../../../engine/catalogResolver";
import { Smartphone, Upload, AlertTriangle, Check, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  groupHardwareFamilies,
  findFamilyAndConfig,
  type HardwareConfig,
} from "../../../lib/hardwareGrouping";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { useHardwareImages } from "../../../hooks/useHardwareImages";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePOSMode } from "@/contexts/POSModeContext";

import { HardwareFilters, type CategoryFilter } from "./HardwareFilters";
import { HardwareGrid } from "./HardwareGrid";
import { CollapsedHardwareSelection } from "./CollapsedHardwareSelection";

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
  const isMobile = useIsMobile();
  const { isPOSMode } = usePOSMode();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const hasSelection = value.name && value.name !== "";
  const { imageMap } = useHardwareImages();

  const getHardwareImage = (hardwareId: string, familyId?: string): string => {
    if (imageMap.has(hardwareId)) return imageMap.get(hardwareId)!;
    if (familyId && imageMap.has(familyId)) return imageMap.get(familyId)!;
    return "";
  };

  const hardwareItems = useMemo(() => listHardwareItems(datasetVersion), [datasetVersion]);

  const brands = useMemo(() => {
    const uniqueBrands = new Set(
      hardwareItems
        .filter(item => item.category !== "custom" && item.category !== "none" && item.id !== "no_hardware")
        .map(item => item.brand)
    );
    return Array.from(uniqueBrands).sort();
  }, [hardwareItems]);

  const families = useMemo(() => {
    const filtered = hardwareItems.filter(item => {
      if (item.category === "custom" || item.id === "no_hardware") return false;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" ||
        item.brand.toLowerCase().includes(searchLower) ||
        item.model.toLowerCase().includes(searchLower);
      const matchesBrand = selectedBrand === "all" || selectedBrand === "sim_only" || item.brand === selectedBrand;
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesBrand && matchesCategory;
    });
    return groupHardwareFamilies(filtered);
  }, [hardwareItems, searchQuery, selectedBrand, selectedCategory]);

  const showSimOnly = selectedBrand === "all" || selectedBrand === "sim_only";
  const totalConfigs = useMemo(() => families.reduce((sum, f) => sum + f.totalConfigs, 0), [families]);

  const selectedInfo = useMemo(() => {
    const found = hardwareItems.find(h =>
      h.category !== "custom" && h.category !== "none" && `${h.brand} ${h.model}` === value.name
    );
    if (found) {
      if (found.id === "no_hardware") return { type: "simOnly" as const };
      const familyInfo = findFamilyAndConfig(families, found.id);
      if (familyInfo) return { type: "config" as const, ...familyInfo };
    }
    if (!value.name || value.name === "KEINE HARDWARE") return { type: "simOnly" as const };
    return null;
  }, [value.name, hardwareItems, families]);

  const handleSimOnlySelect = () => {
    onChange({ ...value, name: "KEINE HARDWARE", ekNet: 0 });
    setOpenPopoverId(null);
    setIsCollapsed(true);
    onHardwareSelected?.();
  };

  const handleConfigSelect = (config: HardwareConfig, brand: string) => {
    onChange({ ...value, name: `${brand} ${config.fullModel}`, ekNet: config.ekNet });
    setOpenPopoverId(null);
    setIsCollapsed(true);
    onHardwareSelected?.();
  };

  const updateField = <K extends keyof HardwareState>(field: K, fieldValue: HardwareState[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Hardware wählen</h2>
        </div>
        {showDealerOptions && !isCollapsed && (
          <div className="flex items-center gap-4">
            <Link to="/data-manager/hardware">
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                Hardware-Manager
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground inline-flex items-center gap-1">
                Im Monatspreis anzeigen
                <HelpTooltip content="Hardware-Auswahl" />
              </span>
              <Switch
                checked={value.amortize}
                onCheckedChange={(checked) => updateField("amortize", checked)}
              />
            </div>
          </div>
        )}
      </div>

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
          <HardwareFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedBrand={selectedBrand}
            onBrandChange={setSelectedBrand}
            brands={brands}
            familyCount={families.length}
            totalConfigs={totalConfigs}
            showSimOnly={showSimOnly}
          />

          {/* SIM-Only Warning Banner */}
          {selectedInfo?.type === "simOnly" && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[hsl(var(--status-warning)/0.1)] border border-[hsl(var(--status-warning)/0.3)] rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[hsl(var(--status-warning))] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--status-warning))]">
                    SIM-Only ausgewählt – keine Hardware
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-[500px]">
                    Der Kunde erhält nur einen Tarif. Dies maximiert die Marge, erfüllt aber keinen Gerätewunsch.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={() => setIsCollapsed(false)} className="flex-1 sm:flex-none">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Gerät hinzufügen
                </Button>
                <Button size="sm" onClick={() => onHardwareSelected?.()} className="flex-1 sm:flex-none bg-[hsl(var(--status-warning))] hover:bg-[hsl(var(--status-warning)/0.9)] text-white">
                  Weiter zum Tarif
                  <Check className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          <HardwareGrid
            families={families}
            selectedInfo={selectedInfo}
            showSimOnly={showSimOnly}
            showHardwareEk={showHardwareEk}
            isPOSMode={isPOSMode}
            isMobile={isMobile}
            openPopoverId={openPopoverId}
            onPopoverChange={setOpenPopoverId}
            onSimOnlySelect={handleSimOnlySelect}
            onConfigSelect={handleConfigSelect}
            getImage={getHardwareImage}
          />
        </>
      )}

      {/* Hardware im Monatspreis */}
      {showDealerOptions && value.amortize && value.ekNet > 0 && (
        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Hardware im Monatspreis</p>
            <p className="text-xs text-muted-foreground">
              {value.ekNet} € EK auf {value.amortMonths || 24} Monate verteilt
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold font-mono">
              +{((value.ekNet || 0) / (value.amortMonths || 24)).toFixed(2)} €
            </p>
            <p className="text-xs text-muted-foreground">pro Monat</p>
          </div>
        </div>
      )}
    </div>
  );
}
