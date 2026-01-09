// ============================================
// PDF Export Dialog Component
// Options for cover page, dealer summary, validity
// ============================================

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, ShieldCheck, Download } from "lucide-react";
import { toast } from "sonner";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { useEmployeeSettings } from "@/margenkalkulator/hooks/useEmployeeSettings";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import type { OfferOptionState, CalculationResult, ViewMode } from "../../engine/types";
import type { DealerSummaryData, OfferCustomerInfo, PdfOfferOptions } from "../../pdf/templates/types";
import { DEFAULT_TEMPLATE } from "../../pdf/templates/allenetzeClean";

interface PdfExportDialogProps {
  option: OfferOptionState;
  result: CalculationResult;
  viewMode?: ViewMode;
  customer?: OfferCustomerInfo;
  children?: React.ReactNode;
}

// SECURITY: Maximum PDF generation time
const PDF_GENERATION_TIMEOUT_MS = 20_000;

// SECURITY: Sanitize filename
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\.\./g, "")
    .replace(/\s+/g, "_")
    .slice(0, 100);
}

// Generate unique offer ID
function generateOfferId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AN-${dateStr}-${random}`;
}

export function PdfExportDialog({
  option,
  result,
  viewMode = "customer",
  customer,
  children,
}: PdfExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Export options state
  const [showCoverPage, setShowCoverPage] = useState(true);
  const [showDealerSummary, setShowDealerSummary] = useState(false);
  const [validDays, setValidDays] = useState("14");
  
  // Hooks
  const visibility = useSensitiveFieldsVisible(viewMode);
  const { settings } = useEmployeeSettings();
  const { branding } = useTenantBranding();
  const { trackPdfExported } = useActivityTracker();
  
  // Check dealer permission
  const canViewMargins = settings?.featureOverrides?.can_view_margins !== false;
  const canShowDealerOption = 
    visibility.effectiveMode !== "customer" &&
    canViewMargins &&
    !visibility.isCustomerSessionActive;
  
  // Build dealer data from result
  const dealerData = useMemo<DealerSummaryData | undefined>(() => {
    if (!showDealerSummary || !result.dealer) return undefined;
    
    const economics = result.dealer;
    const quantity = option.mobile.quantity;
    
    return {
      grossProvision: (economics.provisionBase || 0) * quantity,
      netProvision: (economics.provisionAfter || 0) * quantity,
      fhPartnerDeduction: economics.fhPartnerBonus ? economics.fhPartnerBonus * quantity : undefined,
      omoDeduction: economics.deductions ? economics.deductions * quantity : undefined,
      hardwareEk: option.hardware.ekNet * quantity,
      netMargin: economics.margin * quantity,
      marginPerContract: economics.margin,
      totalContracts: quantity,
      contractType: option.mobile.contractType,
      hardwareDetails: option.hardware.ekNet > 0 
        ? [{
            name: option.hardware.name || "Gerät",
            quantity: quantity,
            ekPerUnit: option.hardware.ekNet,
          }]
        : undefined,
    };
  }, [showDealerSummary, result.dealer, option]);
  
  // Default customer if not provided
  const effectiveCustomer: OfferCustomerInfo = customer || {
    firma: "",
    anrede: "",
    vorname: "",
    nachname: "",
    strasse: "",
    plz: "",
    ort: "",
  };
  
  const handleExport = async () => {
    setLoading(true);
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("PDF generation timeout")),
        PDF_GENERATION_TIMEOUT_MS
      );
    });
    
    try {
      // Dynamic import
      const [{ pdf }, { ProfessionalOfferPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../../pdf/ProfessionalOfferPdf"),
      ]);
      
      const offerId = generateOfferId();
      
      const pdfOptions: PdfOfferOptions = {
        templateId: DEFAULT_TEMPLATE.id,
        showCoverPage,
        validDays: parseInt(validDays, 10),
      };
      
      // Generate PDF
      const blob = await Promise.race([
        pdf(
          <ProfessionalOfferPdf
            template={DEFAULT_TEMPLATE}
            customer={effectiveCustomer}
            options={pdfOptions}
            branding={branding}
            offerId={offerId}
            items={[{ option, result }]}
            showDealerSummary={showDealerSummary}
            dealerData={dealerData}
          />
        ).toBlob(),
        timeoutPromise,
      ]);
      
      // Validate blob
      if (blob.type !== "application/pdf") {
        throw new Error("Invalid PDF blob type");
      }
      
      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const date = new Date().toISOString().split("T")[0];
      const tariffName = option.mobile.tariffId
        ? sanitizeFilename(option.mobile.tariffId)
        : "Angebot";
      const suffix = showDealerSummary ? "_Haendler" : "_Kunde";
      link.download = `${tariffName}${suffix}_${date}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(
        showDealerSummary 
          ? "Professionelles PDF mit Händler-Zusammenfassung erstellt" 
          : "Professionelles Kunden-PDF erstellt"
      );
      
      trackPdfExported(undefined, `${tariffName}_professional${suffix}`);
      setOpen(false);
    } catch (e) {
      console.error("PDF generation failed:", e);
      const errorMessage =
        e instanceof Error && e.message === "PDF generation timeout"
          ? "PDF-Generierung dauerte zu lange. Bitte erneut versuchen."
          : "PDF-Generierung fehlgeschlagen.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF Export</span>
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Professionelles Angebots-PDF
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie ein professionelles Angebot im allenetze.de Design.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Cover Page Option */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="cover"
              checked={showCoverPage}
              onCheckedChange={(checked) => setShowCoverPage(checked === true)}
            />
            <Label htmlFor="cover" className="text-sm font-medium cursor-pointer">
              Deckblatt anzeigen
            </Label>
          </div>
          
          {/* Dealer Summary Option (only in dealer mode) */}
          {canShowDealerOption && (
            <div className="flex items-start space-x-3">
              <Checkbox
                id="dealer"
                checked={showDealerSummary}
                onCheckedChange={(checked) => setShowDealerSummary(checked === true)}
              />
              <div className="grid gap-1">
                <Label htmlFor="dealer" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  Händler-Zusammenfassung anhängen
                </Label>
                <p className="text-xs text-muted-foreground">
                  Vertrauliche Seite mit Provisions- und Margen-Kalkulation
                </p>
              </div>
            </div>
          )}
          
          {/* Validity */}
          <div className="grid gap-2">
            <Label htmlFor="validity" className="text-sm font-medium">
              Gültigkeit des Angebots
            </Label>
            <Select value={validDays} onValueChange={setValidDays}>
              <SelectTrigger id="validity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Tage</SelectItem>
                <SelectItem value="14">14 Tage</SelectItem>
                <SelectItem value="21">21 Tage</SelectItem>
                <SelectItem value="30">30 Tage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Abbrechen
          </Button>
          <Button onClick={handleExport} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Wird erstellt...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                PDF erstellen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
