// ============================================
// PDF Design System - Premium Redesign
// Central colors, typography, spacing definitions
// Publisher: allenetze.de (NEVER Vodafone/O2)
// ============================================

/**
 * Premium PDF Color Palette
 * Vodafone/O2 inspired, but branded for allenetze.de
 */
export const PDF_COLORS = {
  // Brand colors
  primary: "#e53935",       // Accent (Vodafone-style red)
  primaryO2: "#0066CC",     // O2 Blue primary
  accent: "#1a1a2e",        // Cover background (Navy)
  accentGradient: "#2563eb", // Blue for gradient simulation
  
  // Semantic colors
  discount: "#ef4444",      // Discounts (Red with minus sign)
  success: "#22c55e",       // Checkmarks (Green)
  warning: "#f59e0b",       // Warnings (Orange)
  
  // Text colors
  text: "#1a1a1a",          // Primary text
  textMuted: "#666666",     // Secondary text
  textLight: "#999999",     // Tertiary text
  
  // Background colors
  bgWhite: "#ffffff",
  bgAlt: "#f9fafb",         // Alternating rows
  bgLight: "#f8f9fa",       // Cards background
  bgMobile: "#f0f9ff",      // Mobile section header (light blue)
  bgFixedNet: "#f0fdf4",    // Fixed net section header (light green)
  
  // Border colors
  border: "#e5e7eb",
  borderLight: "#f3f4f6",
  
  // Overlay colors
  overlayLight: "rgba(255,255,255,0.15)",
  overlayDark: "rgba(0,0,0,0.1)",
} as const;

/**
 * Typography Scale for PDF
 * Consistent font sizes across all pages
 */
export const PDF_TYPOGRAPHY = {
  // Headlines
  h1: 42,                   // Cover main headline
  h2: 36,                   // Section headlines
  h3: 24,                   // Sub-headlines
  h4: 16,                   // Page titles
  h5: 14,                   // Section titles
  h6: 12,                   // Card titles
  
  // Body text
  body: 10,                 // Standard body text
  bodySmall: 9,             // Compact body text
  
  // Captions and labels
  caption: 8,               // Labels, captions
  small: 7,                 // Footer, fine print
  tiny: 6,                  // Disclaimer, legal
  
  // Table typography
  tableHeader: 8,           // Table headers (bold)
  tableCell: 9,             // Table cells
  tableTotal: 10,           // Total row (bold)
} as const;

/**
 * Spacing System
 * Consistent margins and padding
 */
export const PDF_SPACING = {
  // Page padding
  pagePadding: 35,          // Standard page padding
  pagePaddingLarge: 40,     // Large page padding (cover, contact)
  
  // Section spacing
  sectionGap: 25,           // Between sections
  elementGap: 10,           // Between elements
  itemGap: 6,               // Between list items
  
  // Table spacing
  tablePadding: 8,          // Cell padding
  tableRowGap: 6,           // Row vertical padding
  
  // Card spacing
  cardPadding: 12,          // Card internal padding
  cardGap: 15,              // Between cards
} as const;

/**
 * Template Variants
 * O2 Blue vs Vodafone Red
 */
export type TemplateVariant = "premium-o2" | "premium-vodafone";

export const TEMPLATE_VARIANTS: Record<TemplateVariant, {
  primaryColor: string;
  accentColor: string;
  name: string;
  description: string;
}> = {
  "premium-o2": {
    primaryColor: "#0066CC",
    accentColor: "#002855",
    name: "O2 Blau",
    description: "Modernes, professionelles Design mit Blau-Akzenten",
  },
  "premium-vodafone": {
    primaryColor: "#E60000",
    accentColor: "#1A1A2E",
    name: "Vodafone Rot",
    description: "Klares, strukturiertes Design mit Rot-Akzenten",
  },
};

/**
 * Get template colors based on variant
 */
export function getTemplateColors(variant: TemplateVariant = "premium-vodafone") {
  return TEMPLATE_VARIANTS[variant];
}

/**
 * Period Column Definition for Vodafone-style tables
 */
export interface PeriodColumnDef {
  header: string;
  fromMonth: number;
  toMonth: number;
}

/**
 * Generate standard period columns (1.-12. and 13.-24.)
 */
export function generateStandardPeriods(): PeriodColumnDef[] {
  return [
    { header: "1.-12. Monat", fromMonth: 1, toMonth: 12 },
    { header: "13.-24. Monat", fromMonth: 13, toMonth: 24 },
  ];
}

/**
 * Format currency for German locale
 */
export function formatCurrencyPdf(value: number | undefined | null): string {
  const num = value ?? 0;
  if (isNaN(num)) return "0,00 €";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format discount with minus sign (for red display)
 */
export function formatDiscountPdf(value: number): string {
  const num = Math.abs(value);
  return `−${formatCurrencyPdf(num).replace("-", "")}`;
}

/**
 * Format date for German locale
 */
export function formatDatePdf(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format long date for German locale
 */
export function formatLongDatePdf(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Sanitize text for PDF rendering
 * Removes control characters and HTML tags
 */
export function sanitizeTextPdf(text: string | undefined | null, maxLength = 200): string {
  if (!text) return "";
  return String(text)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/<[^>]*>/g, "")
    .slice(0, maxLength);
}
