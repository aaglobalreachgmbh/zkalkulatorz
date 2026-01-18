// ============================================
// Premium O2 Business Style Template
// Modern blue gradient design inspired by O2 Business
// ============================================

import type { PdfTemplate } from "./types";

export const PREMIUM_O2_TEMPLATE: PdfTemplate = {
  id: "premium-o2",
  name: "Premium O2 Style",
  description: "Modernes, professionelles Design im O2 Business Stil mit Deckblatt",
  
  // Page options
  showCoverPage: true,
  showMarketingPage: false,
  discountDetailLevel: "detailliert",
  
  // Styling - O2 Blue theme
  primaryColor: "#0066CC", // O2 Blue
  accentColor: "#002855",  // O2 Dark Blue
  fontFamily: "Helvetica",
  
  // Publisher info
  publisherInfo: {
    name: "Allenetze MargenKalkulator",
    subline: "Herausgeber: allenetze.de",
    website: "allenetze.de",
  },
};

export const PREMIUM_VODAFONE_TEMPLATE: PdfTemplate = {
  id: "premium-vodafone",
  name: "Premium Vodafone Style",
  description: "Klares, strukturiertes Design im Vodafone Business Stil",
  
  // Page options
  showCoverPage: true,
  showMarketingPage: false,
  discountDetailLevel: "detailliert",
  
  // Styling - Vodafone Red theme
  primaryColor: "#E60000", // Vodafone Red
  accentColor: "#1A1A2E",  // Dark navy
  fontFamily: "Helvetica",
  
  // Publisher info
  publisherInfo: {
    name: "Allenetze MargenKalkulator",
    subline: "Herausgeber: allenetze.de",
    website: "allenetze.de",
  },
};
