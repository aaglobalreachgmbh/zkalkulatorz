// ============================================
// Premium Detail Page - O2 Business Style
// Tariff features with checkmarks, hardware images
// ============================================

import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ProfessionalOfferPdfProps } from "../templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";
import { formatCurrency as formatCurrencyBase } from "../../lib/formatters";

interface PremiumDetailPageProps {
  template: ProfessionalOfferPdfProps["template"];
  items: ProfessionalOfferPdfProps["items"];
  hardwareImages?: Map<string, string>;
  branding?: TenantBranding;
  pageNumber: number;
  totalPages: number;
}

// PDF-specific currency formatting
function formatCurrency(value: number | undefined | null): string {
  const num = value ?? 0;
  if (isNaN(num)) return "0,00 €";
  return formatCurrencyBase(num);
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
      paddingBottom: 12,
      borderBottomWidth: 2,
      borderBottomColor: primaryColor,
    },
    
    logoSection: {
      flexDirection: "row",
      alignItems: "center",
    },
    
    logoImage: {
      width: 45,
      height: 30,
      marginRight: 8,
      objectFit: "contain",
    },
    
    logoText: {
      fontSize: 12,
      fontWeight: "bold",
      color: primaryColor,
    },
    
    logoSubtext: {
      fontSize: 6,
      color: "#666666",
      marginTop: 1,
    },
    
    headerRight: {
      textAlign: "right",
    },
    
    headerTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: accentColor,
    },
    
    // Section title
    sectionTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: primaryColor,
      marginBottom: 8,
      marginTop: 15,
    },
    
    sectionSubtitle: {
      fontSize: 8,
      color: "#666666",
      marginTop: -6,
      marginBottom: 12,
    },
    
    // Detail card (O2 style)
    detailCard: {
      borderWidth: 1,
      borderColor: "#e5e5e5",
      borderRadius: 4,
      marginBottom: 15,
      overflow: "hidden",
    },
    
    detailCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      backgroundColor: primaryColor + "10",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e5e5",
    },
    
    detailCardTitle: {
      fontSize: 12,
      fontWeight: "bold",
      color: accentColor,
    },
    
    detailCardSubtitle: {
      fontSize: 8,
      color: "#666666",
      marginTop: 2,
    },
    
    detailCardPrice: {
      textAlign: "right",
    },
    
    priceStrikethrough: {
      fontSize: 9,
      color: "#999999",
      textDecoration: "line-through",
    },
    
    priceNew: {
      fontSize: 14,
      fontWeight: "bold",
      color: primaryColor,
    },
    
    priceLabel: {
      fontSize: 7,
      color: "#666666",
    },
    
    detailCardBody: {
      padding: 12,
    },
    
    // Feature list with checkmarks
    featureList: {
      marginTop: 8,
    },
    
    featureTitle: {
      fontSize: 9,
      fontWeight: "bold",
      color: accentColor,
      marginBottom: 6,
    },
    
    featureItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 4,
    },
    
    featureCheck: {
      width: 14,
      fontSize: 10,
      color: primaryColor,
      fontWeight: "bold",
    },
    
    featureText: {
      flex: 1,
      fontSize: 8,
      color: "#333333",
      lineHeight: 1.3,
    },
    
    // Promo badge
    promoBadge: {
      backgroundColor: primaryColor,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 3,
      marginTop: 10,
      alignSelf: "flex-start",
    },
    
    promoBadgeText: {
      fontSize: 7,
      color: "#ffffff",
      fontWeight: "bold",
    },
    
    // Hardware section
    hardwareCard: {
      borderWidth: 1,
      borderColor: "#e5e5e5",
      borderRadius: 4,
      marginBottom: 15,
      padding: 12,
    },
    
    hardwareRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    
    hardwareImage: {
      width: 70,
      height: 90,
      marginRight: 15,
      objectFit: "contain",
      backgroundColor: "#f8f9fa",
      borderRadius: 4,
    },
    
    hardwareInfo: {
      flex: 1,
    },
    
    hardwareName: {
      fontSize: 12,
      fontWeight: "bold",
      color: accentColor,
    },
    
    hardwareSpecs: {
      fontSize: 8,
      color: "#666666",
      marginTop: 4,
    },
    
    hardwareFinancing: {
      marginTop: 8,
      padding: 8,
      backgroundColor: "#f8f9fa",
      borderRadius: 3,
    },
    
    hardwareFinancingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    
    hardwareFinancingLabel: {
      fontSize: 8,
      color: "#666666",
    },
    
    hardwareFinancingValue: {
      fontSize: 8,
      fontWeight: "bold",
      color: accentColor,
    },
    
    // Fixed net section
    fixedNetCard: {
      borderWidth: 1,
      borderColor: "#e5e5e5",
      borderRadius: 4,
      marginBottom: 15,
      padding: 12,
      backgroundColor: "#f0fdf4",
    },
    
    // Publisher badge
    publisherBadge: {
      marginTop: 20,
      padding: 10,
      backgroundColor: "#f8f9fa",
      borderRadius: 4,
      alignItems: "center",
    },
    
    publisherText: {
      fontSize: 7,
      color: "#666666",
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
  });
}

// Default mobile features
const DEFAULT_MOBILE_FEATURES = [
  "Unbegrenztes Datenvolumen mit 5G",
  "Allnet-Flat: Telefonie & SMS in alle dt. Netze",
  "EU-Roaming inklusive",
  "MultiSIM Option verfügbar",
  "Kostenlose Mailbox",
];

