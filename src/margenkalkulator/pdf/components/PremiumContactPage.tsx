// ============================================
// Premium Contact Page - O2 Business Style
// Dealer contact card with blue footer
// ============================================

import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ProfessionalOfferPdfProps } from "../templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";

interface PremiumContactPageProps {
  template: ProfessionalOfferPdfProps["template"];
  contact?: ProfessionalOfferPdfProps["contact"];
  options: ProfessionalOfferPdfProps["options"];
  offerId: string;
  branding?: TenantBranding;
  pageNumber: number;
  totalPages: number;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function createStyles(primaryColor: string, accentColor: string) {
  return StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 9,
      backgroundColor: "#ffffff",
    },
    
    // Main content area
    content: {
      flex: 1,
      padding: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    
    // Headline
    headline: {
      fontSize: 24,
      fontWeight: "bold",
      color: accentColor,
      textAlign: "center",
      marginBottom: 10,
    },
    
    subheadline: {
      fontSize: 14,
      color: "#666666",
      textAlign: "center",
      marginBottom: 40,
    },
    
    // Contact card
    contactCard: {
      width: 320,
      padding: 25,
      backgroundColor: "#ffffff",
      borderWidth: 2,
      borderColor: primaryColor,
      borderRadius: 8,
      alignItems: "center",
    },
    
    logoContainer: {
      width: 80,
      height: 50,
      marginBottom: 15,
    },
    
    logoImage: {
      width: "100%",
      height: "100%",
      objectFit: "contain",
    },
    
    contactName: {
      fontSize: 16,
      fontWeight: "bold",
      color: accentColor,
      marginBottom: 4,
    },
    
    contactCompany: {
      fontSize: 10,
      color: "#666666",
      marginBottom: 15,
    },
    
    contactDivider: {
      width: 60,
      height: 2,
      backgroundColor: primaryColor,
      marginVertical: 15,
    },
    
    contactDetail: {
      flexDirection: "row",
      marginBottom: 6,
    },
    
    contactIcon: {
      width: 18,
      fontSize: 10,
      color: primaryColor,
    },
    
    contactText: {
      fontSize: 10,
      color: "#333333",
    },
    
    // Validity section
    validitySection: {
      marginTop: 40,
      padding: 20,
      backgroundColor: primaryColor + "15",
      borderRadius: 6,
      width: "100%",
      maxWidth: 400,
      alignItems: "center",
    },
    
    validityTitle: {
      fontSize: 10,
      fontWeight: "bold",
      color: accentColor,
      marginBottom: 5,
    },
    
    validityText: {
      fontSize: 12,
      fontWeight: "bold",
      color: primaryColor,
    },
    
    // Blue footer section
    footerSection: {
      backgroundColor: primaryColor,
      padding: 30,
      alignItems: "center",
    },
    
    footerHeadline: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#ffffff",
      textAlign: "center",
      marginBottom: 8,
    },
    
    footerSubline: {
      fontSize: 11,
      color: "#ffffff",
      textAlign: "center",
      opacity: 0.9,
    },
    
    // Publisher section
    publisherRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 15,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.3)",
    },
    
    publisherText: {
      fontSize: 8,
      color: "rgba(255,255,255,0.7)",
    },
    
    // Page number
    pageNumberRow: {
      position: "absolute",
      bottom: 10,
      right: 20,
    },
    
    pageNumber: {
      fontSize: 8,
      color: "rgba(255,255,255,0.7)",
    },
  });
}

export function PremiumContactPage({
  template,
  contact,
  options,
  offerId,
  branding,
  pageNumber,
  totalPages,
}: PremiumContactPageProps) {
  const primaryColor = branding?.primaryColor || template.primaryColor;
  const accentColor = template.accentColor;
  const styles = createStyles(primaryColor, accentColor);
  
  const displayName = branding?.companyName || template.publisherInfo.name;
  const today = new Date();
  const validUntil = new Date(today.getTime() + options.validDays * 24 * 60 * 60 * 1000);
  
  return (
    <Page size="A4" style={styles.page}>
      {/* Main content */}
      <View style={styles.content}>
        <Text style={styles.headline}>Alles aus einer Hand</Text>
        <Text style={styles.subheadline}>Von der Beratung bis zum Abschluss – immer für Sie da</Text>
        
        {/* Contact card */}
        <View style={styles.contactCard}>
          {branding?.logoUrl && (
            <View style={styles.logoContainer}>
              <Image src={branding.logoUrl} style={styles.logoImage} />
            </View>
          )}
          
          <Text style={styles.contactName}>{contact?.name || "Vertriebsteam"}</Text>
          <Text style={styles.contactCompany}>{contact?.company || displayName}</Text>
          
          <View style={styles.contactDivider} />
          
          {contact?.phone && (
            <View style={styles.contactDetail}>
              <Text style={styles.contactIcon}>☎</Text>
              <Text style={styles.contactText}>{contact.phone}</Text>
            </View>
          )}
          
          {contact?.email && (
            <View style={styles.contactDetail}>
              <Text style={styles.contactIcon}>✉</Text>
              <Text style={styles.contactText}>{contact.email}</Text>
            </View>
          )}
        </View>
        
        {/* Validity */}
        <View style={styles.validitySection}>
          <Text style={styles.validityTitle}>Angebot {offerId}</Text>
          <Text style={styles.validityText}>
            Gültig bis: {formatDate(validUntil)}
          </Text>
        </View>
      </View>
      
      {/* Blue footer */}
      <View style={styles.footerSection}>
        <Text style={styles.footerHeadline}>Gemeinsam mehr erreichen</Text>
        <Text style={styles.footerSubline}>
          Ihr Partner für Business-Kommunikation
        </Text>
        
        <View style={styles.publisherRow}>
          <Text style={styles.publisherText}>
            Erstellt mit {template.publisherInfo.name} | {template.publisherInfo.website}
          </Text>
        </View>
      </View>
      
      {/* Page number */}
      <View style={styles.pageNumberRow}>
        <Text style={styles.pageNumber}>Seite {pageNumber} von {totalPages}</Text>
      </View>
    </Page>
  );
}
