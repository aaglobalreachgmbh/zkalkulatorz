// ============================================
// OMO Matrix Importer
// Supports XLSX/CSV for omo_matrix
// ============================================

import * as XLSX from "xlsx";
import type { OMOMatrixRow } from "../types";

export type OMOValidationResult = {
  isValid: boolean;
  errors: { row?: number; field: string; message: string }[];
  warnings: string[];
};

// ============================================
// XLSX Parser
// ============================================

export async function parseOMOMatrixXLSX(file: File): Promise<OMOMatrixRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        
        const sheetNames = [
          "omo_matrix", "OMO-Matrix", "OMO Matrix", "omo", "OMO", "Provisionsabzüge"
        ];
        let sheet: XLSX.WorkSheet | undefined;
        
        for (const name of sheetNames) {
          if (workbook.Sheets[name]) {
            sheet = workbook.Sheets[name];
            break;
          }
        }
        
        if (!sheet) {
          // Return empty array if no OMO sheet found
          resolve([]);
          return;
        }
        
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
        const normalized = normalizeOMORows(rows as Record<string, unknown>[]);
        resolve(normalized);
        
      } catch (err) {
        reject(new Error(`XLSX parsing failed: ${err instanceof Error ? err.message : "Unknown error"}`));
      }
    };
    
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsArrayBuffer(file);
  });
}

// ============================================
// Row Normalization
// ============================================

function normalizeOMORows(rows: Record<string, unknown>[]): OMOMatrixRow[] {
  return rows
    .filter(row => {
      const id = row.tariff_id || row.tariffId || row.TarifID || row.Tarif || row.id;
      return id && String(id).trim() !== "";
    })
    .map(row => {
      const tariffId = String(
        row.tariff_id || row.tariffId || row.TarifID || row.Tarif || row.id || ""
      ).trim();
      
      // Support multiple column name formats
      // OMO values: positive = absolute deduction amount, null = locked
      const omo0 = parseOMOValue(row.omo_0 || row.OMO0 || row["OMO 0%"] || row["0%"]);
      const omo5 = parseOMOValue(row.omo_5 || row.OMO5 || row["OMO 5%"] || row["5%"]);
      const omo10 = parseOMOValue(row.omo_10 || row.OMO10 || row["OMO 10%"] || row["10%"]);
      const omo15 = parseOMOValue(row.omo_15 || row.OMO15 || row["OMO 15%"] || row["15%"]);
      const omo175 = parseOMOValue(row.omo_17_5 || row["OMO17.5"] || row.OMO175 || row["OMO 17.5%"] || row["17.5%"]);
      const omo20 = parseOMOValue(row.omo_20 || row.OMO20 || row["OMO 20%"] || row["20%"]);
      const omo25 = parseOMOValue(row.omo_25 || row.OMO25 || row["OMO 25%"] || row["25%"]);
      
      return {
        tariff_id: tariffId,
        omo_0: omo0 ?? 0,
        omo_5: omo5,
        omo_10: omo10,
        omo_15: omo15,
        omo_17_5: omo175,
        omo_20: omo20,
        omo_25: omo25,
        notes: row.notes ? String(row.notes) : undefined,
      };
    });
}

/**
 * Parse OMO value - handles special cases:
 * - "-" or "x" or "locked" = null (locked/not available)
 * - Empty = null (not set)
 * - Number = deduction amount
 */
function parseOMOValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  
  const strVal = String(value).toLowerCase().trim();
  
  // Check for "locked" indicators
  if (strVal === "-" || strVal === "x" || strVal === "locked" || strVal === "gesperrt" || strVal === "n/a") {
    return null;
  }
  
  // Parse as number
  const numStr = strVal.replace(",", ".").replace("€", "");
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
}

// ============================================
// Validation
// ============================================

