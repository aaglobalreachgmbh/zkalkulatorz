// ============================================
// Price Table with Period Columns (Vodafone-Style)
// Displays prices by period with discount highlighting
// Publisher: allenetze.de
// ============================================

import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { PDF_COLORS, PDF_TYPOGRAPHY, formatCurrencyPdf, formatDiscountPdf } from "../../designSystem";

export interface PeriodColumn {
  header: string;
  fromMonth: number;
  toMonth: number;
}

export interface TableRow {
  quantity?: number;
  label: string;
  oneTime?: number;
  monthlyByPeriod: number[];
  isDiscount?: boolean;
  isSubtotal?: boolean;
  isTotal?: boolean;
  footnote?: string;
}

interface PriceTablePeriodProps {
  title?: string;
  titleBgColor?: string;
  periods: PeriodColumn[];
  rows: TableRow[];
  showOneTimeColumn?: boolean;
  showQuantityColumn?: boolean;
  primaryColor: string;
  accentColor: string;
}

function createStyles(primaryColor: string, accentColor: string) {
  return StyleSheet.create({
    table: {
      marginBottom: 15,
    },
    titleRow: {
      flexDirection: "row",
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    titleText: {
      fontSize: PDF_TYPOGRAPHY.body,
      fontWeight: "bold",
      color: accentColor,
    },
    headerRow: {
      flexDirection: "row",
      backgroundColor: accentColor,
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    headerCell: {
      fontSize: PDF_TYPOGRAPHY.tableHeader,
      fontWeight: "bold",
      color: "#ffffff",
    },
    dataRow: {
      flexDirection: "row",
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: PDF_COLORS.border,
    },
    dataRowAlt: {
      backgroundColor: PDF_COLORS.bgAlt,
    },
    dataRowDiscount: {
      backgroundColor: "#fef2f2", // Light red background
    },
    dataRowSubtotal: {
      backgroundColor: PDF_COLORS.bgLight,
      borderTopWidth: 1,
      borderTopColor: "#cccccc",
    },
    dataRowTotal: {
      backgroundColor: primaryColor,
      marginTop: 8,
    },
    cell: {
      fontSize: PDF_TYPOGRAPHY.tableCell,
      color: PDF_COLORS.text,
    },
    cellBold: {
      fontWeight: "bold",
    },
    cellDiscount: {
      color: PDF_COLORS.discount,
      fontWeight: "bold",
    },
    cellTotal: {
      color: "#ffffff",
      fontWeight: "bold",
    },
    // Column widths
    colQty: { width: "8%", textAlign: "center" },
    colPosition: { width: "40%" },
    colOneTime: { width: "13%", textAlign: "right" },
    colPeriod: { width: "13%", textAlign: "right" },
    footnote: {
      fontSize: 6,
      verticalAlign: "super",
      color: PDF_COLORS.textMuted,
    },
  });
}

export function PriceTablePeriod({
  title,
  titleBgColor,
  periods,
  rows,
  showOneTimeColumn = true,
  showQuantityColumn = true,
  primaryColor,
  accentColor,
}: PriceTablePeriodProps) {
  const styles = createStyles(primaryColor, accentColor);
  
  // Calculate column width based on number of periods
  const periodWidth = showOneTimeColumn
    ? (100 - 8 - 40 - 13) / periods.length
    : (100 - 8 - 40) / periods.length;
  
  return (
    <View style={styles.table}>
      {/* Title row (optional) */}
      {title && (
        <View style={[styles.titleRow, { backgroundColor: titleBgColor || PDF_COLORS.bgLight }]}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
      )}
      
      {/* Header row */}
      <View style={styles.headerRow}>
        {showQuantityColumn && (
          <Text style={[styles.headerCell, styles.colQty]}>Anz.</Text>
        )}
        <Text style={[styles.headerCell, styles.colPosition]}>Position</Text>
        {showOneTimeColumn && (
          <Text style={[styles.headerCell, styles.colOneTime]}>Einmalig</Text>
        )}
        {periods.map((period, idx) => (
          <Text
            key={idx}
            style={[styles.headerCell, { width: `${periodWidth}%`, textAlign: "right" }]}
          >
            {period.header}
          </Text>
        ))}
      </View>
      
      {/* Data rows */}
      {rows.map((row, idx) => {
        const isAlt = idx % 2 === 1;
        
        return (
          <View
            key={idx}
            style={[
              styles.dataRow,
              isAlt && !row.isDiscount && !row.isSubtotal && !row.isTotal ? styles.dataRowAlt : {},
              row.isDiscount ? styles.dataRowDiscount : {},
              row.isSubtotal ? styles.dataRowSubtotal : {},
              row.isTotal ? styles.dataRowTotal : {},
            ]}
          >
            {showQuantityColumn && (
              <Text style={[styles.cell, styles.colQty, row.isTotal ? styles.cellTotal : {}]}>
                {row.quantity ? `${row.quantity}x` : ""}
              </Text>
            )}
            
            <Text
              style={[
                styles.cell,
                styles.colPosition,
                (row.isSubtotal || row.isTotal) ? styles.cellBold : {},
                row.isTotal ? styles.cellTotal : {},
              ]}
            >
              {row.label}
            </Text>
            
            {showOneTimeColumn && (
              <Text
                style={[
                  styles.cell,
                  styles.colOneTime,
                  row.isTotal ? styles.cellTotal : {},
                ]}
              >
                {row.oneTime !== undefined ? formatCurrencyPdf(row.oneTime) : "—"}
              </Text>
            )}
            
            {row.monthlyByPeriod.map((amount, pIdx) => (
              <Text
                key={pIdx}
                style={[
                  styles.cell,
                  { width: `${periodWidth}%`, textAlign: "right" },
                  row.isDiscount ? styles.cellDiscount : {},
                  (row.isSubtotal || row.isTotal) ? styles.cellBold : {},
                  row.isTotal ? styles.cellTotal : {},
                ]}
              >
                {row.isDiscount && amount < 0
                  ? formatDiscountPdf(amount)
                  : formatCurrencyPdf(amount)}
                {row.footnote && pIdx === row.monthlyByPeriod.length - 1 && (
                  <Text style={styles.footnote}>{row.footnote}</Text>
                )}
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  );
}
