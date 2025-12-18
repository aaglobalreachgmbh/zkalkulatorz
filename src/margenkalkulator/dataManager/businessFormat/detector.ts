// ============================================
// Business Format Detector
// Distinguishes between Canonical and Business XLSX formats
// ============================================

import * as XLSX from "xlsx";
import type { BusinessSheetType, FormatDetectionResult } from "./types";

// Header patterns for detection
const BUSINESS_REQUIRED_HEADERS = ["mtl. grundpreis", "fh-partner", "push", "datenvolumen"];
const OMO_HEADER_REGEX = /omo\s*rabatt\s*(\d+(?:[,\.]\d+)?)\s*%/i;
const HARDWARE_HEADERS = ["endgerät", "preis"];
const CANONICAL_SHEETS = ["meta", "mobile_tariffs", "fixednet_products"];

export function detectFormat(workbook: XLSX.WorkBook): FormatDetectionResult {
  const sheetNames = workbook.SheetNames.map(s => s.toLowerCase());
  
  // Check for Canonical format (exact sheet names)
  const hasCanonicalSheets = CANONICAL_SHEETS.every(s => 
    sheetNames.includes(s)
  );
  
  if (hasCanonicalSheets) {
    return {
      format: "CANONICAL",
      confidence: "HIGH",
      reason: "Canonical sheet names found (meta, mobile_tariffs, fixednet_products)",
      sheets: [],
    };
  }
  
  // Check for Business format (header-based)
  const detectedSheets: FormatDetectionResult["sheets"] = [];
  
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const sheetType = detectSheetType(sheet);
    
    if (sheetType !== "UNKNOWN") {
      detectedSheets.push({
        name: sheetName,
        type: sheetType,
        headerRow: 1,
      });
    }
  }
  
  if (detectedSheets.length > 0) {
    const hasTariffSheets = detectedSheets.some(s => 
      s.type === "TARIFF_WITH_OMO" || s.type === "TARIFF_WITHOUT_OMO"
    );
    
    return {
      format: "BUSINESS",
      confidence: detectedSheets.length >= 3 && hasTariffSheets ? "HIGH" : "MEDIUM",
      reason: `Business format headers found in ${detectedSheets.length} sheets`,
      sheets: detectedSheets,
    };
  }
  
  return {
    format: "UNKNOWN",
    confidence: "LOW",
    reason: "Could not detect format - neither Canonical nor Business headers found",
    sheets: [],
  };
}

function detectSheetType(sheet: XLSX.WorkSheet): BusinessSheetType {
  if (!sheet["!ref"]) return "UNKNOWN";
  
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const headers: string[] = [];
  
  // Get first row as header
  for (let col = range.s.c; col <= Math.min(range.e.c, 15); col++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: col })];
    if (cell?.v) {
      headers.push(String(cell.v).toLowerCase().trim());
    }
  }
  
  // Check for Hardware format first (simpler pattern)
  const hasHardwareHeaders = HARDWARE_HEADERS.every(h => 
    headers.some(header => header.includes(h))
  );
  if (hasHardwareHeaders) {
    return "HARDWARE";
  }
  
  // Check for Tariff format
  const hasTariffHeaders = BUSINESS_REQUIRED_HEADERS.every(h => {
    const normalizedH = h.replace("-", "").replace(".", "");
    return headers.some(header => {
      const normalizedHeader = header.replace("-", "").replace(".", "");
      return normalizedHeader.includes(normalizedH);
    });
  });
  
  if (hasTariffHeaders) {
    const hasOmo = headers.some(h => OMO_HEADER_REGEX.test(h));
    return hasOmo ? "TARIFF_WITH_OMO" : "TARIFF_WITHOUT_OMO";
  }
  
  // Check for OMO Mapping sheet
  if (headers.some(h => h.includes("omo rabatt") || h.startsWith("omo"))) {
    return "OMO_MAPPING";
  }
  
  return "UNKNOWN";
}

// Re-export types for convenience
export type { FormatDetectionResult, BusinessSheetType };
