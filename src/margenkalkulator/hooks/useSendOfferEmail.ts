// ============================================
// Send Offer Email Hook
// ============================================

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { toast } from "sonner";

interface SendEmailParams {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  senderEmail?: string;
  senderPhone?: string;
  subject: string;
  message?: string;
  pdfBase64: string;
  pdfFilename: string;
  offerId?: string;
  sharedOfferId?: string;
  // DSGVO fields (required)
  gdprConsentGiven: boolean;
  gdprConsentTimestamp?: string;
  // Optional company legal info for imprint
  companyLegal?: {
    companyName?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    registerNumber?: string;
    ceo?: string;
    vatId?: string;
    dataProtectionEmail?: string;
  };
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: string;
  elapsed_ms?: number;
  retryAfter?: number;
}

export function useSendOfferEmail() {
  const [isSending, setIsSending] = useState(false);
  const { branding } = useTenantBranding();

  const sendEmail = useCallback(async (params: SendEmailParams): Promise<SendEmailResult> => {
    // Validate GDPR consent before sending
    if (!params.gdprConsentGiven) {
      toast.error("DSGVO-Einwilligung ist erforderlich");
      return { success: false, error: "DSGVO-Einwilligung fehlt", code: "GDPR_CONSENT_REQUIRED" };
    }
    
    setIsSending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("send-offer-email", {
        body: {
          ...params,
          branding: {
            logoUrl: branding.logoUrl,
            primaryColor: branding.primaryColor,
            secondaryColor: branding.secondaryColor,
            companyName: branding.companyName,
          },
        },
      });

      if (error) {
        console.error("[useSendOfferEmail] Edge function error:", error);
        toast.error(`E-Mail konnte nicht gesendet werden: ${error.message}`);
        return { success: false, error: error.message };
      }

      if (data?.error) {
        console.error("[useSendOfferEmail] API error:", data.error);
        
        // Handle rate limiting
        if (data.code === "RATE_LIMIT_EXCEEDED") {
          toast.error("E-Mail-Limit erreicht. Bitte warten Sie eine Stunde.");
          return { 
            success: false, 
            error: data.error, 
            code: data.code,
            retryAfter: data.retryAfter 
          };
        }
        
        toast.error(`E-Mail-Fehler: ${data.error}`);
        return { success: false, error: data.error, code: data.code };
      }

      toast.success("E-Mail erfolgreich gesendet!");
      return {
        success: true,
        messageId: data?.messageId,
        elapsed_ms: data?.elapsed_ms,
      };
    } catch (err: any) {
      console.error("[useSendOfferEmail] Unexpected error:", err);
      toast.error("Unerwarteter Fehler beim E-Mail-Versand");
      return { success: false, error: err.message };
    } finally {
      setIsSending(false);
    }
  }, [branding]);

  return {
    sendEmail,
    isSending,
  };
}
