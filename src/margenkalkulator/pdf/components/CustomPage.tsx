// ============================================
// Custom Page Component for PDF
// Renders user-defined pages in the PDF document
// ============================================

import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { PdfTemplate, CustomPageConfig } from "../templates/types";
import type { TenantBranding } from "@/hooks/useTenantBranding";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#0066CC",
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#002855",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    color: "#666666",
  },
  content: {
    flex: 1,
  },
  paragraph: {
    marginBottom: 12,
    fontSize: 10,
    lineHeight: 1.6,
    color: "#333333",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    maxWidth: "100%",
    maxHeight: "80%",
    objectFit: "contain",
  },
  imageTitleContainer: {
    marginBottom: 20,
    textAlign: "center",
  },
  imageTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#002855",
  },
  attachmentBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  attachmentIcon: {
    width: 60,
    height: 60,
    marginBottom: 20,
  },
  attachmentText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    maxWidth: 300,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: "#999999",
  },
  pageNumber: {
    fontSize: 8,
    color: "#999999",
  },
});

interface CustomPageProps {
  config: CustomPageConfig;
  template: PdfTemplate;
  branding?: TenantBranding;
  pageNumber: number;
  totalPages: number;
}

export function CustomPage({
  config,
  template,
  branding,
  pageNumber,
  totalPages,
}: CustomPageProps) {
  const primaryColor = branding?.primaryColor || template.primaryColor;
  const accentColor = branding?.secondaryColor || template.accentColor;

  // Dynamic styles based on template colors
  const dynamicStyles = {
    headerBorder: { borderBottomColor: primaryColor },
    title: { color: accentColor },
  };

  // Render content based on page type
  const renderContent = () => {
    switch (config.type) {
      case "text":
        return (
          <View style={styles.content}>
            {config.content?.split("\n\n").map((paragraph, idx) => (
              <Text key={idx} style={styles.paragraph}>
                {paragraph.trim()}
              </Text>
            ))}
          </View>
        );

      case "image":
        return (
          <View style={styles.imageContainer}>
            {config.title && (
              <View style={styles.imageTitleContainer}>
                <Text style={[styles.imageTitle, dynamicStyles.title]}>
                  {config.title}
                </Text>
              </View>
            )}
            {config.imageUrl && (
              <Image src={config.imageUrl} style={styles.image} />
            )}
          </View>
        );

      case "attachment":
        return (
          <View style={styles.attachmentBox}>
            <Text style={[styles.attachmentText, { marginTop: 20 }]}>
              Dieses Dokument enthält wichtige Informationen zu "{config.title}".
              {"\n\n"}
              Bitte lesen Sie diesen Anhang sorgfältig durch, bevor Sie das Angebot bestätigen.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Page size="A4" style={styles.page}>
      {/* Header - show title for text pages */}
      {config.type === "text" && (
        <View style={[styles.header, dynamicStyles.headerBorder]}>
          <Text style={[styles.title, dynamicStyles.title]}>
            {config.title}
          </Text>
          <Text style={styles.subtitle}>
            Zusatzinformationen zu Ihrem Angebot
          </Text>
        </View>
      )}

      {/* Main Content */}
      {renderContent()}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {branding?.companyName || template.publisherInfo.name}
        </Text>
        <Text style={styles.pageNumber}>
          Seite {pageNumber} von {totalPages}
        </Text>
      </View>
    </Page>
  );
}
