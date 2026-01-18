// ============================================
// Premium Summary Page - Vodafone Period Table Style
// Header, customer info, QR code, period-based pricing
// Publisher: allenetze.de (NEVER Vodafone/O2)
// ============================================

import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ProfessionalOfferPdfProps, PeriodColumn, PositionRow, PdfCompanySettings } from "../templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";
import { PDF_COLORS, PDF_TYPOGRAPHY, PDF_SPACING, formatCurrencyPdf, formatDiscountPdf, formatDatePdf, sanitizeTextPdf } from "../designSystem";
import { PUBLISHER } from "../../publisherConfig";

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

function createStyles(primaryColor: string, accentColor: string) {
  return StyleSheet.create({
    page: {
      padding: PDF_SPACING.pagePadding,
      fontFamily: "Helvetica",
      fontSize: PDF_TYPOGRAPHY.bodySmall,
      backgroundColor: "#ffffff",
    },
    
    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 18,
      paddingBottom: 12,
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
      fontSize: PDF_TYPOGRAPHY.h5,
      fontWeight: "bold",
      color: primaryColor,
    },
    logoSubtext: {
      fontSize: PDF_TYPOGRAPHY.small,
      color: PDF_COLORS.textMuted,
      marginTop: 2,
    },
    headerRight: {
      textAlign: "right",
      alignItems: "flex-end",
    },
    headerBrand: {
      fontSize: PDF_TYPOGRAPHY.h4,
      fontWeight: "bold",
      color: accentColor,
    },
    headerSlogan: {
      fontSize: PDF_TYPOGRAPHY.bodySmall,
      color: PDF_COLORS.textMuted,
      marginTop: 2,
      fontStyle: "italic",
    },
    
    // Contact section with QR
    contactSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
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
      fontSize: PDF_TYPOGRAPHY.bodySmall,
      color: PDF_COLORS.text,
      lineHeight: 1.4,
    },
    contactBlock: {
      width: "40%",
      textAlign: "right",
      alignItems: "flex-end",
    },
    contactTitle: {
      fontSize: PDF_TYPOGRAPHY.caption,
      fontWeight: "bold",
      color: PDF_COLORS.textMuted,
      marginBottom: 4,
    },
    contactName: {
      fontSize: PDF_TYPOGRAPHY.body,
      fontWeight: "bold",
      color: primaryColor,
    },
    contactDetail: {
      fontSize: PDF_TYPOGRAPHY.caption,
      color: PDF_COLORS.text,
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
      color: PDF_COLORS.textLight,
      marginTop: 3,
      textAlign: "right",
    },
    
    // Offer info
    offerInfo: {
      marginBottom: 10,
    },
    offerTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: accentColor,
    },
    
    // Greeting
    greeting: {
      marginBottom: 10,
      lineHeight: 1.5,
    },
    greetingText: {
      fontSize: PDF_TYPOGRAPHY.bodySmall,
      color: PDF_COLORS.text,
    },
    
    // Promo box
    promoBox: {
      backgroundColor: primaryColor + "12",
      borderLeftWidth: 4,
      borderLeftColor: primaryColor,
      padding: 10,
      marginBottom: 15,
    },
    promoText: {
      fontSize: PDF_TYPOGRAPHY.bodySmall,
      color: accentColor,
      lineHeight: 1.4,
    },
    promoHighlight: {
      fontWeight: "bold",
      color: primaryColor,
    },
    
    // Section headers
    sectionHeader: {
      flexDirection: "row",
      paddingVertical: 6,
      paddingHorizontal: 8,
      marginBottom: 2,
    },
    sectionHeaderText: {
      fontSize: PDF_TYPOGRAPHY.body,
      fontWeight: "bold",
    },
    
    // Period table
    table: {
      marginBottom: 12,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: accentColor,
      paddingVertical: 7,
      paddingHorizontal: 8,
    },
    tableHeaderCell: {
      fontSize: PDF_TYPOGRAPHY.tableHeader,
      fontWeight: "bold",
      color: "#ffffff",
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: PDF_COLORS.border,
    },
    tableRowAlt: {
      backgroundColor: PDF_COLORS.bgAlt,
    },
    tableRowDiscount: {
      backgroundColor: "#fef2f2",
    },
    tableRowSubtotal: {
      backgroundColor: PDF_COLORS.bgLight,
      borderTopWidth: 1,
      borderTopColor: "#cccccc",
    },
    tableRowTotal: {
      backgroundColor: primaryColor,
      marginTop: 6,
    },
    tableCell: {
      fontSize: PDF_TYPOGRAPHY.tableCell,
      color: PDF_COLORS.text,
    },
    tableCellBold: {
      fontWeight: "bold",
    },
    tableCellDiscount: {
      color: PDF_COLORS.discount,
      fontWeight: "bold",
    },
    tableCellTotal: {
      color: "#ffffff",
      fontWeight: "bold",
    },
    
    // Column widths
    colQty: { width: "8%", textAlign: "center" },
    colPosition: { width: "38%" },
    colOneTime: { width: "14%", textAlign: "right" },
    colPeriod: { width: "13%", textAlign: "right" },
    
    // Average total highlight
    avgRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: primaryColor + "12",
      borderRadius: 4,
    },
    avgLabel: {
      fontSize: PDF_TYPOGRAPHY.body,
      color: accentColor,
      marginRight: 20,
    },
    avgValue: {
      fontSize: PDF_TYPOGRAPHY.h5,
      fontWeight: "bold",
      color: primaryColor,
    },
    
    // Validity
    validity: {
      marginTop: 10,
      marginBottom: 8,
    },
    validityText: {
      fontSize: PDF_TYPOGRAPHY.bodySmall,
      fontWeight: "bold",
      color: accentColor,
    },
    
    // Closing
    closing: {
      marginTop: 12,
      marginBottom: 15,
    },
    closingText: {
      fontSize: PDF_TYPOGRAPHY.bodySmall,
      color: PDF_COLORS.text,
      marginBottom: 8,
    },
    signature: {
      fontSize: PDF_TYPOGRAPHY.bodySmall,
      color: PDF_COLORS.text,
    },
    signatureName: {
      fontWeight: "bold",
    },
    
    // Disclaimer
    disclaimer: {
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: PDF_COLORS.border,
    },
    disclaimerText: {
      fontSize: PDF_TYPOGRAPHY.tiny,
      color: PDF_COLORS.textLight,
      lineHeight: 1.4,
    },
    
    // Footer
    footer: {
      position: "absolute",
      bottom: 22,
      left: PDF_SPACING.pagePadding,
      right: PDF_SPACING.pagePadding,
      borderTopWidth: 1,
      borderTopColor: PDF_COLORS.border,
      paddingTop: 8,
    },
    footerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    footerText: {
      fontSize: PDF_TYPOGRAPHY.small,
      color: PDF_COLORS.textLight,
    },
    pageNumber: {
      fontSize: PDF_TYPOGRAPHY.small,
      color: PDF_COLORS.textLight,
    },
  });
}

