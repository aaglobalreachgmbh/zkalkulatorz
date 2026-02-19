// ============================================
// MobileStep - Zwei-Phasen-Ansicht (Select / Configure)
// Kompakt-Optimierung: Grid wird durch Config ersetzt
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
import { Briefcase, Smartphone, Wifi, AlertTriangle, Ban, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InlineTariffConfig } from "../../components/InlineTariffConfig";
import { useEmployeeSettings, isTariffBlocked } from "../../../hooks/useEmployeeSettings";
import { useDensity } from "@/contexts/DensityContext";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { LeadTimeInput } from "../../components/LeadTimeInput";
import { OfferOptionMeta } from "@/margenkalkulator";
import { cn } from "@/lib/utils";

import { ContractQuantitySelector } from "./ContractQuantitySelector";
import { TariffGrid } from "./TariffGrid";

const PORTFOLIO_TABS = [
  { id: "business" as const, label: "Business Prime", icon: Briefcase, families: ["prime", "teamdeal"] as TariffFamily[] },
  { id: "smart" as const, label: "Business Smart", icon: Smartphone, families: ["business_smart", "smart_business"] as TariffFamily[] },
  { id: "consumer" as const, label: "GigaMobil", icon: Wifi, families: ["gigamobil", "consumer_smart"] as TariffFamily[] },
];

