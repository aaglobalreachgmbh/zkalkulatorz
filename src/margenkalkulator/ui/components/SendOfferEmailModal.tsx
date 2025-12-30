// ============================================
// Send Offer Email Modal
// ============================================

import { useState, useCallback } from "react";
import { Mail, Loader2, Send, User, AtSign, Phone, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSendOfferEmail } from "../../hooks/useSendOfferEmail";
import { useAuth } from "@/hooks/useAuth";
import { useOfferBasket } from "../../contexts/OfferBasketContext";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { MultiOfferPdf } from "../../pdf/MultiOfferPdf";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";

interface SendOfferEmailModalProps {
  trigger?: React.ReactNode;
}

export function SendOfferEmailModal({ trigger }: SendOfferEmailModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState("Ihr persönliches Angebot");
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { sendEmail, isSending } = useSendOfferEmail();
  const { user } = useAuth();
  const { items, customer, options, anschreiben, angebotstext } = useOfferBasket();
  const { branding } = useTenantBranding();

  // Pre-fill from customer data
  const prefillFromBasket = useCallback(() => {
    if (customer.apEmail) {
      setRecipientEmail(customer.apEmail);
    }
    const fullName = [customer.vorname, customer.nachname].filter(Boolean).join(" ");
    if (fullName) {
      setRecipientName(fullName);
    } else if (customer.firma) {
      setRecipientName(customer.firma);
    }
  }, [customer]);

  // Generate PDF and send email
  const handleSend = async () => {
    if (!recipientEmail) {
      toast.error("Bitte E-Mail-Adresse eingeben");
      return;
    }

    if (items.length === 0) {
      toast.error("Keine Tarife im Angebot");
      return;
    }

    setIsGenerating(true);
    try {
      // Build offer config
      const offerConfig = {
        customer,
        options,
        anschreiben,
        angebotstext,
        items,
        createdAt: new Date(),
      };

      // Generate PDF
      const pdfBlob = await pdf(
        <MultiOfferPdf config={offerConfig} branding={branding} />
      ).toBlob();

      // Convert to base64
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      // Prepare sender info
      const senderName = user?.user_metadata?.display_name || 
                         user?.email?.split("@")[0] || 
                         "Ihr Berater";
      const senderEmail = user?.email;

      // Send email
      const result = await sendEmail({
        recipientEmail,
        recipientName,
        senderName,
        senderEmail,
        subject,
        message: message || undefined,
        pdfBase64: base64,
        pdfFilename: `Angebot_${customer.firma || "Kunde"}_${new Date().toISOString().split("T")[0]}.pdf`,
      });

      if (result.success) {
        setIsOpen(false);
        // Reset form
        setRecipientEmail("");
        setRecipientName("");
        setMessage("");
      }
    } catch (error) {
      console.error("Error generating PDF for email:", error);
      toast.error("Fehler beim Erstellen der PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const isLoading = isSending || isGenerating;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Mail className="w-4 h-4" />
            Per E-Mail senden
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Angebot per E-Mail senden
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Pre-fill button */}
          {(customer.apEmail || customer.vorname || customer.firma) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={prefillFromBasket}
              className="w-full text-xs"
            >
              Kundendaten übernehmen
            </Button>
          )}

          {/* Recipient Email */}
          <div>
            <Label htmlFor="recipient-email" className="flex items-center gap-1">
              <AtSign className="w-3.5 h-3.5" />
              E-Mail-Adresse *
            </Label>
            <Input
              id="recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="kunde@beispiel.de"
              required
            />
          </div>

          {/* Recipient Name */}
          <div>
            <Label htmlFor="recipient-name" className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              Empfänger-Name
            </Label>
            <Input
              id="recipient-name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Max Mustermann"
            />
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Betreff</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ihr persönliches Angebot"
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message" className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              Persönliche Nachricht (optional)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ergänzende Informationen zum Angebot..."
              rows={3}
            />
          </div>

          {/* Info */}
          <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
            <p>
              <strong>{items.length} Tarife</strong> werden als PDF-Anhang gesendet.
            </p>
            <p className="mt-1 text-xs">
              Absender: {user?.user_metadata?.display_name || user?.email || "Sie"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSend}
              disabled={isLoading || !recipientEmail || items.length === 0}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isGenerating ? "PDF wird erstellt..." : "Wird gesendet..."}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Angebot senden
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
