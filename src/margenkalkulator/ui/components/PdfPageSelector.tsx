// ============================================
// PDF Page Selector Component
// Step 1 of the PDF Export Wizard
// ============================================

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Image, 
  Table, 
  ListChecks, 
  Smartphone, 
  Award, 
  Contact, 
  ShieldCheck,
  GripVertical,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PdfPageSelection } from "../../pdf/templates/types";

interface PageOption {
  key: keyof Omit<PdfPageSelection, "customPages">;
  label: string;
  description: string;
  icon: React.ReactNode;
  isConfidential?: boolean;
  requiresHardware?: boolean;
}

const PAGE_OPTIONS: PageOption[] = [
  {
    key: "showCoverPage",
    label: "Deckblatt",
    description: "Lifestyle-Bild mit Angebots-Überschrift",
    icon: <Image className="w-5 h-5" />,
  },
  {
    key: "showSummaryPage",
    label: "Zusammenfassung",
    description: "Kostentabelle mit Perioden-Spalten & QR-Code",
    icon: <Table className="w-5 h-5" />,
  },
  {
    key: "showTransitionPage",
    label: "Übergangsseite",
    description: '"Hier geht\'s zu den Details"',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    key: "showDetailPage",
    label: "Tarifdetails",
    description: "Features mit Checkmarks, Aktions-Hinweise",
    icon: <ListChecks className="w-5 h-5" />,
  },
  {
    key: "showHardwarePage",
    label: "Hardware-Finanzierung",
    description: "Geräte-Bild mit Finanzierungsplan",
    icon: <Smartphone className="w-5 h-5" />,
    requiresHardware: true,
  },
  {
    key: "showUspPage",
    label: "Vorteile",
    description: '"Warum wir?" - USPs und Siegel',
    icon: <Award className="w-5 h-5" />,
  },
  {
    key: "showContactPage",
    label: "Kontaktseite",
    description: "Händler-Visitenkarte & Gültigkeit",
    icon: <Contact className="w-5 h-5" />,
  },
  {
    key: "showDealerPage",
    label: "Händler-Zusammenfassung",
    description: "Vertrauliche Provisions- und Margen-Kalkulation",
    icon: <ShieldCheck className="w-5 h-5" />,
    isConfidential: true,
  },
];

interface PdfPageSelectorProps {
  selection: PdfPageSelection;
  onChange: (selection: PdfPageSelection) => void;
  canShowDealerPage: boolean;
  hasHardware: boolean;
}

export function PdfPageSelector({
  selection,
  onChange,
  canShowDealerPage,
  hasHardware,
}: PdfPageSelectorProps) {
  const handleToggle = (key: keyof Omit<PdfPageSelection, "customPages">) => {
    onChange({
      ...selection,
      [key]: !selection[key],
    });
  };

  const filteredOptions = PAGE_OPTIONS.filter((option) => {
    // Hide dealer page if not allowed
    if (option.isConfidential && !canShowDealerPage) return false;
    // Hide hardware page if no hardware selected
    if (option.requiresHardware && !hasHardware) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">
          Seiten im Angebot
        </Label>
        <span className="text-xs text-muted-foreground">
          {Object.values(selection).filter((v) => v === true).length} von{" "}
          {filteredOptions.length} aktiv
        </span>
      </div>

      <div className="space-y-2">
        {filteredOptions.map((option) => {
          const isChecked = selection[option.key];
          const isDisabled = option.key === "showSummaryPage"; // Summary is always required

          return (
            <div
              key={option.key}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                isChecked
                  ? "bg-primary/5 border-primary/30"
                  : "bg-background border-border hover:border-primary/20",
                option.isConfidential && isChecked && "bg-amber-500/10 border-amber-500/30"
              )}
            >
              <div className="flex items-center gap-2 pt-0.5">
                <GripVertical className="w-4 h-4 text-muted-foreground/40 cursor-grab" />
                <Checkbox
                  id={option.key}
                  checked={isChecked}
                  onCheckedChange={() => handleToggle(option.key)}
                  disabled={isDisabled}
                />
              </div>

              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={option.key}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium cursor-pointer",
                    option.isConfidential && "text-amber-600"
                  )}
                >
                  <span className={cn(
                    "p-1.5 rounded",
                    isChecked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                    option.isConfidential && isChecked && "bg-amber-500/20 text-amber-600"
                  )}>
                    {option.icon}
                  </span>
                  {option.label}
                  {option.isConfidential && (
                    <span className="text-[10px] uppercase tracking-wide bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded">
                      Intern
                    </span>
                  )}
                </Label>
                <p className="text-xs text-muted-foreground mt-1 ml-9">
                  {option.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Page Button (placeholder for future) */}
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-2 gap-2 text-muted-foreground"
        disabled
      >
        <Plus className="w-4 h-4" />
        Eigene Seite hinzufügen
        <span className="text-[10px] uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded ml-auto">
          Bald verfügbar
        </span>
      </Button>
    </div>
  );
}
