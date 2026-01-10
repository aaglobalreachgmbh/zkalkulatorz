import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  History, 
  FolderOpen, 
  Save, 
  FileText, 
  Package, 
  Cloud 
} from "lucide-react";
import type { OfferOptionState, CalculationResult, ViewMode } from "@/margenkalkulator";
import { useHistory } from "../../hooks/useHistory";
import { useDrafts } from "../../hooks/useDrafts";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PdfExportDialog } from "./PdfExportDialog";

interface ActionMenuProps {
  config: OfferOptionState;
  avgMonthly: number;
  result?: CalculationResult;
  viewMode?: ViewMode;
  onLoadConfig: (config: OfferOptionState) => void;
}

export function ActionMenu({ config, avgMonthly, result, viewMode, onLoadConfig }: ActionMenuProps) {
  
  const navigate = useNavigate();
  const { history } = useHistory();
  const { createDraft } = useDrafts();
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);

  const handleSaveDraft = async () => {
    const tariffName = config.mobile.tariffId || "Kein Tarif";
    const hardwareName = config.hardware.name || "SIM-Only";
    const name = `${hardwareName} + ${tariffName}`;
    
    try {
      await createDraft(name, config, avgMonthly);
      toast.success("Entwurf gespeichert", { description: `"${name}" wurde gespeichert.` });
    } catch {
      toast.error("Fehler", { description: "Entwurf konnte nicht gespeichert werden." });
    }
  };

  const handleLoadLastHistory = () => {
    if (history.length > 0) {
      onLoadConfig(history[0].config as OfferOptionState);
      toast.success("Konfiguration geladen", { description: "Letzter Verlaufseintrag wurde geladen." });
    } else {
      toast.error("Kein Verlauf", { description: "Es gibt keine gespeicherten Konfigurationen." });
    }
  };

  const handleNavigateDrafts = () => {
    navigate("/offers");
  };

  const handleNavigateCloud = () => {
    navigate("/offers");
  };

  const handleSaveTemplate = () => {
    toast("Template speichern", { description: "Bitte nutze den Vorlagen-Button auf der Angebote-Seite." });
    navigate("/offers");
  };

  const handleSaveBundle = () => {
    navigate("/bundles");
    toast("Bundle speichern", { description: "Du wirst zur Bundle-Verwaltung weitergeleitet." });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <MoreHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Aktionen</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg z-50">
          {/* PDF Export (wenn result vorhanden) */}
          {result && (
            <>
              <DropdownMenuItem 
                onClick={() => setPdfDialogOpen(true)} 
                className="gap-3 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                PDF exportieren
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={handleLoadLastHistory} className="gap-3 cursor-pointer">
            <History className="w-4 h-4" />
            Letzten Verlauf laden
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleNavigateDrafts} className="gap-3 cursor-pointer">
            <FolderOpen className="w-4 h-4" />
            Entwürfe verwalten
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSaveDraft} className="gap-3 cursor-pointer">
            <Save className="w-4 h-4" />
            Als Entwurf speichern
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSaveBundle} className="gap-3 cursor-pointer">
            <Package className="w-4 h-4" />
            Als Bundle speichern
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleNavigateCloud} className="gap-3 cursor-pointer">
            <Cloud className="w-4 h-4" />
            Cloud-Angebote
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* PDF Export Dialog (controlled mode) */}
      {result && (
        <PdfExportDialog
          option={config}
          result={result}
          viewMode={viewMode}
          open={pdfDialogOpen}
          onOpenChange={setPdfDialogOpen}
        />
      )}
    </>
  );
}