type PortfolioTab = typeof PORTFOLIO_TABS[number]["id"];
type ConfigPhase = "select" | "configure";

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
  const currentPortfolio = fullOption?.meta.portfolio || "business";
  const currentLeadTime = fullOption?.meta.leadTimeMonths || 0;

  const getTabFromPortfolio = (p: string): PortfolioTab => {
    if (p === "business") return "business";
    if (p === "consumer") return "consumer";
    return "business";
  };
  const [activeTab, setActiveTab] = useState<PortfolioTab>(getTabFromPortfolio(currentPortfolio));
  const [configPhase, setConfigPhase] = useState<ConfigPhase>("select");

  const updateField = <K extends keyof MobileState>(field: K, fieldValue: MobileState[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const mobileTariffs = listMobileTariffs(datasetVersion);
  const promos = listPromos(datasetVersion);
  const selectedTariff = getMobileTariffFromCatalog(datasetVersion, value.tariffId);
  const isTeamDeal = selectedTariff?.family === "teamdeal";
  const showTeamDealWarning = isTeamDeal && !value.primeOnAccount;

  const { settings: employeeSettings } = useEmployeeSettings();
  const { density } = useDensity();
  const isCompact = density === "compact";

  const activeTabConfig = PORTFOLIO_TABS.find(t => t.id === activeTab) || PORTFOLIO_TABS[0];

  const filteredTariffs = useMemo(() => {
    if (!mobileTariffs || mobileTariffs.length === 0) return [];
    let tariffs = mobileTariffs.filter(t => activeTabConfig.families.includes(t.family as TariffFamily));
    if (employeeSettings?.blockedTariffs && employeeSettings.blockedTariffs.length > 0) {
      tariffs = tariffs.filter(t => !isTariffBlocked(t.id, employeeSettings));
    }
    return tariffs;
  }, [mobileTariffs, activeTabConfig, employeeSettings]);

  const blockedCount = useMemo(() => {
    if (!employeeSettings?.blockedTariffs || employeeSettings.blockedTariffs.length === 0) return 0;
    if (!mobileTariffs || mobileTariffs.length === 0) return 0;
    const allTariffs = mobileTariffs.filter(t => activeTabConfig.families.includes(t.family as TariffFamily));
    return allTariffs.filter(t => isTariffBlocked(t.id, employeeSettings)).length;
  }, [mobileTariffs, activeTabConfig, employeeSettings]);

  const handleTabChange = (tab: PortfolioTab) => {
    setActiveTab(tab);
    setConfigPhase("select");
    const portfolio = tab === "consumer" ? "consumer_gigamobil" as const : "business" as const;
    const newLeadTime = tab !== "consumer" ? currentLeadTime : 0;
    onMetaUpdate?.({ portfolio, leadTimeMonths: newLeadTime });
  };

  const handleTariffSelect = (tariffId: string) => {
    updateField("tariffId", tariffId);
    setConfigPhase("configure");
  };

  const handleBackToSelect = () => {
    setConfigPhase("select");
  };

  const handleAddedToOffer = () => {
    setConfigPhase("select");
    onConfigComplete?.();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Tarifkonfiguration</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Sprach- und Datentarife konfigurieren.</p>
      </div>

      {/* Portfolio Tabs */}
      <div className="flex border-b border-border">
        {PORTFOLIO_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Lead Time (Business Only) */}
      {activeTab !== "consumer" && (
        <LeadTimeInput
          value={currentLeadTime}
          onChange={(v) => onMetaUpdate?.({ leadTimeMonths: v })}
        />
      )}

      {/* Config Box */}
      <ContractQuantitySelector
        contractType={value.contractType}
        quantity={value.quantity}
        maxQuantity={isTeamDeal ? 10 : 100}
        promos={promos}
        selectedPromoId={value.promoId}
        onContractTypeChange={(type) => updateField("contractType", type)}
        onQuantityChange={(qty) => updateField("quantity", qty)}
        onPromoChange={(promoId) => updateField("promoId", promoId)}
      />

      {/* PHASE A: Tarif-Auswahl */}
      {configPhase === "select" && (
        <>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{filteredTariffs.length} Tarif{filteredTariffs.length !== 1 ? "e" : ""}</span>
            {blockedCount > 0 && (
              <Badge variant="secondary" className="gap-1 text-[10px] py-0">
                <Ban className="w-2.5 h-2.5" />
                {blockedCount} gesperrt
              </Badge>
            )}
          </div>

          <TariffGrid
            tariffs={filteredTariffs}
            selectedTariffId={value.tariffId}
            isCompact={isCompact}
            onSelect={handleTariffSelect}
          />
        </>
      )}

      {/* PHASE B: Tarif-Konfiguration (ersetzt Grid) */}
      {configPhase === "configure" && selectedTariff && fullOption && result && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            onClick={handleBackToSelect}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Zurück zur Tarifauswahl
          </button>

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
              if (!isTeamDeal && rate > 0 && value.promoId !== "NONE") {
                onChange({ ...value, omoRate: rate, promoId: "NONE" });
              } else {
                updateField("omoRate", rate);
              }
            }}
            onFHPartnerChange={(checked) => updateField("isFHPartner", checked)}
            onAddedToOffer={handleAddedToOffer}
          />
        </div>
      )}

      {/* TeamDeal Warning */}
      {isTeamDeal && (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-[hsl(var(--status-warning)/0.1)] rounded-lg border border-[hsl(var(--status-warning)/0.3)]">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="primeOnAccount"
                checked={value.primeOnAccount ?? false}
                onCheckedChange={(checked) => updateField("primeOnAccount", !!checked)}
              />
              <Label htmlFor="primeOnAccount" className="text-sm font-normal cursor-pointer">
                Business Prime aktiv auf gleichem Kundenkonto
              </Label>
            </div>
            <HelpTooltip content="TeamDeal" />
          </div>
          {showTeamDealWarning && (
            <Alert variant="destructive" className="border-[hsl(var(--status-warning)/0.5)] bg-[hsl(var(--status-warning)/0.1)]">
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-warning))]" />
              <AlertDescription className="text-[hsl(var(--status-warning))] text-sm">
                <p className="font-medium">TeamDeal ohne Prime aktiv</p>
                <p className="text-xs mt-1">
                  Statt TeamDeal wird <strong>Smart Business Plus (13€/mtl., 1 GB)</strong> aktiviert.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
