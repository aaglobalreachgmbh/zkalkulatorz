// ============================================
// MobileStep - Orchestrator Component
// Phase 6: Refactored from 495 LOC to ~200 LOC
// ============================================

import { useState, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  type MobileState,
  type ContractType,
  type DatasetVersion,
  type TariffFamily,
  type ViewMode,
  type OfferOptionState,
  type CalculationResult,
  listMobileTariffs,
  listPromos,
  getMobileTariffFromCatalog,
} from "@/margenkalkulator";
import { Signal, AlertTriangle } from "lucide-react";
import { InlineTariffConfig } from "../../components/InlineTariffConfig";
import { useEmployeeSettings, isTariffBlocked } from "../../../hooks/useEmployeeSettings";
import { useDensity } from "@/contexts/DensityContext";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { PortfolioSelector } from "../../components/PortfolioSelector";
import { LeadTimeInput } from "../../components/LeadTimeInput";
import { OfferOptionMeta } from "@/margenkalkulator";

import { ContractQuantitySelector } from "./ContractQuantitySelector";
import { TariffFilters } from "./TariffFilters";
import { TariffGrid } from "./TariffGrid";

interface MobileStepProps {
  value: MobileState;
  onChange: (value: MobileState) => void;
  datasetVersion: DatasetVersion;
  fixedNetEnabled?: boolean;
  hardwareName?: string;
  viewMode?: ViewMode;
  fullOption?: OfferOptionState;
  result?: CalculationResult;
  quantityBonus?: number;
  onConfigComplete?: () => void;
  onMetaUpdate?: (update: Partial<OfferOptionMeta>) => void;
}

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

  const updateField = <K extends keyof MobileState>(field: K, fieldValue: MobileState[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const mobileTariffs = listMobileTariffs(datasetVersion);
  const promos = listPromos(datasetVersion);
  const selectedTariff = getMobileTariffFromCatalog(datasetVersion, value.tariffId);
  const isTeamDeal = selectedTariff?.family === "teamdeal";
  const showTeamDealWarning = isTeamDeal && !value.primeOnAccount;

  const families = useMemo(() => {
    const uniqueFamilies = new Set(mobileTariffs.map(t => t.family).filter(Boolean));
    return Array.from(uniqueFamilies) as TariffFamily[];
  }, [mobileTariffs]);

  const { settings: employeeSettings } = useEmployeeSettings();
  const { density } = useDensity();
  const isCompact = density === "compact";

  const filteredTariffs = useMemo(() => {
    if (!mobileTariffs || mobileTariffs.length === 0) return [];
    let tariffs = selectedFamily === "all" ? mobileTariffs : mobileTariffs.filter(t => t.family === selectedFamily);
    if (employeeSettings?.blockedTariffs && employeeSettings.blockedTariffs.length > 0) {
      tariffs = tariffs.filter(t => !isTariffBlocked(t.id, employeeSettings));
    }
    return tariffs;
  }, [mobileTariffs, selectedFamily, employeeSettings]);

  const blockedCount = useMemo(() => {
    if (!employeeSettings?.blockedTariffs || employeeSettings.blockedTariffs.length === 0) return 0;
    if (!mobileTariffs || mobileTariffs.length === 0) return 0;
    const allTariffs = selectedFamily === "all" ? mobileTariffs : mobileTariffs.filter(t => t.family === selectedFamily);
    return allTariffs.filter(t => isTariffBlocked(t.id, employeeSettings)).length;
  }, [mobileTariffs, selectedFamily, employeeSettings]);

  return (
    <div className="space-y-8">
      {/* Portfolio Selector */}
      <PortfolioSelector
        value={currentPortfolio}
        onChange={(p) => {
          const newLeadTime = p === "business" ? currentLeadTime : 0;
          onMetaUpdate?.({ portfolio: p, leadTimeMonths: newLeadTime });
          setSelectedFamily("all");
        }}
      />

      {/* Lead Time Input (Business Only) */}
      {currentPortfolio === "business" && (
        <LeadTimeInput
          value={currentLeadTime}
          onChange={(v) => onMetaUpdate?.({ leadTimeMonths: v })}
        />
      )}

      {/* Contract Type & Quantity */}
      <ContractQuantitySelector
        contractType={value.contractType}
        quantity={value.quantity}
        maxQuantity={isTeamDeal ? 10 : 100}
        onContractTypeChange={(type) => updateField("contractType", type)}
        onQuantityChange={(qty) => updateField("quantity", qty)}
      />

      {/* Tariff Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Signal className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Tarif wählen</h3>
        </div>

        <TariffFilters
          selectedFamily={selectedFamily}
          onFamilyChange={setSelectedFamily}
          families={families}
          filteredCount={filteredTariffs.length}
          blockedCount={blockedCount}
        />

        <TariffGrid
          tariffs={filteredTariffs}
          selectedTariffId={value.tariffId}
          isCompact={isCompact}
          onSelect={(id) => updateField("tariffId", id)}
        />

        {/* Inline Tariff Config */}
        {selectedTariff && fullOption && result && !isTeamDeal && (
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
              if (rate > 0 && value.promoId !== "NONE") {
                onChange({ ...value, omoRate: rate, promoId: "NONE" });
              } else {
                updateField("omoRate", rate);
              }
            }}
            onFHPartnerChange={(checked) => updateField("isFHPartner", checked)}
            onAddedToOffer={onConfigComplete}
          />
        )}

        {/* TeamDeal Inline Config */}
        {selectedTariff && fullOption && result && isTeamDeal && (
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
            onOmoChange={(rate) => updateField("omoRate", rate)}
            onFHPartnerChange={(checked) => updateField("isFHPartner", checked)}
            onAddedToOffer={onConfigComplete}
          />
        )}
      </div>

      {/* TeamDeal Prime Requirement */}
      {isTeamDeal && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-[hsl(var(--status-warning)/0.1)] rounded-lg border border-[hsl(var(--status-warning)/0.3)]">
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
            <Alert variant="destructive" className="border-[hsl(var(--status-warning)/0.5)] bg-[hsl(var(--status-warning)/0.1)]">
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-warning))]" />
              <AlertDescription className="text-[hsl(var(--status-warning))]">
                <p className="font-medium">TeamDeal ohne Prime aktiv</p>
                <p className="text-sm mt-1">
                  Statt TeamDeal wird <strong>Smart Business Plus (13€/mtl., 1 GB)</strong> aktiviert.
                </p>
                <p className="text-sm mt-1 opacity-80">
                  ⚠️ Die Provision für diesen Fallback-Tarif ist nicht im System hinterlegt.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
