// ============================================
// CSV Importer using PapaParse
// ============================================

import Papa from "papaparse";

export async function parseCSV(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, "_"),
      complete: (results) => {
        const normalized = normalizeRows(results.data as Record<string, unknown>[]);
        resolve(normalized);
      },
      error: (err) => reject(new Error(`CSV parsing failed: ${err.message}`)),
    });
  });
}

function normalizeRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map(row => {
    const normalized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(row)) {
      normalized[key] = normalizeValue(value, key);
    }
    
    return normalized;
  });
}

function normalizeValue(value: unknown, key: string): unknown {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  
  // Boolean columns
  if (
    key.includes("active") ||
    key.includes("included") ||
    key.includes("enabled")
  ) {
    return (
      value === true ||
      value === "true" ||
      value === "1" ||
      value === "ja" ||
      value === "yes" ||
      value === "TRUE"
    );
  }
  
  // Numeric columns
  if (
    key.includes("_net") ||
    key.includes("_gb") ||
    key === "sort_order" ||
    key === "speed" ||
    key === "duration_months" ||
    key === "pct"
  ) {
    const numStr = String(value).replace(",", ".").trim();
    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
  }
  
  return String(value).trim();
}
