// ============================================
// Premium Transition Page - O2 Business Style
// Full-page gradient with "Details" headline
// ============================================

import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { PdfTemplate } from "../templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";

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
      height: "60%",
      backgroundColor: primaryColor,
    },
    
    backgroundBottom: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "40%",
      backgroundColor: accentColor,
    },
    
    // Decorative circles (O2 bubble style)
    bubbleContainer: {
      position: "absolute",
      top: 60,
      right: 60,
    },
    
    bubbleLarge: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "rgba(255,255,255,0.1)",
    },
    
    bubbleSmall: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "rgba(255,255,255,0.08)",
      marginTop: 20,
      marginLeft: 40,
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
      marginBottom: 30,
    },
    
    arrow: {
      fontSize: 48,
      color: "#ffffff",
      opacity: 0.9,
    },
    
    // Headline
    headline: {
      fontSize: 36,
      fontWeight: "bold",
      color: "#ffffff",
      textAlign: "center",
      marginBottom: 15,
    },
    
    subtitle: {
      fontSize: 16,
      color: "rgba(255,255,255,0.85)",
      textAlign: "center",
      maxWidth: 400,
      lineHeight: 1.5,
    },
    
    // Decorative line
    divider: {
      width: 80,
      height: 3,
      backgroundColor: "#ffffff",
      opacity: 0.5,
      marginTop: 30,
    },
    
    // Footer
    footer: {
      position: "absolute",
      bottom: 30,
      left: 0,
      right: 0,
      alignItems: "center",
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
  subtitle = "Auf den folgenden Seiten finden Sie alle Details zu Ihrem Angebot.",
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
        <Text style={styles.pageNumber}>
          Seite {pageNumber} von {totalPages}
        </Text>
      </View>
    </Page>
  );
}
