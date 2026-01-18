// ============================================
// PDF Template System - Type Definitions
// Extended with page selection and custom pages
// ============================================

import type { TenantBranding } from "@/hooks/useTenantBranding";

/**
 * PDF Template Definition
 */
export interface PdfTemplate {
  /** Unique template ID */
  id: string;
  /** Display name */
  name: string;
  /** Description for admin UI */
  description: string;
  
  // Page options
  /** Show optional cover page */
  showCoverPage: boolean;
  /** Show marketing/about page */
  showMarketingPage: boolean;
  /** Discount detail level */
  discountDetailLevel: "kurz" | "detailliert";
  
  // Styling
  /** Primary color (hex) */
  primaryColor: string;
  /** Accent color (hex) */
  accentColor: string;
  /** Font family */
  fontFamily: "Helvetica" | "Times-Roman" | "Courier";
  
  // Publisher info (always allenetze.de)
  publisherInfo: {
    name: string;
    subline: string;
    website: string;
  };
}

/**
 * Customer info for personalized offers
 */
export interface OfferCustomerInfo {
  firma: string;
  anrede: "Herr" | "Frau" | "";
  vorname: string;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;
  email?: string;
  telefon?: string;
}

/**
 * PDF page selection options for the wizard
 */
export interface PdfPageSelection {
  /** Show lifestyle cover page */
  showCoverPage: boolean;
  /** Show summary with cost table */
  showSummaryPage: boolean;
  /** Show transition/details page */
  showTransitionPage: boolean;
  /** Show detailed tariff features */
  showDetailPage: boolean;
  /** Show hardware financing */
  showHardwarePage: boolean;
  /** Show USP/benefits page */
  showUspPage: boolean;
  /** Show contact page */
  showContactPage: boolean;
  /** Show dealer summary (internal) */
  showDealerPage: boolean;
  /** Custom pages to include */
  customPages: CustomPageConfig[];
}

/**
 * Custom page configuration
 */
export interface CustomPageConfig {
  id: string;
  type: "text" | "image" | "attachment";
  title: string;
  content?: string;
  imageUrl?: string;
  position: "before-summary" | "after-summary" | "before-contact" | "after-contact";
}

/**
 * Offer options for PDF generation
 */
export interface PdfOfferOptions {
  /** Template to use */
  templateId: string;
  /** Show cover page */
  showCoverPage: boolean;
  /** Days until offer expires */
  validDays: number;
  /** Custom offer text */
  offerText?: string;
  /** Promo highlight text */
  promoHighlight?: string;
  /** Page selection (if wizard used) */
  pageSelection?: PdfPageSelection;
}

/**
 * Period column for multi-period pricing tables (Vodafone-style)
 */
export interface PeriodColumn {
  /** Column header (e.g., "1.-12. Monat") */
  header: string;
  /** Start month (1-indexed) */
  fromMonth: number;
  /** End month (inclusive) */
  toMonth: number;
}

/**
 * Position row in the summary table
 */
export interface PositionRow {
  /** Position quantity */
  quantity?: number;
  /** Position label */
  label: string;
  /** One-time cost */
  oneTime?: number;
  /** Monthly costs by period */
  monthlyByPeriod: number[];
  /** Is this a discount row? */
  isDiscount?: boolean;
  /** Is this a subtotal row? */
  isSubtotal?: boolean;
  /** Is this the grand total row? */
  isTotal?: boolean;
  /** Footnote reference */
  footnote?: string;
}

/**
 * Dealer-specific summary data for confidential PDF section
 */
export interface DealerSummaryData {
  /** Brutto-Provision vor Abzügen */
  grossProvision: number;
  /** Provision nach allen Abzügen */
  netProvision: number;
  /** FH-Partner Abzug */
  fhPartnerDeduction?: number;
  /** OMO-Rate Abzug */
  omoDeduction?: number;
  /** Hardware-EK gesamt */
  hardwareEk: number;
  /** Netto-Marge (Provision - Hardware) */
  netMargin: number;
  /** Marge pro Vertrag */
  marginPerContract: number;
  /** Anzahl Verträge gesamt */
  totalContracts: number;
  /** Vertragsart */
  contractType: "new" | "renewal";
  /** Hardware-Details */
  hardwareDetails?: Array<{
    name: string;
    quantity: number;
    ekPerUnit: number;
  }>;
  /** Push-Bonus */
  pushBonus?: number;
  /** Mitarbeiter-Abzug */
  employeeDeduction?: number;
}

/**
 * Company settings for dynamic PDF header/footer
 */
export interface PdfCompanySettings {
  companyInfo: {
    name: string;
    street: string;
    zip: string;
    city: string;
    phone: string;
    email: string;
    website: string;
  };
  billingInfo: {
    ustId: string;
    taxNumber: string;
    bankName: string;
    iban: string;
    bic: string;
    registrationCourt: string;
    registrationNumber: string;
  };
  pdfContact: {
    name: string;
    position: string;
    email: string;
    phone: string;
  };
}

/**
 * Props for the professional offer PDF
 */
export interface ProfessionalOfferPdfProps {
  template: PdfTemplate;
  customer: OfferCustomerInfo;
  options: PdfOfferOptions;
  branding?: TenantBranding;
  /** Company settings from admin portal */
  companySettings?: PdfCompanySettings;
  /** Sales contact */
  contact?: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
  /** Offer ID */
  offerId: string;
  /** Items to include */
  items: Array<{
    option: import("../../engine/types").OfferOptionState;
    result: import("../../engine/types").CalculationResult;
  }>;
  /** Hardware image URLs by hardware ID */
  hardwareImages?: Map<string, string>;
  /** QR code data URL (pre-generated) */
  qrCodeDataUrl?: string;
  /** Show confidential dealer summary page */
  showDealerSummary?: boolean;
  /** Dealer-specific summary data */
  dealerData?: DealerSummaryData;
}

/**
 * Default page selection
 */
export const DEFAULT_PAGE_SELECTION: PdfPageSelection = {
  showCoverPage: true,
  showSummaryPage: true,
  showTransitionPage: false,
  showDetailPage: true,
  showHardwarePage: true,
  showUspPage: false,
  showContactPage: true,
  showDealerPage: false,
  customPages: [],
};
