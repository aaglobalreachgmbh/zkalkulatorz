// ============================================
// Premium Offer PDF - O2/Vodafone Style Combined
// Professional multi-page PDF with modular pages
// Supports page selection from export wizard
// ============================================

import { Document } from "@react-pdf/renderer";
import type { ProfessionalOfferPdfProps, PdfPageSelection } from "./templates/types";
import { DEFAULT_PAGE_SELECTION } from "./templates/types";
import { DEFAULT_TEMPLATE } from "./templates/allenetzeClean";
import { DEFAULT_BRANDING } from "@/hooks/useTenantBranding";
import { PremiumCoverPage } from "./components/PremiumCoverPage";
import { PremiumSummaryPage } from "./components/PremiumSummaryPage";
import { PremiumTransitionPage } from "./components/PremiumTransitionPage";
import { PremiumDetailPage } from "./components/PremiumDetailPage";
import { PremiumUspPage } from "./components/PremiumUspPage";
import { PremiumContactPage } from "./components/PremiumContactPage";
import { DealerSummaryPage } from "./components/DealerSummaryPage";

export function PremiumOfferPdf({
  template = DEFAULT_TEMPLATE,
  customer,
  options,
  branding = DEFAULT_BRANDING,
  companySettings,
  contact,
  offerId,
  items,
  hardwareImages,
  qrCodeDataUrl,
  showDealerSummary = false,
  dealerData,
}: ProfessionalOfferPdfProps) {
  // Get page selection from options or use defaults
  const pageSelection: PdfPageSelection = options.pageSelection || {
    ...DEFAULT_PAGE_SELECTION,
    showCoverPage: options.showCoverPage,
    showDealerPage: showDealerSummary && !!dealerData,
  };
  
  // Check if hardware exists in any item
  const hasHardware = items.some(item => item.option.hardware.ekNet > 0);
  
  // Calculate total pages based on selection
  const calculateTotalPages = () => {
    let count = 0;
    if (pageSelection.showCoverPage) count++;
    if (pageSelection.showSummaryPage) count++;
    if (pageSelection.showTransitionPage) count++;
    if (pageSelection.showDetailPage) count++;
    if (pageSelection.showHardwarePage && hasHardware) count++;
    if (pageSelection.showUspPage) count++;
    if (pageSelection.showContactPage) count++;
    if (pageSelection.showDealerPage && dealerData) count++;
    return Math.max(count, 1);
  };
  
  const totalPages = calculateTotalPages();
  
  // Track page numbers
  let pageCounter = 0;
  const getNextPageNumber = () => ++pageCounter;
  
  // Build pages array based on selection
  const pages: React.ReactNode[] = [];
  
  // 1. Cover Page
  if (pageSelection.showCoverPage) {
    const pageNum = getNextPageNumber();
    pages.push(
      <PremiumCoverPage
        key="cover"
        template={template}
        customer={customer}
        offerId={offerId}
        branding={branding}
      />
    );
  }
  
  // 2. Summary Page (with period table - Vodafone style)
  if (pageSelection.showSummaryPage) {
    const pageNum = getNextPageNumber();
    pages.push(
      <PremiumSummaryPage
        key="summary"
        template={template}
        customer={customer}
        contact={contact}
        offerId={offerId}
        options={options}
        items={items}
        qrCodeDataUrl={qrCodeDataUrl}
        branding={branding}
        companySettings={companySettings}
        pageNumber={pageNum}
        totalPages={totalPages}
      />
    );
  }
  
  // 3. Transition Page (optional - O2 style)
  if (pageSelection.showTransitionPage) {
    const pageNum = getNextPageNumber();
    pages.push(
      <PremiumTransitionPage
        key="transition"
        template={template}
        branding={branding}
        title="Hier geht's zu den Details"
        subtitle="Auf den folgenden Seiten finden Sie alle Details zu Ihrem Angebot."
        pageNumber={pageNum}
        totalPages={totalPages}
      />
    );
  }
  
  // 4. Detail Page (O2 style with checkmarks)
  if (pageSelection.showDetailPage) {
    const pageNum = getNextPageNumber();
    pages.push(
      <PremiumDetailPage
        key="detail"
        template={template}
        items={items}
        hardwareImages={hardwareImages}
        branding={branding}
        pageNumber={pageNum}
        totalPages={totalPages}
      />
    );
  }
  
  // 5. USP Page (optional)
  if (pageSelection.showUspPage) {
    const pageNum = getNextPageNumber();
    pages.push(
      <PremiumUspPage
        key="usp"
        template={template}
        branding={branding}
        companySettings={companySettings}
        pageNumber={pageNum}
        totalPages={totalPages}
      />
    );
  }
  
  // 6. Contact Page
  if (pageSelection.showContactPage) {
    const pageNum = getNextPageNumber();
    pages.push(
      <PremiumContactPage
        key="contact"
        template={template}
        contact={contact}
        options={options}
        offerId={offerId}
        branding={branding}
        pageNumber={pageNum}
        totalPages={totalPages}
      />
    );
  }
  
  // 7. Dealer Summary Page (confidential)
  if (pageSelection.showDealerPage && dealerData) {
    const pageNum = getNextPageNumber();
    pages.push(
      <DealerSummaryPage
        key="dealer"
        template={template}
        branding={branding}
        dealerData={dealerData}
        pageNumber={pageNum}
        totalPages={totalPages}
      />
    );
  }
  
  return (
    <Document>
      {pages}
    </Document>
  );
}
