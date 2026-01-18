// ============================================
// PDF Page Selector Component
// Step 1 of the PDF Export Wizard - Now with Custom Pages
// ============================================

import { useState } from "react";
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
  Plus,
  Pencil,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CustomPageEditor } from "./CustomPageEditor";
import type { PdfPageSelection, CustomPageConfig } from "../../pdf/templates/types";

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

const POSITION_LABELS: Record<CustomPageConfig["position"], string> = {
  "before-summary": "Vor Zusammenfassung",
  "after-summary": "Nach Zusammenfassung",
  "before-contact": "Vor Kontaktseite",
  "after-contact": "Nach Kontaktseite",
};

const TYPE_ICONS: Record<CustomPageConfig["type"], React.ReactNode> = {
  text: <FileText className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  attachment: <FileText className="w-4 h-4" />,
};

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
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<CustomPageConfig | null>(null);

  const handleToggle = (key: keyof Omit<PdfPageSelection, "customPages">) => {
    onChange({
      ...selection,
      [key]: !selection[key],
    });
  };

  const handleAddCustomPage = (page: CustomPageConfig) => {
    onChange({
      ...selection,
      customPages: [...selection.customPages, page],
    });
    setEditingPage(null);
  };

  const handleEditCustomPage = (page: CustomPageConfig) => {
    setEditingPage(page);
    setEditorOpen(true);
  };

  const handleUpdateCustomPage = (updatedPage: CustomPageConfig) => {
    onChange({
      ...selection,
      customPages: selection.customPages.map(p => 
        p.id === updatedPage.id ? updatedPage : p
      ),
    });
    setEditingPage(null);
  };

  const handleRemoveCustomPage = (pageId: string) => {
    onChange({
      ...selection,
      customPages: selection.customPages.filter(p => p.id !== pageId),
    });
  };

  const filteredOptions = PAGE_OPTIONS.filter((option) => {
    if (option.isConfidential && !canShowDealerPage) return false;
    if (option.requiresHardware && !hasHardware) return false;
    return true;
  });

  const standardPageCount = Object.entries(selection)
    .filter(([key, value]) => key !== "customPages" && value === true)
    .length;

  const totalPageCount = standardPageCount + selection.customPages.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">
          Seiten im Angebot
        </Label>
        <span className="text-xs text-muted-foreground">
          {totalPageCount} von {filteredOptions.length + selection.customPages.length} aktiv
        </span>
      </div>

      {/* Standard Pages */}
      <div className="space-y-2">
        {filteredOptions.map((option) => {
          const isChecked = selection[option.key];
          const isDisabled = option.key === "showSummaryPage";

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

      {/* Custom Pages Section */}
      {selection.customPages.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Eigene Seiten
          </Label>
          
          {selection.customPages.map((page) => (
            <div
              key={page.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-background border-border"
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground/40 cursor-grab" />
                <span className="p-1.5 rounded bg-muted text-muted-foreground">
                  {TYPE_ICONS[page.type]}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{page.title}</p>
                <p className="text-xs text-muted-foreground">
                  {POSITION_LABELS[page.position]}
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleEditCustomPage(page)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveCustomPage(page.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Page Button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-2 gap-2"
        onClick={() => {
          setEditingPage(null);
          setEditorOpen(true);
        }}
      >
        <Plus className="w-4 h-4" />
        Eigene Seite hinzufügen
      </Button>

      {/* Custom Page Editor Modal */}
      <CustomPageEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={editingPage ? handleUpdateCustomPage : handleAddCustomPage}
        editingPage={editingPage}
      />
    </div>
  );
}
