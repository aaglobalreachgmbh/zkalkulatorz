import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  type MobileState,
  type ContractType,
  type DatasetVersion,
  type TariffFamily,
  type MobileTariff,
  type ViewMode,
  type OfferOptionState,
  type CalculationResult,
  listMobileTariffs,
  listPromos,
  getMobileTariffFromCatalog,
  checkGKEligibility,
} from "@/margenkalkulator";
import { Signal, AlertTriangle, Minus, Plus, Ban, Check } from "lucide-react";
import { InlineTariffConfig } from "../components/InlineTariffConfig";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { useEmployeeSettings, isTariffBlocked } from "@/margenkalkulator/hooks/useEmployeeSettings";
import { useDensity } from "@/contexts/DensityContext";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { PortfolioSelector } from "../components/PortfolioSelector";
import { cn } from "@/lib/utils";
import { LeadTimeInput } from "../components/LeadTimeInput";
import { OfferOptionMeta } from "@/margenkalkulator";

interface MobileStepProps {
  value: MobileState;
  onChange: (value: MobileState) => void;
  datasetVersion: DatasetVersion;
  fixedNetEnabled?: boolean;
  hardwareName?: string;
  viewMode?: ViewMode;
  /** Full option state for inline calculation */
  fullOption?: OfferOptionState;
  /** Pre-calculated result for inline display */
  result?: CalculationResult;
  /** Quantity bonus from parent */
  quantityBonus?: number;
  /** Callback after config complete or added to offer */
  onConfigComplete?: () => void;
  /** Callback to update global meta (Portfolio, Lead Time) */
  onMetaUpdate?: (update: Partial<OfferOptionMeta>) => void;
}

const FAMILY_LABELS: Record<TariffFamily, string> = {
  prime: "BUSINESS TARIF",
  business_smart: "BUSINESS SMART",
  smart_business: "SMART BUSINESS",
  teamdeal: "TEAMDEAL",
  gigamobil: "GIGAMOBIL",
  consumer_smart: "SMART TARIF",
};

const FAMILY_COLORS: Record<TariffFamily, string> = {
  prime: "text-primary",
  business_smart: "text-primary",
  smart_business: "text-blue-600",
  teamdeal: "text-orange-600",
  gigamobil: "text-red-600",
  consumer_smart: "text-emerald-600",
};

