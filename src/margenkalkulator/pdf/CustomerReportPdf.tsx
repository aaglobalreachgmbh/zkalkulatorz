// ============================================
// Customer Report PDF Component
// ============================================

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Customer } from "../hooks/useCustomers";
import type { CustomerContract } from "../hooks/useCustomerContracts";
import type { CloudOffer } from "../hooks/useCloudOffers";

interface CustomerReportPdfProps {
  customer: Customer;
  contracts: CustomerContract[];
  offers: CloudOffer[];
  generatedAt: Date;
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 5,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoColumn: {
    width: "50%",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  infoLabel: {
    width: 80,
    fontSize: 8,
    color: "#666666",
  },
  infoValue: {
    flex: 1,
    fontSize: 8,
    color: "#1a1a1a",
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
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 7,
  },
  badgeCritical: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
  },
  badgeWarning: {
    backgroundColor: "#fef3c7",
    color: "#d97706",
  },
  badgeOk: {
    backgroundColor: "#dcfce7",
    color: "#16a34a",
  },
  summary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#cccccc",
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#ffffff",
  },
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#444444",
  },
  summaryTotalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
  },
  summaryTotalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e4002b",
  },
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
  emptyState: {
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 9,
    color: "#666666",
  },
});

function formatDate(date: Date | string | null) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(2).replace(".", ",")} €`;
}

function getRemainingDays(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgencyStyle(days: number | null) {
  if (days === null) return null;
  if (days < 30) return styles.badgeCritical;
  if (days < 60) return styles.badgeWarning;
  if (days <= 90) return styles.badgeOk;
  return null;
}

export function CustomerReportPdf({ customer, contracts, offers, generatedAt }: CustomerReportPdfProps) {
  const activeContracts = contracts.filter((c) => c.status === "aktiv");
  const totalMonthly = activeContracts.reduce((sum, c) => sum + (c.monatspreis || 0), 0);
  const nextVVL = activeContracts
    .filter((c) => c.vvl_datum)
    .sort((a, b) => new Date(a.vvl_datum!).getTime() - new Date(b.vvl_datum!).getTime())[0];

  const fullName = [customer.anrede, customer.vorname, customer.nachname]
    .filter(Boolean)
    .join(" ") || customer.contact_name;
  const address = [
    customer.strasse && customer.hausnummer ? `${customer.strasse} ${customer.hausnummer}` : customer.strasse,
    customer.plz && customer.ort ? `${customer.plz} ${customer.ort}` : customer.ort,
  ].filter(Boolean).join(", ");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>MargenKalkulator</Text>
            <Text style={styles.logoSubtext}>Kunden-Report</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>{customer.company_name}</Text>
            <Text style={styles.headerDate}>Erstellt am {formatDate(generatedAt)}</Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📇 Kontaktdaten</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              {fullName && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ansprechpartner:</Text>
                  <Text style={styles.infoValue}>{fullName}</Text>
                </View>
              )}
              {customer.email && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>E-Mail:</Text>
                  <Text style={styles.infoValue}>{customer.email}</Text>
                </View>
              )}
              {customer.phone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Telefon:</Text>
                  <Text style={styles.infoValue}>{customer.phone}</Text>
                </View>
              )}
            </View>
            <View style={styles.infoColumn}>
              {customer.handy_nr && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Mobil:</Text>
                  <Text style={styles.infoValue}>{customer.handy_nr}</Text>
                </View>
              )}
              {address && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Adresse:</Text>
                  <Text style={styles.infoValue}>{address}</Text>
                </View>
              )}
              {customer.industry && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Branche:</Text>
                  <Text style={styles.infoValue}>{customer.industry}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Contracts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Verträge ({activeContracts.length} aktiv)</Text>
          {activeContracts.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Tarif</Text>
                <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Hardware</Text>
                <Text style={[styles.tableHeaderCell, { width: "15%" }]}>Netz</Text>
                <Text style={[styles.tableHeaderCell, { width: "15%", textAlign: "right" }]}>Monatlich</Text>
                <Text style={[styles.tableHeaderCell, { width: "15%" }]}>VVL-Datum</Text>
                <Text style={[styles.tableHeaderCell, { width: "15%", textAlign: "right" }]}>Tage</Text>
              </View>
              {activeContracts.map((c, idx) => {
                const days = getRemainingDays(c.vvl_datum);
                const urgencyStyle = getUrgencyStyle(days);
                return (
                  <View key={c.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                    <Text style={[styles.tableCell, { width: "20%" }]}>{c.tarif_name || "-"}</Text>
                    <Text style={[styles.tableCell, { width: "20%" }]}>{c.hardware_name || "SIM-Only"}</Text>
                    <Text style={[styles.tableCell, { width: "15%" }]}>{c.netz}</Text>
                    <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>
                      {formatCurrency(c.monatspreis)}
                    </Text>
                    <Text style={[styles.tableCell, { width: "15%" }]}>{formatDate(c.vvl_datum)}</Text>
                    <View style={{ width: "15%", alignItems: "flex-end" }}>
                      {urgencyStyle ? (
                        <Text style={[styles.badge, urgencyStyle]}>{days}</Text>
                      ) : (
                        <Text style={styles.tableCell}>{days !== null ? days : "-"}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Keine aktiven Verträge</Text>
            </View>
          )}
        </View>

        {/* Offers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📑 Offene Angebote ({offers.length})</Text>
          {offers.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "30%" }]}>Angebot</Text>
                <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Hardware</Text>
                <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Tarif</Text>
                <Text style={[styles.tableHeaderCell, { width: "15%", textAlign: "right" }]}>Ø Monatlich</Text>
                <Text style={[styles.tableHeaderCell, { width: "15%" }]}>Erstellt</Text>
              </View>
              {offers.map((o, idx) => (
                <View key={o.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={[styles.tableCell, { width: "30%" }]}>{o.name}</Text>
                  <Text style={[styles.tableCell, { width: "20%" }]}>{o.preview?.hardware || "-"}</Text>
                  <Text style={[styles.tableCell, { width: "20%" }]}>{o.preview?.tariff || "-"}</Text>
                  <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>
                    {formatCurrency(o.preview?.avgMonthly)}
                  </Text>
                  <Text style={[styles.tableCell, { width: "15%" }]}>{formatDate(o.created_at)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Keine offenen Angebote</Text>
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Aktive Verträge:</Text>
            <Text style={styles.summaryValue}>{activeContracts.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Offene Angebote:</Text>
            <Text style={styles.summaryValue}>{offers.length}</Text>
          </View>
          {nextVVL && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Nächster VVL:</Text>
              <Text style={styles.summaryValue}>
                {formatDate(nextVVL.vvl_datum)} ({getRemainingDays(nextVVL.vvl_datum)} Tage)
              </Text>
            </View>
          )}
          <View style={styles.summaryTotal}>
            <Text style={styles.summaryTotalLabel}>Laufende Kosten:</Text>
            <Text style={styles.summaryTotalValue}>{formatCurrency(totalMonthly)}/Monat</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>MargenKalkulator • Kunden-Report</Text>
          <Text style={styles.footerText}>Vertraulich</Text>
        </View>
      </Page>
    </Document>
  );
}
