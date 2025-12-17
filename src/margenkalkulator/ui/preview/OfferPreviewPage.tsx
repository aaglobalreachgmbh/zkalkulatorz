import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArrowLeft, Printer } from "lucide-react";
import type { OfferOptionState, ViewMode, CalculationResult } from "../../engine/types";
import { createDefaultOptionState, calculateOffer } from "../../engine";
import { OfferPreviewContent } from "./OfferPreviewContent";
import { ViewModeToggle } from "../components/ViewModeToggle";
import "./print-styles.css";

type PreviewMode = "option1" | "option2" | "compare";

export function OfferPreviewPage() {
  const navigate = useNavigate();
  const [previewMode, setPreviewMode] = useState<PreviewMode>("option1");
  const [viewMode, setViewMode] = useState<ViewMode>("customer");
  const [option1, setOption1] = useState<OfferOptionState>(createDefaultOptionState);
  const [option2, setOption2] = useState<OfferOptionState>(createDefaultOptionState);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("margenkalkulator_draft");
      if (stored) {
        const draft = JSON.parse(stored);
        if (draft.option1) setOption1(draft.option1);
        if (draft.option2) setOption2(draft.option2);
        if (draft.viewMode) setViewMode(draft.viewMode);
      }
    } catch (e) {
      console.error("Failed to load preview data:", e);
    }
  }, []);

  const result1 = useMemo(() => calculateOffer(option1), [option1]);
  const result2 = useMemo(() => calculateOffer(option2), [option2]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Screen-only controls */}
      <div className="no-print border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück zum Kalkulator
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <ToggleGroup
                type="single"
                value={previewMode}
                onValueChange={(v) => v && setPreviewMode(v as PreviewMode)}
                className="bg-muted p-0.5 rounded-md"
              >
                <ToggleGroupItem
                  value="option1"
                  size="sm"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3"
                >
                  Option 1
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="option2"
                  size="sm"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3"
                >
                  Option 2
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="compare"
                  size="sm"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3"
                >
                  Vergleich
                </ToggleGroupItem>
              </ToggleGroup>

              <ViewModeToggle value={viewMode} onChange={setViewMode} />

              <Button onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                Drucken / PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Content */}
      <div className="offer-preview container mx-auto px-4 py-8 max-w-4xl">
        {previewMode === "compare" ? (
          <div className="grid md:grid-cols-2 gap-6 print:grid-cols-2">
            <OfferPreviewContent
              title="Option 1"
              state={option1}
              result={result1}
              viewMode={viewMode}
            />
            <OfferPreviewContent
              title="Option 2"
              state={option2}
              result={result2}
              viewMode={viewMode}
            />
          </div>
        ) : (
          <OfferPreviewContent
            title={previewMode === "option1" ? "Option 1" : "Option 2"}
            state={previewMode === "option1" ? option1 : option2}
            result={previewMode === "option1" ? result1 : result2}
            viewMode={viewMode}
          />
        )}

        {/* Footer Notes */}
        <div className="mt-8 pt-6 border-t text-sm text-muted-foreground space-y-1">
          <p>• Preise in EUR netto zzgl. 19% MwSt.</p>
          <p>• Mindestvertragslaufzeit 24 Monate</p>
          <p>• Angebot freibleibend, Stand: {new Date().toLocaleDateString("de-DE")}</p>
          <p className="pt-2 text-xs">
            Erstellt mit MargenKalkulator • allenetze.de • Vodafone Business Partner
          </p>
        </div>
      </div>
    </div>
  );
}
