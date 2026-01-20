// ============================================
// PriceTable - Vodafone-Style Perioden-Tabelle
// ============================================

import { View, Text, StyleSheet } from "@react-pdf/renderer";

interface PeriodColumn {
    header: string;      // "1.-12. Monat"
    fromMonth: number;
    toMonth: number;
}

interface PositionRow {
    label: string;
    quantity?: number;
    oneTime?: number;
    monthlyByPeriod: number[];
    isDiscount?: boolean;
    isSubtotal?: boolean;
    isTotal?: boolean;
    footnote?: string;
}

interface PriceTableProps {
    periods: PeriodColumn[];
    rows: PositionRow[];
    showOneTime?: boolean;
    primaryColor?: string;
}

const styles = StyleSheet.create({
    table: {
        width: "100%",
        marginVertical: 10,
    },
    headerRow: {
        flexDirection: "row",
        backgroundColor: "#f3f4f6",
        borderBottomWidth: 2,
        borderBottomColor: "#e5e7eb",
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    headerCell: {
        fontSize: 8,
        fontWeight: "bold",
        color: "#374151",
        textAlign: "right",
    },
    headerCellLabel: {
        flex: 2,
        textAlign: "left",
    },
    headerCellValue: {
        flex: 1,
        textAlign: "right",
        paddingRight: 8,
    },
    row: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    rowAlt: {
        backgroundColor: "#f9fafb",
    },
    rowSubtotal: {
        backgroundColor: "#f3f4f6",
        borderTopWidth: 1,
        borderTopColor: "#d1d5db",
    },
    rowTotal: {
        backgroundColor: "#1f2937",
    },
    cell: {
        fontSize: 9,
        color: "#1f2937",
    },
    cellLabel: {
        flex: 2,
    },
    cellValue: {
        flex: 1,
        textAlign: "right",
        paddingRight: 8,
    },
    cellDiscount: {
        color: "#ef4444",  // Rot für Rabatte
    },
    cellTotal: {
        color: "#ffffff",
        fontWeight: "bold",
    },
    cellBold: {
        fontWeight: "bold",
    },
    footnote: {
        fontSize: 7,
        color: "#6b7280",
        verticalAlign: "super",
    },
});

export function PriceTable({
    periods,
    rows,
    showOneTime = true,
    primaryColor = "#e53935"
}: PriceTableProps) {
    const formatCurrency = (value: number | undefined): string => {
        if (value === undefined) return "—";
        const formatted = new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
        }).format(Math.abs(value));
        return value < 0 ? `−${formatted}` : formatted;
    };

    return (
        <View style={styles.table}>
            {/* Header Row */}
            <View style={styles.headerRow}>
                <Text style={[styles.headerCell, styles.headerCellLabel]}>Position</Text>
                {showOneTime && (
                    <Text style={[styles.headerCell, styles.headerCellValue]}>Einmalig</Text>
                )}
                {periods.map((period, idx) => (
                    <Text key={idx} style={[styles.headerCell, styles.headerCellValue]}>
                        {period.header}
                    </Text>
                ))}
            </View>

            {/* Data Rows */}
            {rows.map((row, rowIdx) => {
                const isAlt = rowIdx % 2 === 1;
                const rowStyles = [
                    styles.row,
                    isAlt && styles.rowAlt,
                    row.isSubtotal && styles.rowSubtotal,
                    row.isTotal && styles.rowTotal,
                ].filter(Boolean);

                const cellStyles = [
                    styles.cell,
                    row.isDiscount && styles.cellDiscount,
                    row.isTotal && styles.cellTotal,
                    (row.isSubtotal || row.isTotal) && styles.cellBold,
                ].filter(Boolean);

                return (
                    <View key={rowIdx} style={rowStyles}>
                        <View style={[styles.cellLabel]}>
                            <Text style={cellStyles}>
                                {row.quantity ? `${row.quantity}× ` : ""}
                                {row.label}
                                {row.footnote && (
                                    <Text style={styles.footnote}>{row.footnote}</Text>
                                )}
                            </Text>
                        </View>

                        {showOneTime && (
                            <Text style={[...cellStyles, styles.cellValue]}>
                                {formatCurrency(row.oneTime)}
                            </Text>
                        )}

                        {row.monthlyByPeriod.map((value, idx) => (
                            <Text key={idx} style={[...cellStyles, styles.cellValue]}>
                                {formatCurrency(value)}
                            </Text>
                        ))}
                    </View>
                );
            })}
        </View>
    );
}

export default PriceTable;
