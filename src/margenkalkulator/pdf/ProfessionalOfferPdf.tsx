// ============================================
// Professional Offer PDF - O2 Business Style
// Multi-page PDF with periods, discounts, QR-code
// Publisher: allenetze.de
// ============================================

import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { ProfessionalOfferPdfProps, PeriodColumn, PositionRow } from "./templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";
import { DEFAULT_BRANDING } from "@/hooks/useTenantBranding";
import { DEFAULT_TEMPLATE } from "./templates/allenetzeClean";

// ============================================
// Style Factory
// ============================================

function createStyles(primaryColor: string, accentColor: string) {
  return StyleSheet.create({
    // Page base
    page: {
      padding: 40,
      fontFamily: "Helvetica",
      fontSize: 9,
      backgroundColor: "#ffffff",
    },
    
    // Cover Page
    coverPage: {
      backgroundColor: accentColor,
      padding: 0,
    },
    coverOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: accentColor,
      opacity: 0.85,
    },
    coverContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 60,
    },
    coverHeadline: {
      fontSize: 36,
      fontWeight: "bold",
      color: "#ffffff",
      textAlign: "center",
      marginBottom: 10,
    },
    coverSubheadline: {
      fontSize: 24,
      color: primaryColor,
      textAlign: "center",
      marginBottom: 60,
    },
    coverCustomer: {
      marginTop: "auto",
      paddingTop: 40,
    },
    coverCustomerLabel: {
      fontSize: 12,
      color: "#cccccc",
      marginBottom: 5,
    },
    coverCustomerName: {
      fontSize: 18,
      color: "#ffffff",
      fontWeight: "bold",
    },
    coverFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 40,
    },
    coverOfferId: {
      fontSize: 10,
      color: "#999999",
    },
    
    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 25,
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
      fontSize: 18,
      fontWeight: "bold",
      color: primaryColor,
    },
    headerSubbrand: {
      fontSize: 10,
      color: "#666666",
    },
    
    // Contact Section
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
      marginBottom: 3,
    },
    recipientAddress: {
      fontSize: 9,
      color: "#333333",
      lineHeight: 1.4,
    },
    contactBlock: {
      width: "40%",
      textAlign: "right",
    },
    contactTitle: {
      fontSize: 8,
      fontWeight: "bold",
      color: "#666666",
      marginBottom: 5,
    },
    contactName: {
      fontSize: 10,
      fontWeight: "bold",
      color: accentColor,
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
      width: 60,
      height: 60,
    },
    
    // Offer Info
    offerInfo: {
      marginBottom: 15,
    },
    offerTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: primaryColor,
    },
    offerLink: {
      fontSize: 8,
      color: primaryColor,
      textDecoration: "underline",
    },
    
    // Greeting
    greeting: {
      marginBottom: 15,
      lineHeight: 1.5,
    },
    greetingText: {
      fontSize: 9,
      color: "#333333",
    },
    
    // Promo Box
    promoBox: {
      backgroundColor: primaryColor + "15",
      borderLeftWidth: 3,
      borderLeftColor: primaryColor,
      padding: 12,
      marginBottom: 20,
    },
    promoIcon: {
      fontSize: 12,
      marginRight: 8,
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
    
    // Table
    table: {
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: "row",
      borderBottomWidth: 2,
      borderBottomColor: accentColor,
      paddingBottom: 8,
      marginBottom: 4,
    },
    tableHeaderCell: {
      fontSize: 8,
      fontWeight: "bold",
      color: "#666666",
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e5e5",
    },
    tableRowDiscount: {
      backgroundColor: "#fafafa",
    },
    tableRowSubtotal: {
      borderTopWidth: 1,
      borderTopColor: "#cccccc",
      fontWeight: "bold",
    },
    tableRowTotal: {
      backgroundColor: primaryColor,
      borderRadius: 2,
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
    colQty: { width: "8%" },
    colPosition: { width: "42%" },
    colOneTime: { width: "15%", textAlign: "right" },
    colPeriod: { width: "17.5%", textAlign: "right" },
    
    // Validity
    validity: {
      marginTop: 15,
      marginBottom: 10,
    },
    validityText: {
      fontSize: 9,
      fontWeight: "bold",
      color: accentColor,
    },
    
    // Closing
    closing: {
      marginTop: 20,
      marginBottom: 30,
    },
    closingText: {
      fontSize: 9,
      color: "#333333",
      marginBottom: 15,
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
    footerLink: {
      color: primaryColor,
      textDecoration: "underline",
    },
    pageNumber: {
      fontSize: 7,
      color: "#999999",
      textAlign: "right",
    },
    
    // Disclaimer
    disclaimer: {
      marginTop: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: "#e5e5e5",
    },
    disclaimerText: {
      fontSize: 6,
      color: "#999999",
      lineHeight: 1.4,
    },
    disclaimerNumber: {
      fontSize: 5,
      verticalAlign: "super",
    },
    
    // Detail Pages
    sectionTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: primaryColor,
      marginBottom: 10,
      marginTop: 15,
    },
    sectionSubtitle: {
      fontSize: 9,
      color: "#666666",
      marginTop: -8,
      marginBottom: 15,
    },
    
    // Detail Card
    detailCard: {
      borderWidth: 1,
      borderColor: "#e5e5e5",
      marginBottom: 15,
      padding: 12,
    },
    detailCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e5e5",
      paddingBottom: 8,
      marginBottom: 10,
    },
    detailCardTitle: {
      fontSize: 10,
      fontWeight: "bold",
      color: accentColor,
    },
    detailCardPrice: {
      textAlign: "right",
    },
    
    // Feature List
    featureList: {
      marginTop: 10,
    },
    featureTitle: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#333333",
      marginBottom: 5,
    },
    featureItem: {
      flexDirection: "row",
      marginBottom: 3,
    },
    featureCheck: {
      width: 12,
      fontSize: 9,
      color: primaryColor,
    },
    featureText: {
      flex: 1,
      fontSize: 8,
      color: "#333333",
    },
    
    // Hardware Row
    hardwareRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    hardwareImage: {
      width: 50,
      height: 50,
      marginRight: 12,
      objectFit: "contain",
      backgroundColor: "#f5f5f5",
      borderRadius: 4,
    },
    hardwareInfo: {
      flex: 1,
    },
    hardwareName: {
      fontSize: 10,
      fontWeight: "bold",
      color: accentColor,
    },
    hardwareSpecs: {
      fontSize: 8,
      color: "#666666",
      marginTop: 2,
    },
    hardwareTotalPrice: {
      fontSize: 9,
      color: "#333333",
      marginTop: 4,
    },
    
    // Publisher
    publisherBadge: {
      marginTop: 20,
      padding: 10,
      backgroundColor: "#f8f9fa",
      borderRadius: 4,
      alignItems: "center",
    },
    publisherText: {
      fontSize: 8,
      color: "#666666",
    },
  });
}

