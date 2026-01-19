import { useState, useMemo } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { de } from "date-fns/locale";
import { Loader2, Calendar, Smartphone, Signal, CreditCard, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CloudOffer } from "@/margenkalkulator/hooks/useCloudOffers";
import type { ContractInput } from "@/margenkalkulator/hooks/useCustomerContracts";

interface OfferToContractDialogProps {
  offer: CloudOffer | null;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (contract: ContractInput) => Promise<void>;
  isCreating: boolean;
}

export function OfferToContractDialog({
  offer,
  isOpen,
  onClose,
  onCreate,
  isCreating,
}: OfferToContractDialogProps) {
  const [startDate, setStartDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  // Calculate end date and VVL date based on start date
  const calculatedDates = useMemo(() => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const end = addMonths(start, 24);
    const vvl = subMonths(end, 3);
    return {
      vertragsende: format(end, "yyyy-MM-dd"),
      vertragsendeDisplay: format(end, "dd.MM.yyyy", { locale: de }),
      vvl_datum: format(vvl, "yyyy-MM-dd"),
      vvlDisplay: format(vvl, "dd.MM.yyyy", { locale: de }),
    };
  }, [startDate]);

  const handleCreate = async () => {
    if (!offer || !offer.customer_id || !calculatedDates) return;

    const contractInput: ContractInput = {
      customer_id: offer.customer_id,
      netz: "vodafone",
      tarif_name: offer.preview?.tariff || offer.config?.mobile?.tariffId || "",
      hardware_name: offer.preview?.hardware || offer.config?.hardware?.name || "",
      monatspreis: offer.preview?.avgMonthly || 0,
      ek_preis: offer.config?.hardware?.ekNet || 0,
      vertragsbeginn: startDate,
      vertragsende: calculatedDates.vertragsende,
      vvl_datum: calculatedDates.vvl_datum,
      status: "aktiv",
      notes: `Erstellt aus Angebot: ${offer.name}`,
    };

    await onCreate(contractInput);
  };

  if (!offer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Angebot als Vertrag anlegen
          </DialogTitle>
          <DialogDescription>
            Übernehme die Daten aus dem Angebot und lege einen neuen Vertrag an.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Offer Summary */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <p className="font-medium text-sm">{offer.name}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                <span>{offer.preview?.hardware || "SIM Only"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Signal className="h-4 w-4" />
                <span>{offer.preview?.tariff || "Kein Tarif"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span>{offer.preview?.avgMonthly?.toFixed(2) || "0.00"} €/Monat</span>
              </div>
              {offer.config?.hardware?.ekNet && offer.config.hardware.ekNet > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs">EK:</span>
                  <span>{offer.config.hardware.ekNet.toFixed(2)} €</span>
                </div>
              )}
            </div>
          </div>

          {/* Start Date Input */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Vertragsbeginn
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Calculated Dates */}
          {calculatedDates && (
            <div className="rounded-lg border bg-accent/30 p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vertragsende (24 Monate):</span>
                <span className="font-medium">{calculatedDates.vertragsendeDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VVL-Datum (3 Monate vorher):</span>
                <span className="font-medium">{calculatedDates.vvlDisplay}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Abbrechen
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !startDate}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Wird erstellt...
              </>
            ) : (
              "Vertrag anlegen"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
