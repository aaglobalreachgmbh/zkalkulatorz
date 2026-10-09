import { useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { OfferBasketPanel } from "./OfferBasketPanel";
import { useOfferBasket } from "../../contexts/OfferBasketContext";

interface MobileBasketSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Mobile access to the complete basket, extras and offer creation flow. */
export function MobileBasketSheet({ open, onOpenChange }: MobileBasketSheetProps) {
  const { isModalOpen } = useOfferBasket();

  useEffect(() => {
    if (isModalOpen) onOpenChange(false);
  }, [isModalOpen, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[88svh] overflow-y-auto rounded-t-lg p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:hidden"
      >
        <SheetHeader className="mb-3 text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Angebot bearbeiten
          </SheetTitle>
        </SheetHeader>
        <OfferBasketPanel />
      </SheetContent>
    </Sheet>
  );
}