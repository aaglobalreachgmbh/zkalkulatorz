// ============================================
// Add to Offer Button
// ============================================
//
// Button zum Hinzufügen eines Tarifs zum Angebot.
// Wird in der Kalkulations-Ansicht angezeigt.
//
// ============================================

import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOfferBasket } from "../../contexts/OfferBasketContext";
import type { OfferOptionState, CalculationResult } from "../../engine/types";
import { toast } from "sonner";
import { useMemo } from "react";

interface AddToOfferButtonProps {
  option: OfferOptionState;
  result: CalculationResult;
  className?: string;
}

export function AddToOfferButton({ option, result, className }: AddToOfferButtonProps) {
  const { addItem, items } = useOfferBasket();

  // Generate a descriptive name for this tariff
  const tariffName = useMemo(() => {
    const tariffBreakdown = result.breakdown.find(b => b.ruleId === "base");
    const baseName = tariffBreakdown?.label?.replace(" Grundpreis", "") || option.mobile.tariffId;
    
    const parts = [baseName];
    
    if (option.mobile.quantity > 1) {
      parts.push(`(×${option.mobile.quantity})`);
    }
    
    if (option.hardware.ekNet > 0) {
      parts.push(`+ ${option.hardware.name}`);
    }
    
    return parts.join(" ");
  }, [option, result]);

  // Check if already added (by comparing tariffId and hardware)
  const isAlreadyAdded = items.some(
    item => 
      item.option.mobile.tariffId === option.mobile.tariffId &&
      item.option.hardware.name === option.hardware.name &&
      item.option.mobile.contractType === option.mobile.contractType
  );

  const handleAdd = () => {
    addItem(tariffName, option, result);
    toast.success(`"${tariffName}" zum Angebot hinzugefügt`);
  };

  if (isAlreadyAdded) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled
          className={className}
        >
          <Check className="w-4 h-4 mr-2 text-emerald-500" />
          Im Angebot
        </Button>
        <Button
          variant="link"
          size="sm"
          onClick={() => {
            // Reset wizard state to allow adding another tariff
            toast.info("Konfiguriere den nächsten Tarif und füge ihn hinzu");
          }}
          className="text-primary text-xs"
        >
          + Weiteren Tarif hinzufügen
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAdd}
      className={`bg-amber-400 hover:bg-amber-500 text-white border-amber-500 ${className}`}
    >
      <Plus className="w-4 h-4 mr-2" />
      zum Angebot hinzufügen
    </Button>
  );
}
