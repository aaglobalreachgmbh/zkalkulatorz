// ============================================
// Dealer PDF Document Component
// Generates dealer-facing PDF with margin details
// SECURITY: Only accessible to users with can_view_margins permission
// ============================================

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { OfferOptionState, CalculationResult } from "../engine/types";
import { styles as baseStyles } from "./styles";

interface DealerPdfProps {
  option: OfferOptionState;
  result: CalculationResult;
  validDays?: number;
}

// Extended styles for dealer section
const dealerStyles = StyleSheet.create({
  dealerSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e60000",
  },
  dealerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e60000",
    marginBottom: 10,
  },
  dealerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dealerLabel: {
    fontSize: 10,
    color: "#333",
  },
  dealerValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  dealerValuePositive: {
    color: "#22c55e",
  },
  dealerValueNegative: {
    color: "#ef4444",
  },
  marginTotal: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#e60000",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  marginLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  marginValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  confidentialBanner: {
    backgroundColor: "#e60000",
    padding: 6,
    marginBottom: 10,
  },
  confidentialText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
});

// SECURITY: Sanitize text content
function sanitizePdfText(text: string | undefined | null, maxLength = 200): string {
  if (!text) return "";
  return String(text)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .slice(0, maxLength);
}

function sanitizeNumber(value: number | undefined | null): number {
  if (value === undefined || value === null || isNaN(value)) return 0;
  return value;
}

