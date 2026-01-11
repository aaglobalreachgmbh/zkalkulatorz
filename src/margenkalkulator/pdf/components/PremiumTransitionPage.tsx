// ============================================
// Premium Transition Page - O2 Business Style
// Full-page gradient with "Details" headline
// Publisher: allenetze.de (NEVER Vodafone/O2)
// ============================================

import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { PdfTemplate } from "../templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";
import { PUBLISHER } from "../../publisherConfig";

interface PremiumTransitionPageProps {
  template: PdfTemplate;
  branding?: TenantBranding;
  title?: string;
  subtitle?: string;
  pageNumber: number;
  totalPages: number;
}

function createStyles(primaryColor: string, accentColor: string) {
  return StyleSheet.create({
    page: {
      position: "relative",
      fontFamily: "Helvetica",
    },
    
    // Gradient background (simulated with colored sections)
    backgroundTop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "55%",
      backgroundColor: primaryColor,
    },
    backgroundBottom: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "45%",
      backgroundColor: accentColor,
    },
    
    // Decorative circles (O2 bubble style)
    bubbleContainer: {
      position: "absolute",
      top: 50,
      right: 50,
    },
    bubbleLarge: {
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: "rgba(255,255,255,0.1)",
    },
    bubbleMedium: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(255,255,255,0.08)",
      marginTop: 20,
      marginLeft: 60,
    },
    bubbleSmall: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.06)",
      marginTop: 15,
      marginLeft: 30,
    },
    
    // Main content
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 60,
    },
    
    // Arrow icon
    arrowContainer: {
      marginBottom: 40,
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(255,255,255,0.15)",
      justifyContent: "center",
      alignItems: "center",
    },
    arrow: {
      fontSize: 40,
      color: "#ffffff",
    },
    
    // Headline
    headline: {
      fontSize: 38,
      fontWeight: "bold",
      color: "#ffffff",
      textAlign: "center",
      marginBottom: 20,
    },
    
    subtitle: {
      fontSize: 16,
      color: "rgba(255,255,255,0.85)",
      textAlign: "center",
      maxWidth: 420,
      lineHeight: 1.6,
    },
    
    // Decorative line
    divider: {
      width: 100,
      height: 4,
      backgroundColor: "#ffffff",
      opacity: 0.4,
      marginTop: 40,
      borderRadius: 2,
    },
    
    // Footer
    footer: {
      position: "absolute",
      bottom: 30,
      left: 0,
      right: 0,
      alignItems: "center",
    },
    publisherNote: {
      fontSize: 8,
      color: "rgba(255,255,255,0.5)",
      marginBottom: 8,
    },
    pageNumber: {
      fontSize: 9,
      color: "rgba(255,255,255,0.6)",
    },
  });
}

export function PremiumTransitionPage({
  template,
  branding,
  title = "Hier geht's zu den Details",
  subtitle = "Auf den folgenden Seiten finden Sie alle Informationen zu Ihrem individuellen Angebot – von Tarifen über Hardware bis hin zu Zusatzleistungen.",
  pageNumber,
  totalPages,
}: PremiumTransitionPageProps) {
  const primaryColor = branding?.primaryColor || template.primaryColor;
  const accentColor = template.accentColor;
  const styles = createStyles(primaryColor, accentColor);

  return (
    <Page size="A4" style={styles.page}>
      {/* Background layers */}
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundBottom} />
      
      {/* Decorative bubbles */}
      <View style={styles.bubbleContainer}>
        <View style={styles.bubbleLarge} />
        <View style={styles.bubbleMedium} />
        <View style={styles.bubbleSmall} />
      </View>
      
      {/* Main content */}
      <View style={styles.content}>
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>↓</Text>
        </View>
        
        <Text style={styles.headline}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        
        <View style={styles.divider} />
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.publisherNote}>{PUBLISHER.subline}</Text>
        <Text style={styles.pageNumber}>
          Seite {pageNumber} von {totalPages}
        </Text>
      </View>
    </Page>
  );
}
