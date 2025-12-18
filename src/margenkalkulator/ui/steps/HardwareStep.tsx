import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HardwareState, DatasetVersion } from "../../engine/types";
import { listHardwareItems } from "../../engine/catalogResolver";
import { Smartphone, Tablet, Package } from "lucide-react";
import { useMemo } from "react";

interface HardwareStepProps {
  value: HardwareState;
  onChange: (value: HardwareState) => void;
  datasetVersion?: DatasetVersion;
}

export function HardwareStep({ value, onChange, datasetVersion = "business-2025-09" }: HardwareStepProps) {
  const hardwareItems = useMemo(() => listHardwareItems(datasetVersion), [datasetVersion]);
  
  // Group hardware by brand
  const groupedHardware = useMemo(() => {
    const groups: Record<string, typeof hardwareItems> = {};
    hardwareItems.forEach(item => {
      if (!groups[item.brand]) groups[item.brand] = [];
      groups[item.brand].push(item);
    });
    return groups;
  }, [hardwareItems]);

  // Find selected hardware item
  const selectedHardwareId = useMemo(() => {
    // Try to find by exact name match
    const found = hardwareItems.find(h => 
      h.category !== "custom" && 
      h.category !== "none" &&
      `${h.brand} ${h.model}` === value.name
    );
    if (found) return found.id;
    
    // Check for "no hardware"
    if (!value.name || value.name === "KEINE HARDWARE") return "no_hardware";
    
    // Check for custom
    if (value.name && value.ekNet > 0) return "custom_device";
    
    return "";
  }, [value.name, value.ekNet, hardwareItems]);

  const handleHardwareSelect = (hardwareId: string) => {
    const item = hardwareItems.find(h => h.id === hardwareId);
    if (!item) return;
    
    if (item.id === "no_hardware") {
      onChange({
        ...value,
        name: "KEINE HARDWARE",
        ekNet: 0,
      });
    } else if (item.id === "custom_device") {
      onChange({
        ...value,
        name: "",
        ekNet: 0,
      });
    } else {
      onChange({
        ...value,
        name: `${item.brand} ${item.model}`,
        ekNet: item.ekNet,
      });
    }
  };

  const updateField = <K extends keyof HardwareState>(
    field: K,
    fieldValue: HardwareState[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const isCustomMode = selectedHardwareId === "custom_device" || 
    (value.name && !hardwareItems.find(h => `${h.brand} ${h.model}` === value.name) && value.name !== "KEINE HARDWARE");

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "tablet": return <Tablet className="w-4 h-4" />;
      case "smartphone": return <Smartphone className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
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
              Gerät aus Katalog wählen oder manuell eingeben
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hardware Selector */}
        <div className="space-y-2">
          <Label htmlFor="hardware-select">Gerät auswählen</Label>
          <Select value={selectedHardwareId} onValueChange={handleHardwareSelect}>
            <SelectTrigger id="hardware-select" className="w-full">
              <SelectValue placeholder="Gerät wählen..." />
            </SelectTrigger>
            <SelectContent className="max-h-80 bg-background">
              {Object.entries(groupedHardware).map(([brand, items]) => (
                <SelectGroup key={brand}>
                  <SelectLabel className="font-semibold text-muted-foreground">{brand}</SelectLabel>
                  {items.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(item.category)}
                        <span>{item.model}</span>
                        {item.category !== "none" && item.category !== "custom" && (
                          <span className="text-muted-foreground ml-auto">
                            {item.ekNet.toFixed(0)} €
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {hardwareItems.length - 2} Geräte im Katalog • EK-Preise sind Platzhalter
          </p>
        </div>

        {/* Custom Device Input (shown when "Sonstiges" selected or existing custom value) */}
        {isCustomMode && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <p className="text-sm font-medium text-muted-foreground">Manuelle Eingabe</p>
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
              <Label htmlFor="hardware-ek-custom">Einkaufspreis (netto)</Label>
              <div className="relative">
                <Input
                  id="hardware-ek-custom"
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
            </div>
          </div>
        )}

        {/* Display selected hardware EK (when not custom) */}
        {!isCustomMode && selectedHardwareId && selectedHardwareId !== "no_hardware" && (
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Einkaufspreis (netto)</span>
              <span className="font-semibold">{value.ekNet.toFixed(2)} €</span>
            </div>
          </div>
        )}

        {/* Amortization Section */}
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
