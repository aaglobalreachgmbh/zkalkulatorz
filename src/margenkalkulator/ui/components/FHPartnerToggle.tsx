// ============================================
// FH-Partner Toggle Component
// Fachhändler-Bonus aktivieren/deaktivieren
// ============================================

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Building2, HelpCircle } from "lucide-react";

interface FHPartnerToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  fhPartnerProvision?: number;
  disabled?: boolean;
}

/**
 * FH-Partner Toggle
 * 
 * ZWECK:
 * Aktiviert den Fachhändler-Bonus, der zur Standard-Provision addiert wird.
 * 
 * GESCHÄFTSLOGIK:
 * - FH-Partner = Fachhändler-Partner (spezieller Vertriebskanal)
 * - Bei Aktivierung wird tariff.fhPartnerNet zur Provision addiert
 * - Nur anzeigen wenn Tarif einen FH-Partner-Wert hat
 */
export function FHPartnerToggle({
  checked,
  onChange,
  fhPartnerProvision,
  disabled,
}: FHPartnerToggleProps) {
  // Nicht anzeigen wenn kein FH-Partner-Wert vorhanden
  if (fhPartnerProvision === undefined || fhPartnerProvision === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-3">
        <Checkbox
          id="fh-partner"
          checked={checked}
          onCheckedChange={(state) => onChange(!!state)}
          disabled={disabled}
        />
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="fh-partner" className="font-normal cursor-pointer">
            FH-Partner-Provision aktivieren
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Fachhändler-Partner erhalten eine zusätzliche Provision von{" "}
                  <strong>{fhPartnerProvision}€</strong> pro Vertrag.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {checked && (
        <span className="text-sm font-medium text-green-600 dark:text-green-400">
          +{fhPartnerProvision}€
        </span>
      )}
    </div>
  );
}
