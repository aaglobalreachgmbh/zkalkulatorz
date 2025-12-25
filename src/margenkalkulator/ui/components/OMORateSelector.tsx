// ============================================
// OMO Rate Selector Component
// Auswahl der OMO-Rabattstufe (0-25%)
// ============================================

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Percent } from "lucide-react";

export type OMORate = 0 | 5 | 10 | 15 | 17.5 | 20 | 25;

interface OMORateSelectorProps {
  value: OMORate;
  onChange: (rate: OMORate) => void;
  disabled?: boolean;
}

const OMO_RATES: { value: OMORate; label: string; description: string }[] = [
  { value: 0, label: "Kein OMO", description: "Standardprovision" },
  { value: 5, label: "OMO 5%", description: "5% Provisionsabzug" },
  { value: 10, label: "OMO 10%", description: "10% Provisionsabzug" },
  { value: 15, label: "OMO 15%", description: "15% Provisionsabzug" },
  { value: 17.5, label: "OMO 17,5%", description: "17,5% Provisionsabzug" },
  { value: 20, label: "OMO 20%", description: "20% Provisionsabzug" },
  { value: 25, label: "OMO 25%", description: "25% Provisionsabzug" },
];

/**
 * OMO Rate Selector
 * 
 * ZWECK:
 * Ermöglicht die Auswahl der OMO-Rabattstufe.
 * OMO = Online Marketing Offer (Provisionsabzug bei Rabattaktionen)
 * 
 * STUFEN:
 * 0%, 5%, 10%, 15%, 17.5%, 20%, 25%
 */
export function OMORateSelector({ value, onChange, disabled }: OMORateSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Percent className="w-4 h-4 text-muted-foreground" />
        <Label className="text-sm text-muted-foreground">OMO-Rabattstufe</Label>
      </div>
      <Select
        value={String(value)}
        onValueChange={(v) => onChange(parseFloat(v) as OMORate)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="OMO-Stufe wählen" />
        </SelectTrigger>
        <SelectContent>
          {OMO_RATES.map((rate) => (
            <SelectItem key={rate.value} value={String(rate.value)}>
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium">{rate.label}</span>
                <span className="text-xs text-muted-foreground">{rate.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
