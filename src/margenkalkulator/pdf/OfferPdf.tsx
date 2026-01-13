// ============================================
// Offer PDF Document Component
// Generates customer-facing PDF (no dealer data!)
// SECURITY: All dynamic content is sanitized before rendering
// BRANDING: Supports dynamic tenant branding
// ============================================

import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import type { OfferOptionState, CalculationResult } from "../engine/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";
import { DEFAULT_BRANDING } from "@/hooks/useTenantBranding";
import { createPdfStyles, styles as defaultStyles } from "./styles";

interface OfferPdfProps {
  option: OfferOptionState;
  result: CalculationResult;
  validDays?: number;
  branding?: TenantBranding;
}

// SECURITY: Sanitize text content to prevent XSS and injection in PDF
function sanitizePdfText(text: string | undefined | null, maxLength = 200): string {
  if (!text) return "";
  return String(text)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") // Remove control characters
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/data:/gi, "") // Remove data: protocol
    .slice(0, maxLength);
}

// SECURITY: Sanitize number to prevent NaN display
function sanitizeNumber(value: number | undefined | null): number {
  if (value === undefined || value === null || isNaN(value)) return 0;
  return value;
}

export function OfferPdf({ option, result, validDays = 14, branding = DEFAULT_BRANDING }: OfferPdfProps) {
  const styles = branding ? createPdfStyles(branding) : defaultStyles;

  const today = new Date();
  const validUntil = new Date(today.getTime() + validDays * 24 * 60 * 60 * 1000);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  const formatCurrency = (value: number) =>
    `${sanitizeNumber(value).toFixed(2).replace(".", ",")} €`;

  // Calculate one-time total
  const oneTimeTotal = result.oneTime.reduce((sum, item) => sum + sanitizeNumber(item.net), 0);

  // Get hardware display info (SANITIZED)
  // WICHTIG: EK-Preis wird NIE im Kunden-PDF angezeigt!
  const hasHardware = sanitizeNumber(option.hardware.ekNet) > 0;
  const hardwareName = sanitizePdfText(option.hardware.name) || "Keine Hardware";

  // Get tariff info from breakdown (SANITIZED)
  const tariffBreakdown = result.breakdown.find(b => b.ruleId === "base");
  const tariffName = sanitizePdfText(tariffBreakdown?.label?.replace(" Grundpreis", "")) || "Mobilfunk-Tarif";

  // Get fixed net info (SANITIZED)
  const fixedNetBreakdown = result.breakdown.find(b => b.ruleId === "fixed_base");
  const fixedNetName = sanitizePdfText(fixedNetBreakdown?.label?.replace(" monatlich", "")) || "Festnetz";
  const fixedNetMonthly = sanitizeNumber(fixedNetBreakdown?.net);

  // Calculate mobile-only monthly (without fixed net)
  const mobileMonthly = sanitizeNumber(result.totals.avgTermNet) - (option.fixedNet.enabled ? fixedNetMonthly : 0);

  // Display name for header
  const displayName = branding.companyName || "MargenKalkulator";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {branding.logoUrl ? (
              <View style={styles.logoContainer}>
                {/* High-DPI logo rendering for PDF quality */}
                <Image src={branding.logoUrl} style={styles.logoImage} />
              </View>
            ) : null}
            <View>
              <Text style={styles.logo}>{displayName}</Text>
              <Text style={styles.logoSubtext}>Vodafone Business Partner</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>Ihr Angebot</Text>
            <Text style={styles.headerDate}>
              Erstellt am {formatDate(today)} • Gültig bis {formatDate(validUntil)}
            </Text>
          </View>
        </View>

        {/* Offer Details */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Angebotsdetails</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Laufzeit:</Text>
            <Text style={styles.infoValue}>{option.meta.termMonths} Monate</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Anzahl Verträge:</Text>
            <Text style={styles.infoValue}>{option.mobile.quantity}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vertragsart:</Text>
            <Text style={styles.infoValue}>
              {option.mobile.contractType === "new" ? "Neuvertrag" : "Verlängerung"}
            </Text>
          </View>
          {result.gkEligible && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Konvergenz:</Text>
              <Text style={styles.infoValue}>GigaKombi-Vorteil aktiv</Text>
            </View>
          )}
        </View>

        {/* 1. Positionen (Items) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enthaltene Positionen</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colPosition]}>Position</Text>
              <Text style={[styles.tableHeaderCell, styles.colOneTime]}>Einmalig</Text>
            </View>

            {/* Hardware */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colPosition]}>{hardwareName}</Text>
              <Text style={[styles.tableCell, styles.colOneTime]}>
                {hasHardware ? "inklusive" : "–"}
              </Text>
            </View>

            {/* Mobile */}
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={[styles.tableCell, styles.colPosition]}>
                {tariffName} {option.mobile.quantity > 1 ? `(×${option.mobile.quantity})` : ""}
              </Text>
              <Text style={[styles.tableCell, styles.colOneTime]}>
                {option.mobile.contractType === "new" ? formatCurrency(0) : "–"}
              </Text>
            </View>

            {/* Fixed Net */}
            {option.fixedNet.enabled && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colPosition]}>{fixedNetName}</Text>
                <Text style={[styles.tableCell, styles.colOneTime]}>
                  {oneTimeTotal > 0 ? formatCurrency(oneTimeTotal) : "–"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 2. Zahlungsplan (Payment Schedule) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zahlungsplan (Monatliche Kosten)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colPosition]}>Zeitraum</Text>
              <Text style={[styles.tableHeaderCell, styles.colMonthly]}>Betrag (Netto)</Text>
            </View>
            {/* Payment Plan */}
            {result.periods.map((period, idx) => {
              const matchesBase = tariffBreakdown && Math.abs(period.monthly.net - tariffBreakdown.net) < 0.01;
              const isFree = period.monthly.net < 0.01;
              return (
                <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCell, styles.colPosition]}>
                    {period.label || `Monat ${period.fromMonth} – ${period.toMonth}`}
                    {isFree && " (Basispreisbefreiung)"}
                  </Text>
                  <Text style={[styles.tableCell, styles.colMonthly]}>
                    {formatCurrency(period.monthly.net)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Einmalkosten gesamt</Text>
            <Text style={styles.summaryValue}>{formatCurrency(oneTimeTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gesamtkosten ({option.meta.termMonths} Monate)</Text>
            <Text style={styles.summaryValue}>{formatCurrency(result.totals.sumTermNet)}</Text>
          </View>

          {/* Dual Price Display if Discounted */}
          {tariffBreakdown && result.totals.avgTermNet < tariffBreakdown.net && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Regulärer Basispreis</Text>
              <Text style={[styles.summaryValue, { textDecoration: "line-through", color: "#9ca3af" }]}>
                {formatCurrency(tariffBreakdown.net)}
              </Text>
            </View>
          )}

          <View style={styles.summaryTotal}>
            <Text style={styles.summaryTotalLabel}>Ø Effektiver Monatspreis</Text>
            <Text style={styles.summaryTotalValue}>{formatCurrency(result.totals.avgTermNet)}</Text>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.legalSection}>
          <Text style={styles.legalText}>
            Alle Preise verstehen sich zzgl. 19% MwSt. sofern nicht anders angegeben.
            Dieses Angebot ist unverbindlich und gilt vorbehaltlich Verfügbarkeit und Bonitätsprüfung.
            Es gelten die Allgemeinen Geschäftsbedingungen der Vodafone GmbH.
            Mindestvertragslaufzeit: {option.meta.termMonths} Monate.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLeft}>
            {displayName} • Vodafone Business Partner
          </Text>
          <Text style={styles.footerRight}>
            Angebots-ID: {Date.now().toString(36).toUpperCase()}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
