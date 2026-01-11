// ============================================
// Shared PDF Footer Component
// Reusable footer with publisher subline and page number
// Publisher: allenetze.de
// ============================================

import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { PDF_COLORS, PDF_TYPOGRAPHY, PDF_SPACING } from "../../designSystem";

interface PdfFooterProps {
  publisherSubline: string;
  pageNumber: number;
  totalPages: number;
  showVatNotice?: boolean;
}

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 25,
    left: PDF_SPACING.pagePadding,
    right: PDF_SPACING.pagePadding,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
    paddingTop: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: PDF_TYPOGRAPHY.small,
    color: PDF_COLORS.textLight,
  },
  pageNumber: {
    fontSize: PDF_TYPOGRAPHY.small,
    color: PDF_COLORS.textLight,
  },
});

export function PdfFooter({
  publisherSubline,
  pageNumber,
  totalPages,
  showVatNotice = true,
}: PdfFooterProps) {
  const vatNotice = showVatNotice ? " | Alle Preise zzgl. MwSt." : "";
  
  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          {publisherSubline}{vatNotice}
        </Text>
        <Text style={styles.pageNumber}>
          Seite {pageNumber} von {totalPages}
        </Text>
      </View>
    </View>
  );
}
