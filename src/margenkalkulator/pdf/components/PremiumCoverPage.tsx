// ============================================
// Premium Cover Page - O2 Business Style
// Herausgeber: allenetze.de
// ============================================

import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

interface CoverPageProps {
  customer: {
    firma: string;
    vorname: string;
    nachname: string;
    plz: string;
    ort: string;
  };
  offerId: string;
  logoUrl?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    position: "relative",
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1a1a2e",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "60%",
    height: "100%",
    backgroundColor: "#2563eb",
    opacity: 0.3,
  },
  content: {
    flex: 1,
    padding: 60,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "flex-end",
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: "contain",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  logoSubtext: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 4,
  },
  headlineSection: {
    marginTop: 100,
  },
  headline: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  subheadline: {
    fontSize: 36,
    color: "#e53935",  // Primary color
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  customerSection: {},
  customerLabel: {
    fontSize: 10,
    color: "#9ca3af",
    marginBottom: 6,
  },
  customerName: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "bold",
  },
  customerAddress: {
    fontSize: 12,
    color: "#d1d5db",
    marginTop: 4,
  },
  offerSection: {
    textAlign: "right",
  },
  offerLabel: {
    fontSize: 10,
    color: "#9ca3af",
    marginBottom: 6,
  },
  offerId: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "bold",
  },
});

export function PremiumCoverPage({ customer, offerId, logoUrl }: CoverPageProps) {
  const customerName = customer.firma ||
    `${customer.vorname} ${customer.nachname}`.trim() ||
    "Interessent";

  return (
    <Page size="A4" style={styles.page}>
      {/* Background */}
      <View style={styles.gradient} />
      <View style={styles.gradientOverlay} />

      <View style={styles.content}>
        {/* Header with Logo */}
        <View style={styles.header}>
          {logoUrl ? (
            <Image src={logoUrl} style={styles.logo} />
          ) : (
            <View>
              <Text style={styles.logoText}>allenetze.de</Text>
              <Text style={styles.logoSubtext}>Ihr Partner für Business-Kommunikation</Text>
            </View>
          )}
        </View>

        {/* Headline */}
        <View style={styles.headlineSection}>
          <Text style={styles.headline}>Top-Leistung zu</Text>
          <Text style={styles.subheadline}>Top-Konditionen</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.customerSection}>
            <Text style={styles.customerLabel}>Erstellt für:</Text>
            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.customerAddress}>
              {customer.plz} {customer.ort}
            </Text>
          </View>

          <View style={styles.offerSection}>
            <Text style={styles.offerLabel}>Angebotsnummer:</Text>
            <Text style={styles.offerId}>{offerId}</Text>
          </View>
        </View>
      </View>
    </Page>
  );
}

export default PremiumCoverPage;
