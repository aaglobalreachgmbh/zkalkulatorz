// ============================================
// CollapsedHardwareSelection - Compact selected state
// New design: horizontal card aesthetic
// ============================================

import { Button } from "@/components/ui/button";
import { Check, RefreshCw, Smartphone, CreditCard } from "lucide-react";

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
    <div className="flex items-center gap-4 rounded-xl border border-[hsl(var(--status-success)/0.3)] bg-[hsl(var(--status-success)/0.05)] p-4">
      {/* Icon */}
      <div className="w-16 h-16 flex-shrink-0 bg-[hsl(var(--status-success)/0.1)] rounded-lg flex items-center justify-center">
        {isSimOnly ? (
          <CreditCard className="w-8 h-8 text-[hsl(var(--status-success))]" />
        ) : (
          <Smartphone className="w-8 h-8 text-[hsl(var(--status-success))]" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[hsl(var(--status-success))] flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
          <p className="font-semibold text-foreground truncate">
            {isSimOnly ? "SIM Only" : name}
          </p>
        </div>
        {showEk && ekNet > 0 && (
          <p className="text-sm text-muted-foreground mt-0.5 ml-7">
            EK: {ekNet.toFixed(2)} €
          </p>
        )}
        {isSimOnly && (
          <p className="text-sm text-muted-foreground mt-0.5 ml-7">
            Nur Tarif, kein Gerät
          </p>
        )}
      </div>

      {/* Change button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onExpand}
        className="gap-2 flex-shrink-0"
      >
        <RefreshCw className="w-4 h-4" />
        Andere Hardware
      </Button>
    </div>
  );
}
