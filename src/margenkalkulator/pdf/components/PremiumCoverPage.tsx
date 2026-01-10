// ============================================
// Premium Cover Page Component - O2 Business Style
// Full-page lifestyle image with overlay
// ============================================

import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { OfferCustomerInfo, PdfTemplate } from "../templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";

interface PremiumCoverPageProps {
  template: PdfTemplate;
  customer: OfferCustomerInfo;
  offerId: string;
  branding?: TenantBranding;
}

function createStyles(primaryColor: string, accentColor: string) {
  return StyleSheet.create({
    page: {
      position: "relative",
      backgroundColor: accentColor,
    },
    
    // Gradient overlay simulation
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: accentColor,
      opacity: 0.85,
    },
    
    // Content container
    content: {
      flex: 1,
      padding: 60,
      justifyContent: "space-between",
    },
    
    // Header with logos
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    
    logoContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    
    logoImage: {
      width: 80,
      height: 50,
      objectFit: "contain",
    },
    
    partnerBadge: {
      marginLeft: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 4,
    },
    
    partnerText: {
      fontSize: 8,
      color: "#ffffff",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    
    // Main headline section
    headlineSection: {
      alignItems: "center",
      marginTop: 100,
    },
    
    mainHeadline: {
      fontSize: 42,
      fontWeight: "bold",
      color: "#ffffff",
      textAlign: "center",
      lineHeight: 1.2,
    },
    
    subHeadline: {
      fontSize: 28,
      color: primaryColor,
      textAlign: "center",
      marginTop: 10,
    },
    
    // Decorative bubbles (O2 style)
    bubblesContainer: {
      position: "absolute",
      top: 150,
      right: 50,
      opacity: 0.3,
    },
    
    bubble: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: primaryColor,
      marginBottom: 20,
    },
    
    bubbleSmall: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: primaryColor,
      marginLeft: 30,
    },
    
    // Customer info section
    customerSection: {
      marginTop: "auto",
      paddingTop: 40,
    },
    
    customerLabel: {
      fontSize: 12,
      color: "#999999",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    
    customerName: {
      fontSize: 20,
      color: "#ffffff",
      fontWeight: "bold",
      marginBottom: 4,
    },
    
    customerAddress: {
      fontSize: 12,
      color: "#cccccc",
      lineHeight: 1.5,
    },
    
    // Footer with offer ID
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginTop: 40,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.2)",
    },
    
    offerIdSection: {},
    
    offerIdLabel: {
      fontSize: 8,
      color: "#999999",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    
    offerIdValue: {
      fontSize: 12,
      color: "#ffffff",
      fontWeight: "bold",
      marginTop: 4,
    },
    
    dateSection: {
      textAlign: "right",
    },
    
    dateLabel: {
      fontSize: 8,
      color: "#999999",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    
    dateValue: {
      fontSize: 12,
      color: "#ffffff",
      marginTop: 4,
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
  const formattedDate = today.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  
  const displayName = branding?.companyName || template.publisherInfo.name;
  const customerFullName = [customer.vorname, customer.nachname].filter(Boolean).join(" ");
  const customerAddress = [customer.strasse, `${customer.plz} ${customer.ort}`]
    .filter(s => s && s.trim())
    .join("\n");
  
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.overlay} />
      
      <View style={styles.content}>
        {/* Header with logos */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {branding?.logoUrl && (
              <Image src={branding.logoUrl} style={styles.logoImage} />
            )}
            <View style={styles.partnerBadge}>
              <Text style={styles.partnerText}>Business Partner</Text>
            </View>
          </View>
        </View>
        
        {/* Main headline */}
        <View style={styles.headlineSection}>
          <Text style={styles.mainHeadline}>Top-Leistung zu</Text>
          <Text style={styles.subHeadline}>Top-Konditionen</Text>
        </View>
        
        {/* Customer info */}
        <View style={styles.customerSection}>
          <Text style={styles.customerLabel}>Erstellt für:</Text>
          <Text style={styles.customerName}>
            {customer.firma || customerFullName || "Geschäftskunde"}
          </Text>
          {customerAddress && (
            <Text style={styles.customerAddress}>{customerAddress}</Text>
          )}
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.offerIdSection}>
            <Text style={styles.offerIdLabel}>Angebotsnummer</Text>
            <Text style={styles.offerIdValue}>{offerId}</Text>
          </View>
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>Datum</Text>
            <Text style={styles.dateValue}>{formattedDate}</Text>
          </View>
        </View>
      </View>
    </Page>
  );
}
