// ============================================
// Business → Canonical Mapper
// Transforms BusinessDataset to CanonicalDataset for engine compatibility
// ============================================

import type { BusinessDataset, BusinessTariffRow, BusinessHardwareRow } from "./types";
import type { CanonicalDataset, MobileTariffRow, HardwareItemRow, SubVariantRow } from "../types";

export function mapBusinessToCanonical(
  business: BusinessDataset,
  options?: { defaultMinTerm?: number }
): CanonicalDataset {
  const minTerm = options?.defaultMinTerm ?? 24;
  
  return {
    meta: {
      datasetVersion: `business-import-${new Date().toISOString().split("T")[0]}`,
      validFromISO: new Date().toISOString().split("T")[0],
      verifiedAtISO: new Date().toISOString().split("T")[0],
      notes: `Imported from ${business.meta.sourceFileName}`,
    },
    mobileTariffs: business.tariffs.map(t => mapTariffRow(t, minTerm)),
    mobileFeatures: [], // Business format doesn't include features
    mobileDependencies: [], // Could derive from contractType later
    fixedNetProducts: [], // Business format focuses on mobile
    hardwareCatalog: business.hardware.map(mapHardwareRow),
    promos: [], // OMO could become promos later
    subVariants: getDefaultSubVariants(),
  };
}

function mapTariffRow(row: BusinessTariffRow, minTerm: number): MobileTariffRow {
  // Parse data volume
  const dataDE = parseDataVolume(row.dataVolumeText);
  
  return {
    id: row.id,
    family: deriveFamilyFromName(row.tarifName),
    productLine: row.category,
    name: row.tarifName,
    minTermMonths: row.laufzeitMonths ?? minTerm,
    base_sim_only_net: row.baseMonthlyNet,
    // SUB add-ons not in business format - keep null
    sub_basic_add_net: null,
    sub_smartphone_add_net: null,
    sub_premium_add_net: null,
    sub_special_premium_add_net: null,
    data_de: dataDE,
    eu_rule: "text" as const,
    eu_note: "wie in DE",
    sort_order: row.sourceRow,
    active: true,
    // Phase 2.4: FH-Partner/Push values from XLSX
    fh_partner_net: row.fhPartnerNet ?? undefined,
    push_net: row.pushNet ?? undefined,
    // OMO-Matrix from parsed values
    omo_matrix: row.omo ?? undefined,
  };
}

function mapHardwareRow(row: BusinessHardwareRow): HardwareItemRow {
  // Try to extract brand/model from display name
  const parts = row.displayName.split(" ");
  const brand = parts[0] ?? "Unknown";
  const model = parts.slice(1).join(" ") || row.displayName;
  
  return {
    id: row.id,
    brand,
    model,
    category: deriveCategory(row.displayName),
    ek_net: row.ekNet,
    sort_order: row.sourceRow,
    active: true,
  };
}

export function parseDataVolume(text: string | null): string | number {
  if (!text || text === "-") return 0;
  
  const lower = text.toLowerCase();
  if (lower.includes("unlimited") || lower.includes("unbegrenzt")) {
    return "unlimited";
  }
  
  const gbMatch = text.match(/(\d+)\s*GB/i);
  if (gbMatch) {
    return parseInt(gbMatch[1], 10);
  }
  
  return text;
}

function deriveFamilyFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("prime")) return "prime";
  if (lower.includes("smart")) return "smart";
  if (lower.includes("teamdeal")) return "teamdeal";
  if (lower.includes("red")) return "red";
  if (lower.includes("young")) return "young";
  if (lower.includes("giga")) return "giga";
  if (lower.includes("basic")) return "basic";
  return "other";
}

function deriveCategory(displayName: string): string {
  const lower = displayName.toLowerCase();
  if (lower.includes("iphone") || lower.includes("galaxy") || lower.includes("pixel")) {
    return "smartphone";
  }
  if (lower.includes("watch") || lower.includes("uhr")) {
    return "wearable";
  }
  if (lower.includes("ipad") || lower.includes("tab")) {
    return "tablet";
  }
  return "other";
}

function getDefaultSubVariants(): SubVariantRow[] {
  return [
    { id: "SIM_ONLY", label: "SIM only", monthly_add_net: 0 },
    { id: "BASIC_PHONE", label: "Basic Phone", monthly_add_net: 5 },
    { id: "SMARTPHONE", label: "Smartphone", monthly_add_net: 10 },
    { id: "PREMIUM_SMARTPHONE", label: "Premium Smartphone", monthly_add_net: 25 },
    { id: "SPECIAL_PREMIUM_SMARTPHONE", label: "Special Premium", monthly_add_net: 40 },
  ];
}
