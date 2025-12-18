// ============================================
// Business Format Parser
// Parses SoHo/PK XLSX with mtl. Grundpreis, FH-Partner, OMO columns
// ============================================

import * as XLSX from "xlsx";
import type { 
  BusinessDataset, 
  BusinessTariffRow, 
  BusinessHardwareRow,
  OmoMatrix,
  BusinessSheetType,
  FormatDetectionResult,
} from "./types";

// OMO Regex for dynamic column detection
const OMO_HEADER_REGEX = /omo\s*rabatt\s*(\d+(?:[,.]\d+)?)\s*%/i;

// RV-Code Regex
const RV_CODE_REGEX = /RV\s*(\d+)/gi;

export function parseBusinessFormat(
  workbook: XLSX.WorkBook,
  detection: FormatDetectionResult,
  fileName: string
): BusinessDataset {
  const result: BusinessDataset = {
    meta: {
      sourceFileName: fileName,
      parsedAt: new Date().toISOString(),
      sheets: workbook.SheetNames,
    },
    tariffs: [],
    hardware: [],
    omoMapping: {},
  };
  
  for (const sheetInfo of detection.sheets) {
    const sheet = workbook.Sheets[sheetInfo.name];
    if (!sheet) continue;
    
    switch (sheetInfo.type) {
      case "TARIFF_WITH_OMO":
      case "TARIFF_WITHOUT_OMO":
        result.tariffs.push(...parseTariffSheet(sheet, sheetInfo));
        break;
      case "HARDWARE":
        result.hardware.push(...parseHardwareSheet(sheet));
        break;
      case "OMO_MAPPING":
        result.omoMapping = parseOmoMappingSheet(sheet);
        break;
    }
  }
  
  return result;
}

type HeaderInfo = { 
  col: number; 
  name: string; 
  omoPercent?: number;
};

function parseTariffSheet(
  sheet: XLSX.WorkSheet,
  sheetInfo: { name: string; type: BusinessSheetType }
): BusinessTariffRow[] {
  const rows: BusinessTariffRow[] = [];
  
  if (!sheet["!ref"]) return rows;
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  
  // Parse headers (Row 1 = index 0)
  const headers: HeaderInfo[] = [];
  
  for (let col = 0; col <= Math.min(range.e.c, 20); col++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: col })];
    const headerText = cell?.v ? String(cell.v).trim() : "";
    
    // Check for OMO column
    const omoMatch = headerText.match(OMO_HEADER_REGEX);
    if (omoMatch) {
      const percent = parseFloat(omoMatch[1].replace(",", "."));
      headers.push({ col, name: "omo", omoPercent: percent });
    } else {
      headers.push({ col, name: normalizeHeaderName(headerText) });
    }
  }
  
  // Derive category and contractType from sheet name
  const sheetNameLower = sheetInfo.name.toLowerCase();
  const category: "mobile" | "data" = sheetNameLower.includes("daten") ? "data" : "mobile";
  const contractType: "NEU" | "VVL" = sheetNameLower.includes("vvl") ? "VVL" : "NEU";
  
  // Parse data rows (starting from Row 3 = index 2, skip placeholder Row 2)
  for (let row = 2; row <= range.e.r; row++) {
    // Get cell A (raw name with RV codes)
    const cellA = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
    const rawName = cellA?.v ? String(cellA.v).trim() : "";
    
    // Skip empty rows or section headers
    if (!rawName || rawName === "-") continue;
    
    // Extract RV codes
    const rvCodes: string[] = [];
    let match;
    const rvRegex = new RegExp(RV_CODE_REGEX.source, RV_CODE_REGEX.flags);
    while ((match = rvRegex.exec(rawName)) !== null) {
      rvCodes.push(match[1]);
    }
    
    // Extract tariff name (after last RV code)
    const tarifName = rawName
      .replace(/RV\s*\d+[, ]*/gi, "")
      .trim();
    
    // Skip rows that are just section headers (no data)
    if (!tarifName) continue;
    
    // Parse values from other columns
    const values: Record<string, number | string | null> = {};
    const omo: OmoMatrix = {};
    
    for (const header of headers) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: header.col })];
      const value = parseBusinessValue(cell?.v, header.name);
      
      if (header.omoPercent !== undefined) {
        omo[header.omoPercent] = value as number | null;
      } else if (header.name) {
        values[header.name] = value;
      }
    }
    
    // Skip rows without a valid base price
    const basePrice = values["mtl_grundpreis"] ?? values["mtlgrundpreis"];
    if (basePrice === null || basePrice === undefined) continue;
    
    // Generate stable ID
    const id = generateStableId(sheetInfo.name, rawName, contractType);
    
    rows.push({
      id,
      rawName,
      rvCodes,
      tarifName,
      category,
      contractType,
      baseMonthlyNet: basePrice as number,
      fhPartnerNet: (values["fhpartner"] ?? values["fh_partner"]) as number | null,
      pushNet: values["push"] as number | null,
      dataVolumeText: (values["datenvolumen"] ?? values["daten_volumen"]) as string | null,
      laufzeitMonths: values["laufzeit"] as number | null,
      omo: Object.keys(omo).length > 0 ? omo : null,
      sourceSheet: sheetInfo.name,
      sourceRow: row + 1, // 1-based for display
    });
  }
  
  return rows;
}

