import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { HardwareState, DatasetVersion, ViewMode } from "../../engine/types";
import { listHardwareItems } from "../../engine/catalogResolver";
import { Smartphone, Upload, Check, Search, Tablet, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { 
  groupHardwareFamilies, 
  findFamilyAndConfig, 
  type HardwareFamily, 
  type HardwareSubModel,
  type HardwareConfig 
} from "../../lib/hardwareGrouping";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";

interface HardwareStepProps {
  value: HardwareState;
  onChange: (value: HardwareState) => void;
  datasetVersion?: DatasetVersion;
  viewMode?: ViewMode;
}

// Placeholder images for hardware (using picsum for demo)
const HARDWARE_IMAGES: Record<string, string> = {
  no_hardware: "https://picsum.photos/seed/simonly/200/200",
  default: "https://picsum.photos/seed/phone/200/200",
};

function getHardwareImage(familyId: string): string {
  return `https://picsum.photos/seed/${familyId}/200/200`;
}

type CategoryFilter = "all" | "smartphone" | "tablet";

export function HardwareStep({ value, onChange, datasetVersion = "business-2025-09", viewMode = "dealer" }: HardwareStepProps) {
  const visibility = useSensitiveFieldsVisible(viewMode);
  const showHardwareEk = visibility.showHardwareEk;
  const showDealerOptions = visibility.showDealerEconomics;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const hardwareItems = useMemo(() => listHardwareItems(datasetVersion), [datasetVersion]);
  
  // Find the SIM-Only item
  const simOnlyItem = useMemo(() => 
    hardwareItems.find(item => item.id === "no_hardware"),
    [hardwareItems]
  );
  
  // Extract unique brands from hardware items
  const brands = useMemo(() => {
    const uniqueBrands = new Set(
      hardwareItems
        .filter(item => item.category !== "custom" && item.category !== "none" && item.id !== "no_hardware")
        .map(item => item.brand)
    );
    return Array.from(uniqueBrands).sort();
  }, [hardwareItems]);

  // Filter and group hardware items using new 3-level hierarchy
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

  // Check if SIM-Only should be shown
  const showSimOnly = selectedBrand === "all" || selectedBrand === "sim_only";

  // Find currently selected hardware
  const selectedInfo = useMemo(() => {
    const found = hardwareItems.find(h => 
      h.category !== "custom" && 
      h.category !== "none" &&
      `${h.brand} ${h.model}` === value.name
    );
    if (found) {
      if (found.id === "no_hardware") {
        return { type: "simOnly" as const };
      }
      const familyInfo = findFamilyAndConfig(families, found.id);
      if (familyInfo) {
        return { type: "config" as const, ...familyInfo };
      }
    }
    if (!value.name || value.name === "KEINE HARDWARE") {
      return { type: "simOnly" as const };
    }
    return null;
  }, [value.name, hardwareItems, families]);

  const handleSimOnlySelect = () => {
    onChange({
      ...value,
      name: "KEINE HARDWARE",
      ekNet: 0,
    });
    setOpenPopoverId(null);
  };

  const handleConfigSelect = (config: HardwareConfig, brand: string) => {
    onChange({
      ...value,
      name: `${brand} ${config.fullModel}`,
      ekNet: config.ekNet,
    });
    setOpenPopoverId(null);
  };

  const updateField = <K extends keyof HardwareState>(
    field: K,
    fieldValue: HardwareState[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  // Count total configs across all families
  const totalConfigs = useMemo(() => 
    families.reduce((sum, f) => sum + f.totalConfigs, 0),
    [families]
  );

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Hardware wählen</h2>
        </div>
        {showDealerOptions && (
          <div className="flex items-center gap-4">
            <Link to="/hardware-manager">
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                Hardware-Manager (CSV)
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Monatlich amortisieren</span>
              <Switch
                checked={value.amortize}
                onCheckedChange={(checked) => updateField("amortize", checked)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter Section */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        {/* Search and Category Row */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Gerät suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                selectedCategory === "all"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setSelectedCategory("smartphone")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                selectedCategory === "smartphone"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Smartphones
            </button>
            <button
              onClick={() => setSelectedCategory("tablet")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                selectedCategory === "tablet"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Tablet className="w-4 h-4" />
              Tablets
            </button>
          </div>
        </div>

        {/* Brand Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedBrand("all")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedBrand === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Alle Marken
          </button>
          <button
            onClick={() => setSelectedBrand("sim_only")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedBrand === "sim_only"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            SIM Only
          </button>
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedBrand === brand
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {brand}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          {families.length} Produktfamilie{families.length !== 1 ? "n" : ""} ({totalConfigs} Varianten)
          {showSimOnly && " + SIM Only"}
        </div>
      </div>

      {/* Hardware Grid - Family Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* SIM Only Card */}
        {showSimOnly && simOnlyItem && (
          <button
            onClick={handleSimOnlySelect}
            className={`
              relative p-5 rounded-xl border-2 bg-card text-left transition-all
              hover:shadow-md hover:border-primary/50
              ${selectedInfo?.type === "simOnly"
                ? "border-primary ring-2 ring-primary/20" 
                : "border-border"
              }
            `}
          >
            {selectedInfo?.type === "simOnly" && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            
            <div className="flex justify-center mb-3">
              <img 
                src={HARDWARE_IMAGES.no_hardware}
                alt="SIM Only"
                className="w-20 h-20 object-cover rounded-lg"
              />
            </div>
            
            <h3 className="font-semibold text-foreground text-center text-sm">
              SIM Only
            </h3>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Nur Tarif
            </p>
            
            {showDealerOptions && (
              <div className="flex justify-center mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
                  Maximale Marge
                </span>
              </div>
            )}
          </button>
        )}

        {/* Family Cards with SubModel/Config Selection */}
        {families.map((family) => {
          const isSelected = selectedInfo?.type === "config" && selectedInfo.family.familyId === family.familyId;
          const selectedConfig = isSelected ? selectedInfo.config : null;
          const selectedSubModel = isSelected ? selectedInfo.subModel : null;
          const hasMultipleOptions = family.totalConfigs > 1;
          
          return (
            <Popover 
              key={family.familyId} 
              open={openPopoverId === family.familyId}
              onOpenChange={(open) => setOpenPopoverId(open ? family.familyId : null)}
            >
              <PopoverTrigger asChild>
                <button
                  className={`
                    relative p-5 rounded-xl border-2 bg-card text-left transition-all w-full
                    hover:shadow-md hover:border-primary/50
                    ${isSelected 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border"
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  {/* Family Stats Badge */}
                  {hasMultipleOptions && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                        {family.subModels.length} Modell{family.subModels.length > 1 ? "e" : ""}
                        <ChevronDown className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-center mb-3 mt-2">
                    <img 
                      src={getHardwareImage(family.familyId)}
                      alt={family.familyName}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                  
                  <h3 className="font-semibold text-foreground text-center text-sm">
                    {family.familyName}
                  </h3>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {family.brand}
                  </p>
                  
                  {/* Selected SubModel + Config Info */}
                  {selectedSubModel && selectedConfig && (
                    <p className="text-xs text-primary text-center mt-1 font-medium">
                      {selectedSubModel.subModelName ? `${selectedSubModel.subModelName} · ` : ""}
                      {selectedConfig.storage}
                    </p>
                  )}
                  
                  {showHardwareEk && (
                    <div className="flex justify-center mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs font-mono">
                        {hasMultipleOptions 
                          ? `ab ${family.lowestPrice} € EK`
                          : `EK: ${family.lowestPrice} €`
                        }
                      </span>
                    </div>
                  )}
                </button>
              </PopoverTrigger>
              
              <PopoverContent className="w-80 p-0 bg-popover" align="start">
                <div className="p-4 border-b border-border">
                  <h4 className="font-semibold">{family.brand} {family.familyName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {family.subModels.length} Modell{family.subModels.length > 1 ? "e" : ""} · {family.totalConfigs} Variante{family.totalConfigs > 1 ? "n" : ""}
                  </p>
                </div>
                
                {/* SubModel Accordion with Configs */}
                <div className="max-h-80 overflow-y-auto">
                  <Accordion 
                    type="single" 
                    collapsible 
                    defaultValue={selectedSubModel?.subModelId || family.subModels[0]?.subModelId}
                    className="w-full"
                  >
                    {family.subModels.map((subModel) => {
                      const isSubModelSelected = selectedSubModel?.subModelId === subModel.subModelId;
                      
                      return (
                        <AccordionItem key={subModel.subModelId} value={subModel.subModelId} className="border-b border-border last:border-0">
                          <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 hover:no-underline">
                            <div className="flex items-center gap-2 text-left">
                              {isSubModelSelected && (
                                <Check className="w-4 h-4 text-primary shrink-0" />
                              )}
                              <span className={`font-medium ${isSubModelSelected ? "text-primary" : ""}`}>
                                {subModel.subModelName || family.familyName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({subModel.configs.length})
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-0">
                            <div className="px-2 pb-2 space-y-1">
                              {subModel.configs.map((config) => {
                                const isConfigSelected = selectedConfig?.id === config.id;
                                return (
                                  <button
                                    key={config.id}
                                    onClick={() => handleConfigSelect(config, family.brand)}
                                    className={`
                                      w-full flex items-center justify-between p-3 rounded-lg transition-colors
                                      ${isConfigSelected 
                                        ? "bg-primary/10 text-primary" 
                                        : "hover:bg-muted"
                                      }
                                    `}
                                  >
                                    <div className="flex items-center gap-3">
                                      {isConfigSelected && (
                                        <Check className="w-4 h-4 text-primary" />
                                      )}
                                      <div className={isConfigSelected ? "" : "ml-7"}>
                                        <span className="font-medium">{config.storage}</span>
                                        {config.connectivity && (
                                          <span className="text-xs text-muted-foreground ml-2">
                                            {config.connectivity}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {showHardwareEk && (
                                      <span className="text-sm font-mono text-muted-foreground">
                                        {config.ekNet} € EK
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              </PopoverContent>
            </Popover>
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

      {/* Amortization Details */}
      {showDealerOptions && value.amortize && value.ekNet > 0 && (
        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Hardware-Amortisation</p>
            <p className="text-xs text-muted-foreground">
              {value.ekNet} € EK über {value.amortMonths || 24} Monate
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold font-mono">
              {((value.ekNet || 0) / (value.amortMonths || 24)).toFixed(2)} €
            </p>
            <p className="text-xs text-muted-foreground">pro Monat</p>
          </div>
        </div>
      )}
    </div>
  );
}
