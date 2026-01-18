// ============================================
// Premium USP Page - "Warum wir?" Benefits
// Trust badges, partner seals, value propositions
// Publisher: allenetze.de
// ============================================

import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { PdfTemplate, PdfCompanySettings } from "../templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";
import { PDF_COLORS, PDF_TYPOGRAPHY, PDF_SPACING } from "../designSystem";
import { PUBLISHER } from "../../publisherConfig";
import { PdfHeader } from "./shared/PdfHeader";
import { PdfFooter } from "./shared/PdfFooter";

interface PremiumUspPageProps {
  template: PdfTemplate;
  branding?: TenantBranding;
  companySettings?: PdfCompanySettings;
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
  
  // Main headline
  mainHeadline: {
    fontSize: 24,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 8,
  },
  
  mainSubheadline: {
    fontSize: 12,
    color: PDF_COLORS.textLight,
    textAlign: "center",
    marginBottom: 35,
  },
  
  // USP Grid
  uspGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  
  uspCard: {
    width: "48%",
    padding: 18,
    marginBottom: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: PDF_COLORS.primary,
  },
  
  uspIcon: {
    fontSize: 24,
    marginBottom: 10,
  },
  
  uspTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
    marginBottom: 6,
  },
  
  uspText: {
    fontSize: PDF_TYPOGRAPHY.body,
    color: PDF_COLORS.text,
    lineHeight: 1.5,
  },
  
  // Trust badges section
  badgesSection: {
    marginTop: 10,
    padding: 20,
    backgroundColor: PDF_COLORS.primary + "08",
    borderRadius: 8,
  },
  
  badgesTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
    textAlign: "center",
    marginBottom: 18,
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
    backgroundColor: PDF_COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  
  badgeIconText: {
    fontSize: 20,
    color: "#ffffff",
  },
  
  badgeLabel: {
    fontSize: PDF_TYPOGRAPHY.bodySmall,
    color: PDF_COLORS.textLight,
    textAlign: "center",
  },
  
  // Partner highlight
  partnerSection: {
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: PDF_COLORS.primary,
    borderRadius: 8,
  },
  
  partnerText: {
    fontSize: 11,
    color: PDF_COLORS.accent,
    fontWeight: "bold",
    marginLeft: 15,
  },
  
  partnerLogo: {
    width: 80,
    height: 40,
    objectFit: "contain",
  },
  
  // Publisher info
  publisherInfo: {
    marginTop: 25,
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    alignItems: "center",
  },
  
  publisherName: {
    fontSize: 10,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
    marginBottom: 4,
  },
  
  publisherAddress: {
    fontSize: PDF_TYPOGRAPHY.bodySmall,
    color: PDF_COLORS.textLight,
    textAlign: "center",
  },
});

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
  const displayName = branding?.companyName || template.publisherInfo.name;

  const primaryColor = branding?.primaryColor || template.primaryColor;
  
  return (
    <Page size="A4" style={styles.page}>
      <PdfHeader
        branding={branding}
        publisherSubline={PUBLISHER.subline}
        primaryColor={primaryColor}
        title="Ihre Vorteile"
      />
      
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
      
      {/* Publisher info */}
      <View style={styles.publisherInfo}>
        <Text style={styles.publisherName}>{PUBLISHER.name}</Text>
        <Text style={styles.publisherAddress}>
          {PUBLISHER.address.street} | {PUBLISHER.address.zipCity}
        </Text>
      </View>
      
      <PdfFooter
        publisherSubline={PUBLISHER.subline}
        pageNumber={pageNumber}
        totalPages={totalPages}
        showVatNotice={false}
      />
    </Page>
  );
}
