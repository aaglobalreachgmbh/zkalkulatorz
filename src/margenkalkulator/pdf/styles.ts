// ============================================
// PDF Styles - Dynamic Branding Support
// ============================================

import { StyleSheet } from "@react-pdf/renderer";
import type { TenantBranding } from "@/hooks/useTenantBranding";
import { DEFAULT_BRANDING } from "@/hooks/useTenantBranding";

/**
 * Create dynamic styles based on tenant branding
 */
export function createPdfStyles(branding: TenantBranding = DEFAULT_BRANDING) {
  const primaryColor = branding.primaryColor || DEFAULT_BRANDING.primaryColor;
  const secondaryColor = branding.secondaryColor || DEFAULT_BRANDING.secondaryColor;

  return StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: "Helvetica",
      fontSize: 10,
      backgroundColor: "#ffffff",
    },

    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 30,
      borderBottomWidth: 2,
      borderBottomColor: primaryColor,
      paddingBottom: 20,
    },

    logo: {
      fontSize: 18,
      fontWeight: "bold",
      color: primaryColor,
    },

    logoSubtext: {
      fontSize: 8,
      color: "#666666",
      marginTop: 2,
    },

    headerRight: {
      textAlign: "right",
    },

    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: secondaryColor,
    },

    headerDate: {
      fontSize: 9,
      color: "#666666",
      marginTop: 4,
    },

    // Logo Image Container
    logoContainer: {
      width: 60,
      height: 40,
      marginRight: 10,
    },

    logoImage: {
      width: "100%",
      height: "100%",
      objectFit: "contain",
    },

    // Info Section
    infoSection: {
      marginBottom: 25,
      padding: 15,
      backgroundColor: "#f8f9fa",
      borderRadius: 4,
    },

    // Generic Section (New)
    section: {
      marginBottom: 20,
    },

    sectionTitle: {
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: 10,
      color: secondaryColor,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e5e5",
      paddingBottom: 5,
    },

    infoTitle: {
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: 8,
      color: secondaryColor,
    },

    infoRow: {
      flexDirection: "row",
      marginBottom: 4,
    },

    infoLabel: {
      width: 100,
      fontSize: 9,
      color: "#666666",
    },

    infoValue: {
      fontSize: 9,
      color: secondaryColor,
      fontWeight: "bold",
    },

    // Table
    table: {
      marginBottom: 25,
    },

    tableHeader: {
      flexDirection: "row",
      backgroundColor: secondaryColor,
      padding: 10,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },

    tableHeaderCell: {
      color: "#ffffff",
      fontSize: 9,
      fontWeight: "bold",
    },

    tableRow: {
      flexDirection: "row",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e5e5",
    },

    tableRowAlt: {
      backgroundColor: "#fafafa",
    },

    tableCell: {
      fontSize: 9,
      color: secondaryColor,
    },

    tableCellRight: {
      textAlign: "right",
    },

    colPosition: { width: "50%" },
    colMonthly: { width: "25%", textAlign: "right" },
    colOneTime: { width: "25%", textAlign: "right" },

    // Summary
    summarySection: {
      marginTop: 20,
      padding: 20,
      backgroundColor: secondaryColor,
      borderRadius: 4,
    },

    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },

    summaryLabel: {
      fontSize: 10,
      color: "#cccccc",
    },

    summaryValue: {
      fontSize: 10,
      color: "#ffffff",
      fontWeight: "bold",
    },

    summaryTotal: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: "#444444",
    },

    summaryTotalLabel: {
      fontSize: 14,
      color: "#ffffff",
      fontWeight: "bold",
    },

    summaryTotalValue: {
      fontSize: 22,
      color: primaryColor,
      fontWeight: "bold",
    },

    // Footer
    footer: {
      position: "absolute",
      bottom: 30,
      left: 40,
      right: 40,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: "#e5e5e5",
    },

    footerLeft: {
      fontSize: 8,
      color: "#999999",
    },

    footerRight: {
      fontSize: 8,
      color: "#999999",
      textAlign: "right",
    },

    // Legal Text
    legalSection: {
      marginTop: 30,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: "#e5e5e5",
    },

    legalText: {
      fontSize: 7,
      color: "#999999",
      lineHeight: 1.4,
    },
  });
}

// Static default styles for backwards compatibility
export const styles = createPdfStyles(DEFAULT_BRANDING);

/**
 * Create dealer-specific styles with branding
 */
