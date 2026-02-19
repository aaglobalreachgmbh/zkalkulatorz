// ============================================
// Offer Basket Panel - Screenshot Rebuild
// Minimal, flat design
// ============================================

import { useState } from "react";
import { ChevronDown, X, Plus, ShoppingCart } from "lucide-react";
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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-2.5 flex items-center justify-between">
        <span className="text-white font-semibold text-xs flex items-center gap-2 uppercase tracking-wider">
          <ShoppingCart className="w-3.5 h-3.5" />
          Basket
        </span>
        {itemCount > 0 && (
          <span className="bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-700 py-1.5 px-2 rounded hover:bg-gray-50 transition-colors">
              <span>{itemCount} {itemCount === 1 ? "Tarif" : "Tarife"} gesammelt</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-1.5">
            {items.length === 0 ? (
              <div className="py-3 text-center">
                <p className="text-[11px] text-gray-400">Noch keine Tarife hinzugefügt</p>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-gray-50 group"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="truncate block font-medium text-gray-800">{item.name}</span>
                      <span className="text-[10px] text-gray-400">{formatMonthlyPrice(item.result.totals.avgTermNet)}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-0.5 ml-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Button
          onClick={openModal}
          disabled={itemCount === 0}
          size="sm"
          className="w-full mt-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Angebot erstellen
        </Button>
      </div>
    </div>
  );
}
