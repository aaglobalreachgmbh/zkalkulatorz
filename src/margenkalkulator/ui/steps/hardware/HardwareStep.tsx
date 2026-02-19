// ============================================
// HardwareStep - Ultra-Kompakt CPQ-Redesign
// Two-phase flow: Select (table) → Configure (inline box)
// Brand-grouped rows, category tabs, keyboard shortcuts
// Identisches Pattern wie MobileStep
// ============================================

import { useState, useMemo, useCallback, useEffect } from "react";
import { Smartphone, Tablet, ArrowLeft, Search, Upload, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HardwareState, DatasetVersion, ViewMode } from "../../../engine/types";
import { listHardwareItems } from "../../../engine/catalogResolver";
import {
  groupHardwareFamilies,
  type HardwareConfig,
  type HardwareFamily,
} from "../../../lib/hardwareGrouping";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { useHardwareImages } from "../../../hooks/useHardwareImages";
import { usePOSMode } from "@/contexts/POSModeContext";
import { HardwareProductCard, BrandGroupHeader } from "./HardwareProductCard";

// ─── Types ───────────────────────────────────────────────
type ConfigPhase = "select" | "configure";
type ActiveCategory = "smartphone" | "tablet" | "simonly";

const AMORT_MONTHS_OPTIONS = [12, 24, 36];

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

  // ─── Phase State ─────────────────────────────────────────
  const [configPhase, setConfigPhase] = useState<ConfigPhase>("select");
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>("smartphone");
  const [searchQuery, setSearchQuery] = useState("");
  // pendingConfig: holds the device chosen in Phase A until user confirms in Phase B
  const [pendingConfig, setPendingConfig] = useState<{ config: HardwareConfig; brand: string } | null>(null);
  // local amort state for Phase B (not committed until user clicks confirm)
  const [pendingAmortize, setPendingAmortize] = useState(false);
  const [pendingAmortMonths, setPendingAmortMonths] = useState(24);

  const { imageMap } = useHardwareImages();

  const hardwareItems = useMemo(() => listHardwareItems(datasetVersion), [datasetVersion]);

  // Already confirmed selection
  const selectedConfigId = useMemo(() => {
    const found = hardwareItems.find(
      h => h.category !== "custom" && h.category !== "none" && `${h.brand} ${h.model}` === value.name
    );
    return found?.id || null;
  }, [value.name, hardwareItems]);

  // ─── Filtered + Grouped data ─────────────────────────────
  const families = useMemo(() => {
    const filtered = hardwareItems.filter(item => {
      if (item.category === "custom" || item.id === "no_hardware") return false;
      if (activeCategory === "smartphone" && item.category !== "smartphone") return false;
      if (activeCategory === "tablet" && item.category !== "tablet") return false;
      const searchLower = searchQuery.toLowerCase();
      return (
        searchQuery === "" ||
        item.brand.toLowerCase().includes(searchLower) ||
        item.model.toLowerCase().includes(searchLower)
      );
    });
    return groupHardwareFamilies(filtered);
  }, [hardwareItems, activeCategory, searchQuery]);

  // Group families by brand (already sorted by hardwareGrouping)
  const brandGroups = useMemo(() => {
    const map = new Map<string, HardwareFamily[]>();
    for (const family of families) {
      if (!map.has(family.brand)) map.set(family.brand, []);
      map.get(family.brand)!.push(family);
    }
    return Array.from(map.entries());
  }, [families]);

  // Flat list of all configs for keyboard nav
  const allConfigs = useMemo(() => {
    return families.flatMap(f =>
      f.subModels.flatMap(sm =>
        sm.configs.map(c => ({ config: c, brand: f.brand }))
      )
    );
  }, [families]);

  // Counts per category
  const counts = useMemo(() => {
    const smartphones = hardwareItems.filter(h => h.category === "smartphone" && h.id !== "no_hardware").length;
    const tablets = hardwareItems.filter(h => h.category === "tablet").length;
    return { smartphones, tablets };
  }, [hardwareItems]);

  // ─── Keyboard Shortcuts ───────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (configPhase !== "select") return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9 && num <= allConfigs.length) {
      handleDeviceSelect(allConfigs[num - 1].config, allConfigs[num - 1].brand);
    }
  }, [configPhase, allConfigs]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ─── Handlers ────────────────────────────────────────────
  const handleCategoryChange = (cat: ActiveCategory) => {
    setActiveCategory(cat);
    setSearchQuery("");
    if (configPhase === "configure") setConfigPhase("select");
  };

  const handleDeviceSelect = (config: HardwareConfig, brand: string) => {
    setPendingConfig({ config, brand });
    setPendingAmortize(value.amortize || false);
    setPendingAmortMonths(value.amortMonths || 24);
    setConfigPhase("configure");
  };

  const handleSimOnly = () => {
    onChange({ ...value, name: "KEINE HARDWARE", ekNet: 0, amortize: false });
    onHardwareSelected?.();
  };

  const handleConfirm = () => {
    if (!pendingConfig) return;
    onChange({
      ...value,
      name: `${pendingConfig.brand} ${pendingConfig.config.fullModel}`,
      ekNet: pendingConfig.config.ekNet,
      amortize: pendingAmortize,
      amortMonths: pendingAmortMonths,
    });
    setConfigPhase("select");
    onHardwareSelected?.();
  };

  const handleBackToSelect = () => {
    setConfigPhase("select");
    setPendingConfig(null);
  };

  // ─── Computed values for Phase B ─────────────────────────
  const monthlyRate = pendingConfig && pendingAmortize
    ? pendingConfig.config.ekNet / pendingAmortMonths
    : 0;

  const isSimOnlyConfirmed = value.name === "KEINE HARDWARE";

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* ─── HEADER BAR ─── */}
      <div className="flex flex-col gap-2">
        {/* Row 1: Title + Hardware-Manager */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Hardware-Auswahl</h2>
          {showDealerOptions && (
            <Link to="/data-manager/hardware">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7 px-2">
                <Upload className="w-3 h-3" />
                Manager
              </Button>
            </Link>
          )}
        </div>

        {/* Row 2: Category Tabs + Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Tabs */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => handleCategoryChange("smartphone")}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors",
                activeCategory === "smartphone"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Smartphone className="w-3 h-3" />
              Smartphones {counts.smartphones > 0 && <span className="opacity-70">({counts.smartphones})</span>}
            </button>
            <button
              onClick={() => handleCategoryChange("tablet")}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors",
                activeCategory === "tablet"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Tablet className="w-3 h-3" />
              Tablets {counts.tablets > 0 && <span className="opacity-70">({counts.tablets})</span>}
            </button>
            <button
              onClick={() => handleCategoryChange("simonly")}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors",
                activeCategory === "simonly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              SIM Only
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          {activeCategory !== "simonly" && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Gerät suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-7 pr-3 text-xs border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 w-36"
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── Row Count / Keyboard Hint ─── */}
      {configPhase === "select" && activeCategory !== "simonly" && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{allConfigs.length} Gerät{allConfigs.length !== 1 ? "e" : ""}</span>
          {selectedConfigId && (
            <span className="flex items-center gap-1 text-[hsl(var(--status-success))]">
              <Check className="w-2.5 h-2.5" />
              Aktuell: {value.name}
            </span>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground/60">
            Tipp: Zifferntasten 1–{Math.min(9, allConfigs.length)} zum Schnellwählen
          </span>
        </div>
      )}

      {/* ─── PHASE A: Device Selection Table ─── */}
      {configPhase === "select" && activeCategory !== "simonly" && (
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          {/* Column Headers */}
          <div className="flex items-center gap-3 px-4 py-1.5 bg-muted/30 border-b border-border">
            <div className="w-5" />
            <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Gerät</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-24 text-center hidden sm:block">Specs</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-20 text-right">
              {showHardwareEk ? "EK (netto)" : "Preis"}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-[68px] text-center">Aktion</span>
          </div>

          {/* Brand Groups */}
          {brandGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Keine Geräte gefunden</p>
            </div>
          ) : (
            <div>
              {brandGroups.map(([brand, brandFamilies]) => {
                // track global config index for keyboard shortcuts
                let globalIdx = 0;
                // we need to count configs before this brand
                const prevBrandConfigs = brandGroups
                  .slice(0, brandGroups.findIndex(([b]) => b === brand))
                  .reduce((sum, [, fams]) => sum + fams.reduce((s, f) => s + f.subModels.reduce((ss, sm) => ss + sm.configs.length, 0), 0), 0);

                return (
                  <div key={brand}>
                    <BrandGroupHeader brand={brand} />
                    <div className="divide-y divide-border/50">
                      {brandFamilies.flatMap((family) =>
                        family.subModels.flatMap((subModel) =>
                          subModel.configs.map((config, configIdx) => {
                            const absoluteIdx = prevBrandConfigs + brandFamilies
                              .slice(0, brandFamilies.indexOf(family))
                              .reduce((s, f) => s + f.subModels.reduce((ss, sm) => ss + sm.configs.length, 0), 0)
                              + family.subModels
                              .slice(0, family.subModels.indexOf(subModel))
                              .reduce((s, sm) => s + sm.configs.length, 0)
                              + configIdx;

                            return (
                              <HardwareProductCard
                                key={config.id}
                                config={config}
                                brand={family.brand}
                                familyName={family.familyName}
                                subModelName={subModel.subModelName}
                                imageUrl=""
                                isSelected={selectedConfigId === config.id}
                                isCurrent={pendingConfig?.config.id === config.id}
                                showEk={showHardwareEk}
                                index={absoluteIdx}
                                onSelect={() => handleDeviceSelect(config, family.brand)}
                              />
                            );
                          })
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── PHASE A: SIM Only ─── */}
      {configPhase === "select" && activeCategory === "simonly" && (
        <div className="rounded-lg border border-border bg-card p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
            <span className="text-2xl">📶</span>
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Nur Tarif — kein Gerät</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Der Kunde bringt sein eigenes Gerät mit oder benötigt kein Neugerät.
            </p>
          </div>
          {isSimOnlyConfirmed ? (
            <div className="flex items-center justify-center gap-2 text-[hsl(var(--status-success))] text-sm font-medium">
              <Check className="w-4 h-4" />
              SIM Only aktiv
            </div>
          ) : (
            <button
              onClick={handleSimOnly}
              className="mx-auto flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Check className="w-4 h-4" />
              SIM Only bestätigen
            </button>
          )}
        </div>
      )}

      {/* ─── PHASE B: HardwareConfigBox (replaces list) ─── */}
      {configPhase === "configure" && pendingConfig && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Back Button */}
          <button
            onClick={handleBackToSelect}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Zurück zur Geräteauswahl
          </button>

          {/* Config Box */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {/* Device Header */}
            <div className="flex items-start justify-between gap-4 p-4 border-b border-border bg-muted/20">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[hsl(var(--status-success))] flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-bold text-foreground text-sm">
                    {pendingConfig.brand} {pendingConfig.config.fullModel}
                  </span>
                </div>
                {showHardwareEk && (
                  <p className="text-xs text-muted-foreground mt-1 ml-7">
                    EK (netto): <span className="font-bold text-foreground">{pendingConfig.config.ekNet.toFixed(2)} €</span>
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">EINMALIG</p>
                <p className="text-xl font-bold text-foreground tabular-nums">
                  {showHardwareEk ? `${pendingConfig.config.ekNet.toFixed(2)} €` : "—"}
                </p>
              </div>
            </div>

            {/* Amortisation Controls (nur für Dealer) */}
            {showDealerOptions && (
              <div className="p-4 space-y-3">
                {/* Segmented Control */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Amortisation
                  </label>
                  <div className="flex border border-border rounded-lg overflow-hidden w-fit">
                    <button
                      onClick={() => setPendingAmortize(false)}
                      className={cn(
                        "px-4 py-2 text-xs font-semibold transition-colors",
                        !pendingAmortize
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      Einmalig
                    </button>
                    <button
                      onClick={() => setPendingAmortize(true)}
                      className={cn(
                        "px-4 py-2 text-xs font-semibold transition-colors",
                        pendingAmortize
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      Im Monatspreis
                    </button>
                  </div>
                </div>

                {/* Laufzeit (nur sichtbar wenn Amortize) */}
                {pendingAmortize && (
                  <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Laufzeit
                    </label>
                    <div className="flex border border-border rounded-lg overflow-hidden w-fit">
                      {AMORT_MONTHS_OPTIONS.map(months => (
                        <button
                          key={months}
                          onClick={() => setPendingAmortMonths(months)}
                          className={cn(
                            "px-4 py-2 text-xs font-semibold transition-colors",
                            pendingAmortMonths === months
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          {months} Monate
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Rate Preview */}
                {pendingAmortize && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                    <div>
                      <p className="text-xs font-medium text-foreground">Monatsrate</p>
                      <p className="text-[11px] text-muted-foreground">
                        {pendingConfig.config.ekNet.toFixed(2)} € auf {pendingAmortMonths} Monate verteilt
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary tabular-nums">
                        +{monthlyRate.toFixed(2)} €
                      </p>
                      <p className="text-[10px] text-muted-foreground">pro Monat</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Summary row if no dealer options */}
            {!showDealerOptions && (
              <div className="p-4">
                <p className="text-xs text-muted-foreground">
                  Das Gerät wird einmalig berechnet.
                </p>
              </div>
            )}

            {/* Confirm Button */}
            <div className="px-4 pb-4">
              <button
                onClick={handleConfirm}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Hardware übernehmen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
