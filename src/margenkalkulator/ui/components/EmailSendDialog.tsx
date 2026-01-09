// ============================================
// DSGVO-Compliant Email Send Dialog
// ============================================

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Loader2, 
  ShieldCheck, 
  AlertTriangle,
  User,
  Building2,
  Send,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useSendOfferEmail } from "@/margenkalkulator/hooks/useSendOfferEmail";
import { useOfferEmails } from "@/margenkalkulator/hooks/useOfferEmails";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { useAuth } from "@/hooks/useAuth";

interface EmailSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfBase64: string;
  pdfFilename: string;
  offerId: string;
  sharedOfferId?: string;
  customerName?: string;
  customerEmail?: string;
  onSuccess?: () => void;
}

interface EmailFormData {
  recipientName: string;
  recipientEmail: string;
  subject: string;
  message: string;
  gdprConsentGiven: boolean;
}

const DEFAULT_MESSAGE = `Sehr geehrte Damen und Herren,

anbei finden Sie Ihr persönliches Angebot als PDF-Dokument.

Bei Fragen stehe ich Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen`;

export function EmailSendDialog({
  open,
  onOpenChange,
  pdfBase64,
  pdfFilename,
  offerId,
  sharedOfferId,
  customerName = "",
  customerEmail = "",
  onSuccess,
}: EmailSendDialogProps) {
  const { sendEmail, isSending } = useSendOfferEmail();
  const { logSentEmail } = useOfferEmails();
  const { branding } = useTenantBranding();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<EmailFormData>({
    recipientName: customerName,
    recipientEmail: customerEmail,
    subject: `Ihr Vodafone Business Angebot ${offerId}`,
    message: DEFAULT_MESSAGE,
    gdprConsentGiven: false,
  });
  
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [errors, setErrors] = useState<Partial<Record<keyof EmailFormData, string>>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        recipientName: customerName,
        recipientEmail: customerEmail,
        subject: `Ihr Vodafone Business Angebot ${offerId}`,
        message: DEFAULT_MESSAGE,
        gdprConsentGiven: false,
      });
      setStep('form');
      setErrors({});
    }
  }, [open, customerName, customerEmail, offerId]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof EmailFormData, string>> = {};
    
    // Validate recipient name
    if (!formData.recipientName.trim()) {
      newErrors.recipientName = "Name ist erforderlich";
    }
    
    // Validate email (strict pattern for German business)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.recipientEmail.trim()) {
      newErrors.recipientEmail = "E-Mail-Adresse ist erforderlich";
    } else if (!emailRegex.test(formData.recipientEmail)) {
      newErrors.recipientEmail = "Ungültige E-Mail-Adresse";
    }
    
    // Validate subject
    if (!formData.subject.trim()) {
      newErrors.subject = "Betreff ist erforderlich";
    }
    
    // CRITICAL: GDPR consent is mandatory
    if (!formData.gdprConsentGiven) {
      newErrors.gdprConsentGiven = "DSGVO-Einwilligung ist erforderlich";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSend = useCallback(async () => {
    if (!validateForm()) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }
    
    try {
      const result = await sendEmail({
        recipientEmail: formData.recipientEmail.trim(),
        recipientName: formData.recipientName.trim(),
        senderName: user?.user_metadata?.display_name || "Ihr Vodafone Partner",
        senderEmail: user?.email,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        pdfBase64,
        pdfFilename,
      });

      if (result.success) {
        // Log to offer_emails for GDPR compliance
        await logSentEmail({
          recipient_email: formData.recipientEmail.trim(),
          recipient_name: formData.recipientName.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          resend_message_id: result.messageId,
          offer_data: JSON.parse(JSON.stringify({ offerId, sharedOfferId })),
        });
        
        setStep('success');
        onSuccess?.();
      }
    } catch (err) {
      console.error("[EmailSendDialog] Send failed:", err);
    }
  }, [formData, validateForm, sendEmail, logSentEmail, pdfBase64, pdfFilename, offerId, sharedOfferId, user, onSuccess]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const updateField = useCallback((field: keyof EmailFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Angebot per E-Mail senden
              </DialogTitle>
              <DialogDescription>
                Senden Sie das Angebot {offerId} direkt an den Kunden.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Recipient Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="w-4 h-4" />
                  Empfänger
                </div>
                
                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="recipientName">Name *</Label>
                    <Input
                      id="recipientName"
                      placeholder="Max Mustermann"
                      value={formData.recipientName}
                      onChange={(e) => updateField('recipientName', e.target.value)}
                      className={errors.recipientName ? "border-destructive" : ""}
                    />
                    {errors.recipientName && (
                      <p className="text-xs text-destructive">{errors.recipientName}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="recipientEmail">E-Mail-Adresse *</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      placeholder="max.mustermann@firma.de"
                      value={formData.recipientEmail}
                      onChange={(e) => updateField('recipientEmail', e.target.value)}
                      className={errors.recipientEmail ? "border-destructive" : ""}
                    />
                    {errors.recipientEmail && (
                      <p className="text-xs text-destructive">{errors.recipientEmail}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Email Content */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  Nachricht
                </div>
                
                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Betreff *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => updateField('subject', e.target.value)}
                      className={errors.subject ? "border-destructive" : ""}
                    />
                    {errors.subject && (
                      <p className="text-xs text-destructive">{errors.subject}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="message">Persönliche Nachricht (optional)</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => updateField('message', e.target.value)}
                      rows={5}
                      placeholder="Ihre persönliche Nachricht an den Kunden..."
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* GDPR Consent Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ShieldCheck className="w-4 h-4" />
                  Datenschutz (DSGVO)
                </div>
                
                <Alert variant={errors.gdprConsentGiven ? "destructive" : "default"}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <div className="flex items-start gap-3 mt-1">
                      <Checkbox
                        id="gdprConsent"
                        checked={formData.gdprConsentGiven}
                        onCheckedChange={(checked) => updateField('gdprConsentGiven', !!checked)}
                        className="mt-0.5"
                      />
                      <label htmlFor="gdprConsent" className="cursor-pointer leading-relaxed">
                        <span className="font-medium">Der Kunde hat der Zusendung per E-Mail zugestimmt</span>
                        <br />
                        <span className="text-muted-foreground">
                          (Art. 6 Abs. 1 lit. a DSGVO – Einwilligung)
                        </span>
                      </label>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <p className="text-xs text-muted-foreground">
                  Das Angebot wird als PDF-Anhang versendet. Die E-Mail enthält 
                  automatisch alle erforderlichen Datenschutzhinweise und das Impressum 
                  gemäß deutschem Recht.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={handleClose}>
                Abbrechen
              </Button>
              <Button 
                onClick={handleSend} 
                disabled={isSending || !formData.gdprConsentGiven}
                className="gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sende...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    E-Mail senden
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                E-Mail erfolgreich gesendet
              </DialogTitle>
            </DialogHeader>

            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  Angebot wurde gesendet!
                </p>
                <p className="text-sm text-muted-foreground">
                  Das Angebot {offerId} wurde an{" "}
                  <span className="font-medium">{formData.recipientEmail}</span>{" "}
                  gesendet.
                </p>
              </div>
              
              <Alert className="text-left">
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Die DSGVO-Einwilligung wurde dokumentiert. Die E-Mail enthält 
                  alle erforderlichen Datenschutzhinweise gemäß deutschem Recht.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Schließen
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
