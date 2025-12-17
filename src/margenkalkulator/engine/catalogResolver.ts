// ============================================
// Catalog Resolver - Phase 2
// Switches between dummy and business datasets
// ============================================

import type {
  DatasetVersion,
  Catalog,
  SubVariant,
  MobileTariff,
  Promo,
  FixedNetProduct,
} from "./types";
import { dummyCatalog } from "./catalog.dummy";
import { businessCatalog2025_09 } from "../data/business/v2025_09";

// ============================================
// Catalog Registry
// ============================================

const catalogs: Record<DatasetVersion, Catalog> = {
  "dummy-v0": dummyCatalog,
  "business-2025-09": businessCatalog2025_09,
};

// ============================================
// Resolver Functions
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

// ============================================
// GK Eligibility Check
// ============================================

/**
 * Check if combination is eligible for GK (Geschäftskunden) convergence benefit
 * Requires: Prime tariff + FixedNet enabled
 */
export function checkGKEligibility(
  tariff: MobileTariff | undefined,
  fixedNetEnabled: boolean
): boolean {
  if (!tariff || !fixedNetEnabled) {
    return false;
  }
  // GK benefit applies to Prime product line
  return tariff.productLine === "PRIME";
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
