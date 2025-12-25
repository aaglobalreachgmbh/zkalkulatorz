// ============================================
// PDF Download Button Component
// ============================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import type { OfferOptionState, CalculationResult } from "../../engine/types";
import { OfferPdf } from "../../pdf/OfferPdf";

interface PdfDownloadButtonProps {
  option: OfferOptionState;
  result: CalculationResult;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm";
}

export function PdfDownloadButton({
  option,
  result,
  variant = "outline",
  size = "sm",
}: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  
  const handleDownload = async () => {
    setLoading(true);
    try {
      // Generate PDF blob
      const blob = await pdf(<OfferPdf option={option} result={result} />).toBlob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Generate filename
      const date = new Date().toISOString().split("T")[0];
      link.download = `Angebot_${date}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF generation failed:", e);
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
