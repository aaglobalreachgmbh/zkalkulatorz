// ============================================
// Mobile Tariff Importer
// Supports XLSX and CSV for mobile_tariffs
// ============================================

import { parseXLSX } from "./xlsxImporter";
import type { MobileTariffRow, OMOMatrixRow, ProvisionRow } from "../types";

export type MobileImportResult = {
  tariffs: MobileTariffRow[];
  omoMatrix: OMOMatrixRow[];
  provisions: ProvisionRow[];
};

export type MobileValidationResult = {
  isValid: boolean;
  errors: { row?: number; field: string; message: string; sheet?: string }[];
  warnings: string[];
};

// ============================================
// XLSX Parser (Mobile + OMO + Provisions)
// ============================================

export async function parseMobileXLSX(file: File): Promise<MobileImportResult> {
  // Use the central safe parser (ExcelJS based)
  const parsedData = await parseXLSX(file);

  const result: MobileImportResult = {
    tariffs: [],
    omoMatrix: [],
    provisions: [],
  };

  // Extract and normalize data from parsed sheets
  // The central parser uses canonical keys from TEMPLATE_SCHEMA

  if (parsedData.mobile_tariffs) {
    result.tariffs = normalizeMobileTariffRows(parsedData.mobile_tariffs);
  }

  if (parsedData.omo_matrix) {
    result.omoMatrix = normalizeOMOMatrixRows(parsedData.omo_matrix);
  }

  if (parsedData.provisions) {
    result.provisions = normalizeProvisionRows(parsedData.provisions);
  }

  return result;
}

// ============================================
// Row Normalization
// ============================================

function normalizeMobileTariffRows(rows: Record<string, unknown>[]): MobileTariffRow[] {
  return rows
    .filter(row => {
      const id = row.id || row.ID || row.Id;
      return id && String(id).trim() !== "";
    })
    .map(row => {
      const id = String(row.id || row.ID || "").trim();
      const family = String(row.family || row.Familie || "prime").toLowerCase().trim();
      const productLine = String(row.productLine || row.product_line || row.Produktlinie || "").trim();
      const name = String(row.name || row.Name || "").trim();
      const minTermMonths = parseGermanNumber(row.minTermMonths || row.min_term_months || row.Laufzeit || 24) ?? 24;
      const baseSim = parseGermanNumber(row.base_sim_only_net || row.baseSim || row.BasisPreis || 0) ?? 0;
      const dataDe = row.data_de || row.Datenvolumen || row.data || "unlimited";
      const dataDeValue: string | number = typeof dataDe === "string" && dataDe.toLowerCase() === "unlimited"
        ? "unlimited"
        : (parseGermanNumber(dataDe) ?? String(dataDe));
      return {
        id,
        family,
        productLine: productLine || undefined,
        name,
        minTermMonths,
        base_sim_only_net: baseSim,
        sub_basic_add_net: parseGermanNumber(row.sub_basic_add_net || row.sub5),
        sub_smartphone_add_net: parseGermanNumber(row.sub_smartphone_add_net || row.sub10),
        sub_premium_add_net: parseGermanNumber(row.sub_premium_add_net || row.sub20),
        sub_special_premium_add_net: parseGermanNumber(row.sub_special_premium_add_net || row.sub30),
        data_de: dataDeValue,
        eu_rule: row.eu_rule === "text" ? "text" : "numeric",
        eu_data_gb: parseGermanNumber(row.eu_data_gb),
        eu_note: row.eu_note ? String(row.eu_note) : null,
        one_number_count: parseGermanNumber(row.one_number_count),
        giga_depot: row.giga_depot ? String(row.giga_depot) : null,
        giga_depot_price: parseGermanNumber(row.giga_depot_price),
        roaming_zone1_gb: parseGermanNumber(row.roaming_zone1_gb),
        roaming_zone1_frequency: row.roaming_zone1_frequency ? String(row.roaming_zone1_frequency) : null,
        sort_order: parseGermanNumber(row.sort_order) ?? 999,
        active: parseBool(row.active ?? row.aktiv ?? true),
        fh_partner_net: parseGermanNumber(row.fh_partner_net),
        push_net: parseGermanNumber(row.push_net),
      };
    });
}

function normalizeOMOMatrixRows(rows: Record<string, unknown>[]): OMOMatrixRow[] {
  return rows
    .filter(row => {
      const id = row.tariff_id || row.tariffId || row.TarifID;
      return id && String(id).trim() !== "";
    })
    .map(row => {
      const tariffId = String(row.tariff_id || row.tariffId || row.TarifID || "").trim();

      return {
        tariff_id: tariffId,
        omo_0: parseGermanNumber(row.omo_0 || row.OMO0) ?? 0,
        omo_5: parseGermanNumber(row.omo_5 || row.OMO5),
        omo_10: parseGermanNumber(row.omo_10 || row.OMO10),
        omo_15: parseGermanNumber(row.omo_15 || row.OMO15),
        omo_17_5: parseGermanNumber(row.omo_17_5 || row["OMO17.5"] || row.OMO175),
        omo_20: parseGermanNumber(row.omo_20 || row.OMO20),
        omo_25: parseGermanNumber(row.omo_25 || row.OMO25),
        notes: row.notes ? String(row.notes) : undefined,
      };
    });
}

