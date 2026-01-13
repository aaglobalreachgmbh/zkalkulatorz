// ============================================
// Hardware-Only Importer
// Supports XLSX (via ExcelJS) and CSV for hardware_catalog only
// ============================================

import ExcelJS from "exceljs";
import Papa from "papaparse";
import type { HardwareItemRow } from "../types";

// Re-export the type for consumers
export type { HardwareItemRow } from "../types";

export type HardwareValidationResult = {
  isValid: boolean;
  errors: { row?: number; field: string; message: string }[];
  warnings: string[];
};

export type HardwareDiffItem = {
  id: string;
  type: "added" | "changed" | "removed";
  brand?: string;
  model?: string;
  oldEkNet?: number;
  newEkNet?: number;
  changes?: string[];
};

export type HardwareDiffResult = {
  items: HardwareDiffItem[];
  summary: {
    added: number;
    changed: number;
    removed: number;
  };
};

// ============================================
// XLSX Parser (Hardware-only)
// ============================================

export async function parseHardwareXLSX(file: File): Promise<HardwareItemRow[]> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // Find hardware sheet (try multiple names)
    const sheetNames = ["hardware_catalog", "hardware", "Hardware", "Geräte"];
    let sheet: ExcelJS.Worksheet | undefined;

    for (const name of sheetNames) {
      const found = workbook.getWorksheet(name);
      if (found) {
        sheet = found;
        break;
      }
    }

    // Fallback: use first sheet
    if (!sheet) {
      const firstSheet = workbook.worksheets[0];
      if (firstSheet) {
        sheet = firstSheet;
      }
    }

    if (!sheet) {
      throw new Error("Keine Hardware-Daten gefunden");
    }

    // Convert sheet to JSON
    // Row 1 is header
    const rows: Record<string, unknown>[] = [];
    const headers: string[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        // Parse headers
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = String(cell.value).trim();
        });
      } else {
        // Parse data
        const rowData: Record<string, unknown> = {};
        let hasData = false;

        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            // Handle Rich Text or simple values
            let cellValue = cell.value;
            if (typeof cellValue === 'object' && cellValue !== null && 'text' in cellValue) {
              // @ts-ignore
              cellValue = cellValue.text;
            } else if (typeof cellValue === 'object' && cellValue !== null && 'result' in cellValue) {
              // Formula result
              // @ts-ignore
              cellValue = cellValue.result;
            }

            rowData[header] = cellValue;
            hasData = true;
          }
        });

        if (hasData) {
          rows.push(rowData);
        }
      }
    });

    return normalizeHardwareRows(rows);

  } catch (err) {
    throw new Error(`XLSX parsing failed: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

// ============================================
// CSV Parser (Hardware-only)
// ============================================

export async function parseHardwareCSV(file: File): Promise<HardwareItemRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, "_"),
      complete: (results) => {
        const normalized = normalizeHardwareRows(results.data as Record<string, unknown>[]);
        resolve(normalized);
      },
      error: (err) => reject(new Error(`CSV parsing failed: ${err.message}`)),
    });
  });
}

// ============================================
// Row Normalization
// ============================================

function normalizeHardwareRows(rows: Record<string, unknown>[]): HardwareItemRow[] {
  return rows
    .filter(row => {
      // Skip empty rows
      const id = row.id || row.ID || row.Id;
      return id && String(id).trim() !== "";
    })
    .map(row => {
      // Normalize column names (support various formats)
      const id = String(row.id || row.ID || row.Id || "").trim();
      const brand = String(row.brand || row.Brand || row.Marke || row.MARKE || "").trim();
      const model = String(row.model || row.Model || row.Modell || row.MODELL || row.endgerät || row.Endgerät || "").trim();
      const category = String(row.category || row.Category || row.Kategorie || "smartphone").toLowerCase().trim();

      // EK Net with German number format support
      const ekRaw = row.ek_net || row.ekNet || row.EK_Net || row.preis || row.Preis || row.PREIS || row["ek netto"] || 0;
      const ekNet = parseGermanNumber(ekRaw);

      const sortOrderRaw = row.sort_order || row.sortOrder || row.SortOrder || row.reihenfolge || 999;
      const sortOrder = parseGermanNumber(sortOrderRaw) ?? 999;

      const activeRaw = row.active ?? row.Active ?? row.aktiv ?? true;
      const active = activeRaw === true || activeRaw === "true" || activeRaw === "1" || activeRaw === "ja" || activeRaw === "TRUE";

      return {
        id,
        brand,
        model,
        category: category as HardwareItemRow["category"],
        ek_net: ekNet ?? 0,
        sort_order: sortOrder,
        active,
      };
    });
}

function parseGermanNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  // Handle German format: 799,00 -> 799.00
  const numStr = String(value).replace(",", ".").trim();
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
}

// ============================================
// Validation
// ============================================

export function validateHardwareRows(rows: HardwareItemRow[]): HardwareValidationResult {
  const errors: HardwareValidationResult["errors"] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // Excel row (header is row 1)

    // Required: id
    if (!row.id || row.id.trim() === "") {
      errors.push({ row: rowNum, field: "id", message: "ID fehlt" });
    } else {
      // Check duplicate
      if (seenIds.has(row.id)) {
        errors.push({ row: rowNum, field: "id", message: `Doppelte ID: ${row.id}` });
      }
      seenIds.add(row.id);
    }

    // Required: brand
    if (!row.brand || row.brand.trim() === "") {
      errors.push({ row: rowNum, field: "brand", message: "Marke fehlt" });
    }

    // Required: model
    if (!row.model || row.model.trim() === "") {
      errors.push({ row: rowNum, field: "model", message: "Modell fehlt" });
    }

    // Required: ek_net must be non-negative
    if (row.ek_net === null || row.ek_net === undefined) {
      errors.push({ row: rowNum, field: "ek_net", message: "EK Netto fehlt" });
    } else if (row.ek_net < 0) {
      errors.push({ row: rowNum, field: "ek_net", message: `Negativer Preis: ${row.ek_net}` });
    }

    // Warning: very high EK
    if (row.ek_net && row.ek_net > 2000) {
      warnings.push(`Zeile ${rowNum}: Hoher EK-Preis (${row.ek_net}€) für ${row.model}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================
// Diff Calculator
// ============================================

export function diffHardware(
  current: HardwareItemRow[],
  next: HardwareItemRow[]
): HardwareDiffResult {
  const currentMap = new Map(current.map(item => [item.id, item]));
  const nextMap = new Map(next.map(item => [item.id, item]));

  const items: HardwareDiffItem[] = [];

  // Added items
  for (const [id, nextItem] of nextMap) {
    if (!currentMap.has(id)) {
      items.push({
        id,
        type: "added",
        brand: nextItem.brand,
        model: nextItem.model,
        newEkNet: nextItem.ek_net,
      });
    }
  }

  // Removed items
  for (const [id, currentItem] of currentMap) {
    if (!nextMap.has(id)) {
      items.push({
        id,
        type: "removed",
        brand: currentItem.brand,
        model: currentItem.model,
        oldEkNet: currentItem.ek_net,
      });
    }
  }

  // Changed items
  for (const [id, nextItem] of nextMap) {
    const currentItem = currentMap.get(id);
    if (currentItem) {
      const changes: string[] = [];

      if (currentItem.brand !== nextItem.brand) {
        changes.push(`Marke: ${currentItem.brand} -> ${nextItem.brand}`);
      }
      if (currentItem.model !== nextItem.model) {
        changes.push(`Modell: ${currentItem.model} -> ${nextItem.model}`);
      }
      if (currentItem.ek_net !== nextItem.ek_net) {
        changes.push(`EK: ${currentItem.ek_net}€ -> ${nextItem.ek_net}€`);
      }
      if (currentItem.category !== nextItem.category) {
        changes.push(`Kategorie: ${currentItem.category} -> ${nextItem.category}`);
      }

      if (changes.length > 0) {
        items.push({
          id,
          type: "changed",
          brand: nextItem.brand,
          model: nextItem.model,
          oldEkNet: currentItem.ek_net,
          newEkNet: nextItem.ek_net,
          changes,
        });
      }
    }
  }

  return {
    items,
    summary: {
      added: items.filter(i => i.type === "added").length,
      changed: items.filter(i => i.type === "changed").length,
      removed: items.filter(i => i.type === "removed").length,
    },
  };
}

// ============================================
// Template Generator
// ============================================

export async function generateHardwareTemplateWithExcelJS(): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("hardware_catalog");

  sheet.columns = [
    { header: "id", key: "id", width: 20 },
    { header: "brand", key: "brand", width: 15 },
    { header: "model", key: "model", width: 30 },
    { header: "category", key: "category", width: 15 },
    { header: "ek_net", key: "ek_net", width: 10 },
    { header: "sort_order", key: "sort_order", width: 10 },
    { header: "active", key: "active", width: 10 },
  ];

  sheet.addRow({ id: "iphone_16_128", brand: "Apple", model: "iPhone 16 128GB", category: "smartphone", ek_net: 779, sort_order: 10, active: true });
  sheet.addRow({ id: "samsung_s24", brand: "Samsung", model: "Galaxy S24", category: "smartphone", ek_net: 649, sort_order: 20, active: true });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}

export function generateHardwareTemplate(): Promise<Blob> {
  return generateHardwareTemplateWithExcelJS();
}
