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
  listMobileTariffs,
  listPromos,
  listSubVariants,
  getMobileTariffFromCatalog,
  checkGKEligibility,
} from "@/margenkalkulator";
import { Signal, Tag, AlertTriangle, Minus, Plus } from "lucide-react";
import { OMORateSelectorEnhanced, type OMORate } from "../components/OMORateSelectorEnhanced";
import { SubVariantSelector } from "../components/SubVariantSelector";
import { FHPartnerToggle } from "../components/FHPartnerToggle";

interface MobileStepProps {
  value: MobileState;
  onChange: (value: MobileState) => void;
  datasetVersion: DatasetVersion;
  fixedNetEnabled?: boolean;
  hardwareName?: string;
}

const FAMILY_LABELS: Record<TariffFamily, string> = {
  prime: "BUSINESS PRIME",
  business_smart: "BUSINESS SMART",
  smart_business: "SMART BUSINESS",
  teamdeal: "TEAMDEAL",
};

const FAMILY_COLORS: Record<TariffFamily, string> = {
  prime: "text-primary",
  business_smart: "text-primary",
  smart_business: "text-blue-600",
  teamdeal: "text-orange-600",
};

export function MobileStep({ 
  value, 
  onChange, 
  datasetVersion, 
  fixedNetEnabled = false,
  hardwareName = "",
}: MobileStepProps) {
  const [selectedFamily, setSelectedFamily] = useState<TariffFamily | "all">("all");

  const updateField = <K extends keyof MobileState>(
    field: K,
    fieldValue: MobileState[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const mobileTariffs = listMobileTariffs(datasetVersion);
  const promos = listPromos(datasetVersion);
  const subVariants = listSubVariants(datasetVersion);
  
  const selectedTariff = getMobileTariffFromCatalog(datasetVersion, value.tariffId);
  const isGKEligible = checkGKEligibility(selectedTariff, fixedNetEnabled);

  const isTeamDeal = selectedTariff?.family === "teamdeal";
  const showTeamDealWarning = isTeamDeal && !value.primeOnAccount;

  // Extract unique families from tariffs
  const families = useMemo(() => {
    const uniqueFamilies = new Set(mobileTariffs.map(t => t.family).filter(Boolean));
    return Array.from(uniqueFamilies) as TariffFamily[];
  }, [mobileTariffs]);

  // Filter tariffs by selected family
  const filteredTariffs = useMemo(() => {
    if (selectedFamily === "all") return mobileTariffs;
    return mobileTariffs.filter(t => t.family === selectedFamily);
  }, [mobileTariffs, selectedFamily]);

  // Format data volume display
  const formatDataVolume = (volume: number | "unlimited" | undefined) => {
    if (volume === "unlimited") return "∞ GB";
    if (volume === undefined) return "";
    if (volume < 1) return `${volume * 1000} MB`;
    return `${volume} GB`;
  };

  return (
    <div className="space-y-8">
      {/* Contract Type & Quantity Row */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          {/* Contract Type Toggle */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Vertragsart</Label>
            <div className="flex">
              <button
                onClick={() => updateField("contractType", "new")}
                className={`px-6 py-2.5 text-sm font-medium rounded-l-lg transition-colors ${
                  value.contractType === "new"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Neuvertrag
              </button>
              <button
                onClick={() => updateField("contractType", "renewal")}
                className={`px-6 py-2.5 text-sm font-medium rounded-r-lg transition-colors ${
                  value.contractType === "renewal"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Verlängerung (VVL)
              </button>
            </div>
          </div>

          {/* Quantity Counter */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Anzahl Karten</Label>
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
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedFamily === "all"
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
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedFamily === family
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {FAMILY_LABELS[family]}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          {filteredTariffs.length} Tarif{filteredTariffs.length !== 1 ? "e" : ""} verfügbar
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTariffs.map((tariff) => {
            const isSelected = value.tariffId === tariff.id;
            const familyLabel = FAMILY_LABELS[tariff.family || "prime"];
            const familyColor = FAMILY_COLORS[tariff.family || "prime"];
            const isUnlimited = tariff.dataVolumeGB === "unlimited";
            
            return (
              <button
                key={tariff.id}
                onClick={() => updateField("tariffId", tariff.id)}
                className={`
                  relative p-5 rounded-xl border-2 bg-card text-left transition-all
                  hover:shadow-md hover:border-primary/50
                  ${isSelected 
                    ? "border-primary ring-2 ring-primary/20" 
                    : "border-border"
                  }
                `}
              >
                {/* Family Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold tracking-wide ${familyColor}`}>
                    {familyLabel}
                  </span>
                  {isUnlimited && (
                    <Badge variant="secondary" className="text-xs">
                      Unlimited
                    </Badge>
                  )}
                </div>

                {/* Tariff Name */}
                <h4 className="text-lg font-semibold text-foreground mb-4">
                  {tariff.name}
                </h4>

                {/* Price & Data */}
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-bold text-foreground">
                      {tariff.baseNet.toFixed(0)}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">€ /mtl.</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-foreground">
                      {formatDataVolume(tariff.dataVolumeGB)}
                    </span>
                    <p className="text-xs text-muted-foreground">Datenvolumen</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTariffs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Signal className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Keine Tarife gefunden</p>
          </div>
        )}
      </div>

      {/* TeamDeal Prime Requirement */}
      {isTeamDeal && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <Checkbox
              id="primeOnAccount"
              checked={value.primeOnAccount ?? false}
              onCheckedChange={(checked) => updateField("primeOnAccount", !!checked)}
            />
            <Label htmlFor="primeOnAccount" className="font-normal cursor-pointer">
              Business Prime aktiv auf gleichem Kundenkonto
            </Label>
          </div>
          {showTeamDealWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Ohne aktiven Business Prime Vertrag fällt TeamDeal auf Smart Business Plus (1 GB / 13€) zurück.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* SUB Variant Selection + OMO + FH-Partner Row */}
      {selectedTariff && !isTeamDeal && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-card rounded-xl border border-border">
          {/* SUB Variant Selector */}
          <SubVariantSelector
            value={value.subVariantId}
            onChange={(id) => updateField("subVariantId", id)}
            hardwareName={hardwareName}
            allowedSubVariants={selectedTariff.allowedSubVariants}
            subVariants={subVariants}
          />

          {/* OMO Rate Selector */}
          <OMORateSelectorEnhanced
            value={(value.omoRate ?? 0) as OMORate}
            onChange={(rate) => updateField("omoRate", rate)}
            tariff={selectedTariff}
            contractType={value.contractType}
          />

          {/* FH Partner Toggle */}
          <div className="flex items-end">
            <FHPartnerToggle
              checked={value.isFHPartner ?? false}
              onChange={(checked) => updateField("isFHPartner", checked)}
              fhPartnerProvision={selectedTariff.fhPartnerNet}
            />
          </div>
        </div>
      )}

      {/* Promos Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Aktionen & Promos</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {promos.map((promo) => {
            const isSelected = value.promoId === promo.id;
            
            return (
              <button
                key={promo.id}
                onClick={() => updateField("promoId", promo.id)}
                className={`
                  p-4 rounded-lg border text-left transition-all
                  ${isSelected 
                    ? "border-primary bg-primary/5" 
                    : "border-border bg-card hover:border-primary/50"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "border-primary" : "border-muted-foreground"
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{promo.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {promo.id === "STANDARD" && "Standardpreise"}
                      {promo.id === "INTRO_6M" && "Basispreisbefreiung für 6 Monate"}
                      {promo.id === "OMO25" && "25% Dauerrabatt auf Basispreis"}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
