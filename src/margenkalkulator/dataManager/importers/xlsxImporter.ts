// ============================================
// XLSX Importer using SheetJS
// Supports both Canonical and Business formats
// ============================================

import * as XLSX from "xlsx";
import { TEMPLATE_SCHEMA } from "../schema";
import type { ParsedSheets, CanonicalDataset } from "../types";
import { detectFormat, type FormatDetectionResult } from "../businessFormat/detector";
import { parseBusinessFormat } from "../businessFormat/parser";
import { mapBusinessToCanonical } from "../businessFormat/mapper";
import { transformToCanonical } from "../adapter";

export async function parseXLSX(file: File): Promise<ParsedSheets> {
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
  
  // String cleanup
  return String(value).trim();
}

// Get available sheet names from a workbook
export async function getSheetNames(file: File): Promise<string[]> {
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

// ============================================
// Unified XLSX Parser with Format Detection
// ============================================

export type UnifiedParseResult = {
  canonical: CanonicalDataset;
  format: "CANONICAL" | "BUSINESS";
  detection: FormatDetectionResult;
};

export async function parseXLSXUnified(file: File): Promise<UnifiedParseResult> {
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
