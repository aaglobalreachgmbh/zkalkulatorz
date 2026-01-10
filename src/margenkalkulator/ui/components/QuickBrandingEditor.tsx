// ============================================
// Quick Branding Editor Component
// Allows fast branding changes without navigating to settings
// ============================================

import { useState } from "react";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { LogoUpload } from "@/components/settings/LogoUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { Settings, RotateCcw, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// Preset colors for quick selection
const PRESET_COLORS = [
  { name: "Vodafone Rot", value: "#e60000" },
  { name: "Telekom Magenta", value: "#e20074" },
  { name: "O2 Blau", value: "#0090d0" },
  { name: "Grün", value: "#16a34a" },
  { name: "Orange", value: "#ea580c" },
  { name: "Violett", value: "#7c3aed" },
  { name: "Dunkelblau", value: "#1e3a8a" },
  { name: "Schwarz", value: "#18181b" },
];

export function QuickBrandingEditor() {
  const { branding, saveBranding, isSaving, resetBranding } = useTenantBranding();
  const [localCompanyName, setLocalCompanyName] = useState(branding.companyName || "");
  
  const handleColorChange = (color: string) => {
    saveBranding({ primaryColor: color });
  };

  const handleCompanyNameSave = () => {
    if (localCompanyName !== branding.companyName) {
      saveBranding({ companyName: localCompanyName || null });
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Logo Upload */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Firmenlogo</Label>
        <p className="text-sm text-muted-foreground">
          Wird in E-Mails, im Dashboard und auf Angeboten angezeigt
        </p>
        <LogoUpload 
          currentLogoUrl={branding.logoUrl}
          onLogoChange={(url) => saveBranding({ logoUrl: url })}
          disabled={isSaving}
        />
      </div>

      <Separator />

      {/* Primary Color */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Primärfarbe</Label>
        <p className="text-sm text-muted-foreground">
          Bestimmt Buttons, Links und Akzente
        </p>
        
        {/* Preset Colors */}
        <div className="grid grid-cols-4 gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorChange(color.value)}
              className={cn(
                "relative h-10 rounded-lg border-2 transition-all",
                branding.primaryColor === color.value 
                  ? "border-foreground ring-2 ring-offset-2 ring-foreground/20" 
                  : "border-transparent hover:border-muted-foreground/30"
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {branding.primaryColor === color.value && (
                <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
              )}
            </button>
          ))}
        </div>
        
        {/* Custom Color Input */}
        <div className="flex items-center gap-3">
          <div 
            className="h-10 w-10 rounded-lg border-2 border-border flex-shrink-0"
            style={{ backgroundColor: branding.primaryColor }}
          />
          <Input
            type="color"
            value={branding.primaryColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="h-10 w-full cursor-pointer"
          />
        </div>
      </div>

      <Separator />

      {/* Company Name */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Firmenname</Label>
        <p className="text-sm text-muted-foreground">
          Wird angezeigt wenn kein Logo hochgeladen ist
        </p>
        <div className="flex gap-2">
          <Input 
            value={localCompanyName}
            onChange={(e) => setLocalCompanyName(e.target.value)}
            onBlur={handleCompanyNameSave}
            onKeyDown={(e) => e.key === "Enter" && handleCompanyNameSave()}
            placeholder="z.B. Vodafone Shop Mustermann"
          />
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="space-y-3">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={resetBranding}
          disabled={isSaving}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Auf Standardwerte zurücksetzen
        </Button>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground"
          asChild
        >
          <Link to="/settings/branding">
            <Settings className="h-4 w-4 mr-2" />
            Alle Branding-Einstellungen
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
