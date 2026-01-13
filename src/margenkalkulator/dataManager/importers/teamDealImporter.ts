// ============================================
// TeamDeal Tariff Importer
// Specialized importer for TeamDeal with SUB-Variant provisions
// ============================================

import { parseRawSheetSafe } from "./xlsxImporter";

export type TeamDealRow = {
  id: string;
  tier: string;
  dataVolumeGB: number | "unlimited";
  // Prices by SUB variant
  priceSIMOnly: number;
  priceSUB5: number;
  priceSUB10: number;
  // Provisions by SUB variant
  provisionSIMOnly: number;
  provisionSUB5: number;
  provisionSUB10: number;
  // Metadata
  active: boolean;
};

export type TeamDealValidationResult = {
  isValid: boolean;
  errors: { row?: number; field: string; message: string }[];
  warnings: string[];
};

// ============================================
// XLSX Parser
// ============================================

export async function parseTeamDealXLSX(file: File): Promise<TeamDealRow[]> {
  const sheetNames = ["teamdeal", "TeamDeal", "Team Deal", "team_deal"];
  // Use generic safe parser from xlsxImporter
  const rows = await parseRawSheetSafe(file, sheetNames);

  // Normalize safely parsed rows
  return normalizeTeamDealRows(rows);
}

// ============================================
// Row Normalization
// ============================================

export function normalizeTeamDealRows(rows: Record<string, unknown>[]): TeamDealRow[] {
  return rows
    .filter(row => {
      const id = row.id || row.ID || row.Tier;
      return id && String(id).trim() !== "";
    })
    .map(row => {
      // Support flexible column names
      const id = String(row.id || row.ID || `TEAMDEAL_${row.Tier || row.tier}`).trim().toUpperCase();
      const tier = String(row.tier || row.Tier || "").trim().toUpperCase();

      // Data volume
      const dataRaw = row.data || row.Daten || row.dataVolumeGB || row.data_gb;
      const dataVolumeGB = String(dataRaw).toLowerCase() === "unlimited"
        ? "unlimited" as const
        : parseGermanNumber(dataRaw) ?? 0;

      // Prices by variant (flexible column names)
      const priceSIMOnly = parseGermanNumber(
        row.priceSIMOnly || row.preis_sim || row["SIM Only Preis"] || row.sim_only_net || row.preis_sim_only
      ) ?? 0;
      const priceSUB5 = parseGermanNumber(
        row.priceSUB5 || row.preis_sub5 || row["SUB5 Preis"] || row.sub5_net
      ) ?? priceSIMOnly + 5;
      const priceSUB10 = parseGermanNumber(
        row.priceSUB10 || row.preis_sub10 || row["SUB10 Preis"] || row.sub10_net
      ) ?? priceSIMOnly + 10;

      // Provisions by variant
      const provisionSIMOnly = parseGermanNumber(
        row.provisionSIMOnly || row.provision_sim || row["Provision SIM"] || row.prov_sim || row.Provi || row.provision
      ) ?? 0;
      const provisionSUB5 = parseGermanNumber(
        row.provisionSUB5 || row.provision_sub5 || row["Provision SUB5"] || row.prov_sub5
      ) ?? 0;
      const provisionSUB10 = parseGermanNumber(
        row.provisionSUB10 || row.provision_sub10 || row["Provision SUB10"] || row.prov_sub10
      ) ?? 0;

      return {
        id,
        tier,
        dataVolumeGB,
        priceSIMOnly,
        priceSUB5,
        priceSUB10,
        provisionSIMOnly,
        provisionSUB5,
        provisionSUB10,
        active: parseBool(row.active ?? row.aktiv ?? true),
      };
    });
}

// ============================================
// Validation
// ============================================

export function validateTeamDealRows(rows: TeamDealRow[]): TeamDealValidationResult {
  const errors: TeamDealValidationResult["errors"] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;

    if (!row.id) {
      errors.push({ row: rowNum, field: "id", message: "TeamDeal-ID fehlt" });
    } else if (seenIds.has(row.id)) {
      errors.push({ row: rowNum, field: "id", message: `Doppelte ID: ${row.id}` });
    } else {
      seenIds.add(row.id);
    }

    if (!row.tier) {
      errors.push({ row: rowNum, field: "tier", message: "Tier fehlt (XS/S/M/XL)" });
    }

    // Validate prices
    if (row.priceSIMOnly < 0) {
      errors.push({ row: rowNum, field: "priceSIMOnly", message: "Negativer SIM-Only Preis" });
    }

    // Validate provisions
    if (row.provisionSIMOnly < 0) {
      errors.push({ row: rowNum, field: "provisionSIMOnly", message: "Negative Provision" });
    }

    // Warnings for unusual values
    if (row.provisionSIMOnly > 500) {
      warnings.push(`Zeile ${rowNum}: Sehr hohe Provision (${row.provisionSIMOnly}€) für ${row.id}`);
    }

    if (row.provisionSUB5 <= row.provisionSIMOnly && row.provisionSUB5 > 0) {
      warnings.push(`Zeile ${rowNum}: SUB5 Provision ≤ SIM-Only Provision`);
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

export type TeamDealDiffItem = {
  id: string;
  type: "added" | "changed" | "removed";
  tier?: string;
  changes?: string[];
};

export type TeamDealDiffResult = {
  items: TeamDealDiffItem[];
  summary: { added: number; changed: number; removed: number };
};

export function diffTeamDeal(
  current: TeamDealRow[],
  next: TeamDealRow[]
): TeamDealDiffResult {
  const currentMap = new Map(current.map(t => [t.id, t]));
  const nextMap = new Map(next.map(t => [t.id, t]));
  const items: TeamDealDiffItem[] = [];

  for (const [id, tariff] of nextMap) {
    if (!currentMap.has(id)) {
      items.push({ id, type: "added", tier: tariff.tier });
    }
  }

  for (const [id, tariff] of currentMap) {
    if (!nextMap.has(id)) {
      items.push({ id, type: "removed", tier: tariff.tier });
    }
  }

  for (const [id, nextTariff] of nextMap) {
    const curr = currentMap.get(id);
    if (curr) {
      const changes: string[] = [];
      if (curr.priceSIMOnly !== nextTariff.priceSIMOnly) {
        changes.push(`SIM-Preis: ${curr.priceSIMOnly}€ → ${nextTariff.priceSIMOnly}€`);
      }
      if (curr.provisionSIMOnly !== nextTariff.provisionSIMOnly) {
        changes.push(`Provision SIM: ${curr.provisionSIMOnly}€ → ${nextTariff.provisionSIMOnly}€`);
      }
      if (curr.provisionSUB5 !== nextTariff.provisionSUB5) {
        changes.push(`Provision SUB5: ${curr.provisionSUB5}€ → ${nextTariff.provisionSUB5}€`);
      }
      if (curr.provisionSUB10 !== nextTariff.provisionSUB10) {
        changes.push(`Provision SUB10: ${curr.provisionSUB10}€ → ${nextTariff.provisionSUB10}€`);
      }
      if (changes.length > 0) {
        items.push({ id, type: "changed", tier: nextTariff.tier, changes });
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
