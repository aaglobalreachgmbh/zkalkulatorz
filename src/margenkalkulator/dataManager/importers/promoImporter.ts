// ============================================
// Promo/Action Importer
// Supports XLSX/CSV for promos_possible
// ============================================

import * as XLSX from "xlsx";
import type { PromoDefinitionRow } from "../types";

export type PromoValidationResult = {
  isValid: boolean;
  errors: { row?: number; field: string; message: string }[];
  warnings: string[];
};

// ============================================
// XLSX Parser
// ============================================

export async function parsePromoXLSX(file: File): Promise<PromoDefinitionRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        
        const sheetNames = [
          "promos_possible", "Aktionen", "Promos", "promos", "Rabatte"
        ];
        let sheet: XLSX.WorkSheet | undefined;
        
        for (const name of sheetNames) {
          if (workbook.Sheets[name]) {
            sheet = workbook.Sheets[name];
            break;
          }
        }
        
        if (!sheet) {
          // Return empty array if no promo sheet found
          resolve([]);
          return;
        }
        
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
        const normalized = normalizePromoRows(rows as Record<string, unknown>[]);
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

function normalizePromoRows(rows: Record<string, unknown>[]): PromoDefinitionRow[] {
  return rows
    .filter(row => {
      const id = row.id || row.ID;
      return id && String(id).trim() !== "";
    })
    .map(row => {
      const id = String(row.id || row.ID || "").trim();
      const label = row.label || row.Label || row.Name || row.name;
      const appliesTo = String(row.applies_to || row.appliesTo || row.gilt_für || "mobile").toLowerCase();
      const typeRaw = String(row.type || row.Type || row.Typ || "INTRO_PRICE").toUpperCase();
      const durationMonths = parseGermanNumber(row.duration_months || row.durationMonths || row.Dauer) ?? 24;
      
      // Type-specific values
      const pct = parseGermanNumber(row.pct || row.prozent || row.Prozent);
      const amountNet = parseGermanNumber(row.amount_net || row.betrag || row.Betrag);
      const introNet = parseGermanNumber(row.intro_net || row.introPreis || row.IntroPreis);
      
      // Validity dates
      const validFrom = row.valid_from || row.validFrom || row.gültig_ab || row.von;
      const validUntil = row.valid_until || row.validUntil || row.gültig_bis || row.bis;
      
      return {
        id,
        label: label ? String(label) : undefined,
        applies_to: (appliesTo === "fixed" || appliesTo === "festnetz") 
          ? "fixed" 
          : appliesTo === "both" ? "both" : "mobile",
        type: typeRaw as "PCT_OFF_BASE" | "ABS_OFF_BASE" | "INTRO_PRICE",
        duration_months: durationMonths,
        pct: pct ?? undefined,
        amount_net: amountNet ?? undefined,
        intro_net: introNet ?? undefined,
        valid_from: validFrom ? String(validFrom) : undefined,
        valid_until: validUntil ? String(validUntil) : undefined,
        eligibility_note: row.eligibility_note ? String(row.eligibility_note) : undefined,
      };
    });
}

// ============================================
// Validation
// ============================================

export function validatePromoRows(rows: PromoDefinitionRow[]): PromoValidationResult {
  const errors: PromoValidationResult["errors"] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();
  const validTypes = ["PCT_OFF_BASE", "ABS_OFF_BASE", "INTRO_PRICE"];
  
  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    
    if (!row.id) {
      errors.push({ row: rowNum, field: "id", message: "Promo-ID fehlt" });
    } else if (seenIds.has(row.id)) {
      errors.push({ row: rowNum, field: "id", message: `Doppelte ID: ${row.id}` });
    } else {
      seenIds.add(row.id);
    }
    
    if (!validTypes.includes(row.type)) {
      errors.push({ 
        row: rowNum, 
        field: "type", 
        message: `Ungültiger Typ: ${row.type}. Erlaubt: ${validTypes.join(", ")}` 
      });
    }
    
    // Type-specific validation
    if (row.type === "PCT_OFF_BASE" && (row.pct === undefined || row.pct <= 0 || row.pct > 1)) {
      errors.push({ row: rowNum, field: "pct", message: "PCT_OFF_BASE erfordert pct (0-1)" });
    }
    
    if (row.type === "ABS_OFF_BASE" && (row.amount_net === undefined || row.amount_net <= 0)) {
      errors.push({ row: rowNum, field: "amount_net", message: "ABS_OFF_BASE erfordert amount_net > 0" });
    }
    
    if (row.type === "INTRO_PRICE" && row.intro_net === undefined) {
      warnings.push(`Zeile ${rowNum}: INTRO_PRICE ohne intro_net (wird 0 angenommen)`);
    }
    
    // Date validation
    if (row.valid_from && row.valid_until) {
      if (row.valid_from > row.valid_until) {
        errors.push({ row: rowNum, field: "valid_from", message: "Startdatum nach Enddatum" });
      }
    }
    
    // Duration validation
    if (row.duration_months < 0 || row.duration_months > 120) {
      warnings.push(`Zeile ${rowNum}: Ungewöhnliche Dauer: ${row.duration_months} Monate`);
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

export type PromoDiffItem = {
  id: string;
  type: "added" | "changed" | "removed";
  label?: string;
  changes?: string[];
};

export type PromoDiffResult = {
  items: PromoDiffItem[];
  summary: { added: number; changed: number; removed: number };
};

export function diffPromos(
  current: PromoDefinitionRow[],
  next: PromoDefinitionRow[]
): PromoDiffResult {
  const currentMap = new Map(current.map(p => [p.id, p]));
  const nextMap = new Map(next.map(p => [p.id, p]));
  const items: PromoDiffItem[] = [];
  
  for (const [id, promo] of nextMap) {
    if (!currentMap.has(id)) {
      items.push({ id, type: "added", label: promo.label });
    }
  }
  
  for (const [id, promo] of currentMap) {
    if (!nextMap.has(id)) {
      items.push({ id, type: "removed", label: promo.label });
    }
  }
  
  for (const [id, nextPromo] of nextMap) {
    const curr = currentMap.get(id);
    if (curr) {
      const changes: string[] = [];
      if (curr.type !== nextPromo.type) {
        changes.push(`Typ: ${curr.type} → ${nextPromo.type}`);
      }
      if (curr.duration_months !== nextPromo.duration_months) {
        changes.push(`Dauer: ${curr.duration_months} → ${nextPromo.duration_months} Monate`);
      }
      if (curr.pct !== nextPromo.pct) {
        changes.push(`Prozent: ${(curr.pct ?? 0) * 100}% → ${(nextPromo.pct ?? 0) * 100}%`);
      }
      if (curr.valid_until !== nextPromo.valid_until) {
        changes.push(`Gültig bis: ${curr.valid_until || "-"} → ${nextPromo.valid_until || "-"}`);
      }
      if (changes.length > 0) {
        items.push({ id, type: "changed", label: nextPromo.label, changes });
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
  const numStr = String(value).replace(",", ".").replace("%", "").replace("€", "").trim();
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
}
