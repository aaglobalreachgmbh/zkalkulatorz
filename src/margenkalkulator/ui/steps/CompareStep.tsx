import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CalculationResult, ViewMode, OfferOptionState } from "../../engine/types";
import { OptionCard } from "../components/OptionCard";
import { ViewModeToggle } from "../components/ViewModeToggle";
import { ArrowLeftRight, Sparkles } from "lucide-react";

interface CompareStepProps {
  option1: OfferOptionState;
  option2: OfferOptionState;
  result1: CalculationResult;
  result2: CalculationResult;
  activeOption: 1 | 2;
  viewMode: ViewMode;
  onActiveOptionChange: (option: 1 | 2) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onCopyOption: (from: 1 | 2, to: 1 | 2) => void;
}

export function CompareStep({
  option1,
  option2,
  result1,
  result2,
  activeOption,
  viewMode,
  onActiveOptionChange,
  onViewModeChange,
  onCopyOption,
}: CompareStepProps) {
  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ToggleGroup
            type="single"
            value={String(activeOption)}
            onValueChange={(v) => v && onActiveOptionChange(Number(v) as 1 | 2)}
            className="bg-muted p-1 rounded-lg"
          >
            <ToggleGroupItem
              value="1"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-4"
            >
              Option 1
            </ToggleGroupItem>
            <ToggleGroupItem
              value="2"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-4"
            >
              Option 2
            </ToggleGroupItem>
          </ToggleGroup>
          <span className="text-sm text-muted-foreground">
            (aktiv für Bearbeitung)
          </span>
        </div>

        <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
      </div>

      {/* Comparison Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <OptionCard
          title="Option 1"
          result={result1}
          viewMode={viewMode}
          isActive={activeOption === 1}
          onCopy={() => onCopyOption(1, 2)}
          gkEligible={result1.gkEligible}
        />
        <OptionCard
          title="Option 2"
          result={result2}
          viewMode={viewMode}
          isActive={activeOption === 2}
          onCopy={() => onCopyOption(2, 1)}
          gkEligible={result2.gkEligible}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCopyOption(activeOption, activeOption === 1 ? 2 : 1)}
          className="gap-2"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Aktive Option in {activeOption === 1 ? "Option 2" : "Option 1"} kopieren
        </Button>
      </div>

      {/* Summary Comparison */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h4 className="font-medium mb-3">Vergleich auf einen Blick</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="font-medium text-muted-foreground">Metrik</div>
          <div className="font-medium text-center">Option 1</div>
          <div className="font-medium text-center">Option 2</div>

          <div className="text-muted-foreground">Ø Monat (netto)</div>
          <div className="text-center">{result1.totals.avgTermNet.toFixed(2)} €</div>
          <div className="text-center">{result2.totals.avgTermNet.toFixed(2)} €</div>

          <div className="text-muted-foreground">Summe 24M (brutto)</div>
          <div className="text-center">{result1.totals.sumTermGross.toFixed(2)} €</div>
          <div className="text-center">{result2.totals.sumTermGross.toFixed(2)} €</div>

          {/* GK Eligibility Row */}
          <div className="text-muted-foreground">GK Konvergenz</div>
          <div className="text-center">
            {result1.gkEligible ? (
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                <Sparkles className="w-3 h-3 mr-1" />
                Berechtigt
              </Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          <div className="text-center">
            {result2.gkEligible ? (
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                <Sparkles className="w-3 h-3 mr-1" />
                Berechtigt
              </Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>

          {viewMode === "dealer" && (
            <>
              <div className="text-muted-foreground">Marge</div>
              <div className={`text-center font-medium ${result1.dealer.margin >= 0 ? "text-green-600" : "text-destructive"}`}>
                {result1.dealer.margin.toFixed(2)} €
              </div>
              <div className={`text-center font-medium ${result2.dealer.margin >= 0 ? "text-green-600" : "text-destructive"}`}>
                {result2.dealer.margin.toFixed(2)} €
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
