// ============================================
// Premium Fixed Net Page - UC & Internet Products
// Shows fixed line products, internet connections
// Publisher: allenetze.de
// ============================================

import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { PdfTemplate, ProfessionalOfferPdfProps, PeriodColumn, PositionRow } from "../templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";
import { PDF_COLORS, PDF_TYPOGRAPHY, PDF_SPACING, formatCurrencyPdf, sanitizeTextPdf } from "../designSystem";
import { PUBLISHER } from "../../publisherConfig";
import { PdfHeader } from "./shared/PdfHeader";
import { PdfFooter } from "./shared/PdfFooter";
import { FeatureList } from "./shared/FeatureList";
import { PriceTablePeriod } from "./shared/PriceTablePeriod";

interface PremiumFixedNetPageProps {
  template: PdfTemplate;
  items: ProfessionalOfferPdfProps["items"];
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
  
  // Fixed net card
  fixedNetCard: {
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 6,
    marginBottom: 18,
    overflow: "hidden",
  },
  
  fixedNetCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#dcfce7", // Light green
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
  },
  
  fixedNetCardTitle: {
    fontSize: PDF_TYPOGRAPHY.h3,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
  },
  
  fixedNetCardSubtitle: {
    fontSize: PDF_TYPOGRAPHY.bodySmall,
    color: PDF_COLORS.textLight,
    marginTop: 2,
  },
  
  fixedNetCardPrice: {
    textAlign: "right",
  },
  
  priceLabel: {
    fontSize: PDF_TYPOGRAPHY.caption,
    color: PDF_COLORS.textLight,
  },
  
  priceValue: {
    fontSize: PDF_TYPOGRAPHY.h3,
    fontWeight: "bold",
    color: PDF_COLORS.success,
  },
  
  fixedNetCardBody: {
    padding: 15,
  },
  
  // Connection type badge
  typeBadge: {
    backgroundColor: PDF_COLORS.success + "20",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  
  typeBadgeText: {
    fontSize: PDF_TYPOGRAPHY.caption,
    color: PDF_COLORS.success,
    fontWeight: "bold",
  },
  
  // Specs row
  specsRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 15,
  },
  
  specItem: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 4,
  },
  
  specLabel: {
    fontSize: PDF_TYPOGRAPHY.caption,
    color: PDF_COLORS.textLight,
    marginBottom: 2,
  },
  
  specValue: {
    fontSize: PDF_TYPOGRAPHY.body,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
  },
  
  // UC licenses section
  ucSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
  },
  
  ucTitle: {
    fontSize: PDF_TYPOGRAPHY.bodySmall,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
    marginBottom: 8,
  },
  
  ucRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  
  ucLabel: {
    fontSize: PDF_TYPOGRAPHY.body,
    color: PDF_COLORS.text,
  },
  
  ucValue: {
    fontSize: PDF_TYPOGRAPHY.body,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
  },
  
  // Summary box
  summaryBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: PDF_COLORS.success + "10",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: PDF_COLORS.success,
  },
  
  summaryTitle: {
    fontSize: PDF_TYPOGRAPHY.h3,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
    marginBottom: 10,
  },
  
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  
  summaryLabel: {
    fontSize: PDF_TYPOGRAPHY.body,
    color: PDF_COLORS.text,
  },
  
  summaryValue: {
    fontSize: PDF_TYPOGRAPHY.body,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
  },
  
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: PDF_COLORS.success,
  },
  
  summaryTotalLabel: {
    fontSize: PDF_TYPOGRAPHY.h3,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
  },
  
  summaryTotalValue: {
    fontSize: PDF_TYPOGRAPHY.h3,
    fontWeight: "bold",
    color: PDF_COLORS.success,
  },
  
  // Note box
  noteBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#dcfce7",
    borderLeftWidth: 4,
    borderLeftColor: PDF_COLORS.success,
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
});

// Default fixed net features
const FIXED_NET_FEATURES = {
  cable: [
    "Schnelles Kabel-Internet mit bis zu 1 Gbit/s",
    "Inklusive WLAN-Router mit neuester Technik",
    "Festnetz-Flat in alle deutschen Netze",
    "Professioneller Installationsservice",
  ],
  fiber: [
    "Glasfaser-Internet mit symmetrischen Geschwindigkeiten",
    "Ultraschnelle Uploads für Cloud-Dienste",
    "Zukunftssichere Infrastruktur",
    "Business-Router inklusive",
  ],
  dsl: [
    "Zuverlässiges DSL-Internet",
    "Inklusive WLAN-Router",
    "Festnetz-Flat inklusive",
    "Techniker-Installation optional",
  ],
  default: [
    "Business-Internet mit garantierter Bandbreite",
    "Hardware inklusive",
    "Festnetz-Telefonie optional",
    "Professioneller Support",
  ],
};