// Generate period columns based on actual data
function generatePeriodColumns(periods: Array<{ fromMonth: number; toMonth: number }>): PeriodColumn[] {
  if (!periods || periods.length === 0 || periods.length === 1) {
    return [{ header: "Monatlich", fromMonth: 1, toMonth: 24 }];
  }
  
  return periods.map(p => ({
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
  
  // Calculate costs with period breakdown - SEPARATE Mobile and FixedNet
  const calculateCosts = () => {
    const mobileRows: PositionRow[] = [];
    const fixedNetRows: PositionRow[] = [];
    
    let mobileMonthlyP1 = 0;
    let mobileMonthlyP2 = 0;
    let fixedNetMonthly = 0;
    let totalOneTime = 0;
    let totalDiscountOverTerm = 0;
    
    for (const item of items) {
      const { option, result } = item;
      const qty = option.mobile.quantity;
      
      // Get period-specific prices
      const period1Price = result.periods[0]?.monthly?.net || result.totals.avgTermNet;
      const period2Price = result.periods[1]?.monthly?.net || period1Price;
      
      // Tariff row
      const tariffBase = result.breakdown.find(b => b.ruleId === "base");
      const tariffName = tariffBase?.label?.replace(" Grundpreis", "") || "Mobilfunk-Tarif";
      
      mobileRows.push({
        quantity: qty,
        label: tariffName,
        monthlyByPeriod: hasMultiplePeriods ? [period1Price, period2Price] : [result.totals.avgTermNet],
      });
      
      // Mobile discounts (shown in red with minus)
      const mobileDiscounts = result.breakdown.filter(b => 
        b.appliesTo === "monthly" && b.net < 0 && !b.ruleId?.includes("fixed")
      );
      
      for (const discount of mobileDiscounts) {
        mobileRows.push({
          label: `    ${discount.label}`,
          monthlyByPeriod: hasMultiplePeriods 
            ? [discount.net, discount.net]
            : [discount.net],
          isDiscount: true,
        });
        totalDiscountOverTerm += Math.abs(discount.net) * qty * 24;
      }
      
      mobileMonthlyP1 += period1Price * qty;
      mobileMonthlyP2 += period2Price * qty;
      
      // Hardware
      if (option.hardware.ekNet > 0) {
        if (option.hardware.amortize) {
          const hwMonthly = option.hardware.ekNet / (option.hardware.amortMonths || 24);
          mobileRows.push({
            quantity: qty,
            label: `${option.hardware.name || "Gerät"} (Finanzierung)`,
            monthlyByPeriod: hasMultiplePeriods 
              ? [hwMonthly * qty, 0] // Financing ends after amort period
              : [hwMonthly * qty],
            footnote: hasMultiplePeriods ? "ᵃ" : undefined,
          });
          mobileMonthlyP1 += hwMonthly * qty;
        } else {
          totalOneTime += option.hardware.ekNet * qty;
        }
      }
      
      // Fixed net (separate block)
      if (option.fixedNet.enabled) {
        const fixedBase = result.breakdown.find(b => b.ruleId === "fixed_base");
        const fixedName = fixedBase?.label || `${option.fixedNet.accessType} Internet`;
        const fixedMonthlyCost = fixedBase?.net || 0;
        
        fixedNetRows.push({
          quantity: 1,
          label: fixedName,
          monthlyByPeriod: hasMultiplePeriods ? [fixedMonthlyCost, fixedMonthlyCost] : [fixedMonthlyCost],
        });
        
        // Fixed net discounts
        const fixedDiscounts = result.breakdown.filter(b => 
          b.appliesTo === "monthly" && b.net < 0 && b.ruleId?.includes("fixed")
        );
        
        for (const discount of fixedDiscounts) {
          fixedNetRows.push({
            label: `    ${discount.label}`,
            monthlyByPeriod: hasMultiplePeriods 
              ? [discount.net, discount.net]
              : [discount.net],
            isDiscount: true,
          });
          totalDiscountOverTerm += Math.abs(discount.net) * 24;
        }
        
        fixedNetMonthly += fixedMonthlyCost;
      }
    }
    
    // Subtotals
    if (mobileRows.length > 0) {
      mobileRows.push({
        label: "Zwischensumme Mobilfunk",
        monthlyByPeriod: hasMultiplePeriods ? [mobileMonthlyP1, mobileMonthlyP2] : [(mobileMonthlyP1 + mobileMonthlyP2) / 2],
        isSubtotal: true,
      });
    }
    
    if (fixedNetRows.length > 0) {
      fixedNetRows.push({
        label: "Zwischensumme Festnetz",
        monthlyByPeriod: hasMultiplePeriods ? [fixedNetMonthly, fixedNetMonthly] : [fixedNetMonthly],
        isSubtotal: true,
      });
    }
    
    return { 
      mobileRows, 
      fixedNetRows, 
      totalOneTime,
      totalMonthlyP1: mobileMonthlyP1 + fixedNetMonthly,
      totalMonthlyP2: mobileMonthlyP2 + fixedNetMonthly,
      totalDiscountOverTerm,
    };
  };
  
  const { mobileRows, fixedNetRows, totalOneTime, totalMonthlyP1, totalMonthlyP2, totalDiscountOverTerm } = calculateCosts();
  const hasFixedNet = fixedNetRows.length > 1;
  const avgMonthly = (totalMonthlyP1 + totalMonthlyP2) / 2;

  // Render table rows
  const renderTableRow = (row: PositionRow, idx: number, isAlt: boolean) => (
    <View
      key={idx}
      style={[
        styles.tableRow,
        isAlt && !row.isDiscount && !row.isSubtotal && !row.isTotal && styles.tableRowAlt,
        row.isDiscount && styles.tableRowDiscount,
        row.isSubtotal && styles.tableRowSubtotal,
        row.isTotal && styles.tableRowTotal,
      ]}
    >
      <Text style={[styles.tableCell, styles.colQty, row.isTotal && styles.tableCellTotal]}>
        {row.quantity ? `${row.quantity}x` : ""}
      </Text>
      <Text style={[
        styles.tableCell, 
        styles.colPosition,
        (row.isSubtotal || row.isTotal) && styles.tableCellBold,
        row.isTotal && styles.tableCellTotal,
      ]}>
        {row.label}
      </Text>
      <Text style={[styles.tableCell, styles.colOneTime, row.isTotal && styles.tableCellTotal]}>
        {row.oneTime !== undefined ? formatCurrencyPdf(row.oneTime) : "—"}
      </Text>
      {row.monthlyByPeriod.map((amount, pIdx) => (
        <Text key={pIdx} style={[
          styles.tableCell,
          styles.colPeriod,
          row.isDiscount && styles.tableCellDiscount,
          (row.isSubtotal || row.isTotal) && styles.tableCellBold,
          row.isTotal && styles.tableCellTotal,
        ]}>
          {row.isDiscount && amount < 0 ? formatDiscountPdf(amount) : formatCurrencyPdf(amount)}
          {row.footnote && pIdx === row.monthlyByPeriod.length - 1 && row.footnote}
        </Text>
      ))}
    </View>
  );

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
      
      {/* Contact Section with QR */}
      <View style={styles.contactSection}>
        <View style={styles.recipientBlock}>
          <Text style={styles.recipientName}>
            {sanitizeTextPdf(customer.firma) || "Geschäftskunde"}
          </Text>
          <Text style={styles.recipientAddress}>
            {customer.anrede} {sanitizeTextPdf(customer.nachname)}{"\n"}
            {sanitizeTextPdf(customer.strasse)}{"\n"}
            {sanitizeTextPdf(customer.plz)} {sanitizeTextPdf(customer.ort)}
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
              <Text style={styles.qrLabel}>Zum Online-Angebot</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Offer Info */}
      <View style={styles.offerInfo}>
        <Text style={styles.offerTitle}>
          Ihr Angebot vom {formatDatePdf(today)} – Angebotsnr. {offerId}
        </Text>
      </View>
      
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          {customer.anrede === "Herr" ? "Sehr geehrter Herr" : customer.anrede === "Frau" ? "Sehr geehrte Frau" : "Guten Tag"} {sanitizeTextPdf(customer.nachname)},
        </Text>
        <Text style={[styles.greetingText, { marginTop: 6 }]}>
          {options.offerText || "vielen Dank für Ihr Interesse. Im Folgenden finden Sie eine Übersicht Ihres individuellen Angebots. Alle Preise verstehen sich zzgl. MwSt."}
        </Text>
      </View>
      
      {/* Promo Box */}
      {options.promoHighlight && (
        <View style={styles.promoBox}>
          <Text style={styles.promoText}>
            🎁 <Text style={styles.promoHighlight}>Bei Abschluss bis zum {formatDatePdf(validUntil)}</Text> {options.promoHighlight}
          </Text>
        </View>
      )}
      
      {/* MOBILFUNK Section */}
      <View style={styles.table}>
        <View style={[styles.sectionHeader, { backgroundColor: PDF_COLORS.bgMobile }]}>
          <Text style={[styles.sectionHeaderText, { color: accentColor }]}>MOBILFUNK</Text>
        </View>
        
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colQty]}>Anz.</Text>
          <Text style={[styles.tableHeaderCell, styles.colPosition]}>Position</Text>
          <Text style={[styles.tableHeaderCell, styles.colOneTime]}>Einmalig</Text>
          {periodColumns.map((col, idx) => (
            <Text key={idx} style={[styles.tableHeaderCell, styles.colPeriod]}>{col.header}</Text>
          ))}
        </View>
        
        {mobileRows.map((row, idx) => renderTableRow(row, idx, idx % 2 === 1))}
      </View>
      
      {/* FESTNETZ Section (if applicable) */}
      {hasFixedNet && (
        <View style={styles.table}>
          <View style={[styles.sectionHeader, { backgroundColor: PDF_COLORS.bgFixedNet }]}>
            <Text style={[styles.sectionHeaderText, { color: accentColor }]}>FESTNETZ</Text>
          </View>
          
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Anz.</Text>
            <Text style={[styles.tableHeaderCell, styles.colPosition]}>Position</Text>
            <Text style={[styles.tableHeaderCell, styles.colOneTime]}>Einmalig</Text>
            {periodColumns.map((col, idx) => (
              <Text key={idx} style={[styles.tableHeaderCell, styles.colPeriod]}>{col.header}</Text>
            ))}
          </View>
          
          {fixedNetRows.map((row, idx) => renderTableRow(row, idx, idx % 2 === 1))}
        </View>
      )}
      
      {/* GESAMTÜBERSICHT Total Row */}
      <View style={[styles.tableRow, styles.tableRowTotal]}>
        <Text style={[styles.tableCell, styles.colQty, styles.tableCellTotal]}></Text>
        <Text style={[styles.tableCell, styles.colPosition, styles.tableCellTotal, styles.tableCellBold]}>
          Gesamtkosten monatlich
        </Text>
        <Text style={[styles.tableCell, styles.colOneTime, styles.tableCellTotal]}>
          {totalOneTime > 0 ? formatCurrencyPdf(totalOneTime) : "—"}
        </Text>
        {hasMultiplePeriods ? (
          <>
            <Text style={[styles.tableCell, styles.colPeriod, styles.tableCellTotal, styles.tableCellBold]}>
              {formatCurrencyPdf(totalMonthlyP1)}
            </Text>
            <Text style={[styles.tableCell, styles.colPeriod, styles.tableCellTotal, styles.tableCellBold]}>
              {formatCurrencyPdf(totalMonthlyP2)}
            </Text>
          </>
        ) : (
          <Text style={[styles.tableCell, styles.colPeriod, styles.tableCellTotal, styles.tableCellBold]}>
            {formatCurrencyPdf(avgMonthly)}
          </Text>
        )}
      </View>
      
      {/* Discount summary (Vodafone-style) */}
      {totalDiscountOverTerm > 0 && (
        <View style={styles.avgRow}>
          <Text style={styles.avgLabel}>Ersparnis über 24 Monate:</Text>
          <Text style={[styles.avgValue, { color: PDF_COLORS.discount }]}>
            −{formatCurrencyPdf(totalDiscountOverTerm)}
          </Text>
        </View>
      )}
      
      {/* Validity */}
      <View style={styles.validity}>
        <Text style={styles.validityText}>
          Angebot gültig bis {formatDatePdf(validUntil)}. Weitere Details auf den folgenden Seiten.
        </Text>
      </View>
      
      {/* Closing */}
      <View style={styles.closing}>
        <Text style={styles.closingText}>
          Für Fragen stehe ich Ihnen gerne zur Verfügung.
        </Text>
        <Text style={styles.signature}>Mit freundlichen Grüßen</Text>
        <Text style={[styles.signature, styles.signatureName, { marginTop: 4 }]}>
          {contact?.name || "Ihr Vertriebsteam"}
        </Text>
      </View>
      
      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          {hasMultiplePeriods && "ᵃ Nach Ende der Hardware-Finanzierung. "}
          Alle Preise zzgl. MwSt. Bei diesem Angebot handelt es sich um ein unverbindliches Tarifbeispiel. 
          Die hier angegebenen Preise können nach Ablauf der Mindestlaufzeit abweichen. 
          Zur Bearbeitung Ihrer Bestellung benötigen wir einen Nachweis für Ihren Geschäftskundenstatus.
        </Text>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            {template.publisherInfo.subline} | Alle Preise zzgl. MwSt. | RV180000
          </Text>
          <Text style={styles.pageNumber}>Seite {pageNumber} von {totalPages}</Text>
        </View>
      </View>
    </Page>
  );
}
