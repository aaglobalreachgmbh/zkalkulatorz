// ============================================
// Allenetze Clean Template
// Standard template for professional offers
// ============================================

import type { PdfTemplate } from "./types";

export const ALLENETZE_CLEAN_TEMPLATE: PdfTemplate = {
  id: "allenetze-clean",
  name: "Allenetze Clean",
  description: "Professionelles, klares Design mit Perioden-Preistabellen",
  
  // Page options
  showCoverPage: false,
  showMarketingPage: false,
  discountDetailLevel: "detailliert",
  
  // Styling
  primaryColor: "#e53935", // Vodafone red
  accentColor: "#1a1a2e",  // Dark navy
  fontFamily: "Helvetica",
  
  // Publisher info
  publisherInfo: {
    name: "Allenetze MargenKalkulator",
    subline: "Herausgeber: allenetze.de",
    website: "allenetze.de",
  },
};

export const DEFAULT_TEMPLATE = ALLENETZE_CLEAN_TEMPLATE;
