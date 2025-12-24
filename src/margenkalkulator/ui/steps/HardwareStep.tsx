import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { HardwareState, DatasetVersion } from "../../engine/types";
import { listHardwareItems } from "../../engine/catalogResolver";
import { Smartphone, Upload, Check } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

interface HardwareStepProps {
  value: HardwareState;
  onChange: (value: HardwareState) => void;
  datasetVersion?: DatasetVersion;
}

// Placeholder images for hardware (using picsum for demo)
const HARDWARE_IMAGES: Record<string, string> = {
  no_hardware: "https://picsum.photos/seed/simonly/200/200",
  iphone_16_128: "https://picsum.photos/seed/iphone16/200/200",
  iphone_16_pro_128: "https://picsum.photos/seed/iphone16pro/200/200",
  samsung_s24_128: "https://picsum.photos/seed/samsungs24/200/200",
  pixel_9_128: "https://picsum.photos/seed/pixel9/200/200",
  default: "https://picsum.photos/seed/phone/200/200",
};

function getHardwareImage(id: string): string {
  return HARDWARE_IMAGES[id] || HARDWARE_IMAGES.default;
}

export function HardwareStep({ value, onChange, datasetVersion = "business-2025-09" }: HardwareStepProps) {
  const hardwareItems = useMemo(() => listHardwareItems(datasetVersion), [datasetVersion]);
  
  // Filter out custom entry for grid display
  const displayItems = useMemo(() => 
    hardwareItems.filter(item => item.category !== "custom").slice(0, 8), // Show first 8 items
    [hardwareItems]
  );

  // Find selected hardware item
  const selectedHardwareId = useMemo(() => {
    const found = hardwareItems.find(h => 
      h.category !== "custom" && 
      h.category !== "none" &&
      `${h.brand} ${h.model}` === value.name
    );
    if (found) return found.id;
    if (!value.name || value.name === "KEINE HARDWARE") return "no_hardware";
    return "";
  }, [value.name, hardwareItems]);

  const handleHardwareSelect = (hardwareId: string) => {
    const item = hardwareItems.find(h => h.id === hardwareId);
    if (!item) return;
    
    if (item.id === "no_hardware") {
      onChange({
        ...value,
        name: "KEINE HARDWARE",
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

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Hardware wählen</h2>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/hardware-manager">
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              Hardware-Manager (CSV)
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Monatlich amortisieren</span>
            <Switch
              checked={value.amortize}
              onCheckedChange={(checked) => updateField("amortize", checked)}
            />
          </div>
        </div>
      </div>

      {/* Hardware Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayItems.map((item) => {
          const isSelected = selectedHardwareId === item.id;
          const displayName = item.id === "no_hardware" 
            ? "SIM Only" 
            : item.model;
          const displayBrand = item.id === "no_hardware" 
            ? "Vodafone" 
            : item.brand;
          
          return (
            <button
              key={item.id}
              onClick={() => handleHardwareSelect(item.id)}
              className={`
                relative p-6 rounded-xl border-2 bg-card text-left transition-all
                hover:shadow-md hover:border-primary/50
                ${isSelected 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "border-border"
                }
              `}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              
              {/* Image */}
              <div className="flex justify-center mb-4">
                <img 
                  src={getHardwareImage(item.id)}
                  alt={displayName}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              </div>
              
              {/* Name & Brand */}
              <h3 className="font-semibold text-foreground text-center">
                {displayName}
              </h3>
              <p className="text-sm text-muted-foreground text-center mt-1">
                {displayBrand}
              </p>
              
              {/* EK Badge */}
              <div className="flex justify-center mt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-sm font-mono">
                  EK: {item.ekNet} €
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Amortization Details */}
      {value.amortize && value.ekNet > 0 && (
        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Amortisierung über {value.amortMonths} Monate</p>
            <p className="text-xs text-muted-foreground">Hardware-Kosten werden auf Monatsraten verteilt</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="amort-months" className="text-sm">Monate:</Label>
              <Input
                id="amort-months"
                type="number"
                min={1}
                max={48}
                value={value.amortMonths}
                onChange={(e) => updateField("amortMonths", Math.max(1, parseInt(e.target.value) || 24))}
                className="w-20"
              />
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{(value.ekNet / value.amortMonths).toFixed(2)} €/Mo</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
