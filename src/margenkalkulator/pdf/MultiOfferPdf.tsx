// ============================================
// Multi-Offer PDF Document
// ============================================
//
// Professionelles PDF-Template nach Vodafone-Referenz
// mit dynamischem Branding und Multi-Tarif-Support.
//
// ============================================

import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { StyleSheet, Font } from "@react-pdf/renderer";
import type { OfferConfig } from "../contexts/OfferBasketContext";
import type { TenantBranding } from "@/hooks/useTenantBranding";
import { DEFAULT_BRANDING } from "@/hooks/useTenantBranding";
import { formatCurrency as formatCurrencyBase } from "../lib/formatters";

interface MultiOfferPdfProps {
  config: OfferConfig;
  branding?: TenantBranding;
}

// SECURITY: Sanitize text content
function sanitize(text: string | undefined | null, maxLength = 500): string {
  if (!text) return "";
  return String(text)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/<[^>]*>/g, "")
    .slice(0, maxLength);
}

// PDF-specific currency formatting
function formatCurrency(value: number): string {
  return formatCurrencyBase(value);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function MultiOfferPdf({ config, branding = DEFAULT_BRANDING }: MultiOfferPdfProps) {
  const primaryColor = branding.primaryColor || DEFAULT_BRANDING.primaryColor;
  const secondaryColor = branding.secondaryColor || DEFAULT_BRANDING.secondaryColor;
  
  const styles = StyleSheet.create({
    page: {
      padding: 40,
      paddingBottom: 100,
      fontFamily: "Helvetica",
      fontSize: 9,
      backgroundColor: "#ffffff",
    },
    
    // Header - Vodafone Style
    header: {
      marginBottom: 25,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    logoSection: {
      flexDirection: "row",
      alignItems: "center",
    },
    logoContainer: {
      width: 50,
      height: 30,
      marginRight: 8,
    },
    logoImage: {
      width: "100%",
      height: "100%",
      objectFit: "contain",
    },
    vodafoneLogo: {
      fontSize: 14,
      fontWeight: "bold",
      color: primaryColor,
    },
    vodafoneSubtext: {
      fontSize: 8,
      color: "#666666",
    },
    dateSection: {
      textAlign: "right",
    },
    dateText: {
      fontSize: 10,
      color: secondaryColor,
      fontWeight: "bold",
    },
    
    // Address Block (Vodafone Style)
    addressBlock: {
      marginTop: 15,
      marginBottom: 20,
    },
    addressLine: {
      fontSize: 7,
      color: "#666666",
      marginBottom: 2,
    },
    senderLine: {
      fontSize: 7,
      color: "#999999",
      marginBottom: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: "#cccccc",
      paddingBottom: 4,
    },
    
    // Contact Info Section
    contactSection: {
      flexDirection: "row",
      marginBottom: 20,
    },
    contactLeft: {
      flex: 1,
    },
    contactRight: {
      width: 180,
      paddingLeft: 15,
    },
    contactLabel: {
      fontSize: 8,
      color: "#666666",
      marginBottom: 2,
    },
    contactValue: {
      fontSize: 9,
      color: secondaryColor,
      marginBottom: 4,
    },
    
    // Title
    offerTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: secondaryColor,
      marginTop: 15,
      marginBottom: 15,
    },
    
    // Anschreiben
    anschreiben: {
      fontSize: 9,
      lineHeight: 1.5,
      color: "#333333",
      marginBottom: 15,
    },
    
    // Table
    table: {
      marginBottom: 15,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#f5f5f5",
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    tableHeaderCell: {
      fontSize: 8,
      fontWeight: "bold",
      color: "#333333",
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: "#e0e0e0",
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    tableSubRow: {
      flexDirection: "row",
      paddingVertical: 3,
      paddingHorizontal: 8,
      paddingLeft: 20,
    },
    tableCell: {
      fontSize: 8,
      color: "#333333",
    },
    tableCellLight: {
      fontSize: 7,
      color: "#666666",
    },
    tableCellBold: {
      fontSize: 8,
      fontWeight: "bold",
      color: secondaryColor,
    },
    
    // Column widths matching reference
    colAnzahl: { width: "8%", textAlign: "center" },
    colTarif: { width: "52%" },
    colEinmalig: { width: "13%", textAlign: "right" },
    colMonat1: { width: "14%", textAlign: "right" },
    colMonat2: { width: "13%", textAlign: "right" },
    
    // Summary Section
    summarySection: {
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: "#e0e0e0",
      paddingTop: 8,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 4,
    },
    summaryLabel: {
      fontSize: 8,
      color: "#666666",
      width: 100,
    },
    summaryValue: {
      fontSize: 8,
      fontWeight: "bold",
      color: secondaryColor,
      width: 80,
      textAlign: "right",
    },
    summaryTotal: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: "#e0e0e0",
    },
    summaryTotalLabel: {
      fontSize: 9,
      fontWeight: "bold",
      color: secondaryColor,
      width: 100,
    },
    summaryTotalValue: {
      fontSize: 10,
      fontWeight: "bold",
      color: primaryColor,
      width: 80,
      textAlign: "right",
    },
    
    // Discount row
    discountRow: {
      flexDirection: "row",
      backgroundColor: "#fff8e6",
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    
    // Legal / Footer Text
    legalSection: {
      marginTop: 20,
    },
    legalText: {
      fontSize: 7,
      color: "#666666",
      lineHeight: 1.4,
    },
    
    // Footer
    footer: {
      position: "absolute",
      bottom: 30,
      left: 40,
      right: 40,
      borderTopWidth: 1,
      borderTopColor: "#e0e0e0",
      paddingTop: 10,
    },
    footerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: 6,
      color: "#999999",
    },
    footerColumn: {
      width: "30%",
    },
    footerLabel: {
      fontSize: 6,
      color: "#666666",
      fontWeight: "bold",
      marginBottom: 2,
    },
    footerValue: {
      fontSize: 6,
      color: "#999999",
      marginBottom: 1,
    },
  });

  // Calculate totals
  const calculateTotals = () => {
    let totalEinmalig = 0;
    let totalMonthly1 = 0;
    let totalMonthly2 = 0;
    let totalDiscount = 0;

    config.items.forEach((item) => {
      const oneTime = item.result.oneTime.reduce((sum, o) => sum + o.net, 0);
      totalEinmalig += oneTime;
      
      // Get period-based pricing
      const periods = item.result.periods;
      if (periods.length >= 1) {
        totalMonthly1 += periods[0].monthly.net * item.option.mobile.quantity;
      }
      if (periods.length >= 2) {
        totalMonthly2 += periods[periods.length - 1].monthly.net * item.option.mobile.quantity;
      } else if (periods.length === 1) {
        totalMonthly2 += periods[0].monthly.net * item.option.mobile.quantity;
      }
      
      // Calculate discounts from breakdown
      const discounts = item.result.breakdown.filter(b => b.key.includes("rabatt") || b.net < 0);
      totalDiscount += discounts.reduce((sum, d) => sum + Math.abs(d.net), 0);
    });

    return { totalEinmalig, totalMonthly1, totalMonthly2, totalDiscount };
  };

  const totals = calculateTotals();
  const totalOver24Months = totals.totalEinmalig + (totals.totalMonthly1 * 12) + (totals.totalMonthly2 * 12);

  const { customer } = config;
  const displayDate = formatDate(config.createdAt);
  const companyName = branding.companyName || "MargenKalkulator";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoSection}>
              {branding.logoUrl ? (
                <View style={styles.logoContainer}>
                  <Image src={branding.logoUrl} style={styles.logoImage} />
                </View>
              ) : null}
              <View>
                <Text style={styles.vodafoneLogo}>vodafone</Text>
                <Text style={styles.vodafoneSubtext}>business</Text>
              </View>
            </View>
            <View style={styles.dateSection}>
              <Text style={styles.dateText}>{displayDate}</Text>
            </View>
          </View>

          {/* Sender Address Line */}
          <View style={styles.addressBlock}>
            <Text style={styles.senderLine}>
              Vodafone GmbH, Ferdinand-Braun-Platz 1, 40549 Düsseldorf
            </Text>
            
            {/* Recipient Address */}
            {customer.firma && (
              <>
                <Text style={styles.addressLine}>
                  {customer.anrede} {customer.vorname} {customer.nachname}
                </Text>
                <Text style={styles.addressLine}>{customer.firma}</Text>
                <Text style={styles.addressLine}>
                  {customer.strasse} {customer.hausnummer}
                </Text>
                <Text style={styles.addressLine}>
                  {customer.plz} {customer.ort}
                </Text>
              </>
            )}
          </View>

          {/* Contact Info */}
          {customer.apName && (
            <View style={styles.contactSection}>
              <View style={styles.contactLeft} />
              <View style={styles.contactRight}>
                <Text style={styles.contactLabel}>Ihr Ansprechpartner:</Text>
                <Text style={styles.contactValue}>{sanitize(customer.apName)}</Text>
                {customer.apStrasse && (
                  <Text style={styles.contactValue}>
                    {customer.apStrasse} {customer.apHausnummer}
                  </Text>
                )}
                {customer.apMobil && (
                  <Text style={styles.contactValue}>Mobilfunk: {customer.apMobil}</Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.offerTitle}>Unverbindliches Angebot:</Text>

        {/* Anschreiben */}
        {config.anschreiben && (
          <Text style={styles.anschreiben}>{sanitize(config.anschreiben)}</Text>
        )}

        {/* Tariff Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colAnzahl]}>Anzahl</Text>
            <Text style={[styles.tableHeaderCell, styles.colTarif]}>Tarif</Text>
            <Text style={[styles.tableHeaderCell, styles.colEinmalig]}>Einmalig</Text>
            <Text style={[styles.tableHeaderCell, styles.colMonat1]}>Monat 1.-12.</Text>
            <Text style={[styles.tableHeaderCell, styles.colMonat2]}>Monat 13.-24.</Text>
          </View>

          {/* Tariff Rows */}
          {config.items.map((item, idx) => {
            const oneTime = item.result.oneTime.reduce((sum, o) => sum + o.net, 0);
            const periods = item.result.periods;
            const monthly1 = periods[0]?.monthly.net || 0;
            const monthly2 = periods[periods.length - 1]?.monthly.net || monthly1;
            
            const tariffName = config.options.hideTariffName 
              ? "Mobilfunk-Tarif" 
              : (item.result.breakdown.find(b => b.ruleId === "base")?.label?.replace(" Grundpreis", "") || item.name);
            
            const providerName = config.options.hideProviderName ? "" : "Vodafone ";

            return (
              <View key={item.id}>
                {/* Main Row */}
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCellBold, styles.colAnzahl]}>
                    {item.option.mobile.quantity}×
                  </Text>
                  <View style={styles.colTarif}>
                    <Text style={styles.tableCellBold}>
                      {providerName}{tariffName} (Laufzeit: {item.option.meta.termMonths} Monate)
                    </Text>
                    {item.option.hardware.ekNet > 0 && (
                      <Text style={styles.tableCellLight}>
                        inkl. {sanitize(item.option.hardware.name)}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.tableCell, styles.colEinmalig]}>
                    {oneTime > 0 ? formatCurrency(oneTime) : "–"}
                  </Text>
                  <Text style={[styles.tableCell, styles.colMonat1]}>
                    {formatCurrency(monthly1)} mtl.
                  </Text>
                  <Text style={[styles.tableCell, styles.colMonat2]}>
                    {formatCurrency(monthly2)} mtl.
                  </Text>
                </View>

                {/* Sub-rows for features/discounts */}
                {item.result.breakdown
                  .filter(b => b.appliesTo === "monthly" && b.ruleId !== "base" && b.net !== 0)
                  .slice(0, 3)
                  .map((b, i) => (
                    <View key={i} style={styles.tableSubRow}>
                      <Text style={[styles.tableCellLight, styles.colAnzahl]} />
                      <Text style={[styles.tableCellLight, styles.colTarif]}>
                        {sanitize(b.label)}
                      </Text>
                      <Text style={[styles.tableCellLight, styles.colEinmalig]}>–</Text>
                      <Text style={[styles.tableCellLight, styles.colMonat1]}>
                        {b.net > 0 ? "+" : ""}{formatCurrency(b.net)} mtl.
                      </Text>
                      <Text style={[styles.tableCellLight, styles.colMonat2]}>
                        {b.net > 0 ? "+" : ""}{formatCurrency(b.net)} mtl.
                      </Text>
                    </View>
                  ))}
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          {totals.totalDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Gesamtrabatt:</Text>
              <Text style={[styles.summaryValue, { color: "#16a34a" }]}>
                -{formatCurrency(totals.totalDiscount * 24)} über 24 Monate
              </Text>
            </View>
          )}
          <View style={styles.summaryTotal}>
            <Text style={styles.summaryTotalLabel}>Gesamtpreis:</Text>
            <Text style={styles.summaryTotalValue}>
              {formatCurrency(totals.totalEinmalig)}
            </Text>
            <Text style={[styles.summaryTotalValue, { marginLeft: 10 }]}>
              {formatCurrency(totals.totalMonthly1)} mtl.
            </Text>
            <Text style={[styles.summaryTotalValue, { marginLeft: 10 }]}>
              {formatCurrency(totals.totalMonthly2)} mtl.
            </Text>
          </View>
        </View>

        {/* Legal Text */}
        <View style={styles.legalSection}>
          <Text style={styles.legalText}>
            {sanitize(config.angebotstext)}
          </Text>
          <Text style={[styles.legalText, { marginTop: 8 }]}>
            alle Preise verstehen sich exkl. Mehrwertsteuer
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerLabel}>Vodafone GmbH</Text>
              <Text style={styles.footerValue}>Ferdinand-Braun-Platz 1, 40549 Düsseldorf</Text>
              <Text style={styles.footerValue}>Tel.: +49 (0) 211/533-0</Text>
              <Text style={styles.footerValue}>vodafone.de</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerLabel}>Bankverbindung:</Text>
              <Text style={styles.footerValue}>Deutsche Bank AG, Düsseldorf</Text>
              <Text style={styles.footerValue}>IBAN: DE68 3007 0010 0250 8000 00</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerLabel}>Geschäftsführung:</Text>
              <Text style={styles.footerValue}>Marcel de Groot (Vorsitzender)</Text>
              <Text style={styles.footerValue}>Sitz: Düsseldorf, HRB 38062</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