export function MobileStep({
  value,
  onChange,
  datasetVersion,
  fixedNetEnabled = false,
  hardwareName = "",
  viewMode = "dealer",
  fullOption,
  result,
  quantityBonus = 0,
  onConfigComplete,
  onMetaUpdate,
}: MobileStepProps) {
  const [selectedFamily, setSelectedFamily] = useState<TariffFamily | "all">("all");

  const currentPortfolio = fullOption?.meta.portfolio || "business";
  const currentLeadTime = fullOption?.meta.leadTimeMonths || 0;

  const updateField = <K extends keyof MobileState>(
    field: K,
    fieldValue: MobileState[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const mobileTariffs = listMobileTariffs(datasetVersion);
  const promos = listPromos(datasetVersion);

  const selectedTariff = getMobileTariffFromCatalog(datasetVersion, value.tariffId);
  const isGKEligible = checkGKEligibility(selectedTariff, fixedNetEnabled);

  const isTeamDeal = selectedTariff?.family === "teamdeal";
  const showTeamDealWarning = isTeamDeal && !value.primeOnAccount;

  // Extract unique families from tariffs
  const families = useMemo(() => {
    const uniqueFamilies = new Set(mobileTariffs.map(t => t.family).filter(Boolean));
    return Array.from(uniqueFamilies) as TariffFamily[];
  }, [mobileTariffs]);

  // Employee settings for tariff blocking
  const { settings: employeeSettings } = useEmployeeSettings();
  const { density } = useDensity();
  const isCompact = density === "compact";

  // Filter tariffs by selected family AND blocked tariffs
  // TODO: Connect to real async loading state
  const isLoading = false;

  const filteredTariffs = useMemo(() => {
    if (!mobileTariffs || mobileTariffs.length === 0) return [];

    let tariffs = selectedFamily === "all" ? mobileTariffs : mobileTariffs.filter(t => t.family === selectedFamily);

    // Filter out blocked tariffs for this employee (with null-safe check)
    if (employeeSettings?.blockedTariffs && employeeSettings.blockedTariffs.length > 0) {
      tariffs = tariffs.filter(t => !isTariffBlocked(t.id, employeeSettings));
    }

    return tariffs;
  }, [mobileTariffs, selectedFamily, employeeSettings]);

  // Count blocked tariffs for info display
  const blockedCount = useMemo(() => {
    if (!employeeSettings?.blockedTariffs || employeeSettings.blockedTariffs.length === 0) return 0;
    if (!mobileTariffs || mobileTariffs.length === 0) return 0;

    const allTariffs = selectedFamily === "all" ? mobileTariffs : mobileTariffs.filter(t => t.family === selectedFamily);
    return allTariffs.filter(t => isTariffBlocked(t.id, employeeSettings)).length;
  }, [mobileTariffs, selectedFamily, employeeSettings]);

  // Format data volume display
  const formatDataVolume = (volume: number | "unlimited" | undefined) => {
    if (volume === "unlimited") return "∞ GB";
    if (volume === undefined) return "";
    if (volume < 1) return `${volume * 1000} MB`;
    return `${volume} GB`;
  };

  return (
    <div className="space-y-8">
      {/* Portfolio Selector (Phase 13) */}
      <PortfolioSelector
        value={currentPortfolio}
        onChange={(p) => {
          // ENTERPRISE HARDENING: State Cleanup
          // Reset DGRV/LeadTime when leaving business portfolio to prevent "Ghost Data"
          const newLeadTime = p === "business" ? currentLeadTime : 0;

          onMetaUpdate?.({
            portfolio: p,
            leadTimeMonths: newLeadTime
          });

          // Reset family selection to avoid confusion
          setSelectedFamily("all");
        }}
      />

      {/* Lead Time Input (Business Only - DGRV Logic) */}
      {currentPortfolio === "business" && (
        <LeadTimeInput
          value={currentLeadTime}
          onChange={(v) => onMetaUpdate?.({ leadTimeMonths: v })}
        />
      )}

      {/* Contract Type & Quantity Row */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-4 sm:gap-6">
          {/* Contract Type Toggle */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              Vertragsart
              <HelpTooltip content="Neuvertrag oder Vertragsverlängerung (VVL)" />
            </Label>
            <div className="flex">
              <button
                onClick={() => updateField("contractType", "new")}
                className={`px-6 py-2.5 text-sm font-medium rounded-l-lg transition-colors ${value.contractType === "new"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                Neuvertrag
              </button>
              <button
                onClick={() => updateField("contractType", "renewal")}
                className={`px-6 py-2.5 text-sm font-medium rounded-r-lg transition-colors ${value.contractType === "renewal"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                Verlängerung
              </button>
            </div>
          </div>

          {/* Quantity Counter */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              Anzahl Karten
              <HelpTooltip content="Anzahl der SIM-Karten für diesen Vertrag" />
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateField("quantity", Math.max(1, value.quantity - 1))}
                disabled={value.quantity <= 1}
                className="h-10 w-10"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center text-xl font-bold">{value.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateField("quantity", Math.min(isTeamDeal ? 10 : 100, value.quantity + 1))}
                className="h-10 w-10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tariff Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Signal className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Tarif wählen</h3>
        </div>

        {/* Family Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFamily("all")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedFamily === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
          >
            Alle Tarife
          </button>
          {families.map((family) => (
            <button
              key={family}
              onClick={() => setSelectedFamily(family)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedFamily === family
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {FAMILY_LABELS[family]}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{filteredTariffs.length} Tarif{filteredTariffs.length !== 1 ? "e" : ""} verfügbar</span>
          {blockedCount > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Ban className="w-3 h-3" />
              {blockedCount} gesperrt
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} className="h-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredTariffs.map((tariff) => {
              const isSelected = value.tariffId === tariff.id;
              const familyLabel = FAMILY_LABELS[tariff.family || "prime"];
              const familyColor = FAMILY_COLORS[tariff.family || "prime"];
              const isUnlimited = tariff.dataVolumeGB === "unlimited";

              return (
                <button
                  key={tariff.id}
                  onClick={() => {
                    updateField("tariffId", tariff.id);
                  }}
                  className={cn(
                    "group relative flex flex-col h-full w-full text-left transition-all duration-200 rounded-lg border bg-card",
                    "hover:border-primary/50 hover:shadow-sm",
                    isSelected ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border"
                  )}
                >
                  {/* Selection Check */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}

                  {/* Card Header - Family & Badges */}
                  <div className={cn(
                    "pb-2",
                    isCompact ? "p-3" : "p-4"
                  )}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn(
                          "font-bold uppercase tracking-wider mb-0.5",
                          isCompact ? "text-[10px]" : "text-xs",
                          familyColor
                        )}>
                          {familyLabel}
                        </p>
                        <h3 className={cn(
                          "font-semibold text-foreground truncate max-w-[180px]",
                          isCompact ? "text-sm" : "text-base"
                        )}>
                          {tariff.id.replace(/_/g, " ")}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Data Volume - Main KPI */}
                  <div className={cn(
                    "border-t border-b bg-muted/5 flex items-center gap-3",
                    isCompact ? "px-3 py-2" : "px-4 py-3"
                  )}>
                    <div className={cn(
                      "rounded-full flex items-center justify-center shrink-0",
                      isCompact ? "w-8 h-8 bg-primary/10" : "w-10 h-10 bg-primary/10"
                    )}>
                      {isUnlimited ? (
                        <div className="text-primary font-bold text-xs">∞</div>
                      ) : (
                        <Signal className={cn(
                          "text-primary",
                          isCompact ? "w-4 h-4" : "w-5 h-5"
                        )} />
                      )}
                    </div>
                    <div>
                      <span className={cn("block font-bold text-foreground leading-none", isCompact ? "text-lg" : "text-xl")}>
                        {isUnlimited ? "Unlimited" : `${tariff.dataVolumeGB} GB`}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">Datenvolumen</span>
                    </div>
                  </div>

                  {/* Card Footer - Price */}
                  <div className={cn(
                    "mt-4 border-t border-border/50 bg-muted/10 rounded-b-lg",
                    isCompact ? "p-2 mt-auto" : "p-3 mt-4"
                  )}>
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground">Basispreis</span>
                        <div className="flex items-baseline gap-0.5">
                          <span className={cn("font-bold text-foreground", isCompact ? "text-base" : "text-lg")}>
                            {((tariff.family === 'consumer_smart' || tariff.family === 'gigamobil')
                              ? tariff.baseNet * 1.19
                              : tariff.baseNet).toFixed(2)}
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground">€</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {isSelected ? (
                          <span className="text-xs font-bold text-primary">Ausgewählt</span>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">Wählen →</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div >
        )}

        {/* INLINE TARIFF CONFIG - SUB + Discounts + Expert Options + Add */}
        {
          selectedTariff && fullOption && result && !isTeamDeal && (
            <InlineTariffConfig
              tariff={selectedTariff}
              mobileState={value}
              allPromos={promos}
              fullOption={fullOption}
              result={result}
              viewMode={viewMode}
              quantityBonus={quantityBonus}
              asOfISO={fullOption.meta.asOfISO}
              hardwareName={hardwareName}
              onPromoChange={(promoId) => updateField("promoId", promoId)}
              onSubVariantChange={(id) => updateField("subVariantId", id)}
              onOmoChange={(rate) => {
                // OMO und Promo sind nicht kombinierbar - OMO gewählt → Promo auf NONE
                if (rate > 0 && value.promoId !== "NONE") {
                  onChange({ ...value, omoRate: rate, promoId: "NONE" });
                } else {
                  updateField("omoRate", rate);
                }
              }}
              onFHPartnerChange={(checked) => updateField("isFHPartner", checked)}
              onAddedToOffer={onConfigComplete}
            />
          )
        }

        {/* TeamDeal uses simplified inline config (no SUB variants) */}
        {
          selectedTariff && fullOption && result && isTeamDeal && (
            <InlineTariffConfig
              tariff={selectedTariff}
              mobileState={value}
              allPromos={promos}
              fullOption={fullOption}
              result={result}
              viewMode={viewMode}
              quantityBonus={quantityBonus}
              asOfISO={fullOption.meta.asOfISO}
              hardwareName={hardwareName}
              onPromoChange={(promoId) => updateField("promoId", promoId)}
              onAddedToOffer={onConfigComplete}
            />
          )
        }

        {/* Empty State */}
        {
          filteredTariffs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Signal className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Keine Tarife gefunden</p>
            </div>
          )
        }
      </div >

      {/* TeamDeal Prime Requirement */}
      {
        isTeamDeal && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="primeOnAccount"
                  checked={value.primeOnAccount ?? false}
                  onCheckedChange={(checked) => updateField("primeOnAccount", !!checked)}
                />
                <Label htmlFor="primeOnAccount" className="font-normal cursor-pointer">
                  Business Prime aktiv auf gleichem Kundenkonto
                </Label>
              </div>
              <HelpTooltip content="TeamDeal" />
            </div>
            {showTeamDealWarning && (
              <Alert variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <p className="font-medium">TeamDeal ohne Prime aktiv</p>
                  <p className="text-sm mt-1">
                    Statt TeamDeal wird <strong>Smart Business Plus (13€/mtl., 1 GB)</strong> aktiviert.
                  </p>
                  <p className="text-sm mt-1 text-amber-600 dark:text-amber-400">
                    ⚠️ Die Provision für diesen Fallback-Tarif ist nicht im System hinterlegt.
                    Bitte manuell bei Vodafone prüfen!
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )
      }

      {/* NOTE: SUB Variants + Expert Options moved to InlineTariffConfig (Phase 4) */}

      {/* NOTE: Promos Section removed - now integrated in InlineTariffConfig above */}
    </div >
  );
}
