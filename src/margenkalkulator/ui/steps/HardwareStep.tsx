import { SecureInput } from "@/components/ui/secure-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { HardwareState, DatasetVersion } from "../../engine/types";
import { listHardwareItems } from "../../engine/catalogResolver";
import { Smartphone, Upload, Check, Search, Tablet } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

interface HardwareStepProps {
  value: HardwareState;
  onChange: (value: HardwareState) => void;
  datasetVersion?: DatasetVersion;
  viewMode?: "customer" | "dealer";
}

// Placeholder images for hardware (using picsum for demo)
const HARDWARE_IMAGES: Record<string, string> = {
  no_hardware: "https://picsum.photos/seed/simonly/200/200",
  iphone_16_128: "https://picsum.photos/seed/iphone16/200/200",
  iphone_16_pro_128: "https://picsum.photos/seed/iphone16pro/200/200",
  samsung_s24_128: "https://picsum.photos/seed/samsungs24/200/200",
  pixel_9_128: "https://picsum.photos/seed/pixel9/200/200",
  default: "https://picsum.photos/seed/phone/200/200",
};

function getHardwareImage(id: string): string {
  return HARDWARE_IMAGES[id] || HARDWARE_IMAGES.default;
}

type CategoryFilter = "all" | "smartphone" | "tablet";

export function HardwareStep({ value, onChange, datasetVersion = "business-2025-09", viewMode = "dealer" }: HardwareStepProps) {
  const isCustomerMode = viewMode === "customer";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");

  const hardwareItems = useMemo(() => listHardwareItems(datasetVersion), [datasetVersion]);
  
  // Extract unique brands from hardware items
  const brands = useMemo(() => {
    const uniqueBrands = new Set(
      hardwareItems
        .filter(item => item.category !== "custom" && item.category !== "none")
        .map(item => item.brand)
    );
    return Array.from(uniqueBrands).sort();
  }, [hardwareItems]);

  // Filter hardware items based on search, brand, and category
  const filteredItems = useMemo(() => {
    return hardwareItems.filter(item => {
      // Always exclude custom entries
      if (item.category === "custom") return false;
      
      // Handle "no_hardware" / SIM Only separately - show only in "all" brand filter
      if (item.id === "no_hardware") {
        return selectedBrand === "all" || selectedBrand === "sim_only";
      }
      
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" || 
        item.brand.toLowerCase().includes(searchLower) ||
        item.model.toLowerCase().includes(searchLower);
      
      // Brand filter
      const matchesBrand = selectedBrand === "all" || item.brand === selectedBrand;
      
      // Category filter
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      
      return matchesSearch && matchesBrand && matchesCategory;
    });
  }, [hardwareItems, searchQuery, selectedBrand, selectedCategory]);

  // Find selected hardware item
  const selectedHardwareId = useMemo(() => {
    const found = hardwareItems.find(h => 
      h.category !== "custom" && 
      h.category !== "none" &&
      `${h.brand} ${h.model}` === value.name
    );
    if (found) return found.id;
    if (!value.name || value.name === "KEINE HARDWARE") return "no_hardware";
    return "";
  }, [value.name, hardwareItems]);

  const handleHardwareSelect = (hardwareId: string) => {
    const item = hardwareItems.find(h => h.id === hardwareId);
    if (!item) return;
    
    if (item.id === "no_hardware") {
      onChange({
        ...value,
        name: "KEINE HARDWARE",
        ekNet: 0,
      });
    } else {
      onChange({
        ...value,
        name: `${item.brand} ${item.model}`,
        ekNet: item.ekNet,
      });
    }
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
        {/* Händler-Optionen - nur im Dealer-Modus */}
        {!isCustomerMode && (
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
          {filteredItems.length} Gerät{filteredItems.length !== 1 ? "e" : ""} gefunden
        </div>
      </div>

      {/* Hardware Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const isSelected = selectedHardwareId === item.id;
          const displayName = item.id === "no_hardware" 
            ? "SIM Only" 
            : item.model;
          const displayBrand = item.id === "no_hardware" 
            ? "Vodafone" 
            : item.brand;
          
          return (
            <button
              key={item.id}
              onClick={() => handleHardwareSelect(item.id)}
              className={`
                relative p-5 rounded-xl border-2 bg-card text-left transition-all
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
              
              {/* Image */}
              <div className="flex justify-center mb-3">
                <img 
                  src={getHardwareImage(item.id)}
                  alt={displayName}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              </div>
              
              {/* Name & Brand */}
              <h3 className="font-semibold text-foreground text-center text-sm">
                {displayName}
              </h3>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {displayBrand}
              </p>
              
              {/* EK Badge - nur im Händler-Modus */}
              {!isCustomerMode && (
                <div className="flex justify-center mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs font-mono">
                    EK: {item.ekNet} €
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Keine Geräte gefunden</p>
          <p className="text-sm">Versuche andere Filteroptionen</p>
        </div>
      )}

      {/* Amortization Details - nur im Händler-Modus */}
      {!isCustomerMode && value.amortize && value.ekNet > 0 && (
        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Amortisierung über {value.amortMonths} Monate</p>
            <p className="text-xs text-muted-foreground">Hardware-Kosten werden auf Monatsraten verteilt</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="amort-months" className="text-sm">Monate:</Label>
              <SecureInput
                id="amort-months"
                type="number"
                min={1}
                max={48}
                value={value.amortMonths}
                onChange={(e) => updateField("amortMonths", Math.max(1, parseInt(e.target.value) || 24))}
                className="w-20"
                detectThreats={false}
              />
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{(value.ekNet / value.amortMonths).toFixed(2)} €/Mo</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