// ============================================
// Helper Functions
// ============================================

function sanitizeText(text: string | undefined | null, maxLength = 200): string {
  if (!text) return "";
  return String(text)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/<[^>]*>/g, "")
    .slice(0, maxLength);
}

function formatCurrency(value: number | undefined | null): string {
  const num = value ?? 0;
  if (isNaN(num)) return "0,00 €";
  return `${num.toFixed(2).replace(".", ",")} €`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function generatePeriodColumns(periods: Array<{ fromMonth: number; toMonth: number }>): PeriodColumn[] {
  if (periods.length <= 1) {
    return [{ header: "Monatlich", fromMonth: 1, toMonth: 24 }];
  }
  
  return periods.map(p => ({
    header: p.fromMonth === p.toMonth 
      ? `Monat ${p.fromMonth}`
      : `${p.fromMonth}.-${p.toMonth}. Monat`,
    fromMonth: p.fromMonth,
    toMonth: p.toMonth,
  }));
}

// ============================================
// Cover Page Component
// ============================================

function CoverPage({ 
  styles, 
  customer, 
  offerId 
}: { 
  styles: ReturnType<typeof createStyles>; 
  customer: ProfessionalOfferPdfProps["customer"]; 
  offerId: string;
}) {
  return (
    <Page size="A4" style={[styles.page, styles.coverPage]}>
      <View style={styles.coverContent}>
        <Text style={styles.coverHeadline}>Top-Leistung zu</Text>
        <Text style={styles.coverSubheadline}>Top-Konditionen</Text>
        
        <View style={styles.coverCustomer}>
          <Text style={styles.coverCustomerLabel}>Erstellt für:</Text>
          <Text style={styles.coverCustomerName}>
            {sanitizeText(customer.firma) || "Geschäftskunde"}
          </Text>
          {customer.ort && (
            <Text style={[styles.coverCustomerName, { marginTop: 5 }]}>
              {sanitizeText(customer.plz)} {sanitizeText(customer.ort)}
            </Text>
          )}
        </View>
        
        <View style={styles.coverFooter}>
          <Text style={styles.coverOfferId}>Angebotsnummer:</Text>
          <Text style={[styles.coverOfferId, { fontWeight: "bold" }]}>{offerId}</Text>
        </View>
      </View>
    </Page>
  );
}

// ============================================
// Summary Page Component
// ============================================

function SummaryPage({
  styles,
  template,
  customer,
  contact,
  offerId,
  options,
  items,
  qrCodeDataUrl,
  branding,
  pageNumber,
  totalPages,
}: {
  styles: ReturnType<typeof createStyles>;
  template: ProfessionalOfferPdfProps["template"];
  customer: ProfessionalOfferPdfProps["customer"];
  contact?: ProfessionalOfferPdfProps["contact"];
  offerId: string;
  options: ProfessionalOfferPdfProps["options"];
  items: ProfessionalOfferPdfProps["items"];
  qrCodeDataUrl?: string;
  branding?: TenantBranding;
  pageNumber: number;
  totalPages: number;
}) {
  const today = new Date();
  const validUntil = new Date(today.getTime() + options.validDays * 24 * 60 * 60 * 1000);
  
  // Collect all periods from all items
  const allPeriods = items.flatMap(item => item.result.periods);
  const periodColumns = generatePeriodColumns(allPeriods.length > 1 ? allPeriods : []);
  const hasMultiplePeriods = periodColumns.length > 1;
  
  // Calculate totals
  const totalOneTime = items.reduce((sum, item) => 
    sum + item.result.oneTime.reduce((s, o) => s + o.net, 0), 0);
  
  const avgMonthly = items.reduce((sum, item) => 
    sum + item.result.totals.avgTermNet * item.option.mobile.quantity, 0);
  
  // Build position rows with discounts
  const buildPositionRows = (): PositionRow[] => {
    const rows: PositionRow[] = [];
    let tariffSubtotal = 0;
    let hardwareSubtotal = 0;
    
    for (const item of items) {
      const { option, result } = item;
      const qty = option.mobile.quantity;
      
      // Mobile tariff row
      const tariffBase = result.breakdown.find(b => b.ruleId === "base");
      const tariffName = tariffBase?.label?.replace(" Grundpreis", "") || "Mobilfunk-Tarif";
      const tariffMonthly = result.periods.map(p => p.monthly.net);
      
      rows.push({
        quantity: qty,
        label: `Mobilfunkvertrag mit ${tariffName}`,
        oneTime: 0,
        monthlyByPeriod: hasMultiplePeriods ? tariffMonthly : [result.totals.avgTermNet],
      });
      
      // Discount rows (TeamDeal, GigaKombi, Promos)
      const discounts = result.breakdown.filter(b => 
        b.appliesTo === "monthly" && b.net < 0
      );
      
      for (const discount of discounts) {
        rows.push({
          label: `- ${discount.label}`,
          monthlyByPeriod: hasMultiplePeriods 
            ? result.periods.map(() => discount.net)
            : [discount.net],
          isDiscount: true,
        });
        tariffSubtotal += discount.net * qty;
      }
      
      tariffSubtotal += result.totals.avgTermNet * qty;
      
      // Hardware row (if present)
      if (option.hardware.ekNet > 0) {
        const hwMonthly = option.hardware.amortize 
          ? option.hardware.ekNet / (option.hardware.amortMonths || 24)
          : 0;
        
        rows.push({
          quantity: qty,
          label: `Hardware - ${option.hardware.name || "Gerät"}`,
          oneTime: option.hardware.amortize ? 0 : option.hardware.ekNet,
          monthlyByPeriod: hasMultiplePeriods 
            ? result.periods.map(() => hwMonthly)
            : [hwMonthly],
        });
        
        hardwareSubtotal += hwMonthly * qty;
      }
    }
    
    // Subtotals
    if (rows.length > 1) {
      rows.push({
        label: "Zwischensumme Tarife",
        oneTime: 0,
        monthlyByPeriod: [tariffSubtotal],
        isSubtotal: true,
      });
      
      if (hardwareSubtotal > 0) {
        rows.push({
          label: "Zwischensumme Hardware",
          oneTime: totalOneTime,
          monthlyByPeriod: [hardwareSubtotal],
          isSubtotal: true,
        });
      }
    }
    
    // Grand total
    rows.push({
      label: "Gesamtpreis",
      oneTime: totalOneTime,
      monthlyByPeriod: [avgMonthly],
      isTotal: true,
    });
    
    return rows;
  };
  
  const positionRows = buildPositionRows();
  const displayName = branding?.companyName || template.publisherInfo.name;
  
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
          <Text style={styles.headerSubbrand}>can do</Text>
        </View>
      </View>
      
      {/* Contact Section */}
      <View style={styles.contactSection}>
        <View style={styles.recipientBlock}>
          <Text style={styles.recipientName}>
            {sanitizeText(customer.firma) || "Geschäftskunde"}
          </Text>
          <Text style={styles.recipientAddress}>
            {customer.anrede} {sanitizeText(customer.nachname)}{"\n"}
            {sanitizeText(customer.strasse)}{"\n"}
            {sanitizeText(customer.plz)} {sanitizeText(customer.ort)}
          </Text>
        </View>
        <View style={styles.contactBlock}>
          <Text style={styles.contactTitle}>Ihr Ansprechpartner:</Text>
          <Text style={styles.contactName}>{contact?.name || "Vertriebsteam"}</Text>
          <Text style={styles.contactDetail}>{contact?.company || displayName}</Text>
          {contact?.phone && <Text style={styles.contactDetail}>📞 {contact.phone}</Text>}
          {contact?.email && <Text style={styles.contactDetail}>✉ {contact.email}</Text>}
          {qrCodeDataUrl && (
            <View style={styles.qrCodeContainer}>
              <Image src={qrCodeDataUrl} style={styles.qrCode} />
            </View>
          )}
        </View>
      </View>
      
      {/* Offer Info */}
      <View style={styles.offerInfo}>
        <Text style={styles.offerTitle}>
          Ihr Angebot vom {formatDate(today)} mit der Angebotsnummer {offerId}
        </Text>
      </View>
      
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          {customer.anrede === "Herr" ? "Sehr geehrter Herr" : customer.anrede === "Frau" ? "Sehr geehrte Frau" : "Guten Tag"} {sanitizeText(customer.nachname)},
        </Text>
        <Text style={[styles.greetingText, { marginTop: 8 }]}>
          {options.offerText || "vielen Dank für Ihr Interesse. Im Folgenden sehen Sie eine Zusammenfassung Ihres persönlichen Angebots. Alle Preise verstehen sich zzgl. MwSt."}
        </Text>
      </View>
      
      {/* Promo Box */}
      {options.promoHighlight && (
        <View style={styles.promoBox}>
          <Text style={styles.promoText}>
            💶 <Text style={styles.promoHighlight}>Bei Abschluss bis zum {formatDate(validUntil)}</Text> {options.promoHighlight}
          </Text>
        </View>
      )}
      
      {/* Positions Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colQty]}></Text>
          <Text style={[styles.tableHeaderCell, styles.colPosition]}></Text>
          <Text style={[styles.tableHeaderCell, styles.colOneTime]}>Einmalig</Text>
          {periodColumns.map((col, i) => (
            <Text key={i} style={[styles.tableHeaderCell, styles.colPeriod]}>{col.header}</Text>
          ))}
        </View>
        
        {/* Table Rows */}
        {positionRows.map((row, idx) => (
          <View 
            key={idx} 
            style={[
              styles.tableRow,
              row.isDiscount && styles.tableRowDiscount,
              row.isSubtotal && styles.tableRowSubtotal,
              row.isTotal && styles.tableRowTotal,
            ]}
          >
            <Text style={[
              styles.tableCell, 
              styles.colQty,
              row.isTotal && styles.tableCellTotal,
            ]}>
              {row.quantity ? `${row.quantity}` : ""}
            </Text>
            <Text style={[
              styles.tableCell, 
              styles.colPosition,
              (row.isSubtotal || row.isTotal) && styles.tableCellBold,
              row.isTotal && styles.tableCellTotal,
            ]}>
              {row.label}
            </Text>
            <Text style={[
              styles.tableCell, 
              styles.colOneTime,
              row.isTotal && styles.tableCellTotal,
            ]}>
              {row.oneTime !== undefined && row.oneTime !== 0 ? formatCurrency(row.oneTime) : "–"}
            </Text>
            {row.monthlyByPeriod.map((value, i) => (
              <Text 
                key={i} 
                style={[
                  styles.tableCell, 
                  styles.colPeriod,
                  row.isDiscount && styles.tableCellNegative,
                  (row.isSubtotal || row.isTotal) && styles.tableCellBold,
                  row.isTotal && styles.tableCellTotal,
                ]}
              >
                {formatCurrency(value)}
              </Text>
            ))}
          </View>
        ))}
      </View>
      
      {/* Validity */}
      <View style={styles.validity}>
        <Text style={styles.validityText}>
          Dieses Angebot ist gültig bis {formatDate(validUntil)}. Weitere Details ab Seite {pageNumber + 1}.
        </Text>
      </View>
      
      {/* Closing */}
      <View style={styles.closing}>
        <Text style={styles.closingText}>
          Für Fragen rund um dieses Angebot stehe ich Ihnen gerne zur Verfügung.
        </Text>
        <Text style={styles.signature}>Mit freundlichen Grüßen</Text>
        <Text style={[styles.signature, styles.signatureName, { marginTop: 5 }]}>
          {contact?.name || "Ihr Vertriebsteam"}
        </Text>
      </View>
      
      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Alle Preise zzgl. MwSt. Wichtiger Hinweis: Bei diesem Angebot handelt es sich um ein unverbindliches Tarifbeispiel. 
          Die hier angegebenen Preise können nach Ablauf der Mindestlaufzeit abweichend sein. 
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

// ============================================
// Detail Page Component
// ============================================

function DetailPage({
  styles,
  template,
  items,
  hardwareImages,
  branding,
  pageNumber,
  totalPages,
}: {
  styles: ReturnType<typeof createStyles>;
  template: ProfessionalOfferPdfProps["template"];
  items: ProfessionalOfferPdfProps["items"];
  hardwareImages?: Map<string, string>;
  branding?: TenantBranding;
  pageNumber: number;
  totalPages: number;
}) {
  const displayName = branding?.companyName || template.publisherInfo.name;
  
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
          <Text style={styles.headerBrand}>Details</Text>
        </View>
      </View>
      
      {/* Mobile Section */}
      <Text style={styles.sectionTitle}>1. Mobilfunkverträge</Text>
      <Text style={styles.sectionSubtitle}>(Mindestlaufzeit: 24 Monate)</Text>
      
      {items.map((item, idx) => {
        const { option, result } = item;
        const tariffBase = result.breakdown.find(b => b.ruleId === "base");
        const tariffName = tariffBase?.label?.replace(" Grundpreis", "") || "Mobilfunk-Tarif";
        
        // Get features from tariff
        const features = [
          "Unbegrenztes Datenvolumen",
          "5G inklusive",
          "Allnet-Flat: Telefonie/SMS in alle deutschen Netze",
          "EU-Roaming inklusive",
        ];
        
        return (
          <View key={idx} style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View>
                <Text style={styles.detailCardTitle}>{tariffName}</Text>
                <Text style={{ fontSize: 8, color: "#666666", marginTop: 2 }}>
                  {option.mobile.quantity}x {option.mobile.contractType === "new" ? "Neuvertrag" : "Verlängerung"}
                </Text>
              </View>
              <View style={styles.detailCardPrice}>
                <Text style={{ fontSize: 10, fontWeight: "bold" }}>
                  {formatCurrency(result.totals.avgTermNet)} /mtl.
                </Text>
              </View>
            </View>
            
            <View style={styles.featureList}>
              <Text style={styles.featureTitle}>Im Tarif inklusive:</Text>
              {features.map((feature, i) => (
                <View key={i} style={styles.featureItem}>
                  <Text style={styles.featureCheck}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
      
      {/* Hardware Section */}
      {items.some(item => item.option.hardware.ekNet > 0) && (
        <>
          <Text style={styles.sectionTitle}>2. Hardware-Finanzierung</Text>
          <Text style={styles.sectionSubtitle}>(Vertragslaufzeit: 24 Monate)</Text>
          
          {items.filter(item => item.option.hardware.ekNet > 0).map((item, idx) => {
            const { option } = item;
            const hwName = option.hardware.name || "Gerät";
            const hwMonthly = option.hardware.amortize 
              ? option.hardware.ekNet / (option.hardware.amortMonths || 24)
              : 0;
            
            // Try to get hardware image
            const hwImageUrl = hardwareImages?.get(hwName.split(" ")[0]?.toLowerCase() || "");
            
            return (
              <View key={idx} style={styles.detailCard}>
                <View style={styles.hardwareRow}>
                  {hwImageUrl && (
                    <Image src={hwImageUrl} style={styles.hardwareImage} />
                  )}
                  <View style={styles.hardwareInfo}>
                    <Text style={styles.hardwareName}>{hwName}</Text>
                    <Text style={styles.hardwareSpecs}>
                      {option.mobile.quantity}x Gerät
                    </Text>
                    <Text style={styles.hardwareTotalPrice}>
                      Finanzierung: {formatCurrency(hwMonthly)} /mtl. × 24 = {formatCurrency(option.hardware.ekNet)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      )}
      
      {/* Fixed Net Section */}
      {items.some(item => item.option.fixedNet.enabled) && (
        <>
          <Text style={styles.sectionTitle}>3. Festnetz & Internet</Text>
          
          {items.filter(item => item.option.fixedNet.enabled).map((item, idx) => {
            const { option, result } = item;
            const fixedNetBreakdown = result.breakdown.find(b => b.ruleId === "fixed_base");
            const fixedNetName = fixedNetBreakdown?.label || "Festnetz";
            const fixedNetMonthly = fixedNetBreakdown?.net || 0;
            
            return (
              <View key={idx} style={styles.detailCard}>
                <View style={styles.detailCardHeader}>
                  <View>
                    <Text style={styles.detailCardTitle}>{fixedNetName}</Text>
                    <Text style={{ fontSize: 8, color: "#666666", marginTop: 2 }}>
                      {option.fixedNet.accessType || "Internet"}
                    </Text>
                  </View>
                  <View style={styles.detailCardPrice}>
                    <Text style={{ fontSize: 10, fontWeight: "bold" }}>
                      {formatCurrency(fixedNetMonthly)} /mtl.
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      )}
      
      {/* Publisher Badge */}
      <View style={styles.publisherBadge}>
        <Text style={styles.publisherText}>
          Erstellt mit {template.publisherInfo.name} | {template.publisherInfo.website}
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

// ============================================
// Main PDF Component
// ============================================

export function ProfessionalOfferPdf({
  template = DEFAULT_TEMPLATE,
  customer,
  options,
  branding = DEFAULT_BRANDING,
  contact,
  offerId,
  items,
  hardwareImages,
  qrCodeDataUrl,
}: ProfessionalOfferPdfProps) {
  const primaryColor = branding?.primaryColor || template.primaryColor;
  const accentColor = template.accentColor;
  const styles = createStyles(primaryColor, accentColor);
  
  // Calculate total pages
  const hasCover = options.showCoverPage && template.showCoverPage;
  const totalPages = (hasCover ? 1 : 0) + 2; // Cover + Summary + Details
  
  let currentPage = 1;
  
  return (
    <Document>
      {/* Cover Page (optional) */}
      {hasCover && (
        <CoverPage 
          styles={styles} 
          customer={customer} 
          offerId={offerId} 
        />
      )}
      
      {/* Summary Page */}
      <SummaryPage
        styles={styles}
        template={template}
        customer={customer}
        contact={contact}
        offerId={offerId}
        options={options}
        items={items}
        qrCodeDataUrl={qrCodeDataUrl}
        branding={branding}
        pageNumber={hasCover ? 2 : 1}
        totalPages={totalPages}
      />
      
      {/* Detail Page */}
      <DetailPage
        styles={styles}
        template={template}
        items={items}
        hardwareImages={hardwareImages}
        branding={branding}
        pageNumber={hasCover ? 3 : 2}
        totalPages={totalPages}
      />
    </Document>
  );
}
