// ============================================
// Quick Save Offer Button
// Ermöglicht schnelles Speichern eines Angebots mit Kunden-Zuordnung
// ============================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, User, Loader2 } from "lucide-react";
import { useCloudOffers } from "@/margenkalkulator/hooks/useCloudOffers";
import { useCustomers } from "@/margenkalkulator/hooks/useCustomers";
import { CustomerSelector } from "./CustomerSelector";
import { toast } from "sonner";
import type { OfferOptionState, CalculationResult } from "../../engine/types";

interface QuickSaveOfferButtonProps {
  config: OfferOptionState;
  result: CalculationResult;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
}

export function QuickSaveOfferButton({
  config,
  result,
  variant = "default",
  size = "sm",
}: QuickSaveOfferButtonProps) {
  const [open, setOpen] = useState(false);
  const [offerName, setOfferName] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { createOffer } = useCloudOffers();
  const { customers } = useCustomers();

  // Generate default offer name
  const getDefaultName = () => {
    const hardware = config.hardware.name || "SIM-Only";
    const tariff = config.mobile.tariffId || "Tarif";
    const date = new Date().toLocaleDateString("de-DE");
    return `${hardware} + ${tariff} (${date})`;
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setOfferName(getDefaultName());
      setSelectedCustomerId(null);
    }
    setOpen(isOpen);
  };

  const handleSave = async () => {
    if (!offerName.trim()) {
      toast.error("Bitte geben Sie einen Namen für das Angebot ein.");
      return;
    }

    createOffer.mutate({
      name: offerName.trim(),
      config,
      avgMonthly: result.totals.avgTermNet,
      customerId: selectedCustomerId,
    }, {
      onSuccess: () => {
        toast.success("Angebot gespeichert!");
        setOpen(false);
      },
      onError: () => {
        toast.error("Fehler beim Speichern des Angebots.");
      },
    });
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Save className="w-4 h-4" />
          Speichern
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Angebot speichern</DialogTitle>
          <DialogDescription>
            Speichern Sie dieses Angebot für spätere Verwendung.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Offer Name */}
          <div className="space-y-2">
            <Label htmlFor="offer-name">Angebotsname</Label>
            <Input
              id="offer-name"
              value={offerName}
              onChange={(e) => setOfferName(e.target.value)}
              placeholder="z.B. iPhone 16 + Prime M"
            />
          </div>

          {/* Customer Selection (Optional) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Kunde zuordnen (optional)
            </Label>
            <CustomerSelector
              value={selectedCustomerId}
              onChange={setSelectedCustomerId}
            />
            {selectedCustomer && (
              <p className="text-sm text-muted-foreground">
                Ausgewählt: {selectedCustomer.company_name}
                {selectedCustomer.contact_name && ` (${selectedCustomer.contact_name})`}
              </p>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hardware:</span>
              <span>{config.hardware.name || "SIM-Only"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tarif:</span>
              <span>{config.mobile.tariffId || "—"}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Ø Monatspreis:</span>
              <span>{result.totals.avgTermNet.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={createOffer.isPending}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={createOffer.isPending} className="gap-2">
            {createOffer.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
