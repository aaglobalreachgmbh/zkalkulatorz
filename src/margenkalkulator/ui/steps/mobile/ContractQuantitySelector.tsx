// ============================================
// ContractQuantitySelector - Contract type and quantity
// Phase 6: Extracted from MobileStep
// ============================================

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import type { ContractType } from "@/margenkalkulator";

interface ContractQuantitySelectorProps {
  contractType: ContractType;
  quantity: number;
  maxQuantity?: number;
  onContractTypeChange: (type: ContractType) => void;
  onQuantityChange: (quantity: number) => void;
}

export function ContractQuantitySelector({
  contractType,
  quantity,
  maxQuantity = 100,
  onContractTypeChange,
  onQuantityChange,
}: ContractQuantitySelectorProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-4 sm:gap-6">
        {/* Contract Type Toggle */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
            Vertragsart
            <HelpTooltip content="Neuvertrag oder Vertragsverlängerung (VVL)" />
          </Label>
          <div className="flex">
            <button
              onClick={() => onContractTypeChange("new")}
              className={`px-6 py-2.5 text-sm font-medium rounded-l-lg transition-colors ${
                contractType === "new"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Neuvertrag
            </button>
            <button
              onClick={() => onContractTypeChange("renewal")}
              className={`px-6 py-2.5 text-sm font-medium rounded-r-lg transition-colors ${
                contractType === "renewal"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Verlängerung
            </button>
          </div>
        </div>

        {/* Quantity Counter */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
            Anzahl Karten
            <HelpTooltip content="Anzahl der SIM-Karten für diesen Vertrag" />
          </Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="h-10 w-10"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-12 text-center text-xl font-bold">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
              className="h-10 w-10"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