export function DealerPdf({ option, result, validDays = 14 }: DealerPdfProps) {
  const today = new Date();
  const validUntil = new Date(today.getTime() + validDays * 24 * 60 * 60 * 1000);
  
  const formatDate = (date: Date) => 
    date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  
  const formatCurrency = (value: number) => 
    `${sanitizeNumber(value).toFixed(2).replace(".", ",")} €`;
  
  const oneTimeTotal = result.oneTime.reduce((sum, item) => sum + sanitizeNumber(item.net), 0);
  
  const hasHardware = sanitizeNumber(option.hardware.ekNet) > 0;
  const hardwareName = sanitizePdfText(option.hardware.name) || "Keine Hardware";
  
  const tariffBreakdown = result.breakdown.find(b => b.ruleId === "base");
  const tariffName = sanitizePdfText(tariffBreakdown?.label?.replace(" Grundpreis", "")) || "Mobilfunk-Tarif";
  
  const fixedNetBreakdown = result.breakdown.find(b => b.ruleId === "fixed_base");
  const fixedNetName = sanitizePdfText(fixedNetBreakdown?.label?.replace(" monatlich", "")) || "Festnetz";
  const fixedNetMonthly = sanitizeNumber(fixedNetBreakdown?.net);
  
  const mobileMonthly = sanitizeNumber(result.totals.avgTermNet) - (option.fixedNet.enabled ? fixedNetMonthly : 0);
  
  // Dealer calculations
  const margin = sanitizeNumber(result.dealer.margin);
  const isPositiveMargin = margin >= 0;
  
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        {/* Confidential Banner */}
        <View style={dealerStyles.confidentialBanner}>
          <Text style={dealerStyles.confidentialText}>
            VERTRAULICH – NUR FÜR INTERNEN GEBRAUCH
          </Text>
        </View>
        
        {/* Header */}
        <View style={baseStyles.header}>
          <View>
            <Text style={baseStyles.logo}>MargenKalkulator</Text>
            <Text style={baseStyles.logoSubtext}>Händler-Kalkulation</Text>
          </View>
          <View style={baseStyles.headerRight}>
            <Text style={baseStyles.headerTitle}>Interne Kalkulation</Text>
            <Text style={baseStyles.headerDate}>
              Erstellt am {formatDate(today)}
            </Text>
          </View>
        </View>
        
        {/* Offer Details */}
        <View style={baseStyles.infoSection}>
          <Text style={baseStyles.infoTitle}>Angebotsdetails</Text>
          <View style={baseStyles.infoRow}>
            <Text style={baseStyles.infoLabel}>Laufzeit:</Text>
            <Text style={baseStyles.infoValue}>{option.meta.termMonths} Monate</Text>
          </View>
          <View style={baseStyles.infoRow}>
            <Text style={baseStyles.infoLabel}>Anzahl Verträge:</Text>
            <Text style={baseStyles.infoValue}>{option.mobile.quantity}</Text>
          </View>
          <View style={baseStyles.infoRow}>
            <Text style={baseStyles.infoLabel}>Vertragsart:</Text>
            <Text style={baseStyles.infoValue}>
              {option.mobile.contractType === "new" ? "Neuvertrag" : "Verlängerung"}
            </Text>
          </View>
        </View>
        
        {/* Positions Table */}
        <View style={baseStyles.table}>
          <View style={baseStyles.tableHeader}>
            <Text style={[baseStyles.tableHeaderCell, baseStyles.colPosition]}>Position</Text>
            <Text style={[baseStyles.tableHeaderCell, baseStyles.colMonthly]}>Monatlich</Text>
            <Text style={[baseStyles.tableHeaderCell, baseStyles.colOneTime]}>Einmalig</Text>
          </View>
          
          <View style={baseStyles.tableRow}>
            <Text style={[baseStyles.tableCell, baseStyles.colPosition]}>{hardwareName}</Text>
            <Text style={[baseStyles.tableCell, baseStyles.colMonthly]}>
              {option.hardware.amortize && hasHardware 
                ? formatCurrency(option.hardware.ekNet / option.hardware.amortMonths)
                : "–"
              }
            </Text>
            <Text style={[baseStyles.tableCell, baseStyles.colOneTime]}>
              {!option.hardware.amortize && hasHardware
                ? formatCurrency(option.hardware.ekNet)
                : hasHardware ? "inkl." : "–"
              }
            </Text>
          </View>
          
          <View style={[baseStyles.tableRow, baseStyles.tableRowAlt]}>
            <Text style={[baseStyles.tableCell, baseStyles.colPosition]}>
              {tariffName} {option.mobile.quantity > 1 ? `(×${option.mobile.quantity})` : ""}
            </Text>
            <Text style={[baseStyles.tableCell, baseStyles.colMonthly]}>
              {formatCurrency(mobileMonthly)}
            </Text>
            <Text style={[baseStyles.tableCell, baseStyles.colOneTime]}>–</Text>
          </View>
          
          {option.fixedNet.enabled && (
            <View style={baseStyles.tableRow}>
              <Text style={[baseStyles.tableCell, baseStyles.colPosition]}>{fixedNetName}</Text>
              <Text style={[baseStyles.tableCell, baseStyles.colMonthly]}>
                {formatCurrency(fixedNetMonthly)}
              </Text>
              <Text style={[baseStyles.tableCell, baseStyles.colOneTime]}>
                {oneTimeTotal > 0 ? formatCurrency(oneTimeTotal) : "–"}
              </Text>
            </View>
          )}
        </View>
        
        {/* Customer Summary */}
        <View style={baseStyles.summarySection}>
          <View style={baseStyles.summaryRow}>
            <Text style={baseStyles.summaryLabel}>Kundenpreis Ø monatlich</Text>
            <Text style={baseStyles.summaryValue}>{formatCurrency(result.totals.avgTermNet)}</Text>
          </View>
        </View>
        
        {/* DEALER SECTION */}
        <View style={dealerStyles.dealerSection}>
          <Text style={dealerStyles.dealerTitle}>Händler-Kalkulation</Text>
          
          {/* Provision */}
          <View style={dealerStyles.dealerRow}>
            <Text style={dealerStyles.dealerLabel}>Provision (nach Abzügen)</Text>
            <Text style={[dealerStyles.dealerValue, dealerStyles.dealerValuePositive]}>
              + {formatCurrency(sanitizeNumber(result.dealer.provisionAfter))}
            </Text>
          </View>
          
          {/* Hardware EK */}
          {hasHardware && (
            <View style={dealerStyles.dealerRow}>
              <Text style={dealerStyles.dealerLabel}>Hardware-EK</Text>
              <Text style={[dealerStyles.dealerValue, dealerStyles.dealerValueNegative]}>
                – {formatCurrency(sanitizeNumber(option.hardware.ekNet))}
              </Text>
            </View>
          )}
          
          {/* Deductions */}
          {sanitizeNumber(result.dealer.deductions) > 0 && (
            <View style={dealerStyles.dealerRow}>
              <Text style={dealerStyles.dealerLabel}>Abzüge (OMO/Mitarbeiter)</Text>
              <Text style={[dealerStyles.dealerValue, dealerStyles.dealerValueNegative]}>
                – {formatCurrency(sanitizeNumber(result.dealer.deductions))}
              </Text>
            </View>
          )}
          
          {/* TOTAL MARGIN */}
          <View style={dealerStyles.marginTotal}>
            <Text style={dealerStyles.marginLabel}>NETTO-MARGE</Text>
            <Text style={[
              dealerStyles.marginValue, 
              isPositiveMargin ? dealerStyles.dealerValuePositive : dealerStyles.dealerValueNegative
            ]}>
              {isPositiveMargin ? "+" : ""}{formatCurrency(margin)}
            </Text>
          </View>
        </View>
        
        {/* Legal */}
        <View style={baseStyles.legalSection}>
          <Text style={baseStyles.legalText}>
            Diese Kalkulation ist vertraulich und nur für internen Gebrauch bestimmt.
            Die angegebenen Provisionen basieren auf den aktuellen Konditionen und können sich ändern.
          </Text>
        </View>
        
        {/* Footer */}
        <View style={baseStyles.footer}>
          <Text style={baseStyles.footerLeft}>
            MargenKalkulator • Händler-Dokument
          </Text>
          <Text style={baseStyles.footerRight}>
            Kalk-ID: {Date.now().toString(36).toUpperCase()}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
