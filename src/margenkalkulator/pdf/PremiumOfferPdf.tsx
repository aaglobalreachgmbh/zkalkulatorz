// ============================================
// Premium Offer PDF - O2/Vodafone Style Combined
// Professional multi-page PDF with modular pages
// ============================================

import { Document } from "@react-pdf/renderer";
import type { ProfessionalOfferPdfProps } from "./templates/types";
import { DEFAULT_TEMPLATE } from "./templates/allenetzeClean";
import { DEFAULT_BRANDING } from "@/hooks/useTenantBranding";
import { PremiumCoverPage } from "./components/PremiumCoverPage";
import { PremiumSummaryPage } from "./components/PremiumSummaryPage";
import { PremiumDetailPage } from "./components/PremiumDetailPage";
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
  // Calculate total pages
  const hasCover = options.showCoverPage;
  const hasDealer = showDealerSummary && dealerData;
  const totalPages = (hasCover ? 1 : 0) + 3 + (hasDealer ? 1 : 0); // Cover + Summary + Detail + Contact + Dealer
  
  let currentPage = 0;
  
  return (
    <Document>
      {/* Cover Page (optional) */}
      {hasCover && (
        <PremiumCoverPage
          template={template}
          customer={customer}
          offerId={offerId}
          branding={branding}
        />
      )}
      
      {/* Summary Page with period table */}
      <PremiumSummaryPage
        template={template}
        customer={customer}
        contact={contact}
        offerId={offerId}
        options={options}
        items={items}
        qrCodeDataUrl={qrCodeDataUrl}
        branding={branding}
        companySettings={companySettings}
        pageNumber={hasCover ? 2 : 1}
        totalPages={totalPages}
      />
      
      {/* Detail Page with features */}
      <PremiumDetailPage
        template={template}
        items={items}
        hardwareImages={hardwareImages}
        branding={branding}
        pageNumber={hasCover ? 3 : 2}
        totalPages={totalPages}
      />
      
      {/* Contact Page */}
      <PremiumContactPage
        template={template}
        contact={contact}
        options={options}
        offerId={offerId}
        branding={branding}
        pageNumber={hasCover ? 4 : 3}
        totalPages={totalPages}
      />
      
      {/* Dealer Summary (optional, confidential) */}
      {hasDealer && (
        <DealerSummaryPage
          template={template}
          branding={branding}
          dealerData={dealerData}
          pageNumber={totalPages}
          totalPages={totalPages}
        />
      )}
    </Document>
  );
}
