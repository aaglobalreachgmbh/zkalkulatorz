// ============================================
// PDF Template Settings - Admin UI
// Phase 6: PDF Template System
// ============================================

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Image, BarChart3, Lock, Check, Save } from "lucide-react";
import { toast } from "sonner";

// ============================================
// Types
// ============================================

export type DiscountDetailLevel = "minimal" | "normal" | "detailed";

export interface PdfTemplateConfig {
  /** Default template ID */
  defaultTemplateId: string;
  /** Show cover page */
  showCover: boolean;
  /** Show marketing pages */
  showMarketingPages: boolean;
  /** Show USP page */
  showUspPage: boolean;
  /** Discount detail level */
  discountDetailLevel: DiscountDetailLevel;
  /** Show period breakdown */
  showPeriodBreakdown: boolean;
  /** Include QR code */
  includeQrCode: boolean;
  /** Publisher label */
  publisherLabel: string;
  /** RV number to display */
  rvNumber: string;
}

export const DEFAULT_PDF_CONFIG: PdfTemplateConfig = {
  defaultTemplateId: "allenetze_clean",
  showCover: true,
  showMarketingPages: true,
  showUspPage: true,
  discountDetailLevel: "normal",
  showPeriodBreakdown: true,
  includeQrCode: true,
  publisherLabel: "allenetze.de",
  rvNumber: "RV180000",
};

// ============================================
// Template Options
// ============================================

const TEMPLATE_OPTIONS = [
  {
    id: "allenetze_clean",
    name: "Allenetze Clean",
    description: "Modernes, sauberes Design mit allenetze.de Branding",
    badge: "Empfohlen",
  },
  {
    id: "premium_vodafone",
    name: "Vodafone Premium",
    description: "Klassisches Vodafone-Design in Rot",
    badge: null,
  },
  {
    id: "premium_o2",
    name: "O2 Business",
    description: "O2-Design in Blau",
    badge: null,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Reduziertes Design ohne Marketing-Elemente",
    badge: null,
  },
];

const DISCOUNT_LEVEL_OPTIONS: Array<{ value: DiscountDetailLevel; label: string; description: string }> = [
  { value: "minimal", label: "Minimal", description: "Nur Endpreis, keine Aufschlüsselung" },
  { value: "normal", label: "Normal", description: "Rabatte mit Zusammenfassung" },
  { value: "detailed", label: "Detailliert", description: "Alle Rabatte einzeln aufgeführt" },
];

// ============================================
// Props
// ============================================

interface PdfTemplateSettingsProps {
  config?: PdfTemplateConfig;
  onChange?: (config: PdfTemplateConfig) => void;
  onSave?: (config: PdfTemplateConfig) => Promise<void>;
  isLoading?: boolean;
}

// ============================================
// Component
// ============================================

export function PdfTemplateSettings({
  config = DEFAULT_PDF_CONFIG,
  onChange,
  onSave,
  isLoading = false,
}: PdfTemplateSettingsProps) {
  const [localConfig, setLocalConfig] = useState<PdfTemplateConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  
  const updateConfig = (updates: Partial<PdfTemplateConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onChange?.(newConfig);
  };
  
  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(localConfig);
      toast.success("PDF-Einstellungen gespeichert");
    } catch (e) {
      toast.error("Fehler beim Speichern");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Standard-Vorlage
          </CardTitle>
          <CardDescription>
            Wählen Sie die Standard-PDF-Vorlage für neue Angebote
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {TEMPLATE_OPTIONS.map((template) => {
              const isSelected = localConfig.defaultTemplateId === template.id;
              
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => updateConfig({ defaultTemplateId: template.id })}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left
                    ${isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                    }
                  `}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{template.name}</span>
                      {template.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {template.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Page Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Seiten-Optionen
          </CardTitle>
          <CardDescription>
            Aktivieren oder deaktivieren Sie einzelne PDF-Seiten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Cover-Seite</Label>
              <p className="text-sm text-muted-foreground">
                Titelseite mit Logo und Kundenname
              </p>
            </div>
            <Switch
              checked={localConfig.showCover}
              onCheckedChange={(checked) => updateConfig({ showCover: checked })}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Marketing-Seiten</Label>
              <p className="text-sm text-muted-foreground">
                Zusätzliche Infos zu Tarifen und Vorteilen
              </p>
            </div>
            <Switch
              checked={localConfig.showMarketingPages}
              onCheckedChange={(checked) => updateConfig({ showMarketingPages: checked })}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>USP-Seite</Label>
              <p className="text-sm text-muted-foreground">
                Alleinstellungsmerkmale und Vorteile
              </p>
            </div>
            <Switch
              checked={localConfig.showUspPage}
              onCheckedChange={(checked) => updateConfig({ showUspPage: checked })}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>QR-Code</Label>
              <p className="text-sm text-muted-foreground">
                QR-Code zur Online-Ansicht des Angebots
              </p>
            </div>
            <Switch
              checked={localConfig.includeQrCode}
              onCheckedChange={(checked) => updateConfig({ includeQrCode: checked })}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Detail Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Detail-Optionen
          </CardTitle>
          <CardDescription>
            Steuern Sie den Detailgrad der Preis-Aufschlüsselung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Rabatt-Detailgrad</Label>
            <Select
              value={localConfig.discountDetailLevel}
              onValueChange={(value) => updateConfig({ discountDetailLevel: value as DiscountDetailLevel })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISCOUNT_LEVEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <div>{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Perioden-Aufschlüsselung</Label>
              <p className="text-sm text-muted-foreground">
                Zeigt Preise nach Vertragsperioden aufgeteilt
              </p>
            </div>
            <Switch
              checked={localConfig.showPeriodBreakdown}
              onCheckedChange={(checked) => updateConfig({ showPeriodBreakdown: checked })}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Branding Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Branding & Kennzeichnung
          </CardTitle>
          <CardDescription>
            RV-Nummer und Publisher-Label für Angebote
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>RV-Nummer</Label>
              <input
                type="text"
                value={localConfig.rvNumber}
                onChange={(e) => updateConfig({ rvNumber: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="RV180000"
              />
              <p className="text-xs text-muted-foreground">
                Wird in Summary & PDF angezeigt
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Publisher-Label</Label>
              <input
                type="text"
                value={localConfig.publisherLabel}
                onChange={(e) => updateConfig({ publisherLabel: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="allenetze.de"
              />
              <p className="text-xs text-muted-foreground">
                Footer-Text auf allen Seiten
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Save Button */}
      {onSave && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? (
              <>Speichern...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Einstellungen speichern
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default PdfTemplateSettings;
