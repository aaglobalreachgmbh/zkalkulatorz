// ============================================
// Premium Summary Page - Vodafone Period Table Style
// Header, customer info, QR code, period-based pricing
// ============================================

import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ProfessionalOfferPdfProps, PeriodColumn, PositionRow, PdfCompanySettings } from "../templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";
import { formatCurrency as formatCurrencyBase } from "../../lib/formatters";

interface PremiumSummaryPageProps {
  template: ProfessionalOfferPdfProps["template"];
  customer: ProfessionalOfferPdfProps["customer"];
  contact?: ProfessionalOfferPdfProps["contact"];
  offerId: string;
  options: ProfessionalOfferPdfProps["options"];
  items: ProfessionalOfferPdfProps["items"];
  qrCodeDataUrl?: string;
  branding?: TenantBranding;
  companySettings?: PdfCompanySettings;
  pageNumber: number;
  totalPages: number;
}

// PDF-specific currency formatting
function formatCurrency(value: number | undefined | null): string {
  const num = value ?? 0;
  if (isNaN(num)) return "0,00 €";
  return formatCurrencyBase(num);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function sanitizeText(text: string | undefined | null, maxLength = 200): string {
  if (!text) return "";
  return String(text)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/<[^>]*>/g, "")
    .slice(0, maxLength);
}

function createStyles(primaryColor: string, accentColor: string) {
  return StyleSheet.create({
    page: {
      padding: 35,
      fontFamily: "Helvetica",
      fontSize: 9,
      backgroundColor: "#ffffff",
    },
    
    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 2,
      borderBottomColor: primaryColor,
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
      color: primaryColor,
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
      fontSize: 16,
      fontWeight: "bold",
      color: accentColor,
    },
    
    headerSlogan: {
      fontSize: 9,
      color: "#666666",
      marginTop: 2,
    },
    
    // Contact section with QR
    contactSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    
    recipientBlock: {
      width: "55%",
    },
    
    recipientName: {
      fontSize: 11,
      fontWeight: "bold",
      marginBottom: 2,
    },
    
    recipientAddress: {
      fontSize: 9,
      color: "#333333",
      lineHeight: 1.4,
    },
    
    contactBlock: {
      width: "40%",
      textAlign: "right",
      alignItems: "flex-end",
    },
    
    contactTitle: {
      fontSize: 8,
      fontWeight: "bold",
      color: "#666666",
      marginBottom: 4,
    },
    
    contactName: {
      fontSize: 10,
      fontWeight: "bold",
      color: primaryColor,
    },
    
    contactDetail: {
      fontSize: 8,
      color: "#333333",
      marginTop: 2,
    },
    
    qrCodeContainer: {
      marginTop: 10,
      alignItems: "flex-end",
    },
    
    qrCode: {
      width: 55,
      height: 55,
    },
    
    qrLabel: {
      fontSize: 6,
      color: "#999999",
      marginTop: 3,
      textAlign: "right",
    },
    
    // Offer info
    offerInfo: {
      marginBottom: 12,
    },
    
    offerTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: accentColor,
    },
    
    // Greeting
    greeting: {
      marginBottom: 12,
      lineHeight: 1.5,
    },
    
    greetingText: {
      fontSize: 9,
      color: "#333333",
    },
    
    // Promo box
    promoBox: {
      backgroundColor: primaryColor + "15",
      borderLeftWidth: 3,
      borderLeftColor: primaryColor,
      padding: 10,
      marginBottom: 15,
    },
    
    promoText: {
      fontSize: 9,
      color: accentColor,
      lineHeight: 1.4,
    },
    
    promoHighlight: {
      fontWeight: "bold",
      color: primaryColor,
    },
    
    // Period table (Vodafone style)
    table: {
      marginBottom: 15,
    },
    
    tableHeader: {
      flexDirection: "row",
      backgroundColor: accentColor,
      paddingVertical: 8,
      paddingHorizontal: 6,
    },
    
    tableHeaderCell: {
      fontSize: 8,
      fontWeight: "bold",
      color: "#ffffff",
    },
    
    tableRow: {
      flexDirection: "row",
      paddingVertical: 6,
      paddingHorizontal: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e5e5",
    },
    
    tableRowAlt: {
      backgroundColor: "#fafafa",
    },
    
    tableRowDiscount: {
      backgroundColor: "#f0f9ff",
    },
    
    tableRowSubtotal: {
      backgroundColor: "#f8f9fa",
      borderTopWidth: 1,
      borderTopColor: "#cccccc",
    },
    
    tableRowTotal: {
      backgroundColor: primaryColor,
      marginTop: 8,
    },
    
    tableCell: {
      fontSize: 9,
      color: "#333333",
    },
    
    tableCellBold: {
      fontWeight: "bold",
    },
    
    tableCellNegative: {
      color: primaryColor,
    },
    
    tableCellTotal: {
      color: "#ffffff",
      fontWeight: "bold",
    },
    
    // Column widths for period table
    colQty: { width: "8%", textAlign: "center" },
    colPosition: { width: "37%" },
    colOneTime: { width: "13%", textAlign: "right" },
    colPeriod1: { width: "14%", textAlign: "right" },
    colPeriod2: { width: "14%", textAlign: "right" },
    colAvg: { width: "14%", textAlign: "right" },
    
    // Average highlight
    avgRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: primaryColor + "15",
      borderRadius: 4,
    },
    
    avgLabel: {
      fontSize: 10,
      color: accentColor,
      marginRight: 20,
    },
    
    avgValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: primaryColor,
    },
    
    // Validity
    validity: {
      marginTop: 12,
      marginBottom: 10,
    },
    
    validityText: {
      fontSize: 9,
      fontWeight: "bold",
      color: accentColor,
    },
    
    // Closing
    closing: {
      marginTop: 15,
      marginBottom: 20,
    },
    
    closingText: {
      fontSize: 9,
      color: "#333333",
      marginBottom: 10,
    },
    
    signature: {
      fontSize: 9,
      color: "#333333",
    },
    
    signatureName: {
      fontWeight: "bold",
    },
    
    // Footer
    footer: {
      position: "absolute",
      bottom: 25,
      left: 35,
      right: 35,
      borderTopWidth: 1,
      borderTopColor: "#e5e5e5",
      paddingTop: 8,
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
    },
    
    // Disclaimer
    disclaimer: {
      marginTop: 15,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: "#e5e5e5",
    },
    
    disclaimerText: {
      fontSize: 6,
      color: "#999999",
      lineHeight: 1.4,
    },
  });
}

