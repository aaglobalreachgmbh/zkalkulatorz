import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { HardwareState, DatasetVersion, ViewMode } from "../../engine/types";
import { listHardwareItems } from "../../engine/catalogResolver";
import { Smartphone, Upload, Check, Search, Tablet, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { groupHardwareItems, findGroupAndVariant, type HardwareGroup, type HardwareVariant } from "../../lib/hardwareGrouping";
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

function getHardwareImage(baseId: string): string {
  // Generiere konsistentes Bild basierend auf baseId
  return `https://picsum.photos/seed/${baseId}/200/200`;
}

type CategoryFilter = "all" | "smartphone" | "tablet";

export function HardwareStep({ value, onChange, datasetVersion = "business-2025-09", viewMode = "dealer" }: HardwareStepProps) {
  // Use centralized visibility hook instead of direct viewMode check
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

  // Filter and group hardware items
  const groupedItems = useMemo(() => {
    const filtered = hardwareItems.filter(item => {
      // Exclude custom, none, and no_hardware (handled separately)
      if (item.category === "custom" || item.id === "no_hardware") return false;
      
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" || 
        item.brand.toLowerCase().includes(searchLower) ||
        item.model.toLowerCase().includes(searchLower);
      
      // Brand filter
      const matchesBrand = selectedBrand === "all" || selectedBrand === "sim_only" || item.brand === selectedBrand;
      
      // Category filter
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      
      return matchesSearch && matchesBrand && matchesCategory;
    });

    return groupHardwareItems(filtered);
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
      const groupInfo = findGroupAndVariant(groupedItems, found.id);
      if (groupInfo) {
        return { type: "variant" as const, ...groupInfo };
      }
    }
    if (!value.name || value.name === "KEINE HARDWARE") {
      return { type: "simOnly" as const };
    }
    return null;
  }, [value.name, hardwareItems, groupedItems]);

  const handleSimOnlySelect = () => {
    onChange({
      ...value,
      name: "KEINE HARDWARE",
      ekNet: 0,
    });
    setOpenPopoverId(null);
  };

  const handleVariantSelect = (variant: HardwareVariant, brand: string) => {
    onChange({
      ...value,
      name: `${brand} ${variant.fullModel}`,
      ekNet: variant.ekNet,
    });
    setOpenPopoverId(null);
  };

  const updateField = <K extends keyof HardwareState>(
    field: K,
    fieldValue: HardwareState[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Hardware wählen</h2>
        </div>
        {/* Händler-Optionen - nur wenn showDealerOptions true */}
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
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Gerät suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Toggle */}
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
          {groupedItems.length} Modell{groupedItems.length !== 1 ? "e" : ""} gefunden
          {showSimOnly && " + SIM Only"}
        </div>
      </div>

      {/* Hardware Grid */}
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
            
            {/* Maximale Marge Badge - nur wenn showDealerOptions */}
            {showDealerOptions && (
              <div className="flex justify-center mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
                  Maximale Marge
                </span>
              </div>
            )}
          </button>
        )}

        {/* Grouped Hardware Cards */}
        {groupedItems.map((group) => {
          const isSelected = selectedInfo?.type === "variant" && selectedInfo.group.baseId === group.baseId;
          const selectedVariant = isSelected ? selectedInfo.variant : null;
          const hasMultipleVariants = group.variants.length > 1;
          
          return (
            <Popover 
              key={group.baseId} 
              open={openPopoverId === group.baseId}
              onOpenChange={(open) => setOpenPopoverId(open ? group.baseId : null)}
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
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  {/* Variants Badge */}
                  {hasMultipleVariants && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                        {group.variants.length} Varianten
                        <ChevronDown className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                  
                  {/* Image */}
                  <div className="flex justify-center mb-3 mt-2">
                    <img 
                      src={getHardwareImage(group.baseId)}
                      alt={group.baseName}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                  
                  {/* Name & Brand */}
                  <h3 className="font-semibold text-foreground text-center text-sm">
                    {group.baseName}
                  </h3>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {group.brand}
                  </p>
                  
                  {/* Selected Variant Info */}
                  {selectedVariant && (
                    <p className="text-xs text-primary text-center mt-1 font-medium">
                      {selectedVariant.storage}
                    </p>
                  )}
                  
                  {/* Price Badge - nur wenn showHardwareEk true */}
                  {showHardwareEk && (
                    <div className="flex justify-center mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs font-mono">
                        {hasMultipleVariants 
                          ? `ab ${group.lowestPrice} € EK`
                          : `EK: ${group.lowestPrice} €`
                        }
                      </span>
                    </div>
                  )}
                </button>
              </PopoverTrigger>
              
              <PopoverContent className="w-72 p-0 bg-popover" align="start">
                <div className="p-4 border-b border-border">
                  <h4 className="font-semibold">{group.brand} {group.baseName}</h4>
                  <p className="text-sm text-muted-foreground">Speicheroption wählen</p>
                </div>
                <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                  {group.variants.map((variant) => {
                    const isVariantSelected = selectedVariant?.id === variant.id;
                    return (
                      <button
                        key={variant.id}
                        onClick={() => handleVariantSelect(variant, group.brand)}
                        className={`
                          w-full flex items-center justify-between p-3 rounded-lg transition-colors
                          ${isVariantSelected 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-muted"
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          {isVariantSelected && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                          <span className={`font-medium ${isVariantSelected ? "" : "ml-7"}`}>
                            {variant.storage}
                          </span>
                        </div>
                        {/* EK nur wenn showHardwareEk true */}
                        {showHardwareEk && (
                          <span className="text-sm font-mono text-muted-foreground">
                            {variant.ekNet} € EK
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>

      {/* Empty State */}
      {groupedItems.length === 0 && !showSimOnly && (
        <div className="text-center py-12 text-muted-foreground">
          <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Keine Geräte gefunden</p>
          <p className="text-sm">Versuche andere Filteroptionen</p>
        </div>
      )}

      {/* Amortization Details - nur wenn showDealerOptions true */}
      {showDealerOptions && value.amortize && value.ekNet > 0 && (
        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Amortisierung über {value.amortMonths} Monate</p>
            <p className="text-xs text-muted-foreground">Hardware-Kosten werden auf Monatsraten verteilt</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="amortMonths" className="text-sm text-muted-foreground">Monate:</Label>
              <Input
                id="amortMonths"
                type="number"
                min={1}
                max={36}
                value={value.amortMonths}
                onChange={(e) => updateField("amortMonths", parseInt(e.target.value) || 24)}
                className="w-20"
              />
            </div>
            <div className="text-right">
              <p className="text-sm font-mono">
                {(value.ekNet / (value.amortMonths || 24)).toFixed(2)} €/mtl.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
