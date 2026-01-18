// ============================================
// Provision Forecast PDF Component
// BRANDING: Supports dynamic tenant branding
// ============================================

import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import type { TenantBranding } from "@/hooks/useTenantBranding";
import { DEFAULT_BRANDING } from "@/hooks/useTenantBranding";
import { createReportStyles } from "./styles";
import { formatCurrency as formatCurrencyBase } from "../lib/formatters";

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
  branding?: TenantBranding;
}

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// PDF-specific currency formatting
function formatCurrency(value: number) {
  return formatCurrencyBase(value);
}

export function ProvisionForecastPdf({ 
  rows, 
  totals, 
  generatedAt, 
  timeRange,
  branding = DEFAULT_BRANDING 
}: ProvisionForecastPdfProps) {
  const styles = createReportStyles(branding);
  
  // Display name for header
  const displayName = branding.companyName || "MargenKalkulator";
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {branding.logoUrl ? (
              <View style={styles.logoContainer}>
                <Image src={branding.logoUrl} style={styles.logoImage} />
              </View>
            ) : null}
            <View>
              <Text style={styles.logo}>{displayName}</Text>
              <Text style={styles.logoSubtext}>Provisions-Prognose</Text>
            </View>
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
          <Text style={styles.footerText}>{displayName} • Provisions-Prognose</Text>
          <Text style={styles.footerText}>{rows.length} Angebote</Text>
        </View>
      </Page>
    </Document>
  );
}
