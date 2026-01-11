// ============================================
// Shared PDF Header Component
// Reusable header with logo, company name, subline
// Publisher: allenetze.de
// ============================================

import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { TenantBranding } from "@/hooks/useTenantBranding";
import { PDF_COLORS, PDF_TYPOGRAPHY } from "../../designSystem";

interface PdfHeaderProps {
  branding?: TenantBranding;
  publisherSubline: string;
  primaryColor: string;
  title?: string;
  titleRight?: string;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
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
  logoTextContainer: {},
  logoText: {
    fontSize: PDF_TYPOGRAPHY.h5,
    fontWeight: "bold",
  },
  logoSubtext: {
    fontSize: PDF_TYPOGRAPHY.small,
    color: PDF_COLORS.textMuted,
    marginTop: 2,
  },
  headerRight: {
    textAlign: "right",
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: PDF_TYPOGRAPHY.h4,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: PDF_TYPOGRAPHY.caption,
    color: PDF_COLORS.textMuted,
    marginTop: 2,
  },
});

export function PdfHeader({
  branding,
  publisherSubline,
  primaryColor,
  title,
  titleRight,
}: PdfHeaderProps) {
  const displayName = branding?.companyName || "Allenetze MargenKalkulator";
  
  return (
    <View style={[styles.header, { borderBottomColor: primaryColor }]}>
      <View style={styles.logoSection}>
        {branding?.logoUrl && (
          <Image src={branding.logoUrl} style={styles.logoImage} />
        )}
        <View style={styles.logoTextContainer}>
          <Text style={[styles.logoText, { color: primaryColor }]}>
            {displayName}
          </Text>
          <Text style={styles.logoSubtext}>{publisherSubline}</Text>
        </View>
      </View>
      
      {(title || titleRight) && (
        <View style={styles.headerRight}>
          {title && (
            <Text style={[styles.headerTitle, { color: PDF_COLORS.accent }]}>
              {title}
            </Text>
          )}
          {titleRight && (
            <Text style={styles.headerSubtitle}>{titleRight}</Text>
          )}
        </View>
      )}
    </View>
  );
}
