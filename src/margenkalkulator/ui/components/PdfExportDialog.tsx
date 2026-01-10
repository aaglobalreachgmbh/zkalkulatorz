// ============================================
// PDF Export Dialog Component - 3-Step Wizard
// Step 1: Template + Page Selection
// Step 2: Preview with enhanced controls
// Step 3: Export (Download/Email/Print)
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, 
  Loader2, 
  Download, 
  Eye, 
  ArrowLeft, 
  ArrowRight,
  Printer, 
  Mail,
  Settings2
} from "lucide-react";
import { toast } from "sonner";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { usePermissions } from "@/hooks/usePermissions";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useSharedOffers } from "@/margenkalkulator/hooks/useSharedOffers";
import { generateOfferId as generateQrOfferId } from "@/margenkalkulator/utils/qrCodeGenerator";
import { EmailSendDialog } from "./EmailSendDialog";
import { PdfPageSelector } from "./PdfPageSelector";
import { PdfPreviewPane } from "./PdfPreviewPane";
import { PdfTemplateSelector } from "./PdfTemplateSelector";
import type { OfferOptionState, CalculationResult, ViewMode } from "../../engine/types";
import type { DealerSummaryData, OfferCustomerInfo, PdfOfferOptions, PdfPageSelection, PdfTemplate } from "../../pdf/templates/types";
import { PREMIUM_O2_TEMPLATE, PREMIUM_VODAFONE_TEMPLATE } from "../../pdf/templates/premiumO2Template";
import { DEFAULT_PAGE_SELECTION } from "../../pdf/templates/types";

