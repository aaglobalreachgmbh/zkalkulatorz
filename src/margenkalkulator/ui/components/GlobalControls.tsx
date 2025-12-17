import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ViewMode, OfferOptionState } from "../../engine/types";
import type { LocalStorageDraftResult } from "../../hooks/useLocalStorageDraft";
import type { OfferExportResult } from "../../hooks/useOfferExport";
import { DraftControls } from "./DraftControls";
import { ExportImportDialog } from "./ExportImportDialog";
import { ViewModeToggle } from "./ViewModeToggle";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GlobalControlsProps {
  activeOption: 1 | 2;
  onActiveOptionChange: (option: 1 | 2) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  option1: OfferOptionState;
  option2: OfferOptionState;
  onImportSuccess: (option1: OfferOptionState, option2: OfferOptionState) => void;
  draftControls: LocalStorageDraftResult;
  exportControls: OfferExportResult;
  showOptionToggle?: boolean;
}

export function GlobalControls({
  activeOption,
  onActiveOptionChange,
  viewMode,
  onViewModeChange,
  option1,
  option2,
  onImportSuccess,
  draftControls,
  exportControls,
  showOptionToggle = true,
}: GlobalControlsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 bg-card border-b">
      {/* Left: Option Toggle */}
      <div className="flex items-center gap-3">
        {showOptionToggle && (
          <>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Bearbeite:
            </span>
            <ToggleGroup
              type="single"
              value={String(activeOption)}
              onValueChange={(v) => v && onActiveOptionChange(Number(v) as 1 | 2)}
              className="bg-muted p-0.5 rounded-md"
            >
              <ToggleGroupItem
                value="1"
                size="sm"
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3"
              >
                Option 1
              </ToggleGroupItem>
              <ToggleGroupItem
                value="2"
                size="sm"
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3"
              >
                Option 2
              </ToggleGroupItem>
            </ToggleGroup>
          </>
        )}
      </div>

      {/* Right: View Mode, Draft, Export, Preview */}
      <div className="flex items-center gap-2 flex-wrap">
        <ViewModeToggle value={viewMode} onChange={onViewModeChange} />

        <div className="w-px h-6 bg-border hidden sm:block" />

        <DraftControls
          hasDraft={draftControls.hasDraft}
          lastSaved={draftControls.lastSaved}
          onLoadDraft={draftControls.loadDraft}
          onResetDraft={draftControls.resetDraft}
          autoSaveEnabled={draftControls.autoSaveEnabled}
          onAutoSaveToggle={draftControls.setAutoSaveEnabled}
        />

        <ExportImportDialog
          option1={option1}
          option2={option2}
          onExport={exportControls.exportToJson}
          onImport={exportControls.importFromJson}
          onImportSuccess={onImportSuccess}
        />

        <div className="w-px h-6 bg-border hidden sm:block" />

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => navigate("/offer-preview")}
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Vorschau</span>
        </Button>
      </div>
    </div>
  );
}
