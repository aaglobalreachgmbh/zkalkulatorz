// ============================================
// SUB Variant Selector Component
// Kombinierte Auswahl: Auto-Vorschlag + manuelle Überschreibung
// ============================================

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Sparkles } from "lucide-react";
import type { SubVariantId, SubVariant } from "@/margenkalkulator/engine/types";
import { inferSubVariantFromHardware } from "@/margenkalkulator/lib/subVariantInference";

interface SubVariantSelectorProps {
  value: string;
  onChange: (subVariantId: string) => void;
  hardwareName: string;
  allowedSubVariants: SubVariantId[] | undefined;
  subVariants: SubVariant[];
  disabled?: boolean;
}

/**
 * SUB Variant Selector
 * 
 * FUNKTIONEN:
 * - Automatischer Vorschlag basierend auf Hardware-Name
 * - Manuelle Überschreibung durch Dropdown
 * - Filterung auf erlaubte Varianten
 * - Anzeige des monatlichen Aufschlags
 */
export function SubVariantSelector({
  value,
  onChange,
  hardwareName,
  allowedSubVariants,
  subVariants,
  disabled,
}: SubVariantSelectorProps) {
  const [autoSuggested, setAutoSuggested] = useState<SubVariantId | undefined>();
  const [isManualOverride, setIsManualOverride] = useState(false);

  // Filtere auf erlaubte Varianten
  const filteredVariants = allowedSubVariants && allowedSubVariants.length > 0
    ? subVariants.filter((v) => allowedSubVariants.includes(v.id as SubVariantId))
    : subVariants;

  // Auto-Vorschlag bei Hardware-Wechsel
  useEffect(() => {
    const suggested = inferSubVariantFromHardware(hardwareName);
    setAutoSuggested(suggested);
    
    // Nur automatisch ändern wenn:
    // 1. Noch keine manuelle Überschreibung
    // 2. Vorschlag ist erlaubt
    // 3. Aktuelle Auswahl entspricht nicht dem Vorschlag
    if (!isManualOverride && suggested) {
      const isAllowed = !allowedSubVariants || allowedSubVariants.includes(suggested);
      if (isAllowed && value !== suggested) {
        onChange(suggested);
      }
    }
  }, [hardwareName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle manuelle Änderung
  const handleChange = (newValue: string) => {
    setIsManualOverride(true);
    onChange(newValue);
  };

  // Reset zu Auto bei Hardware-Wechsel (optional)
  useEffect(() => {
    setIsManualOverride(false);
  }, [hardwareName]);

  // Nur SIM-Only erlaubt → zeige Info statt Dropdown
  if (filteredVariants.length === 1) {
    const onlyVariant = filteredVariants[0];
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm text-muted-foreground">Geräteklasse (SUB)</Label>
        </div>
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          <span className="font-medium">{onlyVariant.label}</span>
          <Badge variant="outline" className="text-xs">Nur diese Option</Badge>
        </div>
      </div>
    );
  }

  const selectedVariant = subVariants.find((v) => v.id === value);
  const showAutoSuggestBadge = autoSuggested && autoSuggested === value && !isManualOverride;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-muted-foreground" />
        <Label className="text-sm text-muted-foreground">Geräteklasse (SUB)</Label>
        {showAutoSuggestBadge && (
          <Badge variant="secondary" className="text-xs gap-1">
            <Sparkles className="w-3 h-3" />
            Auto
          </Badge>
        )}
      </div>
      <Select value={value} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Geräteklasse wählen" />
        </SelectTrigger>
        <SelectContent>
          {filteredVariants.map((variant) => (
            <SelectItem key={variant.id} value={variant.id}>
              <div className="flex items-center justify-between gap-4 w-full">
                <span>{variant.label}</span>
                {variant.monthlyAddNet > 0 && (
                  <span className="text-xs text-muted-foreground">
                    +{variant.monthlyAddNet}€/mtl.
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedVariant && selectedVariant.monthlyAddNet > 0 && (
        <p className="text-xs text-muted-foreground">
          Aufpreis: +{selectedVariant.monthlyAddNet}€ netto pro Monat
        </p>
      )}
    </div>
  );
}
