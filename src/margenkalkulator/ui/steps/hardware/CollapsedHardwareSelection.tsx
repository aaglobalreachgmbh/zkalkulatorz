// ============================================
// CollapsedHardwareSelection - Compact selected state
// Phase 6: Extracted from HardwareStep
// ============================================

import { Button } from "@/components/ui/button";
import { Check, RefreshCw } from "lucide-react";

interface CollapsedHardwareSelectionProps {
  name: string;
  ekNet: number;
  showEk: boolean;
  onExpand: () => void;
}

export function CollapsedHardwareSelection({
  name,
  ekNet,
  showEk,
  onExpand,
}: CollapsedHardwareSelectionProps) {
  const isSimOnly = name === "KEINE HARDWARE";

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Check className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {isSimOnly ? "SIM Only" : name}
            </p>
            {showEk && ekNet > 0 && (
              <p className="text-sm text-muted-foreground">
                EK: {ekNet.toFixed(2)} €
              </p>
            )}
            {isSimOnly && (
              <p className="text-sm text-muted-foreground">Nur Tarif, kein Gerät</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onExpand}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Andere Hardware
        </Button>
      </div>
    </div>
  );
}
