// ============================================
// PDF Template System - Type Definitions
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
}

/**
 * Period column for multi-period pricing tables
 */
export interface PeriodColumn {
  /** Column header (e.g., "Monat 1-12") */
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
}

/**
 * Props for the professional offer PDF
 */
export interface ProfessionalOfferPdfProps {
  template: PdfTemplate;
  customer: OfferCustomerInfo;
  options: PdfOfferOptions;
  branding?: TenantBranding;
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
}
