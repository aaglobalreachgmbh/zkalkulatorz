// ============================================
// PDF Template Selector Component
// Visual template selector for O2 Blue vs. Vodafone Red
// ============================================

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  previewGradient: string;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: "premium-o2",
    name: "O2 Blau",
    description: "Modernes, professionelles Design mit Blau-Akzenten",
    primaryColor: "#0066CC",
    accentColor: "#002855",
    previewGradient: "linear-gradient(135deg, #0066CC 0%, #002855 100%)",
  },
  {
    id: "premium-vodafone",
    name: "Vodafone Rot",
    description: "Klares, strukturiertes Design mit Rot-Akzenten",
    primaryColor: "#E60000",
    accentColor: "#1A1A2E",
    previewGradient: "linear-gradient(135deg, #E60000 0%, #1A1A2E 100%)",
  },
];

interface PdfTemplateSelectorProps {
  selectedTemplateId: string;
  onChange: (templateId: string) => void;
}

export function PdfTemplateSelector({
  selectedTemplateId,
  onChange,
}: PdfTemplateSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">
        Design-Vorlage
      </Label>
      
      <div className="grid grid-cols-2 gap-3">
        {TEMPLATE_OPTIONS.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onChange(template.id)}
              className={cn(
                "relative flex flex-col rounded-lg border-2 p-3 transition-all text-left",
                "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-background hover:border-primary/30"
              )}
            >
              {/* Mini Preview */}
              <div
                className="h-16 w-full rounded-md mb-2 overflow-hidden relative"
                style={{ background: template.previewGradient }}
              >
                {/* Mock PDF layout */}
                <div className="absolute inset-2 flex flex-col gap-1">
                  <div className="h-2 w-8 bg-white/80 rounded-sm" />
                  <div className="h-1.5 w-12 bg-white/60 rounded-sm" />
                  <div className="flex-1" />
                  <div className="flex gap-1">
                    <div className="h-3 w-6 bg-white/50 rounded-sm" />
                    <div className="h-3 w-8 bg-white/50 rounded-sm" />
                  </div>
                </div>
                
                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Check 
                      className="w-3 h-3" 
                      style={{ color: template.primaryColor }} 
                    />
                  </div>
                )}
              </div>
              
              {/* Template Info */}
              <span className="text-sm font-medium text-foreground">
                {template.name}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                {template.description}
              </span>
              
              {/* Color swatches */}
              <div className="flex items-center gap-1.5 mt-2">
                <div
                  className="w-4 h-4 rounded-full border border-black/10"
                  style={{ backgroundColor: template.primaryColor }}
                  title="Primärfarbe"
                />
                <div
                  className="w-4 h-4 rounded-full border border-black/10"
                  style={{ backgroundColor: template.accentColor }}
                  title="Akzentfarbe"
                />
                <span className="text-[10px] text-muted-foreground ml-1">
                  Farbschema
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