export function PremiumDetailPage({
  template,
  items,
  hardwareImages,
  branding,
  pageNumber,
  totalPages,
}: PremiumDetailPageProps) {
  const primaryColor = branding?.primaryColor || template.primaryColor;
  const accentColor = template.accentColor;
  const styles = createStyles(primaryColor, accentColor);
  const displayName = branding?.companyName || template.publisherInfo.name;
  
  const hasHardware = items.some(item => item.option.hardware.ekNet > 0);
  const hasFixedNet = items.some(item => item.option.fixedNet.enabled);
  
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
          <Text style={styles.headerTitle}>Angebotsdetails</Text>
        </View>
      </View>
      
      {/* Mobile Section */}
      <Text style={styles.sectionTitle}>1. Mobilfunkverträge</Text>
      <Text style={styles.sectionSubtitle}>(Mindestvertragslaufzeit: 24 Monate)</Text>
      
      {items.map((item, idx) => {
        const { option, result } = item;
        const tariffBase = result.breakdown.find(b => b.ruleId === "base");
        const tariffName = tariffBase?.label?.replace(" Grundpreis", "") || "Mobilfunk-Tarif";
        const contractType = option.mobile.contractType === "new" ? "Neuvertrag" : "Verlängerung";
        
        return (
          <View key={idx} style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View>
                <Text style={styles.detailCardTitle}>{tariffName}</Text>
                <Text style={styles.detailCardSubtitle}>
                  {option.mobile.quantity}x {contractType}
                </Text>
              </View>
              <View style={styles.detailCardPrice}>
                <Text style={styles.priceNew}>
                  {formatCurrency(result.totals.avgTermNet)}
                </Text>
                <Text style={styles.priceLabel}>pro Monat / Vertrag</Text>
              </View>
            </View>
            
            <View style={styles.detailCardBody}>
              <View style={styles.featureList}>
                <Text style={styles.featureTitle}>Im Tarif inklusive:</Text>
                {DEFAULT_MOBILE_FEATURES.map((feature, i) => (
                  <View key={i} style={styles.featureItem}>
                    <Text style={styles.featureCheck}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              
              {/* Promo badge if discounts apply */}
              {result.breakdown.some(b => b.net < 0) && (
                <View style={styles.promoBadge}>
                  <Text style={styles.promoBadgeText}>
                    Aktionsrabatt inkl.
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
      
      {/* Hardware Section */}
      {hasHardware && (
        <>
          <Text style={styles.sectionTitle}>2. Hardware-Finanzierung</Text>
          <Text style={styles.sectionSubtitle}>(Finanzierungszeitraum: 24 Monate)</Text>
          
          {items.filter(item => item.option.hardware.ekNet > 0).map((item, idx) => {
            const { option } = item;
            const hwName = sanitizeText(option.hardware.name) || "Gerät";
            const hwMonthly = option.hardware.amortize 
              ? option.hardware.ekNet / (option.hardware.amortMonths || 24)
              : 0;
            const hwTotal = option.hardware.ekNet * option.mobile.quantity;
            
            return (
              <View key={idx} style={styles.hardwareCard}>
                <View style={styles.hardwareRow}>
                  <View style={styles.hardwareImage}>
                    {/* Placeholder for hardware image */}
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                      <Text style={{ fontSize: 8, color: "#999" }}>📱</Text>
                    </View>
                  </View>
                  <View style={styles.hardwareInfo}>
                    <Text style={styles.hardwareName}>{hwName}</Text>
                    <Text style={styles.hardwareSpecs}>
                      Anzahl: {option.mobile.quantity} Stück
                    </Text>
                    
                    <View style={styles.hardwareFinancing}>
                      <View style={styles.hardwareFinancingRow}>
                        <Text style={styles.hardwareFinancingLabel}>Monatliche Rate:</Text>
                        <Text style={styles.hardwareFinancingValue}>
                          {formatCurrency(hwMonthly)} × 24 Monate
                        </Text>
                      </View>
                      <View style={styles.hardwareFinancingRow}>
                        <Text style={styles.hardwareFinancingLabel}>Gesamtpreis (alle Geräte):</Text>
                        <Text style={styles.hardwareFinancingValue}>
                          {formatCurrency(hwTotal)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      )}
      
      {/* Fixed Net Section */}
      {hasFixedNet && (
        <>
          <Text style={styles.sectionTitle}>{hasHardware ? "3" : "2"}. Festnetz & Internet</Text>
          
          {items.filter(item => item.option.fixedNet.enabled).map((item, idx) => {
            const { option, result } = item;
            const fixedBase = result.breakdown.find(b => b.ruleId === "fixed_base");
            const fixedName = fixedBase?.label || `${option.fixedNet.accessType} Internet`;
            const fixedMonthly = fixedBase?.net || 0;
            
            return (
              <View key={idx} style={styles.fixedNetCard}>
                <View style={styles.detailCardHeader}>
                  <View>
                    <Text style={styles.detailCardTitle}>{fixedName}</Text>
                    <Text style={styles.detailCardSubtitle}>
                      {option.fixedNet.accessType || "Festnetz"}
                    </Text>
                  </View>
                  <View style={styles.detailCardPrice}>
                    <Text style={styles.priceNew}>
                      {formatCurrency(fixedMonthly)}
                    </Text>
                    <Text style={styles.priceLabel}>pro Monat</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      )}
      
      {/* Publisher badge */}
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
