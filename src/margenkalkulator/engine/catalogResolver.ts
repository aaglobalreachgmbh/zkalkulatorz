// ============================================
// Catalog Resolver - Phase 2
// Switches between dummy and business datasets
// Supports localStorage override for custom datasets
// ============================================

import type {
  DatasetVersion,
  Catalog,
  SubVariant,
  MobileTariff,
  Promo,
  FixedNetProduct,
  FixedNetAccessType,
  HardwareItem,
} from "./types";
import { dummyCatalog } from "./catalog.dummy";
import { businessCatalog2025_09 } from "../data/business/v2025_09";
import {
  loadCustomDataset,
  hasCustomDataset,
  getStoredDatasetVersion,
} from "../dataManager/storage";
import { mapCanonicalToCatalog } from "../dataManager/adapter";

// ============================================
// Catalog Registry
// ============================================

const catalogs: Record<DatasetVersion, Catalog> = {
  "dummy-v0": dummyCatalog,
  "business-2025-09": businessCatalog2025_09,
};

// ============================================
// Active Dataset Resolution (localStorage override)
// ============================================

/**
 * Get the active dataset - checks localStorage for custom dataset first,
 * then falls back to default business catalog.
 */
export function getActiveDataset(): Catalog {
  if (hasCustomDataset()) {
    try {
      const canonical = loadCustomDataset();
      if (canonical) {
        return mapCanonicalToCatalog(canonical);
      }
    } catch (e) {
      console.warn("Failed to load custom dataset, using default:", e);
    }
  }
  return businessCatalog2025_09;
}

/**
 * Get the version string of the active dataset
 */
export function getActiveDatasetVersion(): string {
  const storedVersion = getStoredDatasetVersion();
  if (storedVersion) {
    return `custom: ${storedVersion}`;
  }
  return "business-2025-09";
}

// ============================================
// Standard Resolver Functions
// ============================================

export function getCatalog(version: DatasetVersion): Catalog {
  return catalogs[version] ?? dummyCatalog;
}

export function getSubVariantFromCatalog(
  version: DatasetVersion,
  id: string
): SubVariant | undefined {
  const catalog = getCatalog(version);
  return catalog.subVariants.find((sv) => sv.id === id);
}

export function getMobileTariffFromCatalog(
  version: DatasetVersion,
  id: string
): MobileTariff | undefined {
  const catalog = getCatalog(version);
  return catalog.mobileTariffs.find((t) => t.id === id);
}

export function getPromoFromCatalog(
  version: DatasetVersion,
  id: string
): Promo | undefined {
  const catalog = getCatalog(version);
  return catalog.promos.find((p) => p.id === id);
}

export function getFixedNetProductFromCatalog(
  version: DatasetVersion,
  id: string
): FixedNetProduct | undefined {
  const catalog = getCatalog(version);
  return catalog.fixedNetProducts.find((p) => p.id === id);
}

// ============================================
// List Functions (for UI selectors)
// ============================================

export function listSubVariants(version: DatasetVersion): SubVariant[] {
  return getCatalog(version).subVariants;
}

export function listMobileTariffs(version: DatasetVersion): MobileTariff[] {
  return getCatalog(version).mobileTariffs;
}

export function listPromos(version: DatasetVersion): Promo[] {
  return getCatalog(version).promos;
}

export function listFixedNetProducts(version: DatasetVersion): FixedNetProduct[] {
  const products = getCatalog(version).fixedNetProducts;
  // Sort by speed ascending for better UX
  return [...products].sort((a, b) => (a.speed ?? 0) - (b.speed ?? 0));
}

export function listHardwareItems(version: DatasetVersion): HardwareItem[] {
  const catalog = getCatalog(version);
  return (catalog.hardwareCatalog ?? [])
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}

export function getHardwareItem(
  version: DatasetVersion,
  id: string
): HardwareItem | undefined {
  const catalog = getCatalog(version);
  return catalog.hardwareCatalog?.find((h) => h.id === id);
}

// ============================================
// Phase 2: List Fixed Net by Access Type
// ============================================

export function listFixedNetByAccessType(
  version: DatasetVersion,
  accessType: FixedNetAccessType
): FixedNetProduct[] {
  const products = getCatalog(version).fixedNetProducts;
  return products
    .filter((p) => p.accessType === accessType)
    .sort((a, b) => (a.speed ?? 0) - (b.speed ?? 0));
}

export function getAvailableAccessTypes(version: DatasetVersion): FixedNetAccessType[] {
  const products = getCatalog(version).fixedNetProducts;
  const types = new Set<FixedNetAccessType>();
  products.forEach((p) => {
    if (p.accessType) types.add(p.accessType);
  });
  return Array.from(types);
}

// ============================================
// GK Eligibility Check
// ============================================

/**
 * Check if combination is eligible for GK (Geschäftskunden) convergence benefit
 * Requires: Prime tariff + FixedNet enabled with eligible access type
 */
export function checkGKEligibility(
  tariff: MobileTariff | undefined,
  fixedNetEnabled: boolean,
  accessType?: FixedNetAccessType
): boolean {
  if (!tariff || !fixedNetEnabled) {
    return false;
  }
  // GK benefit applies to Prime, GigaMobil, and Smart product lines
  const eligibleLines = ["PRIME", "GIGAMOBIL", "CONSUMER_SMART"];
  if (!tariff.productLine || !eligibleLines.includes(tariff.productLine)) {
    return false;
  }
  // Only Cable, DSL, Fiber are GK-eligible
  if (accessType && !["CABLE", "DSL", "FIBER"].includes(accessType)) {
    return false;
  }
  return true;
}

// ============================================
// OMO25 Deduction Calculator
// ============================================

/**
 * Get OMO25 deduction amount for a tariff
 * OMO25 has a specific provision deduction per tier
 */
export function getOMODeduction(
  tariff: MobileTariff | undefined,
  promoId: string
): number {
  if (!tariff || promoId !== "OMO25") {
    return 0;
  }
  return tariff.omoDeduction ?? 0;
}