export function createDealerStyles(branding: TenantBranding = DEFAULT_BRANDING) {
  const primaryColor = branding.primaryColor || DEFAULT_BRANDING.primaryColor;

  return StyleSheet.create({
    dealerSection: {
      marginTop: 20,
      padding: 12,
      backgroundColor: "#f8f9fa",
      borderRadius: 4,
      borderWidth: 1,
      borderColor: primaryColor,
    },
    dealerTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: primaryColor,
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
      borderTopColor: primaryColor,
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
      backgroundColor: primaryColor,
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
}

/**
 * Create report-specific styles with branding
 */
export function createReportStyles(branding: TenantBranding = DEFAULT_BRANDING) {
  const primaryColor = branding.primaryColor || DEFAULT_BRANDING.primaryColor;
  const secondaryColor = branding.secondaryColor || DEFAULT_BRANDING.secondaryColor;

  return StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: "Helvetica",
      fontSize: 9,
      backgroundColor: "#ffffff",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: primaryColor,
      paddingBottom: 15,
    },
    logo: {
      fontSize: 16,
      fontWeight: "bold",
      color: primaryColor,
    },
    logoSubtext: {
      fontSize: 8,
      color: "#666666",
      marginTop: 2,
    },
    headerRight: {
      textAlign: "right",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: secondaryColor,
    },
    headerDate: {
      fontSize: 8,
      color: "#666666",
      marginTop: 4,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: 10,
      color: secondaryColor,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e5e5",
      paddingBottom: 5,
    },
    infoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    infoColumn: {
      width: "50%",
      marginBottom: 8,
    },
    infoRow: {
      flexDirection: "row",
      marginBottom: 3,
    },
    infoLabel: {
      width: 80,
      fontSize: 8,
      color: "#666666",
    },
    infoValue: {
      flex: 1,
      fontSize: 8,
      color: secondaryColor,
    },
    table: {
      width: "100%",
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: secondaryColor,
      padding: 6,
    },
    tableHeaderCell: {
      color: "#ffffff",
      fontSize: 8,
      fontWeight: "bold",
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e5e5",
      padding: 6,
    },
    tableRowAlt: {
      backgroundColor: "#fafafa",
    },
    tableCell: {
      fontSize: 8,
      color: secondaryColor,
    },
    badge: {
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 3,
      fontSize: 7,
    },
    badgeCritical: {
      backgroundColor: "#fee2e2",
      color: "#dc2626",
    },
    badgeWarning: {
      backgroundColor: "#fef3c7",
      color: "#d97706",
    },
    badgeOk: {
      backgroundColor: "#dcfce7",
      color: "#16a34a",
    },
    summary: {
      marginTop: 20,
      padding: 15,
      backgroundColor: secondaryColor,
      borderRadius: 4,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    summaryLabel: {
      fontSize: 9,
      color: "#cccccc",
    },
    summaryValue: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#ffffff",
    },
    summaryTotal: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: "#444444",
    },
    summaryTotalLabel: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#ffffff",
    },
    summaryTotalValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: primaryColor,
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 40,
      right: 40,
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: "#e5e5e5",
      paddingTop: 10,
    },
    footerText: {
      fontSize: 7,
      color: "#999999",
    },
    emptyState: {
      padding: 15,
      backgroundColor: "#f8f9fa",
      borderRadius: 4,
      textAlign: "center",
    },
    emptyText: {
      fontSize: 9,
      color: "#666666",
    },
    kpiSection: {
      flexDirection: "row",
      marginBottom: 20,
      gap: 15,
    },
    kpiCard: {
      flex: 1,
      padding: 12,
      backgroundColor: "#f8f9fa",
      borderRadius: 4,
      borderLeftWidth: 3,
    },
    kpiProvision: {
      borderLeftColor: "#16a34a",
    },
    kpiEk: {
      borderLeftColor: "#dc2626",
    },
    kpiMargin: {
      borderLeftColor: "#2563eb",
    },
    kpiLabel: {
      fontSize: 8,
      color: "#666666",
      marginBottom: 4,
    },
    kpiValue: {
      fontSize: 14,
      fontWeight: "bold",
    },
    kpiValuePositive: {
      color: "#16a34a",
    },
    kpiValueNegative: {
      color: "#dc2626",
    },
    tableCellPositive: {
      color: "#16a34a",
    },
    tableCellNegative: {
      color: "#dc2626",
    },
    colCustomer: { width: "22%" },
    colOffer: { width: "18%" },
    colTariff: { width: "15%" },
    colHardware: { width: "12%" },
    colProvision: { width: "11%", textAlign: "right" },
    colEk: { width: "11%", textAlign: "right" },
    colMargin: { width: "11%", textAlign: "right" },
    disclaimer: {
      marginTop: 20,
      padding: 10,
      backgroundColor: "#fef3c7",
      borderRadius: 4,
    },
    disclaimerText: {
      fontSize: 7,
      color: "#92400e",
      lineHeight: 1.4,
    },
    // Logo container for image
    logoContainer: {
      width: 60,
      height: 40,
      marginRight: 10,
    },
    logoImage: {
      width: "100%",
      height: "100%",
      objectFit: "contain",
    },
  });
}
