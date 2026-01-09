// ============================================
// Dealer Summary Page Component (Confidential)
// ONLY for internal use - shows margin calculations
// ============================================

import { Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { PdfTemplate, DealerSummaryData } from "../templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";

// ============================================
// Dealer-specific Styles
// ============================================

const dealerStyles = StyleSheet.create({
  // Confidential Banner
  confidentialBanner: {
    backgroundColor: "#dc2626",
    padding: 10,
    marginBottom: 20,
  },
  confidentialText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 2,
  },
  confidentialSubtext: {
    color: "#ffffff",
    fontSize: 7,
    textAlign: "center",
    marginTop: 2,
    opacity: 0.9,
  },
  
  // Summary Sections
  summarySection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  
  // Data Rows
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  dataRowHighlight: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 8,
    marginHorizontal: -8,
    borderRadius: 2,
  },
  dataLabel: {
    fontSize: 9,
    color: "#666666",
    flex: 1,
  },
  dataValue: {
    fontSize: 9,
    color: "#333333",
    fontWeight: "bold",
    textAlign: "right",
    minWidth: 100,
  },
  dataValuePositive: {
    color: "#16a34a",
  },
  dataValueNegative: {
    color: "#dc2626",
  },
  dataValueNeutral: {
    color: "#6b7280",
  },
  
  // Deduction Row
  deductionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingLeft: 15,
  },
  deductionLabel: {
    fontSize: 8,
    color: "#888888",
    flex: 1,
  },
  deductionValue: {
    fontSize: 8,
    color: "#dc2626",
    textAlign: "right",
    minWidth: 100,
  },
  
  // Total Box
  totalBox: {
    marginTop: 20,
    backgroundColor: "#1e293b",
    borderRadius: 4,
    padding: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValuePositive: {
    color: "#4ade80",
  },
  totalValueNegative: {
    color: "#f87171",
  },
  totalSubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#475569",
  },
  totalSubLabel: {
    fontSize: 9,
    color: "#94a3b8",
  },
  totalSubValue: {
    fontSize: 9,
    color: "#94a3b8",
    fontWeight: "bold",
  },
  
  // Amortization Hint
  amortizationBox: {
    marginTop: 15,
    backgroundColor: "#f0f9ff",
    borderLeftWidth: 3,
    borderLeftColor: "#0ea5e9",
    padding: 12,
  },
  amortizationTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0369a1",
    marginBottom: 5,
  },
  amortizationText: {
    fontSize: 8,
    color: "#0c4a6e",
    lineHeight: 1.4,
  },
  
  // Hardware Table
  hardwareTable: {
    marginTop: 10,
  },
  hardwareRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  hardwareRowHeader: {
    backgroundColor: "#f9fafb",
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
  },
  hardwareCol1: {
    flex: 3,
    fontSize: 8,
    color: "#374151",
  },
  hardwareCol2: {
    flex: 1,
    fontSize: 8,
    color: "#374151",
    textAlign: "center",
  },
  hardwareCol3: {
    flex: 1,
    fontSize: 8,
    color: "#374151",
    textAlign: "right",
  },
  hardwareCol4: {
    flex: 1,
    fontSize: 8,
    color: "#374151",
    textAlign: "right",
    fontWeight: "bold",
  },
  hardwareHeaderText: {
    fontWeight: "bold",
    color: "#6b7280",
  },
  
  // Base styles fallback
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
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#0066cc",
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoImage: {
    width: 50,
    height: 35,
    marginRight: 10,
    objectFit: "contain",
  },
  logoText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0066cc",
  },
  logoSubtext: {
    fontSize: 7,
    color: "#666666",
    marginTop: 2,
  },
  headerRight: {
    textAlign: "right",
    alignItems: "flex-end",
  },
  headerBrand: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0066cc",
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 10,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#999999",
  },
  pageNumber: {
    fontSize: 7,
    color: "#999999",
    textAlign: "right",
  },
});

// ============================================
// Helper Functions
// ============================================

