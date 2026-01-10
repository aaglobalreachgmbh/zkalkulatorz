// ============================================
// PDF Export Dialog Component
// Options for cover page, dealer summary, validity
// With PDF Preview before download
// Extended: QR-Code + Email sending (DSGVO-compliant)
// ============================================

import { useState, useMemo, useCallback } from "react";
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
import { FileText, Loader2, ShieldCheck, Download, Eye, ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Printer, Mail } from "lucide-react";
import { toast } from "sonner";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { useEmployeeSettings } from "@/margenkalkulator/hooks/useEmployeeSettings";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useSharedOffers } from "@/margenkalkulator/hooks/useSharedOffers";
import { generateOfferQrCode, generateOfferId as generateQrOfferId, generateAccessToken } from "@/margenkalkulator/utils/qrCodeGenerator";
import { EmailSendDialog } from "./EmailSendDialog";
import type { OfferOptionState, CalculationResult, ViewMode } from "../../engine/types";
import type { DealerSummaryData, OfferCustomerInfo, PdfOfferOptions } from "../../pdf/templates/types";
import { DEFAULT_TEMPLATE } from "../../pdf/templates/allenetzeClean";

interface PdfExportDialogProps {
  option: OfferOptionState;
  result: CalculationResult;
  viewMode?: ViewMode;
  customer?: OfferCustomerInfo;
  children?: React.ReactNode;
  /** Controlled open state */
  open?: boolean;
  /** Controlled open state setter */
  onOpenChange?: (open: boolean) => void;
}

// SECURITY: Maximum PDF generation time
const PDF_GENERATION_TIMEOUT_MS = 30_000;

// SECURITY: Sanitize filename
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\.\./g, "")
    .replace(/\s+/g, "_")
    .slice(0, 100);
}

