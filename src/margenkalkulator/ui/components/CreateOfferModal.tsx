// ============================================
// Create Offer Modal
// ============================================
//
// Modal zum Erstellen eines neuen Angebots mit
// Kundeninformationen, Optionen und Texten.
//
// ============================================

import { useState, useMemo, useCallback } from "react";
import { X, Search, User, Building, FileDown, Loader2, Mail, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useOfferBasket, DEFAULT_CUSTOMER_INFO, type OfferCustomerInfo } from "../../contexts/OfferBasketContext";
import { useCustomers, type Customer } from "../../hooks/useCustomers";
import { useAuth } from "@/hooks/useAuth";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { MultiOfferPdf } from "../../pdf/MultiOfferPdf";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fireConfetti } from "@/lib/confetti";
import { SendOfferEmailModal } from "./SendOfferEmailModal";
import { CreateCalendarEventModal } from "./CreateCalendarEventModal";

export function CreateOfferModal() {
  const { 
    isModalOpen, 
    closeModal, 
    items, 
    customer, 
    setCustomer,
    options,
    setOptions,
    anschreiben,
    setAnschreiben,
    angebotstext,
    setAngebotstext,
    resetOffer,
  } = useOfferBasket();
  
  const { customers, isLoading: customersLoading } = useCustomers();
  const { user } = useAuth();
  const { branding } = useTenantBranding();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [contactExpanded, setContactExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter customers for autocomplete
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return customers
      .filter(c => 
        c.company_name.toLowerCase().includes(q) ||
        c.contact_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [customers, searchQuery]);

  // Select a customer from search
  const selectCustomer = useCallback((c: Customer) => {
    setCustomer({
      ...customer,
      firma: c.company_name,
      anrede: (c.anrede as OfferCustomerInfo["anrede"]) || "",
      vorname: c.vorname || "",
      nachname: c.nachname || "",
      plz: c.plz || "",
      ort: c.ort || "",
      strasse: c.strasse || "",
      hausnummer: c.hausnummer || "",
    });
    setSearchQuery("");
    setShowCustomerSearch(false);
    toast.success("Kundendaten übernommen");
  }, [customer, setCustomer]);

  // Pre-fill contact person from logged-in user
  const prefillFromUser = useCallback(() => {
    if (user?.email) {
      setCustomer({
        ...customer,
        apEmail: user.email,
        apName: user.user_metadata?.display_name || user.email.split("@")[0],
      });
    }
  }, [user, customer, setCustomer]);

  // Generate and download PDF
  const handleDownloadPdf = async () => {
    if (items.length === 0) {
      toast.error("Keine Tarife im Angebot");
      return;
    }

    setIsGenerating(true);
    try {
      const offerConfig = {
        customer,
        options,
        anschreiben,
        angebotstext,
        items,
        createdAt: new Date(),
      };

      const blob = await pdf(
        <MultiOfferPdf config={offerConfig} branding={branding} />
      ).toBlob();

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Angebot_${customer.firma || "Kunde"}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF erfolgreich erstellt");
      fireConfetti({ duration: 3000 });
      resetOffer();
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Fehler beim Erstellen der PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">neues Angebot erstellen</DialogTitle>
        </DialogHeader>

        {/* Info Banner */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 mb-4">
          <p className="text-amber-800 dark:text-amber-200 font-medium">
            Angebot für einen Kunden erstellen
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            Wir bitten Sie folgendes Formular für den Angebotsdruck auszufüllen. 
            Im Anschluss drücken Sie bitte auf <strong>Angebot erstellen</strong>
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Kontaktdaten */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Building className="w-5 h-5" />
              Kontaktdaten
            </h3>

            <div>
              <Label htmlFor="firma">Firma</Label>
              <Input
                id="firma"
                value={customer.firma}
                onChange={(e) => setCustomer({ ...customer, firma: e.target.value })}
                placeholder="Firmenname"
              />
            </div>

            <div>
              <Label htmlFor="anrede">Anrede</Label>
              <Select
                value={customer.anrede}
                onValueChange={(v) => setCustomer({ ...customer, anrede: v as OfferCustomerInfo["anrede"] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bitte wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Herr">Herr</SelectItem>
                  <SelectItem value="Frau">Frau</SelectItem>
                  <SelectItem value="Divers">Divers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="vorname">Vorname</Label>
                <Input
                  id="vorname"
                  value={customer.vorname}
                  onChange={(e) => setCustomer({ ...customer, vorname: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="nachname">Nachname</Label>
                <Input
                  id="nachname"
                  value={customer.nachname}
                  onChange={(e) => setCustomer({ ...customer, nachname: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="land">Land</Label>
              <Select
                value={customer.land}
                onValueChange={(v) => setCustomer({ ...customer, land: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Deutschland">Deutschland</SelectItem>
                  <SelectItem value="Österreich">Österreich</SelectItem>
                  <SelectItem value="Schweiz">Schweiz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="plz">PLZ</Label>
                <Input
                  id="plz"
                  value={customer.plz}
                  onChange={(e) => setCustomer({ ...customer, plz: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="ort">Ort</Label>
                <Input
                  id="ort"
                  value={customer.ort}
                  onChange={(e) => setCustomer({ ...customer, ort: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label htmlFor="strasse">Straße</Label>
                <Input
                  id="strasse"
                  value={customer.strasse}
                  onChange={(e) => setCustomer({ ...customer, strasse: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="hausnummer">Nr.</Label>
                <Input
                  id="hausnummer"
                  value={customer.hausnummer}
                  onChange={(e) => setCustomer({ ...customer, hausnummer: e.target.value })}
                />
              </div>
            </div>

            {/* Customer Search */}
            <div className="pt-4 border-t">
              <Label className="text-muted-foreground">vorhandenen Kunden suchen</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Kunde suchen ..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowCustomerSearch(true);
                  }}
                  onFocus={() => setShowCustomerSearch(true)}
                  className="pl-9"
                />
                
                {showCustomerSearch && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                      >
                        <p className="font-medium">{c.company_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.contact_name} {c.email && `• ${c.email}`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hideProvider"
                  checked={options.hideProviderName}
                  onCheckedChange={(c) => setOptions({ ...options, hideProviderName: !!c })}
                />
                <Label htmlFor="hideProvider" className="cursor-pointer">
                  Versorgernamen ausblenden
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hideTariff"
                  checked={options.hideTariffName}
                  onCheckedChange={(c) => setOptions({ ...options, hideTariffName: !!c })}
                />
                <Label htmlFor="hideTariff" className="cursor-pointer">
                  Tarifnamen ausblenden
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Wenn diese Option gesetzt wird, werden von allen Tarifen im Angebot keine 
                Versorger- und Tarifnamen angezeigt. Lediglich Preise werden auf das Angebot gedruckt.
              </p>
            </div>
          </div>

          {/* Right Column - Ansprechpartner */}
          <div className="space-y-4">
            <Collapsible open={contactExpanded} onOpenChange={setContactExpanded}>
              <CollapsibleTrigger className="flex items-center gap-2 font-semibold text-lg w-full text-left">
                <User className="w-5 h-5" />
                Ansprechpartner
                <span className={cn("text-xs ml-auto transition-transform", contactExpanded && "rotate-180")}>
                  ▼
                </span>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 mt-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={customer.apName}
                    onChange={(e) => setCustomer({ ...customer, apName: e.target.value })}
                    placeholder="Ansprechpartner Name"
                  />
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={prefillFromUser}
                    className="px-0 text-xs"
                  >
                    Aus Login übernehmen
                  </Button>
                </div>

                <div>
                  <Label>Anrede</Label>
                  <Select
                    value={customer.apAnrede}
                    onValueChange={(v) => setCustomer({ ...customer, apAnrede: v as OfferCustomerInfo["anrede"] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bitte wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Herr">Herr</SelectItem>
                      <SelectItem value="Frau">Frau</SelectItem>
                      <SelectItem value="Divers">Divers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Vorname</Label>
                    <Input
                      value={customer.apVorname}
                      onChange={(e) => setCustomer({ ...customer, apVorname: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Nachname</Label>
                    <Input
                      value={customer.apNachname}
                      onChange={(e) => setCustomer({ ...customer, apNachname: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Land</Label>
                  <Select
                    value={customer.apLand}
                    onValueChange={(v) => setCustomer({ ...customer, apLand: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Deutschland">Deutschland</SelectItem>
                      <SelectItem value="Österreich">Österreich</SelectItem>
                      <SelectItem value="Schweiz">Schweiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>PLZ</Label>
                    <Input
                      value={customer.apPlz}
                      onChange={(e) => setCustomer({ ...customer, apPlz: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Ort</Label>
                    <Input
                      value={customer.apOrt}
                      onChange={(e) => setCustomer({ ...customer, apOrt: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label>Straße</Label>
                    <Input
                      value={customer.apStrasse}
                      onChange={(e) => setCustomer({ ...customer, apStrasse: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Nr.</Label>
                    <Input
                      value={customer.apHausnummer}
                      onChange={(e) => setCustomer({ ...customer, apHausnummer: e.target.value })}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Kontakt Section - Always visible */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                Kontakt
                <span className="text-xs">▲</span>
              </h4>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Vorwahl</Label>
                  <Input
                    placeholder="0173"
                    value={customer.apTelefon?.split(" ")[0] || ""}
                    onChange={(e) => {
                      const rest = customer.apTelefon?.split(" ").slice(1).join(" ") || "";
                      setCustomer({ ...customer, apTelefon: `${e.target.value} ${rest}`.trim() });
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Rufnummer (Mobil)</Label>
                  <Input
                    value={customer.apMobil}
                    onChange={(e) => setCustomer({ ...customer, apMobil: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">E-Mail</Label>
                <Input
                  type="email"
                  value={customer.apEmail}
                  onChange={(e) => setCustomer({ ...customer, apEmail: e.target.value })}
                  className="border-amber-400"
                />
              </div>

              <div>
                <Label className="text-xs">Webseite</Label>
                <Input
                  value={customer.apWebseite}
                  onChange={(e) => setCustomer({ ...customer, apWebseite: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Anschreiben & Angebotstext */}
        <div className="space-y-4 mt-6 border-t pt-6">
          <div>
            <Label htmlFor="anschreiben" className="text-lg font-semibold">Anschreiben</Label>
            <Textarea
              id="anschreiben"
              value={anschreiben}
              onChange={(e) => setAnschreiben(e.target.value)}
              placeholder="Optionaler Einleitungstext vor der Tarifübersicht..."
              className="min-h-[100px] mt-2"
            />
          </div>

          <div>
            <Label htmlFor="angebotstext" className="text-lg font-semibold">
              Angebotstext (nach der Tarifübersicht)
            </Label>
            <Textarea
              id="angebotstext"
              value={angebotstext}
              onChange={(e) => setAngebotstext(e.target.value)}
              className="min-h-[100px] mt-2"
            />
          </div>
        </div>

        {/* Tarife Summary */}
        <div className="bg-muted p-4 rounded-lg mt-4">
          <p className="font-medium mb-2">{items.length} Tarife im Angebot:</p>
          <ul className="text-sm space-y-1">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>{item.name}</span>
                <span className="text-muted-foreground">
                  {item.result.totals.avgTermNet.toFixed(2)} €/mtl.
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={closeModal}>
            Abbrechen
          </Button>
          
          {/* Calendar Event Button */}
          <CreateCalendarEventModal
            trigger={
              <Button
                variant="outline"
                disabled={items.length === 0}
                className="gap-2"
              >
                <Calendar className="w-4 h-4" />
                Termin
              </Button>
            }
          />
          
          {/* Email Send Button */}
          <SendOfferEmailModal
            trigger={
              <Button
                variant="outline"
                disabled={items.length === 0}
                className="gap-2"
              >
                <Mail className="w-4 h-4" />
                E-Mail
              </Button>
            }
          />
          
          <Button
            onClick={handleDownloadPdf}
            disabled={items.length === 0 || isGenerating}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird erstellt...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
