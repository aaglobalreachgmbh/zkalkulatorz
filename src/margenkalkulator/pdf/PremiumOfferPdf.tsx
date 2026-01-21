// ============================================
// Premium Offer PDF - O2/Vodafone Style Combined
// Professional multi-page PDF with modular pages
// Supports page selection + custom pages from export wizard
// ============================================

import { Document } from "@react-pdf/renderer";
import type { ProfessionalOfferPdfProps, PdfPageSelection, CustomPageConfig } from "./templates/types";
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
import { CustomPage } from "./components/CustomPage";

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

  // Helper: filter custom pages by position
  const getCustomPagesByPosition = (position: CustomPageConfig["position"]) =>
    pageSelection.customPages.filter(p => p.position === position);

  // Calculate total pages based on selection
  const calculateTotalPages = () => {
    let count = 0;
    if (pageSelection.showCoverPage) count++;
    // Custom pages before summary
    count += getCustomPagesByPosition("before-summary").length;
    if (pageSelection.showSummaryPage) count++;
    // Custom pages after summary
    count += getCustomPagesByPosition("after-summary").length;
    if (pageSelection.showTransitionPage) count++;
    if (pageSelection.showDetailPage) count++;
    if (pageSelection.showHardwarePage && hasHardware) count++;
    if (pageSelection.showUspPage) count++;
    // Custom pages before contact
    count += getCustomPagesByPosition("before-contact").length;
    if (pageSelection.showContactPage) count++;
    // Custom pages after contact
    count += getCustomPagesByPosition("after-contact").length;
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
    getNextPageNumber();
    pages.push(
      <PremiumCoverPage
        key="cover"
        customer={customer}
        offerId={offerId}
        logoUrl={branding?.logoUrl}
      />
    );
  }

  // 2. Custom Pages: before-summary
  getCustomPagesByPosition("before-summary").forEach((cp) => {
    const pageNum = getNextPageNumber();
    pages.push(
      <CustomPage
        key={cp.id}
        config={cp}
        template={template}
        branding={branding}
        pageNumber={pageNum}
        totalPages={totalPages}
      />
    );
  });

  // 3. Summary Page (with period table - Vodafone style)
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

  // 4. Custom Pages: after-summary
  getCustomPagesByPosition("after-summary").forEach((cp) => {
    const pageNum = getNextPageNumber();
    pages.push(
      <CustomPage
        key={cp.id}
        config={cp}
        template={template}
        branding={branding}
        pageNumber={pageNum}
        totalPages={totalPages}
      />
    );
  });

  // 5. Transition Page (optional - O2 style)
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

  // 6. Detail Page (O2 style with checkmarks)
  if (pageSelection.showDetailPage) {
    const pageNum = getNextPageNumber();
    pages.push(
      <PremiumDetailPage
        key="detail"
        template={template}
        items={items}
        branding={branding}
        pageNumber={pageNum}
        totalPages={totalPages}
      />
    );
  }

  // 7. USP Page (optional)
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

  // 8. Custom Pages: before-contact
  getCustomPagesByPosition("before-contact").forEach((cp) => {
    const pageNum = getNextPageNumber();
    pages.push(
      <CustomPage
        key={cp.id}
        config={cp}
        template={template}
        branding={branding}
        pageNumber={pageNum}
        totalPages={totalPages}
      />
    );
  });

  // 9. Contact Page
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

  // 10. Custom Pages: after-contact
  getCustomPagesByPosition("after-contact").forEach((cp) => {
    const pageNum = getNextPageNumber();
    pages.push(
      <CustomPage
        key={cp.id}
        config={cp}
        template={template}
        branding={branding}
        pageNumber={pageNum}
        totalPages={totalPages}
      />
    );
  });

  // 11. Dealer Summary Page (confidential)
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
      {pages as any}
    </Document>
  );
}
