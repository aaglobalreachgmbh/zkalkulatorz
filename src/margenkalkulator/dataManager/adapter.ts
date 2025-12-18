// ============================================
// Adapter: Canonical Dataset → Engine Catalog
// Maps imported XLSX/CSV format to engine types
// ============================================

import type { 
  Catalog, 
  MobileTariff, 
  FixedNetProduct, 
  Promo, 
  SubVariant,
  SubVariantId,
  FixedNetAccessType,
} from "../engine/types";
import type { 
  CanonicalDataset, 
  MobileTariffRow, 
  FixedNetProductRow,
  PromoDefinitionRow,
  SubVariantRow,
  ParsedSheets,
} from "./types";

// ============================================
// Transform Parsed Sheets → Canonical Dataset
// ============================================

export function transformToCanonical(sheets: ParsedSheets): CanonicalDataset {
  // Extract meta from first row
  const metaRow = sheets.meta?.[0] ?? {};
  
  return {
    meta: {
      datasetVersion: (metaRow.datasetversion as string) ?? "imported",
      validFromISO: (metaRow.validfromiso as string) ?? new Date().toISOString().split("T")[0],
      verifiedAtISO: (metaRow.verifiedatiso as string) ?? new Date().toISOString().split("T")[0],
      notes: metaRow.notes as string,
    },
    mobileTariffs: (sheets.mobile_tariffs ?? []).map(row => ({
      id: row.id as string,
      family: row.family as string,
      productLine: row.productline as string,
      name: row.name as string,
      minTermMonths: (row.mintermmonths as number) ?? 24,
      base_sim_only_net: row.base_sim_only_net as number,
      sub_basic_add_net: row.sub_basic_add_net as number | null,
      sub_smartphone_add_net: row.sub_smartphone_add_net as number | null,
      sub_premium_add_net: row.sub_premium_add_net as number | null,
      sub_special_premium_add_net: row.sub_special_premium_add_net as number | null,
      data_de: row.data_de as string | number,
      eu_rule: (row.eu_rule as "numeric" | "text") ?? "text",
      eu_data_gb: row.eu_data_gb as number | null,
      eu_note: row.eu_note as string | null,
      one_number_count: row.one_number_count as number | null,
      giga_depot: row.giga_depot as string | null,
      giga_depot_price: row.giga_depot_price as number | null,
      roaming_zone1_gb: row.roaming_zone1_gb as number | null,
      roaming_zone1_frequency: row.roaming_zone1_frequency as string | null,
      sort_order: row.sort_order as number,
      active: row.active as boolean ?? true,
    })),
    mobileFeatures: (sheets.mobile_features ?? []).map(row => ({
      tariff_id: row.tariff_id as string,
      key: row.key as string,
      label_short: row.label_short as string,
      label_detail: row.label_detail as string,
      display_order: row.display_order as number,
    })),
    mobileDependencies: (sheets.mobile_dependencies ?? []).map(row => ({
      tariff_id: row.tariff_id as string,
      rule_type: row.rule_type as string,
      param1: row.param1 as string,
      message: row.message as string,
    })),
    fixedNetProducts: (sheets.fixednet_products ?? []).map(row => ({
      id: row.id as string,
      access_type: row.access_type as string,
      variant: row.variant as string,
      name: row.name as string,
      minTermMonths: (row.mintermmonths as number) ?? 24,
      speed_label: row.speed_label as string,
      speed: row.speed as number,
      monthly_net: row.monthly_net as number,
      router_included: row.router_included as boolean ?? false,
      router_model: row.router_model as string,
      one_time_setup_net: (row.one_time_setup_net as number) ?? 0,
      one_time_shipping_net: (row.one_time_shipping_net as number) ?? 0,
      fixed_ip_included: row.fixed_ip_included as boolean ?? false,
      fixed_ip_addon_net: row.fixed_ip_addon_net as number,
      optional_expert_install_net: row.optional_expert_install_net as number,
      sort_order: row.sort_order as number,
      active: row.active as boolean ?? true,
    })),
    hardwareCatalog: (sheets.hardware_catalog ?? []).map(row => ({
      id: row.id as string,
      brand: row.brand as string,
      model: row.model as string,
      category: row.category as string,
      ek_net: row.ek_net as number,
      image_url: row.image_url as string,
      sort_order: row.sort_order as number,
      active: row.active as boolean ?? true,
    })),
    promos: (sheets.promos_possible ?? []).map(row => ({
      id: row.id as string,
      label: row.label as string,
      applies_to: (row.applies_to as "mobile" | "fixed" | "both") ?? "both",
      type: (row.type as "PCT_OFF_BASE" | "ABS_OFF_BASE" | "INTRO_PRICE") ?? "PCT_OFF_BASE",
      duration_months: (row.duration_months as number) ?? 0,
      pct: row.pct as number,
      amount_net: row.amount_net as number,
      intro_net: row.intro_net as number,
      valid_from: row.valid_from as string,
      valid_until: row.valid_until as string,
      eligibility_note: row.eligibility_note as string,
    })),
    subVariants: (sheets.sub_variants ?? []).map(row => ({
      id: row.id as string,
      label: row.label as string,
      monthly_add_net: row.monthly_add_net as number,
    })),
  };
}

