// ============================================
// Provision Forecast PDF Component
// ============================================

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface ForecastRow {
  offerName: string;
  customerName: string;
  tariff: string;
  hardware: string;
  ekPrice: number;
  expectedProvision: number;
  expectedMargin: number;
  createdAt: string;
}

interface ProvisionForecastPdfProps {
  rows: ForecastRow[];
  totals: {
    totalProvision: number;
    totalEk: number;
    netMargin: number;
  };
  generatedAt: Date;
  timeRange: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#e4002b",
    paddingBottom: 15,
  },
  logo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e4002b",
  },
  logoSubtext: {
    fontSize: 8,
    color: "#666666",
    marginTop: 2,
  },
  headerRight: {
    textAlign: "right",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  headerDate: {
    fontSize: 8,
    color: "#666666",
    marginTop: 4,
  },
  kpiSection: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 15,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    borderLeftWidth: 3,
  },
  kpiProvision: {
    borderLeftColor: "#16a34a",
  },
  kpiEk: {
    borderLeftColor: "#dc2626",
  },
  kpiMargin: {
    borderLeftColor: "#2563eb",
  },
  kpiLabel: {
    fontSize: 8,
    color: "#666666",
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  kpiValuePositive: {
    color: "#16a34a",
  },
  kpiValueNegative: {
    color: "#dc2626",
  },
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    padding: 6,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    padding: 6,
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  tableCell: {
    fontSize: 8,
    color: "#1a1a1a",
  },
  tableCellPositive: {
    color: "#16a34a",
  },
  tableCellNegative: {
    color: "#dc2626",
  },
  colCustomer: { width: "22%" },
  colOffer: { width: "18%" },
  colTariff: { width: "15%" },
  colHardware: { width: "12%" },
  colProvision: { width: "11%", textAlign: "right" },
  colEk: { width: "11%", textAlign: "right" },
  colMargin: { width: "11%", textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: "#999999",
  },
  disclaimer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fef3c7",
    borderRadius: 4,
  },
  disclaimerText: {
    fontSize: 7,
    color: "#92400e",
    lineHeight: 1.4,
  },
  emptyState: {
    padding: 30,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 10,
    color: "#666666",
  },
});

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(value: number) {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

export function ProvisionForecastPdf({ rows, totals, generatedAt, timeRange }: ProvisionForecastPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>MargenKalkulator</Text>
            <Text style={styles.logoSubtext}>Provisions-Prognose</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>Provisions-Prognose</Text>
            <Text style={styles.headerDate}>
              Zeitraum: {timeRange} • Erstellt am {formatDate(generatedAt)}
            </Text>
          </View>
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiSection}>
          <View style={[styles.kpiCard, styles.kpiProvision]}>
            <Text style={styles.kpiLabel}>Erwartete Provision</Text>
            <Text style={[styles.kpiValue, styles.kpiValuePositive]}>
              {formatCurrency(totals.totalProvision)}
            </Text>
          </View>
          <View style={[styles.kpiCard, styles.kpiEk]}>
            <Text style={styles.kpiLabel}>Hardware-EK</Text>
            <Text style={[styles.kpiValue, styles.kpiValueNegative]}>
              {formatCurrency(totals.totalEk)}
            </Text>
          </View>
          <View style={[styles.kpiCard, styles.kpiMargin]}>
            <Text style={styles.kpiLabel}>Netto-Marge</Text>
            <Text style={[styles.kpiValue, totals.netMargin >= 0 ? styles.kpiValuePositive : styles.kpiValueNegative]}>
              {totals.netMargin >= 0 ? "+" : ""}{formatCurrency(totals.netMargin)}
            </Text>
          </View>
        </View>

        {/* Table */}
        {rows.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colCustomer]}>Kunde</Text>
              <Text style={[styles.tableHeaderCell, styles.colOffer]}>Angebot</Text>
              <Text style={[styles.tableHeaderCell, styles.colTariff]}>Tarif</Text>
              <Text style={[styles.tableHeaderCell, styles.colHardware]}>Hardware</Text>
              <Text style={[styles.tableHeaderCell, styles.colProvision]}>Provision</Text>
              <Text style={[styles.tableHeaderCell, styles.colEk]}>EK</Text>
              <Text style={[styles.tableHeaderCell, styles.colMargin]}>Marge</Text>
            </View>
            {rows.map((row, idx) => (
              <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                <Text style={[styles.tableCell, styles.colCustomer]}>{row.customerName}</Text>
                <Text style={[styles.tableCell, styles.colOffer]}>{row.offerName}</Text>
                <Text style={[styles.tableCell, styles.colTariff]}>{row.tariff}</Text>
                <Text style={[styles.tableCell, styles.colHardware]}>{row.hardware}</Text>
                <Text style={[styles.tableCell, styles.colProvision, styles.tableCellPositive]}>
                  {formatCurrency(row.expectedProvision)}
                </Text>
                <Text style={[styles.tableCell, styles.colEk, styles.tableCellNegative]}>
                  {formatCurrency(row.ekPrice)}
                </Text>
                <Text style={[
                  styles.tableCell, 
                  styles.colMargin, 
                  row.expectedMargin >= 0 ? styles.tableCellPositive : styles.tableCellNegative
                ]}>
                  {row.expectedMargin >= 0 ? "+" : ""}{formatCurrency(row.expectedMargin)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Keine abgeschlossenen Angebote im gewählten Zeitraum</Text>
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ PROGNOSE: Diese Werte basieren auf Angeboten mit Status "abgeschlossen". 
            Die tatsächliche Provision kann je nach Vertragsbedingungen und Aktivierungszeitpunkt abweichen.
            Hardware-EK-Preise entsprechen den zum Angebotszeitpunkt hinterlegten Werten.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>MargenKalkulator • Provisions-Prognose</Text>
          <Text style={styles.footerText}>{rows.length} Angebote</Text>
        </View>
      </Page>
    </Document>
  );
}
