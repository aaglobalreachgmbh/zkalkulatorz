// ============================================
// PDF Download Button Component
// SECURITY: Timeout protection, filename sanitization, blob validation
// ============================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import type { OfferOptionState, CalculationResult } from "../../engine/types";
import { toast } from "sonner";

interface PdfDownloadButtonProps {
  option: OfferOptionState;
  result: CalculationResult;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm";
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
}: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const { trackPdfExported } = useActivityTracker();

  const handleDownload = async () => {
    setLoading(true);

    // SECURITY: Timeout promise for PDF generation
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("PDF generation timeout")),
        PDF_GENERATION_TIMEOUT_MS
      );
    });

    try {
      // Dynamically import PDF dependencies to avoid SSR issues
      const [{ pdf }, { OfferPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../../pdf/OfferPdf"),
      ]);

      // Generate PDF blob with timeout protection
      const blob = await Promise.race([
        pdf(<OfferPdf option={option} result={result} />).toBlob(),
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

      // Generate sanitized filename
      const date = new Date().toISOString().split("T")[0];
      const tariffName = option.mobile.tariffId
        ? sanitizeFilename(option.mobile.tariffId)
        : "Angebot";
      link.download = `${tariffName}_${date}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup immediately
      URL.revokeObjectURL(url);

      toast.success("PDF wurde heruntergeladen");
      
      // Track PDF export
      trackPdfExported(undefined, tariffName);
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
      ) : (
        <FileText className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">PDF</span>
    </Button>
  );
}
