// ============================================
// Web Worker für isoliertes XLSX-Parsing
// SECURITY: Läuft in separatem Thread für Crash-Isolation
// ============================================

import * as XLSX from "xlsx";

export interface WorkerMessage {
  type: "parse" | "getSheetNames";
  data: ArrayBuffer;
  schemaKeys?: string[];
}

export interface WorkerResponse {
  success: boolean;
  data?: Record<string, unknown[]>;
  sheetNames?: string[];
  error?: string;
}

// Worker message handler
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, data, schemaKeys } = e.data;
  
  try {
    // Parse workbook from ArrayBuffer
    const workbook = XLSX.read(data, { type: "array" });
    
    if (type === "getSheetNames") {
      self.postMessage({ 
        success: true, 
        sheetNames: workbook.SheetNames 
      } as WorkerResponse);
      return;
    }
    
    // Parse sheets according to schema keys
    const result: Record<string, unknown[]> = {};
    const sheetsToProcess = schemaKeys || workbook.SheetNames;
    
    for (const sheetName of sheetsToProcess) {
      const sheet = workbook.Sheets[sheetName];
      if (sheet) {
        const rows = XLSX.utils.sheet_to_json(sheet, {
          defval: null,
          raw: false, // Parse as strings first for normalization
        });
        result[sheetName] = normalizeRowsWorker(rows as Record<string, unknown>[]);
      }
    }
    
    self.postMessage({ success: true, data: result } as WorkerResponse);
  } catch (error) {
    self.postMessage({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown parsing error"
    } as WorkerResponse);
  }
};

// Duplicate normalization logic (worker cannot import from main thread)
function normalizeRowsWorker(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map(row => {
    const normalized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, "_");
      normalized[normalizedKey] = normalizeValueWorker(value, normalizedKey);
    }
    
    return normalized;
  });
}

function normalizeValueWorker(value: unknown, key: string): unknown {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  
  // Boolean columns
  if (
    key.includes("active") ||
    key.includes("included") ||
    key.includes("enabled") ||
    key === "router_included" ||
    key === "fixed_ip_included"
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
    key === "pct" ||
    key === "minTermMonths" ||
    key === "one_number_count" ||
    key === "display_order"
  ) {
    const numStr = String(value).replace(",", ".").trim();
    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
  }
  
  // String cleanup - sanitize potentially dangerous content
  const strValue = String(value).trim();
  
  // Remove formula injection
  if (strValue.startsWith("=") || strValue.startsWith("+") || 
      strValue.startsWith("-") || strValue.startsWith("@")) {
    return "'" + strValue;
  }
  
  return strValue;
}
