// ============================================
// Color Picker Component for Tenant Branding
// ============================================

import { useState } from "react";
import { Palette, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DEFAULT_BRANDING } from "@/hooks/useTenantBranding";

interface ColorPickerProps {
  primaryColor: string;
  secondaryColor: string;
  onPrimaryChange: (color: string) => void;
  onSecondaryChange: (color: string) => void;
  disabled?: boolean;
}

// Preset colors for quick selection
const PRESET_COLORS = [
  { name: "Vodafone Rot", color: "#e4002b" },
  { name: "Schwarz", color: "#1a1a1a" },
  { name: "Blau", color: "#0066cc" },
  { name: "Grün", color: "#00a550" },
  { name: "Orange", color: "#ff6600" },
  { name: "Lila", color: "#7b2d8e" },
  { name: "Türkis", color: "#00a8a8" },
  { name: "Grau", color: "#666666" },
];

export function ColorPicker({
  primaryColor,
  secondaryColor,
  onPrimaryChange,
  onSecondaryChange,
  disabled,
}: ColorPickerProps) {
  const [activeField, setActiveField] = useState<"primary" | "secondary" | null>(null);

  const handlePresetClick = (color: string) => {
    if (activeField === "primary") {
      onPrimaryChange(color);
    } else if (activeField === "secondary") {
      onSecondaryChange(color);
    }
  };

  const resetToDefaults = () => {
    onPrimaryChange(DEFAULT_BRANDING.primaryColor);
    onSecondaryChange(DEFAULT_BRANDING.secondaryColor);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Farbauswahl</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetToDefaults}
          disabled={disabled}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Standard
        </Button>
      </div>

      {/* Primary Color */}
      <div className="space-y-2">
        <Label htmlFor="primary-color">Primärfarbe (Header, Buttons)</Label>
        <div className="flex gap-2">
          <div 
            className="h-10 w-10 rounded-md border cursor-pointer flex-shrink-0"
            style={{ backgroundColor: primaryColor }}
            onClick={() => setActiveField("primary")}
          />
          <Input
            id="primary-color"
            type="color"
            value={primaryColor}
            onChange={(e) => onPrimaryChange(e.target.value)}
            onFocus={() => setActiveField("primary")}
            disabled={disabled}
            className="h-10 w-16 p-1 cursor-pointer"
          />
          <Input
            type="text"
            value={primaryColor.toUpperCase()}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                onPrimaryChange(val);
              }
            }}
            onFocus={() => setActiveField("primary")}
            disabled={disabled}
            className="flex-1 font-mono text-sm"
            placeholder="#E4002B"
          />
        </div>
      </div>

      {/* Secondary Color */}
      <div className="space-y-2">
        <Label htmlFor="secondary-color">Sekundärfarbe (Text, Footer)</Label>
        <div className="flex gap-2">
          <div 
            className="h-10 w-10 rounded-md border cursor-pointer flex-shrink-0"
            style={{ backgroundColor: secondaryColor }}
            onClick={() => setActiveField("secondary")}
          />
          <Input
            id="secondary-color"
            type="color"
            value={secondaryColor}
            onChange={(e) => onSecondaryChange(e.target.value)}
            onFocus={() => setActiveField("secondary")}
            disabled={disabled}
            className="h-10 w-16 p-1 cursor-pointer"
          />
          <Input
            type="text"
            value={secondaryColor.toUpperCase()}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                onSecondaryChange(val);
              }
            }}
            onFocus={() => setActiveField("secondary")}
            disabled={disabled}
            className="flex-1 font-mono text-sm"
            placeholder="#1A1A1A"
          />
        </div>
      </div>

      {/* Preset Colors */}
      {activeField && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Schnellauswahl für {activeField === "primary" ? "Primärfarbe" : "Sekundärfarbe"}
          </Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.color}
                type="button"
                onClick={() => handlePresetClick(preset.color)}
                disabled={disabled}
                className={cn(
                  "h-8 w-8 rounded-md border-2 transition-all hover:scale-110",
                  (activeField === "primary" ? primaryColor : secondaryColor) === preset.color
                    ? "border-ring ring-2 ring-ring/20"
                    : "border-transparent"
                )}
                style={{ backgroundColor: preset.color }}
                title={preset.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
