// ============================================
// Premium Hardware Page - Device Financing
// Shows device images, financing details
// Publisher: allenetze.de
// ============================================

import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { PdfTemplate, ProfessionalOfferPdfProps } from "../templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";
import { PDF_COLORS, PDF_TYPOGRAPHY, PDF_SPACING, formatCurrencyPdf, sanitizeTextPdf } from "../designSystem";
import { PUBLISHER } from "../../publisherConfig";
import { PdfHeader } from "./shared/PdfHeader";
import { PdfFooter } from "./shared/PdfFooter";

interface PremiumHardwarePageProps {
  template: PdfTemplate;
  items: ProfessionalOfferPdfProps["items"];
  hardwareImages?: Map<string, string>;
  branding?: TenantBranding;
  pageNumber: number;
  totalPages: number;
}

const styles = StyleSheet.create({
  page: {
    padding: PDF_SPACING.pagePadding,
    fontFamily: "Helvetica",
    fontSize: PDF_TYPOGRAPHY.body,
    backgroundColor: "#ffffff",
    paddingBottom: 60,
  },

  // Section title
  sectionTitle: {
    fontSize: PDF_TYPOGRAPHY.h3,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
    marginBottom: 8,
    marginTop: 10,
  },

  sectionSubtitle: {
    fontSize: PDF_TYPOGRAPHY.bodySmall,
    color: PDF_COLORS.textLight,
    marginTop: -4,
    marginBottom: 15,
  },

  // Hardware card
  hardwareCard: {
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 6,
    marginBottom: 18,
    overflow: "hidden",
  },

  hardwareCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: PDF_COLORS.primary + "10",
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
  },

  hardwareCardTitle: {
    fontSize: PDF_TYPOGRAPHY.h3,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
  },

  hardwareCardSubtitle: {
    fontSize: PDF_TYPOGRAPHY.bodySmall,
    color: PDF_COLORS.textLight,
    marginTop: 2,
  },

  hardwareCardBody: {
    flexDirection: "row",
    padding: 15,
  },

  hardwareImage: {
    width: 100,
    height: 130,
    marginRight: 20,
    objectFit: "contain",
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
  },

  hardwareImagePlaceholder: {
    width: 100,
    height: 130,
    marginRight: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  hardwareImagePlaceholderText: {
    fontSize: 36,
    color: "#cccccc",
  },

  hardwareDetails: {
    flex: 1,
  },

  hardwareName: {
    fontSize: PDF_TYPOGRAPHY.h3,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
    marginBottom: 10,
  },

  // Financing table
  financingTable: {
    marginTop: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    padding: 12,
  },

  financingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  financingRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },

  financingLabel: {
    fontSize: PDF_TYPOGRAPHY.body,
    color: PDF_COLORS.textLight,
  },

  financingValue: {
    fontSize: PDF_TYPOGRAPHY.body,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
  },

  financingTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: PDF_COLORS.primary,
  },

  financingTotalLabel: {
    fontSize: PDF_TYPOGRAPHY.h3,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
  },

  financingTotalValue: {
    fontSize: PDF_TYPOGRAPHY.h3,
    fontWeight: "bold",
    color: PDF_COLORS.primary,
  },

  // Note box
  noteBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: PDF_COLORS.primary + "08",
    borderLeftWidth: 4,
    borderLeftColor: PDF_COLORS.primary,
    borderRadius: 4,
  },

  noteTitle: {
    fontSize: PDF_TYPOGRAPHY.bodySmall,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
    marginBottom: 4,
  },

  noteText: {
    fontSize: PDF_TYPOGRAPHY.caption,
    color: PDF_COLORS.textLight,
    lineHeight: 1.4,
  },

  // Summary table
  summaryTable: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 6,
  },

  summaryHeader: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.accent,
    padding: 10,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },

  summaryHeaderCell: {
    fontSize: PDF_TYPOGRAPHY.tableHeader,
    fontWeight: "bold",
    color: "#ffffff",
  },

  summaryRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
  },

  summaryRowAlt: {
    backgroundColor: "#f9fafb",
  },

  summaryCell: {
    fontSize: PDF_TYPOGRAPHY.tableCell,
    color: PDF_COLORS.text,
  },

  colDevice: { width: "40%" },
  colQty: { width: "15%", textAlign: "center" },
  colMonthly: { width: "20%", textAlign: "right" },
  colTotal: { width: "25%", textAlign: "right" },
});

