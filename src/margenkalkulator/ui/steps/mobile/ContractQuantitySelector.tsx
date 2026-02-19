// ============================================
// ContractQuantitySelector - 3-Spalten Konfigurations-Box
// Komplett-Neuaufbau nach Screenshot-Vorlage
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
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Spalte 1: Anzahl SIMs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-semibold text-foreground">Anzahl SIMs</Label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => onQuantityChange(Number(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-secondary
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-card
                [&::-webkit-slider-thumb]:shadow-md
                [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
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
              className="w-16 h-10 text-center text-lg font-bold border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <p className="text-xs text-muted-foreground">Ziehen für Mengenrabatte anpassen.</p>
        </div>

        {/* Spalte 2: Vertragsart */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">Vertragsart</Label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="contractType"
                checked={contractType === "new"}
                onChange={() => onContractTypeChange("new")}
                className="w-4 h-4 text-primary accent-primary"
              />
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                Neuvertrag
              </span>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))]">
                High Margin
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="contractType"
                checked={contractType === "renewal"}
                onChange={() => onContractTypeChange("renewal")}
                className="w-4 h-4 text-primary accent-primary"
              />
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                Vertragsverlängerung (VVL)
              </span>
            </label>
          </div>
        </div>

        {/* Spalte 3: Aktion wählen */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-semibold text-foreground">Aktion wählen</Label>
          </div>
          <select
            value={selectedPromoId}
            onChange={(e) => onPromoChange?.(e.target.value)}
            className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="NONE">Keine Aktion</option>
            {promos.filter(p => p.id !== "NONE").map((promo) => (
              <option key={promo.id} value={promo.id}>
                {promo.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">Passenden Kampagnencode auswählen.</p>
        </div>
      </div>
    </div>
  );
}
