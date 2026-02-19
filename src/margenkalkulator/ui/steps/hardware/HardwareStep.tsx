// ============================================
// HardwareStep - Complete redesign
// Flat cards grouped by brand, no popovers
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
  findFamilyAndConfig,
  type HardwareConfig,
  type HardwareFamily,
} from "../../../lib/hardwareGrouping";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { useHardwareImages } from "../../../hooks/useHardwareImages";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePOSMode } from "@/contexts/POSModeContext";
import { HardwareProductCard } from "./HardwareProductCard";
import { CollapsedHardwareSelection } from "./CollapsedHardwareSelection";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | "smartphone" | "tablet";

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
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
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
      const matchesSearch = searchQuery === "" ||
        item.brand.toLowerCase().includes(searchLower) ||
        item.model.toLowerCase().includes(searchLower);
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    return groupHardwareFamilies(filtered);
  }, [hardwareItems, searchQuery, selectedCategory]);

  // Group families by brand
  const brandGroups = useMemo(() => {
    const map = new Map<string, HardwareFamily[]>();
    for (const family of families) {
      const existing = map.get(family.brand) || [];
      existing.push(family);
      map.set(family.brand, existing);
    }
    return Array.from(map.entries());
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

  const totalConfigs = families.reduce((sum, f) => sum + f.totalConfigs, 0);
  const isSimOnlySelected = value.name === "KEINE HARDWARE";

  // --- RENDER ---

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Hardware Selection</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure customer devices and SIMs.
        </p>
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
          {/* Search + Category Tabs + Dealer Options */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Gerät suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Tabs */}
              <div className="flex bg-muted rounded-lg p-1">
                {([
                  { key: "all" as const, label: "Alle", icon: null },
                  { key: "smartphone" as const, label: "Smartphones", icon: Smartphone },
                  { key: "tablet" as const, label: "Tablets", icon: Tablet },
                ] as const).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5",
                      selectedCategory === key
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dealer options row */}
            {showDealerOptions && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {totalConfigs} Varianten gefunden
                </span>
                <div className="flex items-center gap-4">
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
              </div>
            )}
          </div>

          {/* SIM-Only Section */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              SIM-Only
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                onClick={handleSimOnlySelect}
                className={cn(
                  "relative flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 cursor-pointer",
                  "bg-card hover:border-primary/40 hover:shadow-sm",
                  isSimOnlySelected
                    ? "border-[hsl(var(--status-success))] bg-[hsl(var(--status-success)/0.05)] ring-1 ring-[hsl(var(--status-success)/0.2)]"
                    : "border-border"
                )}
              >
                {isSimOnlySelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[hsl(var(--status-success))] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
                <div className="w-24 h-24 flex-shrink-0 bg-muted/30 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">SIM Only</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nur Tarif, kein Gerät – maximale Marge
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[hsl(var(--status-success)/0.1)] text-[hsl(var(--status-success))]">
                      Sofort verfügbar
                    </span>
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSimOnlySelect(); }}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        isSimOnlySelected
                          ? "bg-[hsl(var(--status-success))] text-white"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground"
                      )}
                    >
                      {isSimOnlySelected ? "Ausgewählt ✓" : "Zum Angebot"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Sections */}
          {brandGroups.map(([brand, brandFamilies]) => (
            <div key={brand}>
              <h3 className="text-lg font-bold text-foreground mb-3">{brand}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {brandFamilies.flatMap((family) =>
                  family.subModels.flatMap((subModel) =>
                    subModel.configs.map((config) => (
                      <HardwareProductCard
                        key={config.id}
                        config={config}
                        brand={brand}
                        familyName={family.familyName}
                        subModelName={subModel.subModelName}
                        imageUrl={getHardwareImage(config.id, family.familyId)}
                        isSelected={selectedConfigId === config.id}
                        showEk={showHardwareEk}
                        onSelect={() => handleConfigSelect(config, brand)}
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