function formatCurrency(value: number | undefined | null): string {
  const num = value ?? 0;
  if (isNaN(num)) return "0,00 €";
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(2).replace(".", ",")} €`;
}

function formatCurrencyNoSign(value: number | undefined | null): string {
  const num = value ?? 0;
  if (isNaN(num)) return "0,00 €";
  return `${num.toFixed(2).replace(".", ",")} €`;
}

// ============================================
// Dealer Summary Page Component
// ============================================

interface DealerSummaryPageProps {
  template: PdfTemplate;
  branding?: TenantBranding;
  dealerData: DealerSummaryData;
  pageNumber: number;
  totalPages: number;
}

export function DealerSummaryPage({
  template,
  branding,
  dealerData,
  pageNumber,
  totalPages,
}: DealerSummaryPageProps) {
  const displayName = branding?.companyName || template.publisherInfo.name;
  
  // Calculate if amortization makes sense
  const monthlyHardwareRate = dealerData.hardwareEk / 24;
  const breakEvenMonths = dealerData.netMargin < 0 
    ? Math.ceil(Math.abs(dealerData.netMargin) / (dealerData.netProvision / 24))
    : 0;
  
  return (
    <Page size="A4" style={dealerStyles.page}>
      {/* Confidential Banner */}
      <View style={dealerStyles.confidentialBanner}>
        <Text style={dealerStyles.confidentialText}>🔒 VERTRAULICH – NUR FÜR INTERNEN GEBRAUCH</Text>
        <Text style={dealerStyles.confidentialSubtext}>Dieses Dokument enthält sensible Geschäftsdaten und darf nicht an Kunden weitergegeben werden.</Text>
      </View>
      
      {/* Header */}
      <View style={dealerStyles.header}>
        <View style={dealerStyles.logoSection}>
          {branding?.logoUrl && (
            <Image src={branding.logoUrl} style={dealerStyles.logoImage} />
          )}
          <View>
            <Text style={dealerStyles.logoText}>{displayName}</Text>
            <Text style={dealerStyles.logoSubtext}>Herausgeber: allenetze.de</Text>
          </View>
        </View>
        <View style={dealerStyles.headerRight}>
          <Text style={dealerStyles.headerBrand}>Händler-Übersicht</Text>
        </View>
      </View>
      
      {/* Summary Section */}
      <View style={dealerStyles.summarySection}>
        <Text style={dealerStyles.sectionTitle}>Zusammenfassung</Text>
        
        <View style={dealerStyles.dataRow}>
          <Text style={dealerStyles.dataLabel}>Anzahl Positionen:</Text>
          <Text style={dealerStyles.dataValue}>{dealerData.totalContracts}</Text>
        </View>
        <View style={dealerStyles.dataRow}>
          <Text style={dealerStyles.dataLabel}>Anzahl Verträge gesamt:</Text>
          <Text style={dealerStyles.dataValue}>{dealerData.totalContracts}</Text>
        </View>
        <View style={dealerStyles.dataRow}>
          <Text style={dealerStyles.dataLabel}>Vertragsart:</Text>
          <Text style={dealerStyles.dataValue}>
            {dealerData.contractType === "new" ? "Neuvertrag" : "Verlängerung"}
          </Text>
        </View>
      </View>
      
      {/* Provision Calculation */}
      <View style={dealerStyles.summarySection}>
        <Text style={dealerStyles.sectionTitle}>Provisions-Kalkulation</Text>
        
        <View style={[dealerStyles.dataRow, dealerStyles.dataRowHighlight]}>
          <Text style={dealerStyles.dataLabel}>Brutto-Provision:</Text>
          <Text style={[dealerStyles.dataValue, dealerStyles.dataValuePositive]}>
            {formatCurrency(dealerData.grossProvision)}
          </Text>
        </View>
        
        {dealerData.fhPartnerDeduction && dealerData.fhPartnerDeduction !== 0 && (
          <View style={dealerStyles.deductionRow}>
            <Text style={dealerStyles.deductionLabel}>− FH-Partner Abzug (3%):</Text>
            <Text style={dealerStyles.deductionValue}>
              {formatCurrency(-Math.abs(dealerData.fhPartnerDeduction))}
            </Text>
          </View>
        )}
        
        {dealerData.omoDeduction && dealerData.omoDeduction !== 0 && (
          <View style={dealerStyles.deductionRow}>
            <Text style={dealerStyles.deductionLabel}>− OMO-Rate:</Text>
            <Text style={dealerStyles.deductionValue}>
              {formatCurrency(-Math.abs(dealerData.omoDeduction))}
            </Text>
          </View>
        )}
        
        {dealerData.pushBonus && dealerData.pushBonus > 0 && (
          <View style={dealerStyles.deductionRow}>
            <Text style={dealerStyles.deductionLabel}>+ Push-Bonus:</Text>
            <Text style={[dealerStyles.deductionValue, { color: "#16a34a" }]}>
              {formatCurrency(dealerData.pushBonus)}
            </Text>
          </View>
        )}
        
        {dealerData.employeeDeduction && dealerData.employeeDeduction !== 0 && (
          <View style={dealerStyles.deductionRow}>
            <Text style={dealerStyles.deductionLabel}>− Mitarbeiter-Abzug:</Text>
            <Text style={dealerStyles.deductionValue}>
              {formatCurrency(-Math.abs(dealerData.employeeDeduction))}
            </Text>
          </View>
        )}
        
        <View style={[dealerStyles.dataRow, dealerStyles.dataRowHighlight, { marginTop: 10 }]}>
          <Text style={[dealerStyles.dataLabel, { fontWeight: "bold" }]}>= Netto-Provision:</Text>
          <Text style={[dealerStyles.dataValue, dealerStyles.dataValuePositive]}>
            {formatCurrency(dealerData.netProvision)}
          </Text>
        </View>
      </View>
      
      {/* Hardware Costs */}
      {dealerData.hardwareEk > 0 && (
        <View style={dealerStyles.summarySection}>
          <Text style={dealerStyles.sectionTitle}>Hardware-Kosten</Text>
          
          {dealerData.hardwareDetails && dealerData.hardwareDetails.length > 0 && (
            <View style={dealerStyles.hardwareTable}>
              {/* Header */}
              <View style={[dealerStyles.hardwareRow, dealerStyles.hardwareRowHeader]}>
                <Text style={[dealerStyles.hardwareCol1, dealerStyles.hardwareHeaderText]}>Gerät</Text>
                <Text style={[dealerStyles.hardwareCol2, dealerStyles.hardwareHeaderText]}>Anz.</Text>
                <Text style={[dealerStyles.hardwareCol3, dealerStyles.hardwareHeaderText]}>EK/Stk.</Text>
                <Text style={[dealerStyles.hardwareCol4, dealerStyles.hardwareHeaderText]}>Gesamt</Text>
              </View>
              
              {/* Rows */}
              {dealerData.hardwareDetails.map((hw, idx) => (
                <View key={idx} style={dealerStyles.hardwareRow}>
                  <Text style={dealerStyles.hardwareCol1}>{hw.name}</Text>
                  <Text style={dealerStyles.hardwareCol2}>{hw.quantity}×</Text>
                  <Text style={dealerStyles.hardwareCol3}>{formatCurrencyNoSign(hw.ekPerUnit)}</Text>
                  <Text style={dealerStyles.hardwareCol4}>−{formatCurrencyNoSign(hw.quantity * hw.ekPerUnit)}</Text>
                </View>
              ))}
            </View>
          )}
          
          <View style={[dealerStyles.dataRow, dealerStyles.dataRowHighlight, { marginTop: 10 }]}>
            <Text style={[dealerStyles.dataLabel, { fontWeight: "bold" }]}>= Hardware-EK gesamt:</Text>
            <Text style={[dealerStyles.dataValue, dealerStyles.dataValueNegative]}>
              −{formatCurrencyNoSign(dealerData.hardwareEk)}
            </Text>
          </View>
        </View>
      )}
      
      {/* Total Box */}
      <View style={dealerStyles.totalBox}>
        <View style={dealerStyles.totalRow}>
          <Text style={dealerStyles.totalLabel}>NETTO-MARGE</Text>
          <Text style={[
            dealerStyles.totalValue,
            dealerData.netMargin >= 0 
              ? dealerStyles.totalValuePositive 
              : dealerStyles.totalValueNegative
          ]}>
            {formatCurrency(dealerData.netMargin)}
          </Text>
        </View>
        <View style={dealerStyles.totalSubRow}>
          <Text style={dealerStyles.totalSubLabel}>Ø Marge pro Vertrag:</Text>
          <Text style={dealerStyles.totalSubValue}>
            {formatCurrency(dealerData.marginPerContract)}
          </Text>
        </View>
      </View>
      
      {/* Amortization Hint (if negative margin) */}
      {dealerData.netMargin < 0 && dealerData.hardwareEk > 0 && (
        <View style={dealerStyles.amortizationBox}>
          <Text style={dealerStyles.amortizationTitle}>💡 Hinweis zur Hardware-Finanzierung</Text>
          <Text style={dealerStyles.amortizationText}>
            Bei Weitergabe der Hardware-Kosten an den Kunden (monatliche Finanzierung über 24 Monate):
            {"\n"}• Monatliche Rate: {formatCurrencyNoSign(monthlyHardwareRate)}/mtl.
            {breakEvenMonths > 0 && `\n• Break-Even nach: ~${breakEvenMonths} Monate`}
          </Text>
        </View>
      )}
      
      {/* Footer */}
      <View style={dealerStyles.footer}>
        <View style={dealerStyles.footerRow}>
          <Text style={dealerStyles.footerText}>
            Erstellt mit Allenetze MargenKalkulator | allenetze.de • Händler-Dokument
          </Text>
          <Text style={dealerStyles.pageNumber}>Seite {pageNumber} von {totalPages}</Text>
        </View>
      </View>
    </Page>
  );
}
