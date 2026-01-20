// ============================================
// Professional Offer PDF - Premium Redesign
// Orchestrator for all PDF pages
// Publisher: allenetze.de
// ============================================

import React from "react";
import { Document, Font } from "@react-pdf/renderer";
import type { ProfessionalOfferPdfProps } from "./templates/types";
import { PUBLISHER } from "../publisherConfig";

// Components
import { PremiumCoverPage } from "./components/PremiumCoverPage";
import { PremiumSummaryPage } from "./components/PremiumSummaryPage";
import { PremiumDetailPage } from "./components/PremiumDetailPage";
import { PremiumHardwarePage } from "./components/PremiumHardwarePage";
import { PremiumContactPage } from "./components/PremiumContactPage";

// Register fonts (system fonts or custom if available)
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf" },
    { src: "https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf", fontWeight: "bold" },
  ],
});

export function ProfessionalOfferPdf(props: ProfessionalOfferPdfProps) {
  const {
    template,
    customer,
    items,
    options,
    branding,
    offerId,
    // other props passed through
  } = props;

  // Branding override (Publisher is always allenetze.de, but branding allows logo/colors)
  // If no branding provided, use template defaults

  // Calculate total pages for pagination
  // Cover + Summary + Detail + (Hardware if needed) + Contact
  // This is an estimate, exact calculation is hard in react-pdf without rendering.
  // We'll pass a dynamic page number to components.

  const hasHardware = items.some(item => item.option.hardware.ekNet > 0);
  const totalPages = 4 + (hasHardware ? 1 : 0);

  // Collect hardware images if passed in props (need to be handled in parent)
  // For now assuming passed or empty

  return (
    <Document
      title={`Angebot_${offerId}_${customer.firma || customer.nachname}`}
      author={PUBLISHER.name}
      creator="Antigravity Estimate Engine"
      producer={PUBLISHER.displayName}
    >
      {/* Page 1: Cover */}
      <PremiumCoverPage
        customer={customer}
        offerId={offerId}
        logoUrl={branding?.logoUrl}
      />

      {/* Page 2: Management Summary */}
      <PremiumSummaryPage
        {...props}
        pageNumber={2}
        totalPages={totalPages}
      />

      {/* Page 3: Tariff Details */}
      <PremiumDetailPage
        {...props}
        pageNumber={3}
        totalPages={totalPages}
      />

      {/* Page 4: Hardware (Optional) */}
      {hasHardware && (
        <PremiumHardwarePage
          {...props}
          // hardwareImages map should be passed in props if available
          pageNumber={4}
          totalPages={totalPages}
        />
      )}

      {/* Last Page: Contact & Impressum */}
      <PremiumContactPage
        {...props}
        pageNumber={hasHardware ? 5 : 4}
        totalPages={totalPages}
      />
    </Document>
  );
}

export default ProfessionalOfferPdf;
