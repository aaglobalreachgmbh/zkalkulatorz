// ============================================
// ContractQuantitySelector - Kompakte 3-Spalten Box
// ============================================

import { Label } from "@/components/ui/label";
import { Tag, Sliders } from "lucide-react";
import type { ContractType, Promo } from "@/margenkalkulator";

interface ContractQuantitySelectorProps {
  contractType: ContractType;
  quantity: number;
  maxQuantity?: number;
  promos?: Promo[];
  selectedPromoId?: string;
  onContractTypeChange: (type: ContractType) => void;
  onQuantityChange: (quantity: number) => void;
  onPromoChange?: (promoId: string) => void;
}

export function ContractQuantitySelector({
  contractType,
  quantity,
  maxQuantity = 100,
  promos = [],
  selectedPromoId = "NONE",
  onContractTypeChange,
  onQuantityChange,
  onPromoChange,
}: ContractQuantitySelectorProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Anzahl SIMs */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
            <Label className="text-xs font-semibold text-foreground">Anzahl SIMs</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => onQuantityChange(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-secondary
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-card [&::-webkit-slider-thumb]:shadow-sm
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2
                [&::-moz-range-thumb]:border-card"
            />
            <input
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => {
                const val = Math.max(1, Math.min(maxQuantity, Number(e.target.value) || 1));
                onQuantityChange(val);
              }}
              className="w-14 h-8 text-center text-sm font-bold border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Vertragsart */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">Vertragsart</Label>
          <div className="space-y-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="contractType"
                checked={contractType === "new"}
                onChange={() => onContractTypeChange("new")}
                className="w-3.5 h-3.5 text-primary accent-primary"
              />
              <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                Neuvertrag
              </span>
              <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))]">
                High Margin
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="contractType"
                checked={contractType === "renewal"}
                onChange={() => onContractTypeChange("renewal")}
                className="w-3.5 h-3.5 text-primary accent-primary"
              />
              <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                VVL
              </span>
            </label>
          </div>
        </div>

        {/* Aktion */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <Label className="text-xs font-semibold text-foreground">Aktion</Label>
          </div>
          <select
            value={selectedPromoId}
            onChange={(e) => onPromoChange?.(e.target.value)}
            className="w-full h-8 px-2 text-xs border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
          >
            <option value="NONE">Keine Aktion</option>
            {promos.filter(p => p.id !== "NONE").map((promo) => (
              <option key={promo.id} value={promo.id}>
                {promo.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
