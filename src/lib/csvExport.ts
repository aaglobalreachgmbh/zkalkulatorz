// ============================================
// CSV Export Utility
// Reusable function for exporting data to CSV
// ============================================

/**
 * Escape a value for CSV format
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  
  const stringValue = typeof value === "object" 
    ? JSON.stringify(value) 
    : String(value);
  
  // If value contains comma, newline, or double quote, wrap in quotes and escape internal quotes
  if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[]
): string {
  // Create header row
  const headerRow = columns.map(col => escapeCSVValue(col.label)).join(";");
  
  // Create data rows
  const dataRows = data.map(row => 
    columns.map(col => escapeCSVValue(row[col.key])).join(";")
  );
  
  // Add BOM for Excel UTF-8 compatibility
  return "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
}

/**
 * Trigger download of CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.style.display = "none";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string
): void {
  const csvContent = arrayToCSV(data, columns);
  downloadCSV(csvContent, filename);
}

// Predefined column configurations for common entities
export const OFFER_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "created_at", label: "Erstellt am" },
  { key: "visibility", label: "Sichtbarkeit" },
  { key: "tariff", label: "Tarif" },
  { key: "hardware", label: "Hardware" },
  { key: "avgMonthly", label: "Monatlich (€)" },
] as const;

export const CUSTOMER_COLUMNS = [
  { key: "company_name", label: "Firmenname" },
  { key: "anrede", label: "Anrede" },
  { key: "vorname", label: "Vorname" },
  { key: "nachname", label: "Nachname" },
  { key: "email", label: "E-Mail" },
  { key: "phone", label: "Telefon" },
  { key: "handy_nr", label: "Handy" },
  { key: "festnetz", label: "Festnetz" },
  { key: "strasse", label: "Straße" },
  { key: "hausnummer", label: "Hausnummer" },
  { key: "plz", label: "PLZ" },
  { key: "ort", label: "Ort" },
  { key: "industry", label: "Branche" },
  { key: "customer_status", label: "Status" },
  { key: "vip_kunde", label: "VIP" },
  { key: "created_at", label: "Erstellt am" },
] as const;

export const CALCULATION_HISTORY_COLUMNS = [
  { key: "created_at", label: "Datum" },
  { key: "tariff_name", label: "Tarif" },
  { key: "hardware_name", label: "Hardware" },
  { key: "avg_monthly", label: "Monatlich (€)" },
  { key: "margin", label: "Marge (€)" },
  { key: "summary", label: "Zusammenfassung" },
] as const;

export const ACTIVITY_LOG_COLUMNS = [
  { key: "created_at", label: "Zeitpunkt" },
  { key: "action", label: "Aktion" },
  { key: "resource_type", label: "Ressourcen-Typ" },
  { key: "resource_name", label: "Ressourcen-Name" },
  { key: "summary", label: "Zusammenfassung" },
] as const;
