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
  // Auto-open when items exist
  const [isOpen, setIsOpen] = useState(items.length > 0);

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-lg border-2 border-amber-400 bg-card">
      {/* Header - Amber/Orange like reference */}
      <div className="bg-amber-400 px-4 py-3 flex items-center justify-between">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Angebots-Korb
        </h3>
        {itemCount > 0 && (
          <span className="bg-white text-amber-600 text-sm font-bold px-2 py-0.5 rounded-full">
            {itemCount}
          </span>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Tariff Count / Dropdown */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              <span className="flex items-center gap-2">
                {itemCount > 0 && <span className="text-amber-600">✓</span>}
                {itemCount} {itemCount === 1 ? "Tarif" : "Tarife"} gesammelt
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
                    <div className="flex-1 min-w-0">
                      <span className="truncate block font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.result.totals.avgTermNet.toFixed(2)} €/Monat
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity p-1 ml-2"
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
          Angebot erstellen
        </Button>
        
        {/* Info hint */}
        {itemCount === 0 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Konfiguriere einen Tarif und klicke auf "zum Angebot hinzufügen"
          </p>
        )}
      </div>
    </div>
  );
}