export function PremiumFixedNetPage({
  template,
  items,
  branding,
  pageNumber,
  totalPages,
}: PremiumFixedNetPageProps) {
  const displayName = branding?.companyName || template.publisherInfo.name;
  
  // Filter items with fixed net
  const fixedNetItems = items.filter(item => item.option.fixedNet.enabled);
  
  // Calculate totals
  const totalMonthly = fixedNetItems.reduce((acc, item) => {
    const fixedBase = item.result.breakdown.find(b => b.ruleId === "fixed_base");
    return acc + (fixedBase?.net || 0);
  }, 0);
  
  // Build period table data
  const periods: PeriodColumn[] = [
    { header: "Monatlich", fromMonth: 1, toMonth: 24 },
  ];
  
  const rows: PositionRow[] = fixedNetItems.map(item => {
    const fixedBase = item.result.breakdown.find(b => b.ruleId === "fixed_base");
    const accessType = item.option.fixedNet.accessType || "Internet";
    const productName = fixedBase?.label || `${accessType} Business`;
    
    return {
      label: productName,
      monthlyByPeriod: [fixedBase?.net || 0],
    };
  });
  
  // Add discounts
  fixedNetItems.forEach(item => {
    const discounts = item.result.breakdown.filter(b => 
      b.appliesTo === "monthly" && b.net < 0 && b.ruleId?.includes("fixed")
    );
    
    discounts.forEach(discount => {
      rows.push({
        label: `   ${discount.label}`,
        monthlyByPeriod: [discount.net],
        isDiscount: true,
      });
    });
  });
  
  // Add total
  rows.push({
    label: "Gesamt Festnetz",
    monthlyByPeriod: [totalMonthly],
    isTotal: true,
  });
  
  const primaryColor = branding?.primaryColor || template.primaryColor;
  const accentColor = template.accentColor;
  
  return (
    <Page size="A4" style={styles.page}>
      <PdfHeader
        branding={branding}
        publisherSubline={PUBLISHER.subline}
        primaryColor={primaryColor}
        title="Festnetz & Internet"
      />
      
      {/* Section Title */}
      <Text style={styles.sectionTitle}>Ihre Festnetz-Produkte</Text>
      <Text style={styles.sectionSubtitle}>
        Business-Internet und Kommunikationslösungen | Mindestlaufzeit: 24 Monate
      </Text>
      
      {/* Fixed Net Cards */}
      {fixedNetItems.map((item, idx) => {
        const { option, result } = item;
        const fixedBase = result.breakdown.find(b => b.ruleId === "fixed_base");
        const accessType = option.fixedNet.accessType || "internet";
        const productName = fixedBase?.label || `${accessType} Business`;
        const monthlyPrice = fixedBase?.net || 0;
        
        // Get features based on access type
        const accessKey = accessType.toLowerCase() as keyof typeof FIXED_NET_FEATURES;
        const features = FIXED_NET_FEATURES[accessKey] || FIXED_NET_FEATURES.default;
        
        // Get bandwidth if available (use default)
        const bandwidth = "100 Mbit/s";
        
        return (
          <View key={idx} style={styles.fixedNetCard}>
            <View style={styles.fixedNetCardHeader}>
              <View>
                <Text style={styles.fixedNetCardTitle}>{productName}</Text>
                <Text style={styles.fixedNetCardSubtitle}>
                  Geschäftskunden-Anschluss
                </Text>
              </View>
              <View style={styles.fixedNetCardPrice}>
                <Text style={styles.priceValue}>{formatCurrencyPdf(monthlyPrice)}</Text>
                <Text style={styles.priceLabel}>pro Monat</Text>
              </View>
            </View>
            
            <View style={styles.fixedNetCardBody}>
              {/* Connection type badge */}
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {accessType.toUpperCase()}
                </Text>
              </View>
              
              {/* Specs row */}
              <View style={styles.specsRow}>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Download</Text>
                  <Text style={styles.specValue}>{bandwidth}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Laufzeit</Text>
                  <Text style={styles.specValue}>24 Monate</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Einrichtung</Text>
                  <Text style={styles.specValue}>Inkl.</Text>
                </View>
              </View>
              
              {/* Features */}
              <FeatureList
                title="Leistungen inklusive:"
                items={features}
                checkColor={PDF_COLORS.success}
              />
              
              {/* UC licenses section removed - not in current FixedNetState */}
            </View>
          </View>
        );
      })}
      
      {/* Price Table */}
      {rows.length > 1 && (
        <View style={{ marginTop: 15 }}>
          <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Preisübersicht Festnetz</Text>
          <PriceTablePeriod
            periods={periods}
            rows={rows}
            showOneTimeColumn={false}
            primaryColor={primaryColor}
            accentColor={accentColor}
          />
        </View>
      )}
      
      {/* Note Box */}
      <View style={styles.noteBox}>
        <Text style={styles.noteTitle}>Hinweis zur Festnetz-Bestellung</Text>
        <Text style={styles.noteText}>
          Die Verfügbarkeit des gewünschten Anschlusses ist standortabhängig und wird nach Bestellung geprüft. 
          Hardware (Router, Telefon) wird kostenfrei bereitgestellt und bleibt Eigentum des Anbieters. 
          Bei Vertragsende ist die Hardware zurückzugeben.
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
