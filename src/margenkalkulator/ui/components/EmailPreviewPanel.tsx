// ============================================
// Email Preview Panel Component
// ============================================
// Renders a preview of how the email will look to the recipient

import { useMemo } from "react";
import { useTenantBranding } from "@/hooks/useTenantBranding";

interface EmailPreviewPanelProps {
  recipientName: string;
  senderName: string;
  senderEmail?: string;
  message?: string;
  tariffCount: number;
}

export function EmailPreviewPanel({
  recipientName,
  senderName,
  senderEmail,
  message,
  tariffCount,
}: EmailPreviewPanelProps) {
  const { branding } = useTenantBranding();
  
  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, []);

  const primaryColor = branding.primaryColor || "#e4002b";
  const companyName = branding.companyName || "MargenKalkulator";

  return (
    <div className="border rounded-lg overflow-hidden bg-background shadow-sm max-h-[400px] overflow-y-auto">
      {/* Header */}
      <div 
        className="px-4 py-3 text-center"
        style={{ backgroundColor: primaryColor }}
      >
        <h3 className="text-white font-semibold text-sm">{companyName}</h3>
        <p className="text-white/80 text-xs mt-0.5">Vodafone Business Partner</p>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3 text-sm">
        <p className="text-foreground">
          Guten Tag {recipientName || "Kunde"},
        </p>
        
        <p className="text-muted-foreground text-xs leading-relaxed">
          vielen Dank für Ihr Interesse an unseren Vodafone Business-Lösungen. 
          Anbei finden Sie Ihr persönliches Angebot, das wir auf Basis Ihrer Anforderungen erstellt haben.
        </p>
        
        {message && (
          <div 
            className="p-3 rounded text-xs"
            style={{ 
              backgroundColor: `${primaryColor}10`,
              borderLeft: `3px solid ${primaryColor}`,
            }}
          >
            <strong className="block mb-1">Persönliche Nachricht:</strong>
            <span className="text-muted-foreground whitespace-pre-wrap">{message}</span>
          </div>
        )}
        
        {/* Attachment notice */}
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 p-3 rounded text-xs">
          <span className="text-lg">📎</span>
          <div>
            <strong className="text-green-700 dark:text-green-400 block">Ihr Angebot im Anhang</strong>
            <span className="text-green-600 dark:text-green-500">
              PDF mit {tariffCount} Tarif{tariffCount !== 1 ? "en" : ""}
            </span>
          </div>
        </div>
        
        {/* CTA */}
        <p className="text-center text-muted-foreground text-xs py-2">
          Bei Fragen stehe ich Ihnen gerne zur Verfügung.
        </p>
        
        {/* Signature */}
        <div className="border-t pt-3 mt-3">
          <p className="text-xs text-muted-foreground">Mit freundlichen Grüßen</p>
          <p className="font-medium text-sm mt-1">{senderName}</p>
          <p className="text-xs text-muted-foreground">
            {companyName} • Vodafone Business Partner
            {senderEmail && <><br />E-Mail: {senderEmail}</>}
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-muted/50 px-4 py-3 text-center">
        <p className="text-xs text-muted-foreground">
          Gesendet über <span style={{ color: primaryColor }} className="font-medium">{companyName}</span>
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          Datum: {currentDate}
        </p>
      </div>
    </div>
  );
}
