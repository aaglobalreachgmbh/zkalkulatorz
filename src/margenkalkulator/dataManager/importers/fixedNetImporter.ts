// ============================================
// Fixed-Net Product Importer
// Supports XLSX/CSV for Cable, DSL, Fiber, Komfort
// ============================================

import * as XLSX from "xlsx";
import type { FixedNetProductRow } from "../types";

export type FixedNetValidationResult = {
  isValid: boolean;
  errors: { row?: number; field: string; message: string }[];
  warnings: string[];
};

// ============================================
// XLSX Parser
// ============================================

export async function parseFixedNetXLSX(file: File): Promise<FixedNetProductRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        
        const sheetNames = [
          "fixednet_products", "Festnetz", "fixednet", "Fixed Net",
          "Cable", "DSL", "Fiber", "Internet"
        ];
        let sheet: XLSX.WorkSheet | undefined;
        
        for (const name of sheetNames) {
          if (workbook.Sheets[name]) {
            sheet = workbook.Sheets[name];
            break;
          }
        }
        
        if (!sheet && workbook.SheetNames.length > 0) {
          sheet = workbook.Sheets[workbook.SheetNames[0]];
        }
        
        if (!sheet) {
          reject(new Error("Kein Festnetz-Sheet gefunden"));
          return;
        }
        
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
        const normalized = normalizeFixedNetRows(rows as Record<string, unknown>[]);
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

export function normalizeFixedNetRows(rows: Record<string, unknown>[]): FixedNetProductRow[] {
  return rows
    .filter(row => {
      const id = row.id || row.ID;
      return id && String(id).trim() !== "";
    })
    .map(row => {
      const id = String(row.id || row.ID || "").trim();
      const accessType = String(row.access_type || row.accessType || row.Zugangsart || "CABLE").toUpperCase();
      const variant = row.variant ? String(row.variant) : undefined;
      const name = String(row.name || row.Name || "").trim();
      const minTermMonths = parseGermanNumber(row.minTermMonths || row.min_term_months || row.Laufzeit || 24) ?? 24;
      const speed = parseGermanNumber(row.speed || row.Speed || row.Geschwindigkeit);
      const speedLabel = row.speed_label || row.speedLabel || (speed ? `${speed} Mbit/s` : undefined);
      const monthlyNet = parseGermanNumber(row.monthly_net || row.monthlyNet || row.Preis || row.mtl_netto) ?? 0;
      
      return {
        id,
        access_type: accessType,
        variant,
        name,
        minTermMonths,
        speed_label: speedLabel ? String(speedLabel) : undefined,
        speed,
        monthly_net: monthlyNet,
        router_included: parseBool(row.router_included ?? row.routerIncluded ?? true),
        router_model: row.router_model ? String(row.router_model) : undefined,
        one_time_setup_net: parseGermanNumber(row.one_time_setup_net || row.setupFee || row.Anschluss) ?? 0,
        one_time_shipping_net: parseGermanNumber(row.one_time_shipping_net || row.shippingFee || row.Versand) ?? 0,
        fixed_ip_included: parseBool(row.fixed_ip_included ?? row.fixedIpIncluded ?? false),
        fixed_ip_addon_net: parseGermanNumber(row.fixed_ip_addon_net || row.fixedIpAddon),
        optional_expert_install_net: parseGermanNumber(row.optional_expert_install_net || row.expertSetup),
        sort_order: parseGermanNumber(row.sort_order) ?? 999,
        active: parseBool(row.active ?? row.aktiv ?? true),
      };
    });
}

// ============================================
// Validation
// ============================================

export function validateFixedNetRows(rows: FixedNetProductRow[]): FixedNetValidationResult {
  const errors: FixedNetValidationResult["errors"] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();
  const validAccessTypes = ["CABLE", "DSL", "FIBER", "KOMFORT_REGIO", "KOMFORT_FTTH"];
  
  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    
    if (!row.id) {
      errors.push({ row: rowNum, field: "id", message: "Produkt-ID fehlt" });
    } else if (seenIds.has(row.id)) {
      errors.push({ row: rowNum, field: "id", message: `Doppelte ID: ${row.id}` });
    } else {
      seenIds.add(row.id);
    }
    
    if (!row.name) {
      errors.push({ row: rowNum, field: "name", message: "Produktname fehlt" });
    }
    
    if (!validAccessTypes.includes(row.access_type)) {
      errors.push({ 
        row: rowNum, 
        field: "access_type", 
        message: `Ungültige Zugangsart: ${row.access_type}. Erlaubt: ${validAccessTypes.join(", ")}` 
      });
    }
    
    if (row.monthly_net < 0) {
      errors.push({ row: rowNum, field: "monthly_net", message: "Negativer Monatspreis" });
    }
    
    // Warnings
    if (row.monthly_net > 200) {
      warnings.push(`Zeile ${rowNum}: Hoher Monatspreis (${row.monthly_net}€) für ${row.name}`);
    }
    
    if (row.speed && row.speed > 2000) {
      warnings.push(`Zeile ${rowNum}: Sehr hohe Geschwindigkeit (${row.speed} Mbit/s)`);
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

export type FixedNetDiffItem = {
  id: string;
  type: "added" | "changed" | "removed";
  name?: string;
  accessType?: string;
  changes?: string[];
};

export type FixedNetDiffResult = {
  items: FixedNetDiffItem[];
  summary: { added: number; changed: number; removed: number };
};

export function diffFixedNet(
  current: FixedNetProductRow[],
  next: FixedNetProductRow[]
): FixedNetDiffResult {
  const currentMap = new Map(current.map(p => [p.id, p]));
  const nextMap = new Map(next.map(p => [p.id, p]));
  const items: FixedNetDiffItem[] = [];
  
  for (const [id, product] of nextMap) {
    if (!currentMap.has(id)) {
      items.push({ id, type: "added", name: product.name, accessType: product.access_type });
    }
  }
  
  for (const [id, product] of currentMap) {
    if (!nextMap.has(id)) {
      items.push({ id, type: "removed", name: product.name, accessType: product.access_type });
    }
  }
  
  for (const [id, nextProduct] of nextMap) {
    const curr = currentMap.get(id);
    if (curr) {
      const changes: string[] = [];
      if (curr.monthly_net !== nextProduct.monthly_net) {
        changes.push(`Preis: ${curr.monthly_net}€ → ${nextProduct.monthly_net}€`);
      }
      if (curr.speed !== nextProduct.speed) {
        changes.push(`Speed: ${curr.speed} → ${nextProduct.speed} Mbit/s`);
      }
      if (curr.name !== nextProduct.name) {
        changes.push(`Name: ${curr.name} → ${nextProduct.name}`);
      }
      if (changes.length > 0) {
        items.push({ id, type: "changed", name: nextProduct.name, accessType: nextProduct.access_type, changes });
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
// Helpers
// ============================================

function parseGermanNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numStr = String(value).replace(",", ".").replace("€", "").trim();
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
}

function parseBool(value: unknown): boolean {
  return value === true || value === "true" || value === "1" || value === "ja" || value === "TRUE";
}