// Generate period columns based on actual data
function generatePeriodColumns(periods: Array<{ fromMonth: number; toMonth: number }>): PeriodColumn[] {
  if (!periods || periods.length === 0) {
    return [{ header: "Monatlich", fromMonth: 1, toMonth: 24 }];
  }
  
  if (periods.length === 1) {
    return [{ header: "Monatlich", fromMonth: 1, toMonth: 24 }];
  }
  
  return periods.map((p, idx) => ({
    header: `${p.fromMonth}.-${p.toMonth}. Mon.`,
    fromMonth: p.fromMonth,
    toMonth: p.toMonth,
  }));
}

export function PremiumSummaryPage({
  template,
  customer,
  contact,
  offerId,
  options,
  items,
  qrCodeDataUrl,
  branding,
  companySettings,
  pageNumber,
  totalPages,
}: PremiumSummaryPageProps) {
  const primaryColor = branding?.primaryColor || template.primaryColor;
  const accentColor = template.accentColor;
  const styles = createStyles(primaryColor, accentColor);
  
  const today = new Date();
  const validUntil = new Date(today.getTime() + options.validDays * 24 * 60 * 60 * 1000);
  const displayName = branding?.companyName || template.publisherInfo.name;
  
  // Collect all periods from items
  const allPeriods = items.flatMap(item => item.result.periods);
  const periodColumns = generatePeriodColumns(allPeriods.length > 1 ? allPeriods : []);
  const hasMultiplePeriods = periodColumns.length > 1;
  
  // Calculate costs with period breakdown
  const calculateCosts = () => {
    const rows: PositionRow[] = [];
    let totalMonthlyPeriod1 = 0;
    let totalMonthlyPeriod2 = 0;
    let totalOneTime = 0;
    
    for (const item of items) {
      const { option, result } = item;
      const qty = option.mobile.quantity;
      
      // Get period-specific prices
      const period1Price = result.periods[0]?.monthly?.net || result.totals.avgTermNet;
      const period2Price = result.periods[1]?.monthly?.net || period1Price;
      
      // Tariff row
      const tariffBase = result.breakdown.find(b => b.ruleId === "base");
      const tariffName = tariffBase?.label?.replace(" Grundpreis", "") || "Mobilfunk-Tarif";
      
      rows.push({
        quantity: qty,
        label: tariffName,
        monthlyByPeriod: hasMultiplePeriods ? [period1Price, period2Price] : [result.totals.avgTermNet],
      });
      
      // Discounts
      const discounts = result.breakdown.filter(b => 
        b.appliesTo === "monthly" && b.net < 0 && !b.ruleId?.includes("fixed")
      );
      
      for (const discount of discounts) {
        rows.push({
          label: `    ${discount.label}`,
          monthlyByPeriod: hasMultiplePeriods 
            ? [discount.net, discount.net] // Both periods get the same discount
            : [discount.net],
          isDiscount: true,
        });
      }
      
      // Hardware
      if (option.hardware.ekNet > 0 && option.hardware.amortize) {
        const hwMonthly = option.hardware.ekNet / (option.hardware.amortMonths || 24);
        rows.push({
          quantity: qty,
          label: `${option.hardware.name || "Gerät"} (Finanzierung)`,
          monthlyByPeriod: [hwMonthly * qty],
        });
      } else if (option.hardware.ekNet > 0) {
        totalOneTime += option.hardware.ekNet * qty;
      }
      
      totalMonthlyPeriod1 += period1Price * qty;
      totalMonthlyPeriod2 += period2Price * qty;
      
      // Fixed net
      if (option.fixedNet.enabled) {
        const fixedBase = result.breakdown.find(b => b.ruleId === "fixed_base");
        const fixedMonthly = fixedBase?.net || 0;
        
        rows.push({
          quantity: 1,
          label: fixedBase?.label || "Festnetz/Internet",
          monthlyByPeriod: [fixedMonthly],
        });
        
        totalMonthlyPeriod1 += fixedMonthly;
        totalMonthlyPeriod2 += fixedMonthly;
      }
    }
    
    // Add subtotal
    rows.push({
      label: "Zwischensumme",
      monthlyByPeriod: hasMultiplePeriods 
        ? [totalMonthlyPeriod1, totalMonthlyPeriod2]
        : [(totalMonthlyPeriod1 + totalMonthlyPeriod2) / 2],
      isSubtotal: true,
    });
    
    // Calculate average
    const avgMonthly = hasMultiplePeriods
      ? ((totalMonthlyPeriod1 * 12) + (totalMonthlyPeriod2 * 12)) / 24
      : totalMonthlyPeriod1;
    
    return { 
      rows, 
      totalMonthlyPeriod1, 
      totalMonthlyPeriod2, 
      totalOneTime,
      avgMonthly,
    };
  };
  
  const { rows, totalMonthlyPeriod1, totalMonthlyPeriod2, totalOneTime, avgMonthly } = calculateCosts();
  
  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          {branding?.logoUrl && (
            <Image src={branding.logoUrl} style={styles.logoImage} />
          )}
          <View>
            <Text style={styles.logoText}>{displayName}</Text>
            <Text style={styles.logoSubtext}>{template.publisherInfo.subline}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerBrand}>Ihr Angebot</Text>
          <Text style={styles.headerSlogan}>can do</Text>
        </View>
      </View>
      
      {/* Contact section with QR */}
      <View style={styles.contactSection}>
        <View style={styles.recipientBlock}>
          <Text style={styles.recipientName}>
            {sanitizeText(customer.firma) || "Geschäftskunde"}
          </Text>
          <Text style={styles.recipientAddress}>
            {customer.anrede} {sanitizeText(customer.vorname)} {sanitizeText(customer.nachname)}{"\n"}
            {sanitizeText(customer.strasse)}{"\n"}
            {sanitizeText(customer.plz)} {sanitizeText(customer.ort)}
          </Text>
        </View>
        <View style={styles.contactBlock}>
          <Text style={styles.contactTitle}>Ihr Ansprechpartner:</Text>
          <Text style={styles.contactName}>{contact?.name || "Vertriebsteam"}</Text>
          <Text style={styles.contactDetail}>{contact?.company || displayName}</Text>
          {contact?.phone && <Text style={styles.contactDetail}>☎ {contact.phone}</Text>}
          {contact?.email && <Text style={styles.contactDetail}>✉ {contact.email}</Text>}
          {qrCodeDataUrl && (
            <View style={styles.qrCodeContainer}>
              <Image src={qrCodeDataUrl} style={styles.qrCode} />
              <Text style={styles.qrLabel}>Online ansehen</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Offer info */}
      <View style={styles.offerInfo}>
        <Text style={styles.offerTitle}>
          Angebot vom {formatDate(today)} • Angebots-Nr.: {offerId}
        </Text>
      </View>
      
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          {customer.anrede === "Herr" ? "Sehr geehrter Herr" : customer.anrede === "Frau" ? "Sehr geehrte Frau" : "Guten Tag"} {sanitizeText(customer.nachname)},
        </Text>
        <Text style={[styles.greetingText, { marginTop: 6 }]}>
          {options.offerText || "vielen Dank für Ihr Interesse. Im Folgenden finden Sie Ihre persönliche Kostenübersicht. Alle Preise verstehen sich zzgl. MwSt."}
        </Text>
      </View>
      
      {/* Promo box */}
      {options.promoHighlight && (
        <View style={styles.promoBox}>
          <Text style={styles.promoText}>
            💶 <Text style={styles.promoHighlight}>Bei Abschluss bis {formatDate(validUntil)}:</Text> {options.promoHighlight}
          </Text>
        </View>
      )}
      
      {/* Period-based table */}
      <View style={styles.table}>
        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colQty]}>Anz.</Text>
          <Text style={[styles.tableHeaderCell, styles.colPosition]}>Position</Text>
          <Text style={[styles.tableHeaderCell, styles.colOneTime]}>Einmalig</Text>
          {hasMultiplePeriods ? (
            <>
              <Text style={[styles.tableHeaderCell, styles.colPeriod1]}>{periodColumns[0]?.header}</Text>
              <Text style={[styles.tableHeaderCell, styles.colPeriod2]}>{periodColumns[1]?.header}</Text>
            </>
          ) : (
            <Text style={[styles.tableHeaderCell, styles.colPeriod1, { width: "28%" }]}>Monatlich</Text>
          )}
          {hasMultiplePeriods && (
            <Text style={[styles.tableHeaderCell, styles.colAvg]}>Ø Monat</Text>
          )}
        </View>
        
        {/* Table rows */}
        {rows.map((row, idx) => (
          <View 
            key={idx} 
            style={[
              styles.tableRow,
              idx % 2 === 1 && styles.tableRowAlt,
              row.isDiscount && styles.tableRowDiscount,
              row.isSubtotal && styles.tableRowSubtotal,
            ]}
          >
            <Text style={[styles.tableCell, styles.colQty]}>
              {row.quantity ? `${row.quantity}x` : ""}
            </Text>
            <Text style={[
              styles.tableCell, 
              styles.colPosition,
              row.isSubtotal && styles.tableCellBold,
            ]}>
              {row.label}
            </Text>
            <Text style={[styles.tableCell, styles.colOneTime]}>
              {row.oneTime ? formatCurrency(row.oneTime) : "–"}
            </Text>
            {hasMultiplePeriods ? (
              <>
                <Text style={[
                  styles.tableCell, 
                  styles.colPeriod1,
                  row.isDiscount && styles.tableCellNegative,
                  row.isSubtotal && styles.tableCellBold,
                ]}>
                  {formatCurrency(row.monthlyByPeriod[0])}
                </Text>
                <Text style={[
                  styles.tableCell, 
                  styles.colPeriod2,
                  row.isDiscount && styles.tableCellNegative,
                  row.isSubtotal && styles.tableCellBold,
                ]}>
                  {formatCurrency(row.monthlyByPeriod[1] ?? row.monthlyByPeriod[0])}
                </Text>
              </>
            ) : (
              <Text style={[
                styles.tableCell, 
                styles.colPeriod1, 
                { width: "28%" },
                row.isDiscount && styles.tableCellNegative,
                row.isSubtotal && styles.tableCellBold,
              ]}>
                {formatCurrency(row.monthlyByPeriod[0])}
              </Text>
            )}
            {hasMultiplePeriods && row.isSubtotal && (
              <Text style={[styles.tableCell, styles.colAvg, styles.tableCellBold]}>
                {formatCurrency(avgMonthly)}
              </Text>
            )}
          </View>
        ))}
        
        {/* Total row */}
        <View style={[styles.tableRow, styles.tableRowTotal]}>
          <Text style={[styles.tableCell, styles.colQty, styles.tableCellTotal]}></Text>
          <Text style={[styles.tableCell, styles.colPosition, styles.tableCellTotal, styles.tableCellBold]}>
            GESAMTKOSTEN
          </Text>
          <Text style={[styles.tableCell, styles.colOneTime, styles.tableCellTotal]}>
            {totalOneTime > 0 ? formatCurrency(totalOneTime) : "–"}
          </Text>
          {hasMultiplePeriods ? (
            <>
              <Text style={[styles.tableCell, styles.colPeriod1, styles.tableCellTotal, styles.tableCellBold]}>
                {formatCurrency(totalMonthlyPeriod1)}
              </Text>
              <Text style={[styles.tableCell, styles.colPeriod2, styles.tableCellTotal, styles.tableCellBold]}>
                {formatCurrency(totalMonthlyPeriod2)}
              </Text>
              <Text style={[styles.tableCell, styles.colAvg, styles.tableCellTotal, styles.tableCellBold]}>
                {formatCurrency(avgMonthly)}
              </Text>
            </>
          ) : (
            <Text style={[styles.tableCell, styles.colPeriod1, { width: "28%" }, styles.tableCellTotal, styles.tableCellBold]}>
              {formatCurrency(avgMonthly)}
            </Text>
          )}
        </View>
      </View>
      
      {/* Average highlight */}
      <View style={styles.avgRow}>
        <Text style={styles.avgLabel}>Ø Durchschnittliche Monatskosten (24 Monate):</Text>
        <Text style={styles.avgValue}>{formatCurrency(avgMonthly)}</Text>
      </View>
      
      {/* Validity */}
      <View style={styles.validity}>
        <Text style={styles.validityText}>
          ✓ Dieses Angebot ist gültig bis zum {formatDate(validUntil)}
        </Text>
      </View>
      
      {/* Closing */}
      <View style={styles.closing}>
        <Text style={styles.closingText}>
          Für Rückfragen stehe ich Ihnen gerne zur Verfügung.
        </Text>
        <Text style={styles.signature}>Mit freundlichen Grüßen</Text>
        <Text style={[styles.signature, styles.signatureName, { marginTop: 4 }]}>
          {contact?.name || "Ihr Vertriebsteam"}
        </Text>
      </View>
      
      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Alle Preise zzgl. MwSt. Dieses Angebot ist unverbindlich. Die angegebenen Preise können nach Ablauf der Mindestlaufzeit abweichen. 
          Zur Bearbeitung Ihrer Bestellung benötigen wir einen Nachweis für Ihren Geschäftskundenstatus.
        </Text>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            {template.publisherInfo.subline} | Alle Preise zzgl. MwSt.
          </Text>
          <Text style={styles.pageNumber}>Seite {pageNumber} von {totalPages}</Text>
        </View>
      </View>
    </Page>
  );
}