function parseHardwareSheet(sheet: XLSX.WorkSheet): BusinessHardwareRow[] {
  const rows: BusinessHardwareRow[] = [];
  
  if (!sheet["!ref"]) return rows;
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  
  // Start from Row 3 (skip header + placeholder)
  for (let row = 2; row <= range.e.r; row++) {
    const cellA = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
    const cellB = sheet[XLSX.utils.encode_cell({ r: row, c: 1 })];
    
    const displayName = cellA?.v ? String(cellA.v).trim() : "";
    const priceRaw = cellB?.v;
    
    // Skip placeholder rows
    if (!displayName || displayName === "-") continue;
    
    const price = parseBusinessValue(priceRaw, "preis") as number ?? 0;
    
    // Skip placeholder rows (0.001€ or negative)
    if (price <= 0.01) continue;
    
    rows.push({
      id: slugify(displayName),
      displayName,
      ekNet: price,
      sourceRow: row + 1,
    });
  }
  
  return rows;
}

function parseOmoMappingSheet(sheet: XLSX.WorkSheet): OmoMatrix {
  const mapping: OmoMatrix = {};
  
  if (!sheet["!ref"]) return mapping;
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  
  for (let row = 1; row <= range.e.r; row++) {
    const cellA = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
    const cellB = sheet[XLSX.utils.encode_cell({ r: row, c: 1 })];
    
    const label = cellA?.v ? String(cellA.v) : "";
    const percentMatch = label.match(/(\d+(?:[,.]\d+)?)\s*%/);
    
    if (percentMatch) {
      const percent = parseFloat(percentMatch[1].replace(",", "."));
      const value = parseBusinessValue(cellB?.v, "value");
      mapping[percent] = value as number | null;
    }
  }
  
  return mapping;
}

// === Helper Functions (exported for testing) ===

export function normalizeHeaderName(header: string): string {
  return header
    .toLowerCase()
    .replace(/[äöü]/g, c => ({ "ä": "ae", "ö": "oe", "ü": "ue" }[c] || c))
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^|_$/g, "");
}

export function parseBusinessValue(
  value: unknown, 
  columnType: string
): number | string | null {
  if (value === null || value === undefined || value === "") return null;
  
  const strValue = String(value).trim();
  
  // "Nicht gültig" → null
  if (strValue.toLowerCase() === "nicht gültig") return null;
  
  // "-" → null for numeric, keep as string for text columns
  if (strValue === "-") {
    return columnType === "datenvolumen" || columnType === "daten_volumen" 
      ? "-" 
      : null;
  }
  
  // Text columns (Datenvolumen) - preserve string
  if (columnType === "datenvolumen" || columnType === "daten_volumen") {
    return strValue;
  }
  
  // Numeric columns: handle direct numbers first
  if (typeof value === "number") return value;
  
  // Parse Euro format: "11,00 €", "- 7,50 €", "-€", etc.
  const euroMatch = strValue.match(/(-?\s*\d+(?:[,.]\d+)?)\s*€?/);
  if (euroMatch) {
    const numStr = euroMatch[1].replace(/\s/g, "").replace(",", ".");
    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
  }
  
  // Try direct parse (German comma separator)
  const numStr = strValue.replace(",", ".");
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
}

export function generateStableId(
  sheetName: string, 
  rawName: string, 
  contractType: string
): string {
  const base = `${slugify(sheetName)}_${slugify(rawName)}_${contractType.toLowerCase()}`;
  return base.substring(0, 60);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöü]/g, c => ({ "ä": "ae", "ö": "oe", "ü": "ue" }[c] || c))
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^|_$/g, "")
    .substring(0, 30);
}