export function PremiumHardwarePage({
  template,
  items,
  hardwareImages,
  branding,
  pageNumber,
  totalPages,
}: PremiumHardwarePageProps) {
  const displayName = branding?.companyName || template.publisherInfo.name;

  // Filter items with hardware
  const hardwareItems = items.filter(item => item.option.hardware.ekNet > 0);

  // Calculate totals
  const totals = hardwareItems.reduce((acc, item) => {
    const { option } = item;
    const qty = option.mobile.quantity;
    const ekTotal = option.hardware.ekNet * qty;
    const monthly = option.hardware.amortize
      ? option.hardware.ekNet / (option.hardware.amortMonths || 24)
      : 0;

    return {
      totalDevices: acc.totalDevices + qty,
      totalEk: acc.totalEk + ekTotal,
      totalMonthly: acc.totalMonthly + (monthly * qty),
    };
  }, { totalDevices: 0, totalEk: 0, totalMonthly: 0 });

  const primaryColor = branding?.primaryColor || template.primaryColor;

  return (
    <Page size="A4" style={styles.page}>
      <PdfHeader
        branding={branding}
        publisherSubline={PUBLISHER.subline}
        primaryColor={primaryColor}
        title="Hardware-Finanzierung"
      />

      {/* Section Title */}
      <Text style={styles.sectionTitle}>Ihre Geräte</Text>
      <Text style={styles.sectionSubtitle}>
        Finanzierungszeitraum: 24 Monate | Alle Preise zzgl. MwSt.
      </Text>

      {/* Hardware Cards */}
      {hardwareItems.map((item, idx) => {
        const { option } = item;
        const hwName = sanitizeTextPdf(option.hardware.name) || "Gerät";
        const qty = option.mobile.quantity;
        const ekPerDevice = option.hardware.ekNet;
        const ekTotal = ekPerDevice * qty;
        const months = option.hardware.amortMonths || 24;
        const monthly = option.hardware.amortize ? ekPerDevice / months : 0;
        const monthlyTotal = monthly * qty;

        // Try to get hardware image
        const hwKey = hwName.split(" ")[0]?.toLowerCase() || "";
        const hwImageUrl = hardwareImages?.get(hwKey);

        return (
          <View key={idx} style={styles.hardwareCard}>
            <View style={styles.hardwareCardHeader}>
              <View>
                <Text style={styles.hardwareCardTitle}>{hwName}</Text>
                <Text style={styles.hardwareCardSubtitle}>
                  {qty}x Gerät | Hardware-Finanzierung
                </Text>
              </View>
            </View>

            <View style={styles.hardwareCardBody}>
              {hwImageUrl ? (
                <Image src={hwImageUrl} style={styles.hardwareImage} />
              ) : (
                <View style={styles.hardwareImagePlaceholder}>
                  <Text style={styles.hardwareImagePlaceholderText}>📱</Text>
                </View>
              )}

              <View style={styles.hardwareDetails}>
                <Text style={styles.hardwareName}>{hwName}</Text>

                <View style={styles.financingTable}>
                  <View style={styles.financingRow}>
                    <Text style={styles.financingLabel}>Gerätepreis pro Stück:</Text>
                    <Text style={styles.financingValue}>{formatCurrencyPdf(ekPerDevice)}</Text>
                  </View>
                  <View style={styles.financingRow}>
                    <Text style={styles.financingLabel}>Anzahl:</Text>
                    <Text style={styles.financingValue}>{qty} Stück</Text>
                  </View>
                  <View style={styles.financingRow}>
                    <Text style={styles.financingLabel}>Monatliche Rate (pro Gerät):</Text>
                    <Text style={styles.financingValue}>{formatCurrencyPdf(monthly)} × {months} Mon.</Text>
                  </View>
                  <View style={styles.financingRowLast}>
                    <Text style={styles.financingLabel}>Anzahlung:</Text>
                    <Text style={styles.financingValue}>0,00 €</Text>
                  </View>

                  <View style={styles.financingTotal}>
                    <Text style={styles.financingTotalLabel}>Gesamt (alle Geräte):</Text>
                    <Text style={styles.financingTotalValue}>{formatCurrencyPdf(ekTotal)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );
      })}

      {/* Summary Table if multiple devices */}
      {hardwareItems.length > 1 && (
        <View style={styles.summaryTable}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryHeaderCell, styles.colDevice]}>Gerät</Text>
            <Text style={[styles.summaryHeaderCell, styles.colQty]}>Anzahl</Text>
            <Text style={[styles.summaryHeaderCell, styles.colMonthly]}>Mtl. Rate</Text>
            <Text style={[styles.summaryHeaderCell, styles.colTotal]}>Gesamt</Text>
          </View>

          {hardwareItems.map((item, idx) => {
            const { option } = item;
            const hwName = sanitizeTextPdf(option.hardware.name) || "Gerät";
            const qty = option.mobile.quantity;
            const monthly = option.hardware.amortize
              ? option.hardware.ekNet / (option.hardware.amortMonths || 24)
              : 0;
            const total = option.hardware.ekNet * qty;

            return (
              <View
                key={idx}
                style={[styles.summaryRow, idx % 2 === 1 ? styles.summaryRowAlt : {}]}
              >
                <Text style={[styles.summaryCell, styles.colDevice]}>{hwName}</Text>
                <Text style={[styles.summaryCell, styles.colQty]}>{qty}x</Text>
                <Text style={[styles.summaryCell, styles.colMonthly]}>{formatCurrencyPdf(monthly)}</Text>
                <Text style={[styles.summaryCell, styles.colTotal]}>{formatCurrencyPdf(total)}</Text>
              </View>
            );
          })}

          {/* Total row */}
          <View style={[styles.summaryRow, { backgroundColor: PDF_COLORS.primary + "10" }]}>
            <Text style={[styles.summaryCell, styles.colDevice, { fontWeight: "bold" }]}>Gesamt Hardware</Text>
            <Text style={[styles.summaryCell, styles.colQty, { fontWeight: "bold" }]}>{totals.totalDevices}x</Text>
            <Text style={[styles.summaryCell, styles.colMonthly, { fontWeight: "bold" }]}>{formatCurrencyPdf(totals.totalMonthly)}</Text>
            <Text style={[styles.summaryCell, styles.colTotal, { fontWeight: "bold", color: PDF_COLORS.primary }]}>{formatCurrencyPdf(totals.totalEk)}</Text>
          </View>
        </View>
      )}

      {/* Note Box */}
      <View style={styles.noteBox}>
        <Text style={styles.noteTitle}>Hinweis zur Hardware-Finanzierung</Text>
        <Text style={styles.noteText}>
          Die Hardware wird über 24 Monate finanziert und ist Eigentum des Kunden nach vollständiger Zahlung.
          Nach Ablauf der Finanzierung entfällt die monatliche Hardware-Rate.
          Die Mindestvertragslaufzeit für den Mobilfunktarif beträgt ebenfalls 24 Monate.
        </Text>
      </View>

      <PdfFooter
        publisherSubline={PUBLISHER.subline}
        pageNumber={pageNumber}
        totalPages={totalPages}
      />
    </Page>
  );
}
