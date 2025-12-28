// ============================================
// Export Helpers - CSV, Formatting, Sanitization
// ============================================

/**
 * Download data as CSV file with BOM for Excel compatibility
 */
export function downloadCSV(filename: string, headers: string[], rows: string[][]): void {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = sanitizeFilename(filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sanitize filename to prevent path traversal and invalid characters
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "") // Remove invalid characters
    .replace(/\.\./g, "") // Prevent path traversal
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .slice(0, 100); // Limit length
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "-";
  return `${value.toFixed(2).replace(".", ",")} €`;
}

/**
 * Format currency for CSV (no symbol, comma as decimal)
 */
export function formatCurrencyForCSV(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "";
  return value.toFixed(2).replace(".", ",");
}

/**
 * Format date for display (dd.MM.yyyy)
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return "-";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

/**
 * Format date for filenames (yyyy-MM-dd)
 */
export function formatDateForFilename(date?: Date): string {
  const d = date || new Date();
  return d.toISOString().split("T")[0];
}

/**
 * Get remaining days until a date
 */
export function getRemainingDays(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get VVL urgency label in German
 */
export function getVVLUrgencyLabel(days: number | null): string {
  if (days === null) return "Kein VVL";
  if (days < 0) return "Überfällig";
  if (days < 30) return "Kritisch";
  if (days < 60) return "Bald";
  if (days <= 90) return "Vormerken";
  return "Später";
}
