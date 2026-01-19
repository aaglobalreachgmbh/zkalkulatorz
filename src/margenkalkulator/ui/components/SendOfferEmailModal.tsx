// ============================================
// Send Offer Email Modal
// ============================================

import { useState, useCallback } from "react";
import { Mail, Loader2, Send, User, AtSign, MessageSquare, Eye, EyeOff, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useSendOfferEmail } from "../../hooks/useSendOfferEmail";
import { useOfferEmails } from "../../hooks/useOfferEmails";
import { useCloudOffers } from "../../hooks/useCloudOffers";
import { useAuth } from "@/hooks/useAuth";
import { useOfferBasket } from "../../contexts/OfferBasketContext";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { MultiOfferPdf } from "../../pdf/MultiOfferPdf";
import { EmailPreviewPanel } from "./EmailPreviewPanel";
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
  const [activeTab, setActiveTab] = useState("compose");
  const [saveToCloud, setSaveToCloud] = useState(true);

  const { sendEmail, isSending } = useSendOfferEmail();
  const { logSentEmail } = useOfferEmails();
  const { createOffer } = useCloudOffers();
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

  // Get sender info
  const senderName = user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Ihr Berater";
  const senderEmail = user?.email;

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
        gdprConsentGiven: true, // Implicit consent by user action
        gdprConsentTimestamp: new Date().toISOString(),
      });

      if (result.success) {
        // Log to email history
        await logSentEmail({
          recipient_email: recipientEmail,
          recipient_name: recipientName || undefined,
          subject,
          message: message || undefined,
          offer_data: JSON.parse(JSON.stringify(items)),
          resend_message_id: result.messageId,
        });

        // Auto-save offer to cloud if enabled
        if (saveToCloud && items.length > 0) {
          const firstItem = items[0];
          const offerName = `${customer.firma || recipientName || "Angebot"} - ${new Date().toLocaleDateString("de-DE")}`;

          // Use the config from the first basket item
          const baseConfig = firstItem.option;
          const avgMonthly = items.reduce((sum, item) => sum + (item.result?.totals?.avgTermNet || 0), 0) / items.length;

          createOffer.mutate({
            name: offerName,
            config: baseConfig,
            avgMonthly,
            customerId: null, // Could be enhanced to link to customer if we have ID
          });
        }

        setIsOpen(false);
        // Reset form
        setRecipientEmail("");
        setRecipientName("");
        setMessage("");
        setActiveTab("compose");
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
        {trigger ? (trigger as React.ReactElement) : (
          <Button variant="outline" size="sm" className="gap-2">
            <Mail className="w-4 h-4" />
            Per E-Mail senden
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Angebot per E-Mail senden
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Verfassen
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" />
              Vorschau
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="mt-4 space-y-4">
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

            {/* Save to Cloud Option */}
            <div className="flex items-center justify-between bg-muted p-3 rounded-md">
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Angebot automatisch speichern</p>
                  <p className="text-xs text-muted-foreground">Nach dem Senden in der Cloud speichern</p>
                </div>
              </div>
              <Switch
                checked={saveToCloud}
                onCheckedChange={setSaveToCloud}
              />
            </div>

            {/* Info */}
            <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
              <p>
                <strong>{items.length} Tarife</strong> werden als PDF-Anhang gesendet.
              </p>
              <p className="mt-1 text-xs">
                Absender: {senderName}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                So sieht die E-Mail für den Empfänger aus:
              </p>
              <EmailPreviewPanel
                recipientName={recipientName}
                senderName={senderName}
                senderEmail={senderEmail}
                message={message}
                tariffCount={items.length}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-between gap-2 pt-4 border-t mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(activeTab === "preview" ? "compose" : "preview")}
          >
            {activeTab === "preview" ? (
              <>
                <EyeOff className="w-4 h-4 mr-1" />
                Bearbeiten
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1" />
                Vorschau
              </>
            )}
          </Button>

          <div className="flex gap-2">
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
