import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MobileState, ContractType } from "../../engine/types";
import { mobileTariffs, subVariants, promos, getMobileTariff } from "../../engine/catalog.dummy";
import { Signal, Zap } from "lucide-react";

interface MobileStepProps {
  value: MobileState;
  onChange: (value: MobileState) => void;
}

export function MobileStep({ value, onChange }: MobileStepProps) {
  const updateField = <K extends keyof MobileState>(
    field: K,
    fieldValue: MobileState[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const selectedTariff = getMobileTariff(value.tariffId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Signal className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Mobilfunk-Tarif</CardTitle>
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
                  <div className="flex items-center justify-between w-full">
                    <span>{tariff.name}</span>
                    <span className="text-muted-foreground ml-2">
                      {tariff.baseNet.toFixed(2)} €
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTariff && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedTariff.features.map((feature, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-muted px-2 py-0.5 rounded-full"
                >
                  {feature}
                </span>
              ))}
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
                  {promo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
