// ============================================
// Offer Basket Panel - Redesign
// Clean amber-header basket widget
// ============================================

import { useState } from "react";
import { ChevronDown, X, Plus, FileText, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useOfferBasket } from "../../contexts/OfferBasketContext";
import { formatMonthlyPrice } from "../../lib/formatters";
import { cn } from "@/lib/utils";

export function OfferBasketPanel() {
  const { items, itemCount, removeItem, openModal } = useOfferBasket();
  const [isOpen, setIsOpen] = useState(items.length > 0);

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
      {/* Amber Header */}
      <div className="bg-amber-400 px-4 py-3 flex items-center justify-between">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Angebots-Korb
        </h3>
        {itemCount > 0 && (
          <span className="bg-white text-amber-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {itemCount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between border-gray-200 hover:bg-gray-50 text-sm"
            >
              <span className="flex items-center gap-2">
                {itemCount > 0 && <span className="text-amber-600">✓</span>}
                {itemCount} {itemCount === 1 ? "Tarif" : "Tarife"} gesammelt
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform text-gray-400",
                  isOpen && "rotate-180"
                )}
              />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-2">
            {items.length === 0 ? (
              <div className="py-4 px-3 bg-gray-50 rounded-lg text-center">
                <ShoppingCart className="w-6 h-6 mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-medium text-gray-500">Warenkorb ist leer</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Konfiguriere einen Tarif und füge ihn hinzu
                </p>
              </div>
            ) : (
              <ul className="space-y-1 bg-gray-50 rounded-lg p-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-white group"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="truncate block font-medium text-gray-900 text-xs">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {formatMonthlyPrice(item.result.totals.avgTermNet)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity p-1 ml-2"
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
          size="sm"
          className="w-full mt-3 bg-amber-400 hover:bg-amber-500 text-white font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Angebot erstellen
        </Button>

        {itemCount === 0 && (
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            Konfiguriere einen Tarif und klicke auf "Zum Angebot"
          </p>
        )}
      </div>
    </div>
  );
}
