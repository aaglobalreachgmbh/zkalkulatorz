import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { HardwareState } from "../../engine/types";
import { Smartphone } from "lucide-react";

interface HardwareStepProps {
  value: HardwareState;
  onChange: (value: HardwareState) => void;
}

export function HardwareStep({ value, onChange }: HardwareStepProps) {
  const updateField = <K extends keyof HardwareState>(
    field: K,
    fieldValue: HardwareState[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Hardware</CardTitle>
            <CardDescription>
              Gerät und Einkaufspreis für die Kalkulation
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="hardware-name">Gerätename</Label>
          <Input
            id="hardware-name"
            placeholder="z.B. iPhone 15 Pro, Samsung S24"
            value={value.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hardware-ek">Einkaufspreis (netto)</Label>
          <div className="relative">
            <Input
              id="hardware-ek"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={value.ekNet || ""}
              onChange={(e) => updateField("ekNet", parseFloat(e.target.value) || 0)}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              €
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Der Hardware-EK wird vom Dealer-Margin abgezogen
          </p>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hardware-amortize">Amortisierung aktivieren</Label>
              <p className="text-xs text-muted-foreground">
                Hardware-Kosten auf Monatsraten verteilen
              </p>
            </div>
            <Switch
              id="hardware-amortize"
              checked={value.amortize}
              onCheckedChange={(checked) => updateField("amortize", checked)}
            />
          </div>

          {value.amortize && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="hardware-months">Amortisierungsdauer (Monate)</Label>
              <Input
                id="hardware-months"
                type="number"
                min={1}
                max={48}
                value={value.amortMonths}
                onChange={(e) =>
                  updateField("amortMonths", Math.max(1, parseInt(e.target.value) || 24))
                }
              />
              {value.ekNet > 0 && (
                <p className="text-sm text-muted-foreground">
                  = {(value.ekNet / value.amortMonths).toFixed(2)} € / Monat netto
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