export function validateOMOMatrixRows(rows: OMOMatrixRow[]): OMOValidationResult {
  const errors: OMOValidationResult["errors"] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();
  
  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    
    if (!row.tariff_id) {
      errors.push({ row: rowNum, field: "tariff_id", message: "Tarif-ID fehlt" });
    } else if (seenIds.has(row.tariff_id)) {
      errors.push({ row: rowNum, field: "tariff_id", message: `Doppelte Tarif-ID: ${row.tariff_id}` });
    } else {
      seenIds.add(row.tariff_id);
    }
    
    // Validate progression (higher OMO should have higher deduction)
    const values = [
      { rate: 0, val: row.omo_0 },
      { rate: 5, val: row.omo_5 },
      { rate: 10, val: row.omo_10 },
      { rate: 15, val: row.omo_15 },
      { rate: 17.5, val: row.omo_17_5 },
      { rate: 20, val: row.omo_20 },
      { rate: 25, val: row.omo_25 },
    ].filter(v => v.val !== null);
    
    for (let i = 1; i < values.length; i++) {
      if (values[i].val! < values[i - 1].val!) {
        warnings.push(
          `Zeile ${rowNum}: OMO${values[i].rate}% Abzug (${values[i].val}€) ist kleiner als OMO${values[i - 1].rate}% (${values[i - 1].val}€)`
        );
      }
    }
    
    // Warn about very high deductions
    const maxDeduction = Math.max(...values.map(v => v.val ?? 0));
    if (maxDeduction > 200) {
      warnings.push(`Zeile ${rowNum}: Sehr hoher Provisionsabzug (${maxDeduction}€) für ${row.tariff_id}`);
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

export type OMODiffItem = {
  tariffId: string;
  type: "added" | "changed" | "removed";
  changes?: string[];
};

export type OMODiffResult = {
  items: OMODiffItem[];
  summary: { added: number; changed: number; removed: number };
};

export function diffOMOMatrix(
  current: OMOMatrixRow[],
  next: OMOMatrixRow[]
): OMODiffResult {
  const currentMap = new Map(current.map(r => [r.tariff_id, r]));
  const nextMap = new Map(next.map(r => [r.tariff_id, r]));
  const items: OMODiffItem[] = [];
  
  for (const [id] of nextMap) {
    if (!currentMap.has(id)) {
      items.push({ tariffId: id, type: "added" });
    }
  }
  
  for (const [id] of currentMap) {
    if (!nextMap.has(id)) {
      items.push({ tariffId: id, type: "removed" });
    }
  }
  
  for (const [id, nextRow] of nextMap) {
    const curr = currentMap.get(id);
    if (curr) {
      const changes: string[] = [];
      
      const compareField = (name: string, currVal: number | null, nextVal: number | null) => {
        if (currVal !== nextVal) {
          const currStr = currVal === null ? "locked" : `${currVal}€`;
          const nextStr = nextVal === null ? "locked" : `${nextVal}€`;
          changes.push(`${name}: ${currStr} → ${nextStr}`);
        }
      };
      
      compareField("OMO5", curr.omo_5, nextRow.omo_5);
      compareField("OMO10", curr.omo_10, nextRow.omo_10);
      compareField("OMO15", curr.omo_15, nextRow.omo_15);
      compareField("OMO17.5", curr.omo_17_5, nextRow.omo_17_5);
      compareField("OMO20", curr.omo_20, nextRow.omo_20);
      compareField("OMO25", curr.omo_25, nextRow.omo_25);
      
      if (changes.length > 0) {
        items.push({ tariffId: id, type: "changed", changes });
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
// Convert to Engine Format
// ============================================

/**
 * Convert OMO matrix row to engine omoMatrix format
 */
export function toEngineOMOMatrix(row: OMOMatrixRow): Record<number, number | null> {
  return {
    0: row.omo_0,
    5: row.omo_5,
    10: row.omo_10,
    15: row.omo_15,
    17.5: row.omo_17_5,
    20: row.omo_20,
    25: row.omo_25,
  };
}
