// ============================================
// Offer Basket Panel - "Angebotsdruck" UI
// ============================================
//
// Zeigt die gesammelten Tarife an und ermöglicht
// das Erstellen eines neuen Angebots.
//
// ============================================

import { useState } from "react";
import { ChevronDown, X, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useOfferBasket } from "../../contexts/OfferBasketContext";
import { cn } from "@/lib/utils";

export function OfferBasketPanel() {
  const { items, itemCount, removeItem, openModal } = useOfferBasket();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-xs rounded-lg overflow-hidden shadow-lg border-2 border-amber-400 bg-card">
      {/* Header - Amber/Orange like reference */}
      <div className="bg-amber-400 px-4 py-3">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Angebotsdruck
        </h3>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Info Text */}
        <div className="mb-4">
          <h4 className="text-sky-500 font-semibold mb-2">Tarif hinzufügen</h4>
          <p className="text-sm text-muted-foreground">
            Um einen Tarif zum Angebot hinzuzufügen, klicken Sie in der Ergebnisliste bei dem jeweiligen Tarif auf zum Angebot hinzufügen.
          </p>
        </div>
        
        {/* Tariff Count / Dropdown */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              <span className="flex items-center gap-2">
                {itemCount > 0 && <span className="text-amber-600">✓</span>}
                {itemCount} {itemCount === 1 ? "Tarif" : "Tarife"} im Angebot
              </span>
              <ChevronDown 
                className={cn(
                  "w-4 h-4 transition-transform",
                  isOpen && "rotate-180"
                )} 
              />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-2">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-2 px-3 bg-muted rounded">
                Noch keine Tarife hinzugefügt
              </p>
            ) : (
              <ul className="space-y-1 bg-muted rounded p-2">
                {items.map((item) => (
                  <li 
                    key={item.id}
                    className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-background group"
                  >
                    <span className="truncate flex-1">{item.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity p-1"
                      title="Entfernen"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleContent>
        </Collapsible>
        
        {/* Create Offer Button */}
        <Button
          onClick={openModal}
          disabled={itemCount === 0}
          className="w-full mt-4 bg-amber-400 hover:bg-amber-500 text-white border-2 border-amber-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          neues Angebot erstellen
        </Button>
      </div>
    </div>
  );
}
