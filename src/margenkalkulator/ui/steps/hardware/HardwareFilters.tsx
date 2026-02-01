// ============================================
// HardwareFilters - Search, Category, Brand tabs
// Phase 6: Extracted from HardwareStep
// ============================================

import { Input } from "@/components/ui/input";
import { Search, Smartphone, Tablet } from "lucide-react";

export type CategoryFilter = "all" | "smartphone" | "tablet";

interface HardwareFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: CategoryFilter;
  onCategoryChange: (value: CategoryFilter) => void;
  selectedBrand: string;
  onBrandChange: (value: string) => void;
  brands: string[];
  familyCount: number;
  totalConfigs: number;
  showSimOnly: boolean;
}

export function HardwareFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedBrand,
  onBrandChange,
  brands,
  familyCount,
  totalConfigs,
  showSimOnly,
}: HardwareFiltersProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4 mb-6 shadow-sm">
      {/* Search and Category Row */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative w-full sm:flex-1 sm:min-w-[180px] lg:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Gerät suchen..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex bg-muted rounded-lg p-1 overflow-x-auto">
          <button
            onClick={() => onCategoryChange("all")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              selectedCategory === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => onCategoryChange("smartphone")}
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
            onClick={() => onCategoryChange("tablet")}
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
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        <button
          onClick={() => onBrandChange("all")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
            selectedBrand === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Alle Marken
        </button>
        <button
          onClick={() => onBrandChange("sim_only")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
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
            onClick={() => onBrandChange(brand)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
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
        {familyCount} Produktfamilie{familyCount !== 1 ? "n" : ""} ({totalConfigs} Varianten)
        {showSimOnly && " + SIM Only"}
      </div>
    </div>
  );
}
