// ============================================
// VVL List PDF Component
// ============================================

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ContractWithCustomer } from "../hooks/useCustomerContracts";

interface VVLListPdfProps {
  contracts: ContractWithCustomer[];
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
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    padding: 6,
    borderRadius: 3,
  },
  sectionCritical: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
  },
  sectionWarning: {
    backgroundColor: "#fef3c7",
    color: "#d97706",
  },
  sectionOk: {
    backgroundColor: "#dcfce7",
    color: "#16a34a",
  },
  sectionFuture: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
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
  colCustomer: { width: "25%" },
  colContact: { width: "15%" },
  colTariff: { width: "15%" },
  colHardware: { width: "15%" },
  colVVL: { width: "15%" },
  colDays: { width: "15%", textAlign: "right" },
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
  summary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#666666",
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1a1a1a",
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

function getRemainingDays(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgency(days: number | null): "critical" | "warning" | "ok" | "future" {
  if (days === null) return "future";
  if (days < 30) return "critical";
  if (days < 60) return "warning";
  if (days <= 90) return "ok";
  return "future";
}

function groupByUrgency(contracts: ContractWithCustomer[]) {
  const groups = {
    critical: [] as ContractWithCustomer[],
    warning: [] as ContractWithCustomer[],
    ok: [] as ContractWithCustomer[],
    future: [] as ContractWithCustomer[],
  };

  contracts.forEach((c) => {
    const days = getRemainingDays(c.vvl_datum);
    const urgency = getUrgency(days);
    groups[urgency].push(c);
  });

  return groups;
}

function ContractTable({ contracts, urgency }: { contracts: ContractWithCustomer[]; urgency: string }) {
  if (contracts.length === 0) return null;

  const sectionStyles = {
    critical: styles.sectionCritical,
    warning: styles.sectionWarning,
    ok: styles.sectionOk,
    future: styles.sectionFuture,
  };

  const titles = {
    critical: `🔴 KRITISCH (< 30 Tage) – ${contracts.length} Verträge`,
    warning: `🟡 BALD (30-60 Tage) – ${contracts.length} Verträge`,
    ok: `🟢 VORMERKEN (60-90 Tage) – ${contracts.length} Verträge`,
    future: `⚪ SPÄTER (> 90 Tage) – ${contracts.length} Verträge`,
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, sectionStyles[urgency as keyof typeof sectionStyles]]}>
        {titles[urgency as keyof typeof titles]}
      </Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colCustomer]}>Kunde</Text>
          <Text style={[styles.tableHeaderCell, styles.colContact]}>Kontakt</Text>
          <Text style={[styles.tableHeaderCell, styles.colTariff]}>Tarif</Text>
          <Text style={[styles.tableHeaderCell, styles.colHardware]}>Hardware</Text>
          <Text style={[styles.tableHeaderCell, styles.colVVL]}>VVL-Datum</Text>
          <Text style={[styles.tableHeaderCell, styles.colDays]}>Tage</Text>
        </View>
        {contracts.map((c, idx) => {
          const days = getRemainingDays(c.vvl_datum);
          const contact = c.customer?.vorname && c.customer?.nachname
            ? `${c.customer.vorname} ${c.customer.nachname}`
            : c.customer?.contact_name || "-";

          return (
            <View key={c.id}
              style={[
                styles.tableRow,
                idx % 2 === 1 ? { backgroundColor: '#f9fafb' } : {}
              ]}>
              <Text style={[styles.tableCell, styles.colCustomer]}>
                {c.customer?.company_name || "-"}
              </Text>
              <Text style={[styles.tableCell, styles.colContact]}>{contact}</Text>
              <Text style={[styles.tableCell, styles.colTariff]}>{c.tarif_name || "-"}</Text>
              <Text style={[styles.tableCell, styles.colHardware]}>{c.hardware_name || "SIM-Only"}</Text>
              <Text style={[styles.tableCell, styles.colVVL]}>
                {c.vvl_datum ? formatDate(c.vvl_datum) : "-"}
              </Text>
              <Text style={[styles.tableCell, styles.colDays]}>
                {days !== null ? (days < 0 ? `${days}` : `${days}`) : "-"}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function VVLListPdf({ contracts, generatedAt }: VVLListPdfProps) {
  const groups = groupByUrgency(contracts);
  const counts = {
    critical: groups.critical.length,
    warning: groups.warning.length,
    ok: groups.ok.length,
    future: groups.future.length,
    total: contracts.length,
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>MargenKalkulator</Text>
            <Text style={styles.logoSubtext}>VVL-Übersicht</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>VVL-Liste</Text>
            <Text style={styles.headerDate}>Erstellt am {formatDate(generatedAt)}</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gesamt:</Text>
            <Text style={styles.summaryValue}>{counts.total} Verträge</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>🔴 Kritisch ({"<"} 30 Tage):</Text>
            <Text style={styles.summaryValue}>{counts.critical}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>🟡 Bald (30-60 Tage):</Text>
            <Text style={styles.summaryValue}>{counts.warning}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>🟢 Vormerken (60-90 Tage):</Text>
            <Text style={styles.summaryValue}>{counts.ok}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>⚪ Später ({">"} 90 Tage):</Text>
            <Text style={styles.summaryValue}>{counts.future}</Text>
          </View>
        </View>

        {/* Contract Tables by Urgency */}
        <ContractTable contracts={groups.critical} urgency="critical" />
        <ContractTable contracts={groups.warning} urgency="warning" />
        <ContractTable contracts={groups.ok} urgency="ok" />
        <ContractTable contracts={groups.future} urgency="future" />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>MargenKalkulator • VVL-Übersicht</Text>
          <Text style={styles.footerText}>Seite 1</Text>
        </View>
      </Page>
    </Document>
  );
}