interface PdfExportDialogProps {
  option: OfferOptionState;
  result: CalculationResult;
  viewMode?: ViewMode;
  customer?: OfferCustomerInfo;
  children?: React.ReactNode;
  open?: boolean;
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

// Generate unique offer ID
function generateOfferId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AN-${dateStr}-${random}`;
}

type DialogStep = "pages" | "preview";

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
  const [step, setStep] = useState<DialogStep>("pages");
  
  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [zoom, setZoom] = useState(100);
  
  // QR Code + Share state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [sharedOfferId, setSharedOfferId] = useState<string | null>(null);
  
  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  
  // Controlled or uncontrolled mode
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;
  
  // Template selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("premium-o2");
  
  // Get selected template
  const selectedTemplate: PdfTemplate = useMemo(() => {
    switch (selectedTemplateId) {
      case "premium-vodafone":
        return PREMIUM_VODAFONE_TEMPLATE;
      default:
        return PREMIUM_O2_TEMPLATE;
    }
  }, [selectedTemplateId]);
  
  // Page selection state
  const [pageSelection, setPageSelection] = useState<PdfPageSelection>({
    ...DEFAULT_PAGE_SELECTION,
    showCoverPage: true,
    showSummaryPage: true,
    showDetailPage: true,
    showContactPage: true,
  });
  
  // Validity option
  const [validDays, setValidDays] = useState("14");
  
  // Generated offer ID
  const [offerId] = useState(() => generateOfferId());
  
  // Shared offers hook
  const { saveSharedOffer } = useSharedOffers();
  
  // Hooks
  const visibility = useSensitiveFieldsVisible(viewMode);
  const { canViewMargins, canExportPdf } = usePermissions();
  const { branding } = useTenantBranding();
  const { trackPdfExported } = useActivityTracker();
  
  // Check dealer permission using usePermissions
  const canShowDealerOption = 
    visibility.effectiveMode !== "customer" &&
    canViewMargins &&
    canExportPdf &&
    !visibility.isCustomerSessionActive;
  
  // Check if hardware is selected
  const hasHardware = option.hardware.ekNet > 0;
  
  // Auto-enable hardware page if hardware selected
  const effectivePageSelection = useMemo(() => ({
    ...pageSelection,
    showHardwarePage: hasHardware ? pageSelection.showHardwarePage : false,
  }), [pageSelection, hasHardware]);
  
  // Build dealer data from result
  const dealerData = useMemo<DealerSummaryData | undefined>(() => {
    if (!effectivePageSelection.showDealerPage || !result.dealer) return undefined;
    
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
  }, [effectivePageSelection.showDealerPage, result.dealer, option]);
  
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
  
  // Get customer-based filename
  const getCustomerBasedFilename = useCallback(() => {
    const date = new Date().toISOString().split("T")[0];
    const customerName = effectiveCustomer.firma 
      || (effectiveCustomer.nachname ? `${effectiveCustomer.anrede || ""}_${effectiveCustomer.nachname}`.replace(/^_/, "") : null)
      || option.mobile.tariffId
      || "Angebot";
    const sanitizedName = sanitizeFilename(customerName);
    const suffix = effectivePageSelection.showDealerPage ? "_Haendler" : "";
    return `Angebot_${sanitizedName}${suffix}_${date}.pdf`;
  }, [effectiveCustomer, option.mobile.tariffId, effectivePageSelection.showDealerPage]);
  
  // Cleanup preview URL on close
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setStep("pages");
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setPreviewBlob(null);
      setZoom(100);
      setQrCodeDataUrl(null);
      setSharedOfferId(null);
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
    
    const [{ pdf }, { PremiumOfferPdf }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("../../pdf/PremiumOfferPdf"),
    ]);
    
    const pdfOptions: PdfOfferOptions = {
      templateId: selectedTemplate.id,
      showCoverPage: effectivePageSelection.showCoverPage,
      validDays: parseInt(validDays, 10),
      pageSelection: effectivePageSelection,
    };
    
    const blob = await Promise.race([
      pdf(
        <PremiumOfferPdf
          template={selectedTemplate}
          customer={effectiveCustomer}
          options={pdfOptions}
          branding={branding}
          offerId={offerId}
          items={[{ option, result }]}
          showDealerSummary={effectivePageSelection.showDealerPage}
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
      // Create shared offer for QR code
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
          monthlyPrice: result.totals.avgTermNet,
        } : undefined,
      };
      
      const savedOffer = await saveSharedOffer(
        sharedOfferData,
        effectiveCustomer.vorname && effectiveCustomer.nachname 
          ? `${effectiveCustomer.vorname} ${effectiveCustomer.nachname}`.trim()
          : effectiveCustomer.firma || undefined
      );
      
      if (savedOffer.success && savedOffer.offerId && savedOffer.accessToken) {
        setSharedOfferId(savedOffer.offerId);
        
        if (savedOffer.qrCodeDataUrl) {
          setQrCodeDataUrl(savedOffer.qrCodeDataUrl);
        }
        
        const blob = await generatePdfBlob(savedOffer.qrCodeDataUrl);
        
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
        
        toast.success("Vorschau mit QR-Code wurde generiert");
      } else {
        // Fallback: Generate PDF without QR code
        const blob = await generatePdfBlob();
        
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
        
        toast.success("Vorschau wurde generiert");
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
  
  // Download the generated PDF
  const handleDownload = () => {
    if (!previewBlob || !previewUrl) return;
    
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = getCustomerBasedFilename();
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(
      effectivePageSelection.showDealerPage 
        ? "PDF mit Händler-Zusammenfassung heruntergeladen" 
        : "Kunden-PDF heruntergeladen"
    );
    
    trackPdfExported(undefined, getCustomerBasedFilename().replace(".pdf", ""));
    handleOpenChange(false);
  };
  
  // Go back to page selection
  const handleBackToPages = () => {
    setStep("pages");
  };
  
  // Print PDF
  const handlePrint = () => {
    if (!previewUrl) return;
    
    const printWindow = window.open(previewUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } else {
      const iframe = document.querySelector('iframe[title="PDF Vorschau"]') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } else {
        toast.error("Drucken konnte nicht gestartet werden.");
      }
    }
  };
  
  // Email dialog handlers
  const handleOpenEmailDialog = () => setEmailDialogOpen(true);
  const handleEmailSent = () => {
    setEmailDialogOpen(false);
    toast.success("Angebot wurde per E-Mail gesendet!");
  };
  
  // Count selected pages
  const selectedPageCount = useMemo(() => {
    let count = 0;
    if (effectivePageSelection.showCoverPage) count++;
    if (effectivePageSelection.showSummaryPage) count++;
    if (effectivePageSelection.showTransitionPage) count++;
    if (effectivePageSelection.showDetailPage) count++;
    if (effectivePageSelection.showHardwarePage && hasHardware) count++;
    if (effectivePageSelection.showUspPage) count++;
    if (effectivePageSelection.showContactPage) count++;
    if (effectivePageSelection.showDealerPage && canShowDealerOption) count++;
    return count;
  }, [effectivePageSelection, hasHardware, canShowDealerOption]);
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      
      <DialogContent 
        className={step === "preview" 
          ? "sm:max-w-[1000px] h-[90vh] flex flex-col" 
          : "sm:max-w-[500px] max-h-[85vh] flex flex-col"
        }
      >
        {step === "pages" ? (
          <>
            {/* Step 1: Template + Page Selection */}
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Angebot konfigurieren
              </DialogTitle>
              <DialogDescription>
                Wählen Sie Design-Vorlage und Seiten für Ihr PDF.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {/* Template Selector */}
              <PdfTemplateSelector
                selectedTemplateId={selectedTemplateId}
                onChange={setSelectedTemplateId}
              />
              
              {/* Page Selector */}
              <div className="pt-2 border-t">
                <PdfPageSelector
                  selection={pageSelection}
                  onChange={setPageSelection}
                  canShowDealerPage={canShowDealerOption}
                  hasHardware={hasHardware}
                />
              </div>
              
              {/* Validity Option */}
              <div className="space-y-2 pt-2 border-t">
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
            
            <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0 pt-4 border-t">
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
                    Vorschau ({selectedPageCount} Seiten)
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Step 2: Preview */}
            <DialogHeader className="flex-shrink-0 pb-2">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                PDF-Vorschau
              </DialogTitle>
              <DialogDescription>
                Überprüfen Sie das Angebot vor dem Download oder Versand.
              </DialogDescription>
            </DialogHeader>
            
            {/* PDF Preview Pane */}
            <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
              <PdfPreviewPane
                previewUrl={previewUrl}
                zoom={zoom}
                onZoomChange={setZoom}
                showDealerSummary={effectivePageSelection.showDealerPage}
                pageCount={selectedPageCount}
              />
            </div>
            
            <DialogFooter className="flex-shrink-0 gap-2 pt-4 border-t">
              <Button variant="ghost" onClick={handleBackToPages} className="gap-2">
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
                E-Mail
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
                pdfFilename={getCustomerBasedFilename()}
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