// ============================================
// Map Canonical Dataset → Engine Catalog
// ============================================

export function mapCanonicalToCatalog(canonical: CanonicalDataset): Catalog {
  return {
    version: canonical.meta.datasetVersion as "business-2025-09" | "dummy-v0",
    validFrom: canonical.meta.validFromISO,
    subVariants: canonical.subVariants.map(mapSubVariant),
    mobileTariffs: canonical.mobileTariffs
      .filter(t => t.active !== false)
      .map(t => mapMobileTariff(t, canonical.mobileFeatures)),
    fixedNetProducts: canonical.fixedNetProducts
      .filter(p => p.active !== false)
      .map(mapFixedNetProduct),
    promos: canonical.promos.map(mapPromo),
  };
}

function mapSubVariant(row: SubVariantRow): SubVariant {
  return {
    id: row.id as SubVariantId,
    label: row.label,
    monthlyAddNet: row.monthly_add_net,
  };
}

function mapMobileTariff(
  row: MobileTariffRow, 
  features: { tariff_id: string; key: string; label_short: string }[]
): MobileTariff {
  // Build allowedSubVariants from which SUB add prices are defined
  const allowedSubVariants: SubVariantId[] = ["SIM_ONLY"];
  if (row.sub_basic_add_net !== null && row.sub_basic_add_net !== undefined) {
    allowedSubVariants.push("BASIC_PHONE");
  }
  if (row.sub_smartphone_add_net !== null && row.sub_smartphone_add_net !== undefined) {
    allowedSubVariants.push("SMARTPHONE");
  }
  if (row.sub_premium_add_net !== null && row.sub_premium_add_net !== undefined) {
    allowedSubVariants.push("PREMIUM_SMARTPHONE");
  }
  if (row.sub_special_premium_add_net !== null && row.sub_special_premium_add_net !== undefined) {
    allowedSubVariants.push("SPECIAL_PREMIUM_SMARTPHONE");
  }
  
  // Map features for this tariff
  const tariffFeatures = features
    .filter(f => f.tariff_id === row.id)
    .map(f => f.label_short);
  
  // Determine data volume
  const dataVolumeGB = row.data_de === "unlimited" ? "unlimited" : Number(row.data_de);
  
  // Map gigaDepot status
  let gigaDepot: MobileTariff["gigaDepot"];
  if (row.giga_depot === "included") {
    gigaDepot = { status: "included" };
  } else if (row.giga_depot === "optional" && row.giga_depot_price !== null) {
    gigaDepot = { status: "optional", priceNet: row.giga_depot_price ?? 0 };
  }
  
  return {
    id: row.id,
    name: row.name,
    family: row.family as MobileTariff["family"],
    productLine: row.productLine as MobileTariff["productLine"],
    baseNet: row.base_sim_only_net,
    dataVolumeGB,
    euRoamingHighspeedGB: row.eu_rule === "numeric" ? (row.eu_data_gb ?? undefined) : undefined,
    euRoamingNote: row.eu_rule === "text" ? (row.eu_note ?? "wie in DE") : undefined,
    oneNumberIncludedCount: row.one_number_count ?? undefined,
    gigaDepot,
    roamingPacketZone1GB: row.roaming_zone1_gb ?? undefined,
    allowedSubVariants,
    minTermMonths: row.minTermMonths ?? 24,
    features: tariffFeatures,
    provisionBase: 0,
    deductionRate: 0,
  };
}

function mapFixedNetProduct(row: FixedNetProductRow): FixedNetProduct {
  // Determine router type from model name
  let routerType: "FRITZBOX" | "VODAFONE_STATION" | undefined;
  if (row.router_included && row.router_model) {
    routerType = row.router_model.toUpperCase().includes("FRITZ") 
      ? "FRITZBOX" 
      : "VODAFONE_STATION";
  }
  
  // Parse speed with fallback
  const speedFromLabel = row.speed_label ? parseInt(row.speed_label) : 0;
  const speed = row.speed ?? (speedFromLabel || undefined);
  
  return {
    id: row.id,
    name: row.name,
    accessType: row.access_type as FixedNetAccessType,
    monthlyNet: row.monthly_net,
    oneTimeNet: (row.one_time_setup_net ?? 0) + (row.one_time_shipping_net ?? 0),
    speed,
    routerType,
    includesRouter: row.router_included,
    routerModelDefault: row.router_model,
    fixedIpIncluded: row.fixed_ip_included ?? false,
    fixedIpAddonNet: row.fixed_ip_addon_net,
    expertSetupAvailable: (row.optional_expert_install_net ?? 0) > 0,
    features: [],
  };
}

function mapPromo(row: PromoDefinitionRow): Promo {
  return {
    id: row.id,
    type: row.type,
    label: row.label ?? row.id,
    appliesTo: row.applies_to,
    durationMonths: row.duration_months ?? 0,
    value: row.pct ?? row.intro_net ?? 0,
    amountNetPerMonth: row.amount_net,
    validFromISO: row.valid_from,
    validUntilISO: row.valid_until,
  };
}
