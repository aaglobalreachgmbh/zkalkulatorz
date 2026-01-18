// ============================================
// Premium Cover Page - O2/Vodafone Business Style
// Full-page gradient with headline, customer info, logo box
// Publisher: allenetze.de (NEVER Vodafone/O2)
// ============================================

import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { OfferCustomerInfo, PdfTemplate } from "../templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";
import { PDF_COLORS, PDF_TYPOGRAPHY, formatLongDatePdf, sanitizeTextPdf } from "../designSystem";
import { PUBLISHER } from "../../publisherConfig";

interface PremiumCoverPageProps {
  template: PdfTemplate;
  customer: OfferCustomerInfo;
  offerId: string;
  branding?: TenantBranding;
  pageNumber?: number;
  totalPages?: number;
}

function createStyles(primaryColor: string, accentColor: string) {
  return StyleSheet.create({
    page: {
      position: "relative",
    },
    
    // Gradient simulation - Navy to Blue
    gradientTop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "100%",
      backgroundColor: accentColor,
    },
    gradientOverlay: {
      position: "absolute",
      top: 0,
      right: 0,
      width: "60%",
      height: "100%",
      backgroundColor: "#2563eb",
      opacity: 0.4,
    },
    
    // Decorative bubbles (O2 style)
    bubblesContainer: {
      position: "absolute",
      top: 100,
      right: 40,
    },
    bubbleLarge: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: "rgba(255,255,255,0.08)",
      marginBottom: 20,
    },
    bubbleMedium: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(255,255,255,0.06)",
      marginLeft: 50,
      marginBottom: 15,
    },
    bubbleSmall: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: "rgba(255,255,255,0.05)",
      marginLeft: 20,
    },
    
    // Content container
    content: {
      flex: 1,
      padding: 50,
      justifyContent: "space-between",
    },
    
    // Header with logo box (top right)
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    partnerBadge: {
      paddingHorizontal: 15,
      paddingVertical: 8,
      backgroundColor: "rgba(255,255,255,0.12)",
      borderRadius: 4,
    },
    partnerText: {
      fontSize: 9,
      color: "#ffffff",
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    logoBox: {
      backgroundColor: "#ffffff",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 6,
      alignItems: "center",
    },
    logoImage: {
      width: 100,
      height: 45,
      objectFit: "contain",
    },
    logoFallback: {
      fontSize: 14,
      fontWeight: "bold",
      color: primaryColor,
    },
    
    // Main headline section (center)
    headlineSection: {
      marginTop: 80,
      paddingLeft: 20,
    },
    mainHeadlineContainer: {
      backgroundColor: "rgba(0,0,0,0.25)",
      paddingVertical: 25,
      paddingHorizontal: 35,
      borderRadius: 8,
      maxWidth: 450,
    },
    mainHeadline: {
      fontSize: PDF_TYPOGRAPHY.h1,
      fontWeight: "bold",
      color: "#ffffff",
      lineHeight: 1.15,
    },
    subHeadline: {
      fontSize: PDF_TYPOGRAPHY.h3 + 4,
      color: primaryColor,
      marginTop: 8,
      fontWeight: "bold",
    },
    
    // Customer info section (bottom left)
    customerSection: {
      marginTop: "auto",
      paddingLeft: 20,
    },
    customerLabel: {
      fontSize: 11,
      color: "#999999",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    customerName: {
      fontSize: 22,
      color: "#ffffff",
      fontWeight: "bold",
      marginBottom: 6,
    },
    customerAddress: {
      fontSize: 13,
      color: "#cccccc",
      lineHeight: 1.6,
    },
    
    // Footer with offer info
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginTop: 50,
      paddingTop: 25,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.2)",
    },
    footerBlock: {},
    footerLabel: {
      fontSize: 8,
      color: "#888888",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    footerValue: {
      fontSize: 14,
      color: "#ffffff",
      fontWeight: "bold",
      marginTop: 4,
    },
    footerRight: {
      textAlign: "right",
    },
    publisherNote: {
      fontSize: 8,
      color: "#666666",
      marginTop: 15,
    },
  });
}

export function PremiumCoverPage({
  template,
  customer,
  offerId,
  branding,
}: PremiumCoverPageProps) {
  const primaryColor = branding?.primaryColor || template.primaryColor;
  const accentColor = template.accentColor;
  const styles = createStyles(primaryColor, accentColor);
  
  const today = new Date();
  const formattedDate = formatLongDatePdf(today);
  
  const customerFullName = [customer.vorname, customer.nachname].filter(Boolean).join(" ");
  const customerAddress = [
    customer.strasse,
    `${customer.plz || ""} ${customer.ort || ""}`.trim(),
  ].filter(s => s && s.trim()).join("\n");
  
  // Display name for logo box - use tenant branding if available
  const displayName = branding?.companyName || PUBLISHER.displayName;
  
  return (
    <Page size="A4" style={styles.page}>
      {/* Gradient background layers */}
      <View style={styles.gradientTop} />
      <View style={styles.gradientOverlay} />
      
      {/* Decorative bubbles */}
      <View style={styles.bubblesContainer}>
        <View style={styles.bubbleLarge} />
        <View style={styles.bubbleMedium} />
        <View style={styles.bubbleSmall} />
      </View>
      
      <View style={styles.content}>
        {/* Header with logo box */}
        <View style={styles.header}>
          <View style={styles.partnerBadge}>
            <Text style={styles.partnerText}>Business Partner</Text>
          </View>
          
          <View style={styles.logoBox}>
            {branding?.logoUrl ? (
              <Image src={branding.logoUrl} style={styles.logoImage} />
            ) : (
              <Text style={styles.logoFallback}>{displayName}</Text>
            )}
          </View>
        </View>
        
        {/* Main headline */}
        <View style={styles.headlineSection}>
          <View style={styles.mainHeadlineContainer}>
            <Text style={styles.mainHeadline}>Top-Leistung zu</Text>
            <Text style={styles.subHeadline}>Top-Konditionen</Text>
          </View>
        </View>
        
        {/* Customer info */}
        <View style={styles.customerSection}>
          <Text style={styles.customerLabel}>Erstellt für:</Text>
          <Text style={styles.customerName}>
            {sanitizeTextPdf(customer.firma) || customerFullName || "Geschäftskunde"}
          </Text>
          {customerAddress && (
            <Text style={styles.customerAddress}>{customerAddress}</Text>
          )}
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBlock}>
            <Text style={styles.footerLabel}>Angebotsnummer</Text>
            <Text style={styles.footerValue}>{offerId}</Text>
          </View>
          <View style={[styles.footerBlock, styles.footerRight]}>
            <Text style={styles.footerLabel}>Datum</Text>
            <Text style={styles.footerValue}>{formattedDate}</Text>
          </View>
        </View>
        
        {/* Publisher note */}
        <Text style={styles.publisherNote}>
          {PUBLISHER.subline}
        </Text>
      </View>
    </Page>
  );
}
