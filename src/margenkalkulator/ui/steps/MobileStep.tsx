import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MobileState, ContractType, DatasetVersion } from "../../engine/types";
import { 
  listMobileTariffs, 
  listSubVariants, 
  listPromos, 
  getMobileTariffFromCatalog,
  checkGKEligibility,
} from "../../engine/catalogResolver";
import { Signal, Zap, Sparkles } from "lucide-react";

interface MobileStepProps {
  value: MobileState;
  onChange: (value: MobileState) => void;
  datasetVersion: DatasetVersion;
  fixedNetEnabled?: boolean;
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
              Tarif, Hardware-Variante und Aktionen auswählen
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
              {mobileTariffs.map((tariff) => (
                <SelectItem key={tariff.id} value={tariff.id}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-2">
                      <span>{tariff.name}</span>
                      {tariff.tier && (
                        <Badge variant="outline" className="text-xs">
                          {tariff.tier}
                        </Badge>
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
          {selectedTariff && (
            <div className="space-y-2 mt-2">
              <div className="flex flex-wrap gap-1.5">
                {selectedTariff.features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-muted px-2 py-0.5 rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>
              {selectedTariff.oneNumberIncluded && (
                <Badge variant="secondary" className="text-xs">
                  OneNumber inklusive
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* SUB Variant */}
        <div className="space-y-2">
          <Label>Hardware-Variante (SUB)</Label>
          <Select
            value={value.subVariantId}
            onValueChange={(v) => updateField("subVariantId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Variante wählen" />
            </SelectTrigger>
            <SelectContent>
              {subVariants.map((sv) => (
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
            SUB-Aufpreis wird nie durch Aktionen rabattiert
          </p>
        </div>

        {/* Promo */}
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
          <Label htmlFor="mobile-quantity">Anzahl SIM-Karten</Label>
          <Input
            id="mobile-quantity"
            type="number"
            min={1}
            max={100}
            value={value.quantity}
            onChange={(e) =>
              updateField("quantity", Math.max(1, parseInt(e.target.value) || 1))
            }
            className="w-24"
          />
        </div>
      </CardContent>
    </Card>
  );
}
