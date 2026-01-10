// ============================================
// PDF Download Button Component
// SECURITY: Timeout protection, filename sanitization, blob validation
// BRANDING: Supports dynamic tenant branding
// ============================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, ShieldCheck } from "lucide-react";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { usePermissions } from "@/hooks/usePermissions";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import type { OfferOptionState, CalculationResult, ViewMode } from "../../engine/types";
import { toast } from "sonner";

interface PdfDownloadButtonProps {
  option: OfferOptionState;
  result: CalculationResult;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm";
  /** PDF type: customer (default) or dealer (with margin info) */
  type?: "customer" | "dealer";
  /** Current view mode - required for dealer PDF security check */
  viewMode?: ViewMode;
}

// SECURITY: Maximum PDF generation time (prevents DoS via complex documents)
const PDF_GENERATION_TIMEOUT_MS = 15_000;

// SECURITY: Sanitize filename to prevent path traversal and invalid characters
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "") // Remove invalid characters
    .replace(/\.\./g, "") // Prevent path traversal
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .slice(0, 100); // Limit length
}

export function PdfDownloadButton({
  option,
  result,
  variant = "outline",
  size = "sm",
  type = "customer",
  viewMode = "customer",
}: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const { trackPdfExported } = useActivityTracker();
  const visibility = useSensitiveFieldsVisible(viewMode);
  const { canViewMargins, canExportPdf } = usePermissions();
  const { branding } = useTenantBranding();

  // SECURITY: Dealer PDF only allowed when:
  // 1. Not in customer mode
  // 2. User has permission to view margins
  // 3. User has permission to export PDF
  // 4. No active customer session
  const canGenerateDealerPdf = 
    type === "dealer" &&
    visibility.effectiveMode !== "customer" &&
    canViewMargins &&
    canExportPdf &&
    !visibility.isCustomerSessionActive;

  const handleDownload = async () => {
    // SECURITY: Block dealer PDF if not authorized
    if (type === "dealer" && !canGenerateDealerPdf) {
      toast.error("Keine Berechtigung für Händler-PDF");
      return;
    }

    setLoading(true);

    // SECURITY: Timeout promise for PDF generation
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("PDF generation timeout")),
        PDF_GENERATION_TIMEOUT_MS
      );
    });

    try {
      // Dynamically import PDF dependencies based on type
      const [{ pdf }, pdfComponent] = await Promise.all([
        import("@react-pdf/renderer"),
        type === "dealer" 
          ? import("../../pdf/DealerPdf")
          : import("../../pdf/OfferPdf"),
      ]);

      // Generate PDF blob with timeout protection
      const PdfComponent = type === "dealer" 
        ? (pdfComponent as { DealerPdf: typeof import("../../pdf/DealerPdf").DealerPdf }).DealerPdf
        : (pdfComponent as { OfferPdf: typeof import("../../pdf/OfferPdf").OfferPdf }).OfferPdf;

      // Pass branding to PDF component
      const blob = await Promise.race([
        pdf(<PdfComponent option={option} result={result} branding={branding} />).toBlob(),
        timeoutPromise,
      ]);

      // SECURITY: Validate blob type
      if (blob.type !== "application/pdf") {
        console.error("[Security] Invalid PDF blob type:", blob.type);
        throw new Error("Invalid PDF blob type");
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate sanitized filename with type suffix
      const date = new Date().toISOString().split("T")[0];
      const tariffName = option.mobile.tariffId
        ? sanitizeFilename(option.mobile.tariffId)
        : "Angebot";
      const typeSuffix = type === "dealer" ? "_Haendler" : "_Kunde";
      link.download = `${tariffName}${typeSuffix}_${date}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup immediately
      URL.revokeObjectURL(url);

      toast.success(type === "dealer" ? "Händler-PDF wurde heruntergeladen" : "Kunden-PDF wurde heruntergeladen");
      
      // Track PDF export
      trackPdfExported(undefined, `${tariffName}_${type}`);
    } catch (e) {
      console.error("PDF generation failed:", e);
      const errorMessage =
        e instanceof Error && e.message === "PDF generation timeout"
          ? "PDF-Generierung dauerte zu lange. Bitte versuchen Sie es erneut."
          : "PDF-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Don't render dealer button if not authorized
  if (type === "dealer" && !canGenerateDealerPdf) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : type === "dealer" ? (
        <ShieldCheck className="w-4 h-4" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">{type === "dealer" ? "Händler-PDF" : "PDF"}</span>
    </Button>
  );
}