// Generate unique offer ID (fallback)
function generateOfferId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AN-${dateStr}-${random}`;
}

type DialogStep = "options" | "preview" | "email";

export function PdfExportDialog({
  option,
  result,
  viewMode = "customer",
  customer,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: PdfExportDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<DialogStep>("options");
  
  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [zoom, setZoom] = useState(100);
  
  // QR Code + Share state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [sharedOfferId, setSharedOfferId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  
  // Controlled or uncontrolled mode
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;
  
  // Export options state
  const [showCoverPage, setShowCoverPage] = useState(true);
  const [showDealerSummary, setShowDealerSummary] = useState(false);
  const [validDays, setValidDays] = useState("14");
  
  // Generated offer ID (persisted during session)
  const [offerId] = useState(() => generateOfferId());
  
  // Shared offers hook
  const { saveSharedOffer } = useSharedOffers();
  
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
  
  // Cleanup preview URL on close
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setStep("options");
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setPreviewBlob(null);
      setZoom(100);
      setQrCodeDataUrl(null);
      setSharedOfferId(null);
      setAccessToken(null);
      setPdfBase64(null);
    }
    setOpen(newOpen);
  }, [previewUrl, setOpen]);
  
  // Generate PDF blob with optional QR code
  const generatePdfBlob = async (qrCode?: string): Promise<Blob> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("PDF generation timeout")),
        PDF_GENERATION_TIMEOUT_MS
      );
    });
    
    const [{ pdf }, { ProfessionalOfferPdf }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("../../pdf/ProfessionalOfferPdf"),
    ]);
    
    const pdfOptions: PdfOfferOptions = {
      templateId: DEFAULT_TEMPLATE.id,
      showCoverPage,
      validDays: parseInt(validDays, 10),
    };
    
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
          qrCodeDataUrl={qrCode}
        />
      ).toBlob(),
      timeoutPromise,
    ]);
    
    if (blob.type !== "application/pdf") {
      throw new Error("Invalid PDF blob type");
    }
    
    return blob;
  };
  
  // Generate preview with QR code
  const handleGeneratePreview = async () => {
    setLoading(true);
    
    try {
      // Step 1: Create shared offer for QR code
      const newOfferId = generateQrOfferId();
      const newAccessToken = generateAccessToken();
      
      // Prepare offer data (customer-facing only, NO dealer info)
      const sharedOfferData = {
        tariffName: option.mobile.tariffId || "Business Tarif",
        hardwareName: option.hardware.name || "SIM-Only",
        monthlyPrice: result.totals.avgTermNet,
        oneTimePrice: result.oneTime.reduce((sum, item) => sum + item.net, 0),
        contractLength: 24,
        validDays: parseInt(validDays, 10),
        createdAt: new Date().toISOString(),
        quantity: option.mobile.quantity,
        fixedNet: option.fixedNet.enabled ? {
          product: option.fixedNet.productId,
          monthlyPrice: result.totals.avgTermNet, // Simplified
        } : undefined,
      };
      
      // Save shared offer to database
      const savedOffer = await saveSharedOffer(
        sharedOfferData,
        effectiveCustomer.vorname && effectiveCustomer.nachname 
          ? `${effectiveCustomer.vorname} ${effectiveCustomer.nachname}`.trim()
          : effectiveCustomer.firma || undefined
      );
      
      if (savedOffer.success && savedOffer.offerId && savedOffer.accessToken) {
        setSharedOfferId(savedOffer.offerId);
        setAccessToken(savedOffer.accessToken);
        
        // Use the QR code from the saved offer
        if (savedOffer.qrCodeDataUrl) {
          setQrCodeDataUrl(savedOffer.qrCodeDataUrl);
        }
        
        // Step 3: Generate PDF with QR code
        const blob = await generatePdfBlob(savedOffer.qrCodeDataUrl);
        
        // Convert to base64 for email sending
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          setPdfBase64(base64);
        };
        reader.readAsDataURL(blob);
        
        // Cleanup old URL if exists
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewBlob(blob);
        setStep("preview");
        
        toast.success("Vorschau mit QR-Code wurde generiert");
      } else {
        // Fallback: Generate PDF without QR code
        const blob = await generatePdfBlob();
        
        // Convert to base64 for email sending
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          setPdfBase64(base64);
        };
        reader.readAsDataURL(blob);
        
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewBlob(blob);
        setStep("preview");
        
        toast.success("Vorschau wurde generiert (ohne QR-Code)");
      }
    } catch (e) {
      console.error("PDF preview generation failed:", e);
      const errorMessage =
        e instanceof Error && e.message === "PDF generation timeout"
          ? "PDF-Generierung dauerte zu lange. Bitte erneut versuchen."
          : "PDF-Vorschau fehlgeschlagen.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Download the generated PDF with customer-based filename
  const handleDownload = () => {
    if (!previewBlob || !previewUrl) return;
    
    const link = document.createElement("a");
    link.href = previewUrl;
    
    const date = new Date().toISOString().split("T")[0];
    
    // Priority: Firma > Nachname > Tarif > "Angebot"
    const customerName = effectiveCustomer.firma 
      || (effectiveCustomer.nachname ? `${effectiveCustomer.anrede || ""}_${effectiveCustomer.nachname}`.replace(/^_/, "") : null)
      || option.mobile.tariffId
      || "Angebot";
    
    const sanitizedName = sanitizeFilename(customerName);
    const suffix = showDealerSummary ? "_Haendler" : "";
    link.download = `Angebot_${sanitizedName}${suffix}_${date}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(
      showDealerSummary 
        ? "PDF mit Händler-Zusammenfassung heruntergeladen" 
        : "Kunden-PDF heruntergeladen"
    );
    
    trackPdfExported(undefined, `Angebot_${sanitizedName}${suffix}`);
    handleOpenChange(false);
  };
  
  // Go back to options
  const handleBackToOptions = () => {
    setStep("options");
  };
  
  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleZoomReset = () => setZoom(100);
  
  // Print PDF
  const handlePrint = () => {
    if (!previewUrl) return;
    
    // Open PDF in new window and trigger print
    const printWindow = window.open(previewUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } else {
      // Fallback: use iframe print
      const iframe = document.querySelector('iframe[title="PDF Vorschau"]') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } else {
        toast.error("Drucken konnte nicht gestartet werden. Bitte laden Sie das PDF herunter.");
      }
    }
  };
  
  // Open email dialog
  const handleOpenEmailDialog = () => {
    setEmailDialogOpen(true);
  };
  
  // Email sent successfully
  const handleEmailSent = () => {
    setEmailDialogOpen(false);
    toast.success("Angebot wurde per E-Mail gesendet!");
  };
  
  // Get PDF filename
  const getPdfFilename = () => {
    const date = new Date().toISOString().split("T")[0];
    const tariffName = option.mobile.tariffId
      ? sanitizeFilename(option.mobile.tariffId)
      : "Angebot";
    const suffix = showDealerSummary ? "_Haendler" : "_Kunde";
    return `${tariffName}${suffix}_${date}.pdf`;
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      
      <DialogContent className={step === "preview" ? "sm:max-w-[900px] h-[90vh] flex flex-col" : "sm:max-w-[425px]"}>
        {step === "options" ? (
          <>
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
              <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={loading}>
                Abbrechen
              </Button>
              <Button onClick={handleGeneratePreview} disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wird generiert...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Vorschau anzeigen
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Preview Step */}
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  PDF-Vorschau
                </DialogTitle>
                
                {/* Zoom Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    className="h-8 w-8"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                    className="h-8 w-8"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomReset}
                    className="h-8 w-8"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <DialogDescription>
                Überprüfen Sie das Angebot vor dem Download.
                {showDealerSummary && (
                  <span className="ml-2 text-amber-600 font-medium">
                    🔒 Enthält Händler-Informationen
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            {/* PDF Viewer */}
            <div className="flex-1 min-h-0 bg-muted/50 rounded-lg overflow-auto border">
              {previewUrl && (
                <div 
                  className="flex justify-center p-4"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
                >
                  <iframe
                    src={previewUrl}
                    className="w-full bg-white shadow-lg rounded"
                    style={{ 
                      height: "calc(100vh - 280px)",
                      minHeight: "500px",
                      maxWidth: "800px"
                    }}
                    title="PDF Vorschau"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter className="flex-shrink-0 gap-2 pt-4">
              <Button variant="ghost" onClick={handleBackToOptions} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Zurück
              </Button>
              <div className="flex-1" />
              <Button 
                variant="outline" 
                onClick={handleOpenEmailDialog} 
                disabled={!pdfBase64}
                className="gap-2"
              >
                <Mail className="w-4 h-4" />
                Per E-Mail senden
              </Button>
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                Drucken
              </Button>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />
                Herunterladen
              </Button>
            </DialogFooter>
            
            {/* Email Send Dialog */}
            {pdfBase64 && (
              <EmailSendDialog
                open={emailDialogOpen}
                onOpenChange={setEmailDialogOpen}
                pdfBase64={pdfBase64}
                pdfFilename={getPdfFilename()}
                offerId={sharedOfferId || offerId}
                customerName={effectiveCustomer.vorname && effectiveCustomer.nachname 
                  ? `${effectiveCustomer.vorname} ${effectiveCustomer.nachname}`.trim()
                  : effectiveCustomer.firma || ""}
                customerEmail=""
                onSuccess={handleEmailSent}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}