function normalizeProvisionRows(rows: Record<string, unknown>[]): ProvisionRow[] {
  return rows
    .filter(row => {
      const id = row.tariff_id || row.tariffId || row.TarifID;
      return id && String(id).trim() !== "";
    })
    .map(row => {
      const tariffId = String(row.tariff_id || row.tariffId || row.TarifID || "").trim();
      const tariffType = String(row.tariff_type || row.TarifTyp || "mobile").toLowerCase();

      return {
        tariff_id: tariffId,
        tariff_type: tariffType as "mobile" | "fixednet" | "iot" | "voip",
        provision_new_net: parseGermanNumber(row.provision_new_net || row.ProvisionNeu) ?? 0,
        provision_renewal_net: parseGermanNumber(row.provision_renewal_net || row.ProvisionVVL),
        provision_renewal_pct: parseGermanNumber(row.provision_renewal_pct),
        fh_partner_modifier: parseGermanNumber(row.fh_partner_modifier),
        push_modifier: parseGermanNumber(row.push_modifier),
        notes: row.notes ? String(row.notes) : undefined,
      };
    });
}

// ============================================
// Validation
// ============================================

export function validateMobileImport(result: MobileImportResult): MobileValidationResult {
  const errors: MobileValidationResult["errors"] = [];
  const warnings: string[] = [];
  const seenTariffIds = new Set<string>();

  // Validate tariffs
  result.tariffs.forEach((row, idx) => {
    const rowNum = idx + 2;

    if (!row.id) {
      errors.push({ row: rowNum, field: "id", message: "Tarif-ID fehlt", sheet: "mobile_tariffs" });
    } else if (seenTariffIds.has(row.id)) {
      errors.push({ row: rowNum, field: "id", message: `Doppelte ID: ${row.id}`, sheet: "mobile_tariffs" });
    } else {
      seenTariffIds.add(row.id);
    }

    if (!row.name) {
      errors.push({ row: rowNum, field: "name", message: "Tarifname fehlt", sheet: "mobile_tariffs" });
    }

    if (row.base_sim_only_net < 0) {
      errors.push({ row: rowNum, field: "base_sim_only_net", message: "Negativer Basispreis", sheet: "mobile_tariffs" });
    }
  });

  // Validate OMO matrix references
  result.omoMatrix.forEach((row, idx) => {
    const rowNum = idx + 2;

    if (!seenTariffIds.has(row.tariff_id)) {
      warnings.push(`OMO-Matrix Zeile ${rowNum}: Tarif "${row.tariff_id}" nicht gefunden`);
    }
  });

  // Validate provisions references
  result.provisions.forEach((row, idx) => {
    const rowNum = idx + 2;

    if (!seenTariffIds.has(row.tariff_id)) {
      warnings.push(`Provisionen Zeile ${rowNum}: Tarif "${row.tariff_id}" nicht gefunden`);
    }

    if (row.provision_new_net < 0) {
      errors.push({ row: rowNum, field: "provision_new_net", message: "Negative Provision", sheet: "provisions" });
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

export type MobileDiffItem = {
  id: string;
  type: "added" | "changed" | "removed";
  name?: string;
  changes?: string[];
};

export type MobileDiffResult = {
  items: MobileDiffItem[];
  summary: { added: number; changed: number; removed: number };
};

export function diffMobileTariffs(
  current: MobileTariffRow[],
  next: MobileTariffRow[]
): MobileDiffResult {
  const currentMap = new Map(current.map(t => [t.id, t]));
  const nextMap = new Map(next.map(t => [t.id, t]));
  const items: MobileDiffItem[] = [];

  // Added
  for (const [id, tariff] of nextMap) {
    if (!currentMap.has(id)) {
      items.push({ id, type: "added", name: tariff.name });
    }
  }

  // Removed
  for (const [id, tariff] of currentMap) {
    if (!nextMap.has(id)) {
      items.push({ id, type: "removed", name: tariff.name });
    }
  }

  // Changed
  for (const [id, nextTariff] of nextMap) {
    const current = currentMap.get(id);
    if (current) {
      const changes: string[] = [];
      if (current.base_sim_only_net !== nextTariff.base_sim_only_net) {
        changes.push(`Preis: ${current.base_sim_only_net}€ → ${nextTariff.base_sim_only_net}€`);
      }
      if (current.name !== nextTariff.name) {
        changes.push(`Name: ${current.name} → ${nextTariff.name}`);
      }
      if (changes.length > 0) {
        items.push({ id, type: "changed", name: nextTariff.name, changes });
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
// Helper Functions
// ============================================

function parseGermanNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numStr = String(value).replace(",", ".").trim();
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
}

function parseBool(value: unknown): boolean {
  return value === true || value === "true" || value === "1" || value === "ja" || value === "TRUE";
}
