// ============================================
// Premium Contact Page - O2 Business Style
// Dealer contact card with blue footer + Impressum
// Publisher: allenetze.de (NEVER Vodafone/O2)
// ============================================

import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ProfessionalOfferPdfProps } from "../templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";
import { PDF_COLORS, PDF_TYPOGRAPHY, formatDatePdf } from "../designSystem";
import { PUBLISHER } from "../../publisherConfig";

interface PremiumContactPageProps {
  template: ProfessionalOfferPdfProps["template"];
  contact?: ProfessionalOfferPdfProps["contact"];
  options: ProfessionalOfferPdfProps["options"];
  offerId: string;
  branding?: TenantBranding;
  pageNumber: number;
  totalPages: number;
}

function createStyles(primaryColor: string, accentColor: string) {
  return StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 9,
      backgroundColor: "#ffffff",
    },
    content: {
      flex: 1,
      padding: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    headline: {
      fontSize: 26,
      fontWeight: "bold",
      color: accentColor,
      textAlign: "center",
      marginBottom: 10,
    },
    subheadline: {
      fontSize: 14,
      color: PDF_COLORS.textMuted,
      textAlign: "center",
      marginBottom: 40,
    },
    contactCard: {
      width: 340,
      padding: 30,
      backgroundColor: "#ffffff",
      borderWidth: 2,
      borderColor: primaryColor,
      borderRadius: 10,
      alignItems: "center",
    },
    logoContainer: {
      width: 90,
      height: 55,
      marginBottom: 18,
    },
    logoImage: {
      width: "100%",
      height: "100%",
      objectFit: "contain",
    },
    contactName: {
      fontSize: 18,
      fontWeight: "bold",
      color: accentColor,
      marginBottom: 4,
    },
    contactCompany: {
      fontSize: 11,
      color: PDF_COLORS.textMuted,
      marginBottom: 18,
    },
    contactDivider: {
      width: 70,
      height: 3,
      backgroundColor: primaryColor,
      marginVertical: 18,
      borderRadius: 2,
    },
    contactDetail: {
      flexDirection: "row",
      marginBottom: 8,
    },
    contactIcon: {
      width: 22,
      fontSize: 12,
      color: primaryColor,
    },
    contactText: {
      fontSize: 11,
      color: PDF_COLORS.text,
    },
    validitySection: {
      marginTop: 40,
      padding: 22,
      backgroundColor: primaryColor + "12",
      borderRadius: 8,
      width: "100%",
      maxWidth: 420,
      alignItems: "center",
    },
    validityTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: accentColor,
      marginBottom: 6,
    },
    validityText: {
      fontSize: 14,
      fontWeight: "bold",
      color: primaryColor,
    },
    footerSection: {
      backgroundColor: primaryColor,
      padding: 35,
      alignItems: "center",
    },
    footerHeadline: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#ffffff",
      textAlign: "center",
      marginBottom: 10,
    },
    footerSubline: {
      fontSize: 12,
      color: "#ffffff",
      textAlign: "center",
      opacity: 0.9,
    },
    impressumSection: {
      marginTop: 25,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.25)",
      alignItems: "center",
    },
    impressumTitle: {
      fontSize: 9,
      color: "rgba(255,255,255,0.7)",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    impressumText: {
      fontSize: 8,
      color: "rgba(255,255,255,0.65)",
      textAlign: "center",
      lineHeight: 1.5,
    },
    publisherRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 20,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.2)",
    },
    publisherText: {
      fontSize: 8,
      color: "rgba(255,255,255,0.6)",
    },
    pageNumberRow: {
      position: "absolute",
      bottom: 12,
      right: 25,
    },
    pageNumber: {
      fontSize: 8,
      color: "rgba(255,255,255,0.6)",
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
      <View style={styles.content}>
        <Text style={styles.headline}>Alles aus einer Hand</Text>
        <Text style={styles.subheadline}>Von der Beratung bis zum Abschluss – immer für Sie da</Text>
        
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
        
        <View style={styles.validitySection}>
          <Text style={styles.validityTitle}>Angebot {offerId}</Text>
          <Text style={styles.validityText}>Gültig bis: {formatDatePdf(validUntil)}</Text>
        </View>
      </View>
      
      <View style={styles.footerSection}>
        <Text style={styles.footerHeadline}>Gemeinsam mehr erreichen</Text>
        <Text style={styles.footerSubline}>Ihr Partner für Business-Kommunikation</Text>
        
        {/* IMPRESSUM Section */}
        <View style={styles.impressumSection}>
          <Text style={styles.impressumTitle}>Impressum</Text>
          <Text style={styles.impressumText}>
            {PUBLISHER.name}{"\n"}
            {PUBLISHER.address.street}, {PUBLISHER.address.zipCity}{"\n"}
            USt-IdNr.: {PUBLISHER.vatId}
          </Text>
        </View>
        
        <View style={styles.publisherRow}>
          <Text style={styles.publisherText}>
            Erstellt mit {template.publisherInfo.name} | {template.publisherInfo.website}
          </Text>
        </View>
      </View>
      
      <View style={styles.pageNumberRow}>
        <Text style={styles.pageNumber}>Seite {pageNumber} von {totalPages}</Text>
      </View>
    </Page>
  );
}
