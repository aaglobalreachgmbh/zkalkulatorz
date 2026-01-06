// ============================================
// Publisher Configuration - allenetze.de
// CONSTANT - Not editable by tenants
// ============================================

export const PUBLISHER = {
  name: "allenetze.de",
  displayName: "Allenetze MargenKalkulator",
  subline: "Herausgeber: allenetze.de",
  
  // Legal entity
  address: {
    street: "Königstraße 22",
    zipCity: "47051 Duisburg",
    country: "Deutschland",
  },
  representative: "Funda Akar",
  phone: "0203 2980502",
  email: "info@allenetze.de",
  vatId: "DE278076921",
  
  // Legal links
  links: {
    impressum: "https://allenetze.de/impressum/",
    datenschutz: "https://allenetze.de/datenschutz/",
  },
  
  // Copyright
  getCopyright: () => `© ${new Date().getFullYear()} allenetze.de`,
} as const;

export type Publisher = typeof PUBLISHER;
