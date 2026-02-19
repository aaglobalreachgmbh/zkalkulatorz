// ============================================
// MobileStep - Ultra-Kompakt "Rapid Config" Pattern
// Enterprise CPQ-inspired: inline header, horizontal rows, two-phase
// ============================================

import { useState, useMemo, useEffect, useCallback } from "react";
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
  type SubVariantId,
  listMobileTariffs,
  listPromos,
  getMobileTariffFromCatalog,
  listSubVariants,
} from "@/margenkalkulator";
import { Briefcase, Smartphone, Wifi, AlertTriangle, Ban, ArrowLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InlineTariffConfig } from "../../components/InlineTariffConfig";
import { useEmployeeSettings, isTariffBlocked } from "../../../hooks/useEmployeeSettings";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { OfferOptionMeta } from "@/margenkalkulator";
import { cn } from "@/lib/utils";
import { TariffGrid } from "./TariffGrid";
import { toast } from "sonner";

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
  const allSubVariants = useMemo(() => listSubVariants(datasetVersion), [datasetVersion]);
  const selectedTariff = getMobileTariffFromCatalog(datasetVersion, value.tariffId);
  const isTeamDeal = selectedTariff?.family === "teamdeal";
  const showTeamDealWarning = isTeamDeal && !value.primeOnAccount;

  const { settings: employeeSettings } = useEmployeeSettings();

  const activeTabConfig = PORTFOLIO_TABS.find(t => t.id === activeTab) || PORTFOLIO_TABS[0];

  // Tab-abhängige erlaubte SUB-Stufen
  const tabAllowedSubVariants = useMemo((): SubVariantId[] => {
    if (activeTab === "consumer") return [];
    if (activeTab === "smart") return ["SIM_ONLY", "BASIC_PHONE", "SMARTPHONE"];
    return ["SIM_ONLY", "BASIC_PHONE", "SMARTPHONE", "PREMIUM_SMARTPHONE", "SPECIAL_PREMIUM_SMARTPHONE"];
  }, [activeTab]);

  // SUB-Varianten die im Header angezeigt werden (nur bei business/smart)
  const headerSubVariants = useMemo(() => {
    return allSubVariants.filter(sv => tabAllowedSubVariants.includes(sv.id as SubVariantId));
  }, [allSubVariants, tabAllowedSubVariants]);

  // Kurze Labels für den Header
  const subLabelMap: Record<string, string> = {
    SIM_ONLY: "SIM",
    BASIC_PHONE: "Basic",
    SMARTPHONE: "Smart",
    PREMIUM_SMARTPHONE: "Premium",
    SPECIAL_PREMIUM_SMARTPHONE: "Spec.",
  };

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

  // Keyboard shortcuts: 1-9 selects tariff by index
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (configPhase !== "select") return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9 && num <= filteredTariffs.length) {
      handleTariffSelect(filteredTariffs[num - 1].id);
    }
  }, [configPhase, filteredTariffs]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleTabChange = (tab: PortfolioTab) => {
    setActiveTab(tab);
    setConfigPhase("select");
    const portfolio = tab === "consumer" ? "consumer_gigamobil" as const : "business" as const;
    const newLeadTime = tab !== "consumer" ? currentLeadTime : 0;
    onMetaUpdate?.({ portfolio, leadTimeMonths: newLeadTime });

    // SUB-Reset beim Tab-Wechsel: Smart erlaubt kein Premium
    if (tab === "smart" && ["PREMIUM_SMARTPHONE", "SPECIAL_PREMIUM_SMARTPHONE"].includes(value.subVariantId)) {
      onChange({ ...value, subVariantId: "SMARTPHONE" });
    }
  };

  const handleTariffSelect = (tariffId: string) => {
    const tariff = getMobileTariffFromCatalog(datasetVersion, tariffId);
    const allowed = tariff?.allowedSubVariants;
    if (allowed && allowed.length > 0 && !allowed.includes(value.subVariantId as SubVariantId)) {
      // Fallback auf höchste erlaubte Stufe
      const bestAllowed = allowed[allowed.length - 1];
      onChange({ ...value, tariffId, subVariantId: bestAllowed });
      const subLabel = allSubVariants.find(s => s.id === bestAllowed)?.label ?? bestAllowed;
      toast.info(`Geräteklasse auf "${subLabel}" angepasst`, { duration: 2500 });
    } else {
      updateField("tariffId", tariffId);
    }
    setConfigPhase("configure");
  };

  const handleBackToSelect = () => setConfigPhase("select");

  const handleAddedToOffer = () => {
    setConfigPhase("select");
    onConfigComplete?.();
  };

  // Increment/decrement for SIM quantity
  const adjustQty = (delta: number) => {
    const max = isTeamDeal ? 10 : 100;
    const newQty = Math.max(1, Math.min(max, value.quantity + delta));
    updateField("quantity", newQty);
  };

  return (
    <div className="space-y-3">
      {/* ─── HEADER BAR ─── */}
      <div className="flex flex-col gap-2">
        {/* Row 1: Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Tarifkonfiguration</h2>
          {activeTab !== "consumer" && currentLeadTime > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              <Clock className="w-2.5 h-2.5" />
              {currentLeadTime} Mon. Vorlauf
            </span>
          )}
        </div>

        {/* Row 2: Portfolio Tabs + Controls on same line */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Portfolio Tabs */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            {PORTFOLIO_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Lead Time quick-toggle (business only) */}
          {activeTab !== "consumer" && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Vorlauf</span>
              <select
                value={currentLeadTime}
                onChange={(e) => onMetaUpdate?.({ leadTimeMonths: Number(e.target.value) })}
                className="h-7 px-1 text-xs border border-border rounded bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                {[0, 1, 2, 3, 6, 12].map(m => (
                  <option key={m} value={m}>{m === 0 ? "Kein" : `${m} Mon.`}</option>
                ))}
              </select>
            </div>
          )}

          {/* SIM Stepper */}
          <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => adjustQty(-1)}
              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors text-sm font-bold"
            >−</button>
            <input
              type="number"
              min={1}
              max={isTeamDeal ? 10 : 100}
              value={value.quantity}
              onChange={(e) => {
                const max = isTeamDeal ? 10 : 100;
                updateField("quantity", Math.max(1, Math.min(max, Number(e.target.value) || 1)));
              }}
              className="w-10 h-7 text-center text-xs font-bold bg-card text-foreground border-x border-border focus:outline-none"
            />
            <button
              onClick={() => adjustQty(1)}
              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors text-sm font-bold"
            >+</button>
          </div>
          <span className="text-[10px] text-muted-foreground">SIM</span>

          {/* NV | VVL Segmented Control */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            {(["new", "renewal"] as ContractType[]).map((type) => (
              <button
                key={type}
                onClick={() => updateField("contractType", type)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold transition-colors",
                  value.contractType === type
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {type === "new" ? "Neuvertrag" : "VVL"}
              </button>
            ))}
          </div>

          {/* ─── SUB-Stufe Selector (nur für business/smart) ─── */}
          {activeTab !== "consumer" && headerSubVariants.length > 0 && (
            <div className="flex border border-border rounded-lg overflow-hidden">
              {headerSubVariants.map((sv) => (
                <button
                  key={sv.id}
                  onClick={() => {
                    updateField("subVariantId", sv.id);
                  }}
                  title={sv.label}
                  className={cn(
                    "px-2.5 py-1.5 text-xs font-semibold transition-colors",
                    value.subVariantId === sv.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {subLabelMap[sv.id] ?? sv.id}
                </button>
              ))}
            </div>
          )}

          {/* Promo (only in select phase to keep it visible) */}
          <select
            value={value.promoId || "NONE"}
            onChange={(e) => updateField("promoId", e.target.value)}
            className="h-7 px-2 text-xs border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            <option value="NONE">Keine Aktion</option>
            {promos.filter(p => p.id !== "NONE").map((promo) => (
              <option key={promo.id} value={promo.id}>{promo.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── TARIFF COUNT / BLOCKED BADGE ─── */}
      {configPhase === "select" && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{filteredTariffs.length} Tarif{filteredTariffs.length !== 1 ? "e" : ""}</span>
          {blockedCount > 0 && (
            <Badge variant="secondary" className="gap-1 text-[10px] py-0">
              <Ban className="w-2.5 h-2.5" />
              {blockedCount} gesperrt
            </Badge>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground/60">Tipp: Zifferntasten 1-{Math.min(9, filteredTariffs.length)} zum Schnellwählen</span>
        </div>
      )}

      {/* ─── PHASE A: Tariff Selection List ─── */}
      {configPhase === "select" && (
        <TariffGrid
          tariffs={filteredTariffs}
          selectedTariffId={value.tariffId}
          onSelect={handleTariffSelect}
        />
      )}

      {/* ─── PHASE B: Inline Configuration (replaces grid) ─── */}
      {configPhase === "configure" && selectedTariff && fullOption && result && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Back button */}
          <button
            onClick={handleBackToSelect}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
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

      {/* ─── TeamDeal Warning (always visible if relevant) ─── */}
      {isTeamDeal && (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-[hsl(var(--status-warning)/0.1)] rounded-lg border border-[hsl(var(--status-warning)/0.3)]">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="primeOnAccount"
                checked={value.primeOnAccount ?? false}
                onCheckedChange={(checked) => updateField("primeOnAccount", !!checked)}
              />
              <Label htmlFor="primeOnAccount" className="text-xs font-normal cursor-pointer">
                Business Prime aktiv auf gleichem Kundenkonto
              </Label>
            </div>
            <HelpTooltip content="TeamDeal" />
          </div>
          {showTeamDealWarning && (
            <Alert variant="destructive" className="border-[hsl(var(--status-warning)/0.5)] bg-[hsl(var(--status-warning)/0.1)] py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--status-warning))]" />
              <AlertDescription className="text-[hsl(var(--status-warning))] text-xs">
                <p className="font-medium">TeamDeal ohne Prime aktiv</p>
                <p className="text-[10px] mt-0.5">Statt TeamDeal wird <strong>Smart Business Plus (13€/mtl., 1 GB)</strong> aktiviert.</p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
