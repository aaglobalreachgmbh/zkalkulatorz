// ============================================
// XLSX Importer using SheetJS
// Supports both Canonical and Business formats
// SECURITY: Includes secure Worker-based parsing
// ============================================

import * as XLSX from "xlsx";
import { TEMPLATE_SCHEMA } from "../schema";
import type { ParsedSheets, CanonicalDataset } from "../types";
import { detectFormat, type FormatDetectionResult } from "../businessFormat/detector";
import { parseBusinessFormat } from "../businessFormat/parser";
import { mapBusinessToCanonical } from "../businessFormat/mapper";
import { transformToCanonical } from "../adapter";
import { validateUploadedFile, logSecurityEvent } from "@/lib/securityUtils";
import { parseXLSXInWorker, isWorkerAvailable } from "../workers";

// =============================================================================
// File Validation (must be called before parsing)
// =============================================================================
export function validateFileBeforeParse(file: File): { valid: boolean; errors: string[] } {
  const validation = validateUploadedFile(file);
  
  if (!validation.valid) {
    logSecurityEvent("file_rejected", { 
      category: "upload", 
      severity: "warn",
    });
  }
  
  return validation;
}

// =============================================================================
// Main XLSX Parser
// =============================================================================
export async function parseXLSX(file: File): Promise<ParsedSheets> {
  // Validate file before parsing
  const validation = validateFileBeforeParse(file);
  if (!validation.valid) {
    throw new Error(`Datei ungültig: ${validation.errors.join(", ")}`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        
        const result: ParsedSheets = {};
        
        // Parse each sheet according to schema
        for (const sheetName of Object.keys(TEMPLATE_SCHEMA)) {
          const sheet = workbook.Sheets[sheetName];
          if (sheet) {
            const rows = XLSX.utils.sheet_to_json(sheet, {
              defval: null,
              raw: false, // Parse as strings first for normalization
            });
            result[sheetName as keyof ParsedSheets] = normalizeRows(rows as Record<string, unknown>[]);
          }
        }
        
        resolve(result);
      } catch (err) {
        reject(new Error(`XLSX parsing failed: ${err instanceof Error ? err.message : "Unknown error"}`));
      }
    };
    
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsArrayBuffer(file);
  });
}

function normalizeRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map(row => {
    const normalized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(row)) {
      // Normalize column names: lowercase, trim, replace spaces with underscores
      const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, "_");
      normalized[normalizedKey] = normalizeValue(value, normalizedKey);
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
  
  // Numeric columns (handle German comma separator)
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
  
  // Remove any potential formula injection (Excel/CSV formula injection)
  if (strValue.startsWith("=") || strValue.startsWith("+") || 
      strValue.startsWith("-") || strValue.startsWith("@")) {
    // Prefix with single quote to neutralize formula
    return "'" + strValue;
  }
  
  return strValue;
}

// Get available sheet names from a workbook
export async function getSheetNames(file: File): Promise<string[]> {
  // Validate file before reading
  const validation = validateFileBeforeParse(file);
  if (!validation.valid) {
    throw new Error(`Datei ungültig: ${validation.errors.join(", ")}`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        resolve(workbook.SheetNames);
      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsArrayBuffer(file);
  });
}

// =============================================================================
// SECURITY: Secure XLSX Parser using Web Worker
// Isolates parsing in separate thread with timeout protection
// =============================================================================
export async function parseXLSXSecure(file: File): Promise<ParsedSheets> {
  // Validate file before parsing
  const validation = validateFileBeforeParse(file);
  if (!validation.valid) {
    logSecurityEvent("file_rejected", {
      category: "upload",
      severity: "warn",
      reason: validation.errors.join(", "),
    });
    throw new Error(`Datei ungültig: ${validation.errors.join(", ")}`);
  }

  // Check if Web Workers are available
  if (!isWorkerAvailable()) {
    console.warn("[Security] Web Worker nicht verfügbar, nutze Main-Thread Fallback");
    return parseXLSX(file);
  }

  // Read file as ArrayBuffer
  const buffer = await file.arrayBuffer();
  const schemaKeys = Object.keys(TEMPLATE_SCHEMA);

  // Parse in Web Worker with timeout
  const result = await parseXLSXInWorker(buffer, schemaKeys);

  if (!result.success) {
    logSecurityEvent("file_rejected", {
      category: "parsing",
      severity: "error",
      reason: result.error,
    });
    throw new Error(result.error || "XLSX parsing failed in worker");
  }

  // Type-cast result data to ParsedSheets
  const sheets: ParsedSheets = {};
  for (const [sheetName, rows] of Object.entries(result.data || {})) {
    sheets[sheetName as keyof ParsedSheets] = rows as Record<string, unknown>[];
  }

  return sheets;
}

// Secure version of unified parser
export async function parseXLSXUnifiedSecure(file: File): Promise<UnifiedParseResult> {
  // Try secure worker-based parsing first
  if (isWorkerAvailable()) {
    try {
      const sheets = await parseXLSXSecure(file);
      // For secure parsing, we need to detect format from the sheets
      // Fall back to regular parsing for format detection
      return parseXLSXUnified(file);
    } catch {
      console.warn("[Security] Secure parsing failed, falling back to main thread");
    }
  }
  
  // Fallback to regular parsing
  return parseXLSXUnified(file);
}

// ============================================
// Unified XLSX Parser with Format Detection
// ============================================

export type UnifiedParseResult = {
  canonical: CanonicalDataset;
  format: "CANONICAL" | "BUSINESS";
  detection: FormatDetectionResult;
};

export async function parseXLSXUnified(file: File): Promise<UnifiedParseResult> {
  // Validate file before parsing
  const validation = validateFileBeforeParse(file);
  if (!validation.valid) {
    throw new Error(`Datei ungültig: ${validation.errors.join(", ")}`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        
        // Step 1: Detect format
        const detection = detectFormat(workbook);
        
        if (detection.format === "CANONICAL") {
          // Use existing canonical parser
          const sheets = parseCanonicalSheets(workbook);
          const canonical = transformToCanonical(sheets);
          resolve({ canonical, format: "CANONICAL", detection });
          
        } else if (detection.format === "BUSINESS") {
          // Use new business parser
          const business = parseBusinessFormat(workbook, detection, file.name);
          const canonical = mapBusinessToCanonical(business);
          resolve({ canonical, format: "BUSINESS", detection });
          
        } else {
          reject(new Error(
            "Unbekanntes Dateiformat. Erwartet: Canonical (mit meta, mobile_tariffs) " +
            "oder Business (mit mtl. Grundpreis, FH-Partner)."
          ));
        }
      } catch (err) {
        reject(new Error(`XLSX parsing failed: ${err instanceof Error ? err.message : "Unknown error"}`));
      }
    };
    
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsArrayBuffer(file);
  });
}

// Parse canonical format sheets (reuses existing normalizeRows)
function parseCanonicalSheets(workbook: XLSX.WorkBook): ParsedSheets {
  const result: ParsedSheets = {};
  
  for (const sheetName of Object.keys(TEMPLATE_SCHEMA)) {
    const sheet = workbook.Sheets[sheetName];
    if (sheet) {
      const rows = XLSX.utils.sheet_to_json(sheet, {
        defval: null,
        raw: false,
      });
      result[sheetName as keyof ParsedSheets] = normalizeRows(rows as Record<string, unknown>[]);
    }
  }
  
  return result;
}
