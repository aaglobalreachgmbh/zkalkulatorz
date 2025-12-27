// ============================================
// Offer PDF Document Component
// Generates customer-facing PDF (no dealer data!)
// SECURITY: All dynamic content is sanitized before rendering
// ============================================

import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { OfferOptionState, CalculationResult } from "../engine/types";
import { styles } from "./styles";

interface OfferPdfProps {
  option: OfferOptionState;
  result: CalculationResult;
  validDays?: number;
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

export function OfferPdf({ option, result, validDays = 14 }: OfferPdfProps) {
  const today = new Date();
  const validUntil = new Date(today.getTime() + validDays * 24 * 60 * 60 * 1000);
  
  const formatDate = (date: Date) => 
    date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  
  const formatCurrency = (value: number) => 
    `${sanitizeNumber(value).toFixed(2).replace(".", ",")} €`;
  
  // Calculate one-time total
  const oneTimeTotal = result.oneTime.reduce((sum, item) => sum + sanitizeNumber(item.net), 0);
  
  // Get hardware display info (SANITIZED)
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
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>MargenKalkulator</Text>
            <Text style={styles.logoSubtext}>Vodafone Business Partner</Text>
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
        
        {/* Positions Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colPosition]}>Position</Text>
            <Text style={[styles.tableHeaderCell, styles.colMonthly]}>Monatlich</Text>
            <Text style={[styles.tableHeaderCell, styles.colOneTime]}>Einmalig</Text>
          </View>
          
          {/* Hardware */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colPosition]}>{hardwareName}</Text>
            <Text style={[styles.tableCell, styles.colMonthly]}>
              {option.hardware.amortize && hasHardware 
                ? formatCurrency(option.hardware.ekNet / option.hardware.amortMonths)
                : "–"
              }
            </Text>
            <Text style={[styles.tableCell, styles.colOneTime]}>
              {!option.hardware.amortize && hasHardware
                ? formatCurrency(option.hardware.ekNet)
                : hasHardware ? "inkl." : "–"
              }
            </Text>
          </View>
          
          {/* Mobile Tariff */}
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={[styles.tableCell, styles.colPosition]}>
              {tariffName} {option.mobile.quantity > 1 ? `(×${option.mobile.quantity})` : ""}
            </Text>
            <Text style={[styles.tableCell, styles.colMonthly]}>
              {formatCurrency(mobileMonthly)}
            </Text>
            <Text style={[styles.tableCell, styles.colOneTime]}>–</Text>
          </View>
          
          {/* Fixed Net (if enabled) */}
          {option.fixedNet.enabled && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colPosition]}>{fixedNetName}</Text>
              <Text style={[styles.tableCell, styles.colMonthly]}>
                {formatCurrency(fixedNetMonthly)}
              </Text>
              <Text style={[styles.tableCell, styles.colOneTime]}>
                {oneTimeTotal > 0 ? formatCurrency(oneTimeTotal) : "–"}
              </Text>
            </View>
          )}
          
          {/* Fixed IP (if enabled) */}
          {option.fixedNet.fixedIpEnabled && (
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={[styles.tableCell, styles.colPosition]}>Feste IP-Adresse</Text>
              <Text style={[styles.tableCell, styles.colMonthly]}>
                {formatCurrency(5.00)}
              </Text>
              <Text style={[styles.tableCell, styles.colOneTime]}>–</Text>
            </View>
          )}
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
          <View style={styles.summaryTotal}>
            <Text style={styles.summaryTotalLabel}>Ø Monatlich netto</Text>
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
            MargenKalkulator • Vodafone Business Partner
          </Text>
          <Text style={styles.footerRight}>
            Angebots-ID: {Date.now().toString(36).toUpperCase()}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
