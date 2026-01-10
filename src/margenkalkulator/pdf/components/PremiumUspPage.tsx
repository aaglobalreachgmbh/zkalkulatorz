// ============================================
// Premium USP Page - "Warum wir?" Benefits
// Trust badges, partner seals, value propositions
// ============================================

import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { PdfTemplate, PdfCompanySettings } from "../templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";

interface PremiumUspPageProps {
  template: PdfTemplate;
  branding?: TenantBranding;
  companySettings?: PdfCompanySettings;
  pageNumber: number;
  totalPages: number;
}

function createStyles(primaryColor: string, accentColor: string) {
  return StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: "Helvetica",
      fontSize: 9,
      backgroundColor: "#ffffff",
    },
    
    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 30,
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
    
    headerTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: accentColor,
    },
    
    // Main headline
    mainHeadline: {
      fontSize: 24,
      fontWeight: "bold",
      color: accentColor,
      textAlign: "center",
      marginBottom: 8,
    },
    
    mainSubheadline: {
      fontSize: 12,
      color: "#666666",
      textAlign: "center",
      marginBottom: 40,
    },
    
    // USP Grid
    uspGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: 40,
    },
    
    uspCard: {
      width: "48%",
      padding: 20,
      marginBottom: 15,
      backgroundColor: "#f8f9fa",
      borderRadius: 6,
      borderLeftWidth: 4,
      borderLeftColor: primaryColor,
    },
    
    uspIcon: {
      fontSize: 24,
      marginBottom: 10,
    },
    
    uspTitle: {
      fontSize: 12,
      fontWeight: "bold",
      color: accentColor,
      marginBottom: 6,
    },
    
    uspText: {
      fontSize: 9,
      color: "#333333",
      lineHeight: 1.5,
    },
    
    // Trust badges section
    badgesSection: {
      marginTop: 20,
      padding: 25,
      backgroundColor: primaryColor + "08",
      borderRadius: 8,
    },
    
    badgesTitle: {
      fontSize: 12,
      fontWeight: "bold",
      color: accentColor,
      textAlign: "center",
      marginBottom: 20,
    },
    
    badgesRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
    },
    
    badge: {
      alignItems: "center",
      width: 100,
    },
    
    badgeIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: primaryColor,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    
    badgeIconText: {
      fontSize: 20,
      color: "#ffffff",
    },
    
    badgeLabel: {
      fontSize: 8,
      color: "#666666",
      textAlign: "center",
    },
    
    // Partner highlight
    partnerSection: {
      marginTop: 30,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      backgroundColor: "#ffffff",
      borderWidth: 2,
      borderColor: primaryColor,
      borderRadius: 8,
    },
    
    partnerText: {
      fontSize: 11,
      color: accentColor,
      fontWeight: "bold",
      marginLeft: 15,
    },
    
    partnerLogo: {
      width: 80,
      height: 40,
      objectFit: "contain",
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
    
    pageNumber: {
      fontSize: 7,
      color: "#999999",
    },
  });
}

const USP_ITEMS = [
  {
    icon: "🎯",
    title: "Persönliche Beratung",
    text: "Ihr Ansprechpartner vor Ort kennt Ihre Anforderungen und findet die optimale Lösung für Ihr Business.",
  },
  {
    icon: "⚡",
    title: "Schnelle Umsetzung",
    text: "Von der Beratung bis zur Aktivierung: Wir kümmern uns um alles – schnell und unkompliziert.",
  },
  {
    icon: "💶",
    title: "Faire Konditionen",
    text: "Als Partner erhalten Sie exklusive Business-Konditionen, die Sie am freien Markt nicht finden.",
  },
  {
    icon: "🔧",
    title: "Rundum-Service",
    text: "Technischer Support, Vertragsverwaltung, Gerätetausch – wir sind auch nach dem Abschluss für Sie da.",
  },
];

const TRUST_BADGES = [
  { icon: "✓", label: "Autorisierter Partner" },
  { icon: "★", label: "Zertifizierter Fachhandel" },
  { icon: "🏆", label: "Top-Beratung" },
  { icon: "🔒", label: "Datenschutz garantiert" },
];

export function PremiumUspPage({
  template,
  branding,
  companySettings,
  pageNumber,
  totalPages,
}: PremiumUspPageProps) {
  const primaryColor = branding?.primaryColor || template.primaryColor;
  const accentColor = template.accentColor;
  const styles = createStyles(primaryColor, accentColor);
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
        <Text style={styles.headerTitle}>Ihre Vorteile</Text>
      </View>
      
      {/* Main headline */}
      <Text style={styles.mainHeadline}>Warum mit uns?</Text>
      <Text style={styles.mainSubheadline}>
        Als Ihr lokaler Partner bieten wir Ihnen mehr als nur einen Vertrag
      </Text>
      
      {/* USP Grid */}
      <View style={styles.uspGrid}>
        {USP_ITEMS.map((usp, idx) => (
          <View key={idx} style={styles.uspCard}>
            <Text style={styles.uspIcon}>{usp.icon}</Text>
            <Text style={styles.uspTitle}>{usp.title}</Text>
            <Text style={styles.uspText}>{usp.text}</Text>
          </View>
        ))}
      </View>
      
      {/* Trust badges */}
      <View style={styles.badgesSection}>
        <Text style={styles.badgesTitle}>Darauf können Sie sich verlassen</Text>
        <View style={styles.badgesRow}>
          {TRUST_BADGES.map((badge, idx) => (
            <View key={idx} style={styles.badge}>
              <View style={styles.badgeIcon}>
                <Text style={styles.badgeIconText}>{badge.icon}</Text>
              </View>
              <Text style={styles.badgeLabel}>{badge.label}</Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Partner highlight */}
      <View style={styles.partnerSection}>
        {branding?.logoUrl && (
          <Image src={branding.logoUrl} style={styles.partnerLogo} />
        )}
        <Text style={styles.partnerText}>
          Ihr offizieller Business Partner
        </Text>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            {template.publisherInfo.subline}
          </Text>
          <Text style={styles.pageNumber}>Seite {pageNumber} von {totalPages}</Text>
        </View>
      </View>
    </Page>
  );
}
