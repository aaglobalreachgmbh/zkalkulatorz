import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MobileState, ContractType, DatasetVersion, TariffFamily, MobileTariff, SubVariantId } from "../../engine/types";
import { 
  listMobileTariffs, 
  listSubVariants, 
  listPromos, 
  getMobileTariffFromCatalog,
  checkGKEligibility,
} from "../../engine/catalogResolver";
import { Signal, Zap, Sparkles, AlertTriangle } from "lucide-react";

interface MobileStepProps {
  value: MobileState;
  onChange: (value: MobileState) => void;
  datasetVersion: DatasetVersion;
  fixedNetEnabled?: boolean;
}

const TARIFF_FAMILIES: { id: TariffFamily; label: string }[] = [
  { id: "prime", label: "Business Prime" },
  { id: "business_smart", label: "Business Smart" },
  { id: "smart_business", label: "Smart Business" },
  { id: "teamdeal", label: "TeamDeal" },
];

function getTariffFamily(tariff: MobileTariff | undefined): TariffFamily {
  return tariff?.family ?? "prime";
}

export function MobileStep({ value, onChange, datasetVersion, fixedNetEnabled = false }: MobileStepProps) {
  const updateField = <K extends keyof MobileState>(
    field: K,
    fieldValue: MobileState[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const mobileTariffs = listMobileTariffs(datasetVersion);
  const subVariants = listSubVariants(datasetVersion);
  const promos = listPromos(datasetVersion);
  
  const selectedTariff = getMobileTariffFromCatalog(datasetVersion, value.tariffId);
  const isGKEligible = checkGKEligibility(selectedTariff, fixedNetEnabled);
  
  // Determine current family from selected tariff
  const currentFamily = getTariffFamily(selectedTariff);
  const [selectedFamily, setSelectedFamily] = useState<TariffFamily>(currentFamily);
  
  // Filter tariffs by family
  const tariffsInFamily = mobileTariffs.filter(t => t.family === selectedFamily);
  
  // Filter SUB variants based on tariff's allowedSubVariants
  const allowedSubs = selectedTariff?.allowedSubVariants ?? ["SIM_ONLY"];
  const filteredSubVariants = subVariants.filter(sv => 
    allowedSubs.includes(sv.id as SubVariantId)
  );
  
  // When family changes, select first tariff in that family
  const handleFamilyChange = (family: TariffFamily) => {
    setSelectedFamily(family);
    const firstTariff = mobileTariffs.find(t => t.family === family);
    if (firstTariff) {
      onChange({
        ...value,
        tariffId: firstTariff.id,
        // Reset primeOnAccount when switching away from TeamDeal
        primeOnAccount: family === "teamdeal" ? false : undefined,
        // TeamDeal is SIM-only
        subVariantId: family === "teamdeal" ? "SIM_ONLY" : value.subVariantId,
      });
    }
  };
  
  // Sync family selector with tariff selection
  useEffect(() => {
    if (selectedTariff && selectedTariff.family !== selectedFamily) {
      setSelectedFamily(selectedTariff.family ?? "prime");
    }
  }, [selectedTariff, selectedFamily]);
  
  // Reset SUB to SIM_ONLY if current selection is not allowed
  useEffect(() => {
    if (selectedTariff && !allowedSubs.includes(value.subVariantId as SubVariantId)) {
      updateField("subVariantId", "SIM_ONLY");
    }
  }, [selectedTariff?.id]);

  const isTeamDeal = selectedFamily === "teamdeal";
  const showTeamDealWarning = isTeamDeal && !value.primeOnAccount;

  // Format data volume display
  const formatDataVolume = (volume: number | "unlimited" | undefined) => {
    if (volume === "unlimited") return "Unlimited";
    if (volume === undefined) return "";
    if (volume < 1) return `${volume * 1000} MB`;
    return `${volume} GB`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Signal className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>Mobilfunk-Tarif</CardTitle>
              {isGKEligible && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                  <Sparkles className="w-3 h-3 mr-1" />
                  GK Unlimited möglich
                </Badge>
              )}
            </div>
            <CardDescription>
              Tarif-Familie, Tarif und Optionen auswählen
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Family Selection */}
        <div className="space-y-2">
          <Label>Tarif-Familie</Label>
          <div className="flex flex-wrap gap-2">
            {TARIFF_FAMILIES.map((family) => (
              <button
                key={family.id}
                onClick={() => handleFamilyChange(family.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFamily === family.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
              >
                {family.label}
              </button>
            ))}
          </div>
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

        {/* Tariff Selection */}
        <div className="space-y-2">
          <Label>Tarif</Label>
          <Select
            value={value.tariffId}
            onValueChange={(v) => updateField("tariffId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tarif wählen" />
            </SelectTrigger>
            <SelectContent>
              {tariffsInFamily.map((tariff) => (
                <SelectItem key={tariff.id} value={tariff.id}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-2">
                      <span>{tariff.name}</span>
                      {tariff.tier && (
                        <Badge variant="outline" className="text-xs">
                          {tariff.tier}
                        </Badge>
                      )}
                      {tariff.dataVolumeGB && (
                        <span className="text-xs text-muted-foreground">
                          {formatDataVolume(tariff.dataVolumeGB)}
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {tariff.baseNet.toFixed(2)} €
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Leistungen-Box (structured features panel) */}
        {selectedTariff && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <h4 className="font-semibold text-sm">Leistungen</h4>
            
            {/* Daten DE */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Daten DE:</span>
              <span className="font-medium">{formatDataVolume(selectedTariff.dataVolumeGB)}</span>
            </div>
            
            {/* EU-Roaming */}
            {selectedTariff.euRoamingHighspeedGB && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">EU Highspeed:</span>
                <span>{selectedTariff.euRoamingHighspeedGB} GB</span>
              </div>
            )}
            {selectedTariff.euRoamingNote && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">EU Daten:</span>
                <span>{selectedTariff.euRoamingNote}</span>
              </div>
            )}
            
            {/* OneNumber */}
            {selectedTariff.oneNumberIncludedCount && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">OneNumber inkl.:</span>
                <span>{selectedTariff.oneNumberIncludedCount}× kostenlos</span>
              </div>
            )}
            
            {/* GigaDepot */}
            {selectedTariff.gigaDepot && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GigaDepot:</span>
                <span>
                  {selectedTariff.gigaDepot.status === "included" 
                    ? "inklusive" 
                    : `optional (+${selectedTariff.gigaDepot.priceNet}€/mtl.)`}
                </span>
              </div>
            )}
            
            {/* Roaming Zone 1 */}
            {selectedTariff.roamingPacketZone1GB && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ReisePaket Zone 1:</span>
                <span>{selectedTariff.roamingPacketZone1GB} GB (48h/Monat)</span>
              </div>
            )}
            
            {/* Additional features as badges */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
              {selectedTariff.features.slice(0, 4).map((feature, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-background px-2 py-0.5 rounded-full"
                >
                  {feature}
                </span>
              ))}
            </div>
            
            {/* Show effective price for TeamDeal fallback */}
            {isTeamDeal && showTeamDealWarning && (
              <p className="text-xs text-amber-600 pt-2">
                Effektiver Preis: 13,00 € (Fallback auf Smart Business Plus)
              </p>
            )}
          </div>
        )}

        {/* SUB Variant - filtered based on allowedSubVariants */}
        {filteredSubVariants.length > 1 && (
          <div className="space-y-2">
            <Label>Geräteklasse (SUB)</Label>
            <Select
              value={value.subVariantId}
              onValueChange={(v) => updateField("subVariantId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Variante wählen" />
              </SelectTrigger>
              <SelectContent>
                {filteredSubVariants.map((sv) => (
                  <SelectItem key={sv.id} value={sv.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{sv.label}</span>
                      {sv.monthlyAddNet > 0 && (
                        <span className="text-muted-foreground ml-2">
                          +{sv.monthlyAddNet.toFixed(2)} €/Mo
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              SUB = monatlicher Aufpreis je Geräteklasse (auch ohne Handy buchbar)
            </p>
          </div>
        )}
        
        {/* TeamDeal / Flex is SIM-only info */}
        {filteredSubVariants.length <= 1 && (
          <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
            {isTeamDeal 
              ? "TeamDeal ist nur als SIM-only verfügbar (keine Geräte-Optionen)"
              : "Dieser Tarif ist nur als SIM-only verfügbar"}
          </div>
        )}

        {/* Promo - only for non-TeamDeal */}
        {!isTeamDeal && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Aktion / Promotion
            </Label>
            <Select
              value={value.promoId}
              onValueChange={(v) => updateField("promoId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aktion wählen" />
              </SelectTrigger>
              <SelectContent>
                {promos.map((promo) => (
                  <SelectItem key={promo.id} value={promo.id}>
                    <div className="flex items-center gap-2">
                      <span>{promo.label}</span>
                      {promo.id === "OMO25" && (
                        <Badge variant="destructive" className="text-xs">
                          Provision-Abzug
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {value.promoId === "OMO25" && (
              <p className="text-xs text-amber-600">
                OMO25 führt zu einem Provisions-Abzug je nach Tarif
              </p>
            )}
          </div>
        )}

        {/* Contract Type */}
        <div className="space-y-3">
          <Label>Vertragsart</Label>
          <RadioGroup
            value={value.contractType}
            onValueChange={(v) => updateField("contractType", v as ContractType)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="contract-new" />
              <Label htmlFor="contract-new" className="font-normal cursor-pointer">
                Neuvertrag
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="renewal" id="contract-renewal" />
              <Label htmlFor="contract-renewal" className="font-normal cursor-pointer">
                Verlängerung
              </Label>
            </div>
          </RadioGroup>
          {value.contractType === "renewal" && selectedTariff?.provisionRenewal && (
            <p className="text-xs text-muted-foreground">
              Verlängerungsprovision: {selectedTariff.provisionRenewal} € (statt {selectedTariff.provisionBase} €)
            </p>
          )}
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <Label htmlFor="mobile-quantity">
            {isTeamDeal ? "Anzahl TeamDeal-Karten (max. 10 pro Prime)" : "Anzahl SIM-Karten"}
          </Label>
          <Input
            id="mobile-quantity"
            type="number"
            min={1}
            max={isTeamDeal ? 10 : 100}
            value={value.quantity}
            onChange={(e) =>
              updateField("quantity", Math.max(1, Math.min(isTeamDeal ? 10 : 100, parseInt(e.target.value) || 1)))
            }
            className="w-24"
          />
          {isTeamDeal && (
            <p className="text-xs text-muted-foreground">
              Bis zu 10 TeamDeal-Karten pro aktivem Business Prime möglich
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
