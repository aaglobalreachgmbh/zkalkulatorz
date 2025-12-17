// ============================================
// MargenKalkulator Dummy Catalog - Phase 1
// ============================================

import type { DummyCatalog, SubVariant, MobileTariff, Promo, FixedNetProduct } from "./types";

// ============================================
// SUB Varianten
// ============================================

export const subVariants: SubVariant[] = [
  { id: "SIM_ONLY", label: "SIM only", monthlyAddNet: 0 },
  { id: "SUB5", label: "SUB5", monthlyAddNet: 5 },
  { id: "SUB10", label: "SUB10", monthlyAddNet: 10 },
];

// ============================================
// Mobile Tarife (Dummy)
// ============================================

export const mobileTariffs: MobileTariff[] = [
  {
    id: "RED_BIZ_S",
    name: "Red Business S",
    baseNet: 25,
    features: ["10 GB Daten", "Allnet Flat", "EU Roaming"],
    provisionBase: 200,
    deductionRate: 0.1, // 10% deduction
  },
  {
    id: "RED_BIZ_M",
    name: "Red Business M",
    baseNet: 35,
    features: ["25 GB Daten", "Allnet Flat", "EU Roaming", "5G"],
    provisionBase: 300,
    deductionRate: 0.1,
  },
  {
    id: "RED_BIZ_L",
    name: "Red Business L",
    baseNet: 50,
    features: ["Unlimited Daten", "Allnet Flat", "EU Roaming", "5G", "Priority"],
    provisionBase: 450,
    deductionRate: 0.1,
  },
];

// ============================================
// Promos (Dummy)
// ============================================

export const promos: Promo[] = [
  {
    id: "NONE",
    type: "NONE",
    label: "Keine Aktion",
    durationMonths: 0,
    value: 0,
  },
  {
    id: "INTRO_PRICE",
    type: "INTRO_PRICE",
    label: "Intro-Preis (6 Monate)",
    durationMonths: 6,
    value: 15, // Fixed €15/month for first 6 months (base only)
  },
  {
    id: "PCT_OFF_BASE",
    type: "PCT_OFF_BASE",
    label: "50% auf Base (12 Monate)",
    durationMonths: 12,
    value: 0.5, // 50% off base for 12 months
  },
];

// ============================================
// Festnetz Produkte (Dummy)
// ============================================

export const fixedNetProducts: FixedNetProduct[] = [
  {
    id: "CABLE_250",
    name: "Cable 250",
    monthlyNet: 30,
    oneTimeNet: 50,
    features: ["250 Mbit/s Download", "50 Mbit/s Upload", "Router inklusive"],
    promo: {
      type: "INTRO_PRICE",
      durationMonths: 6,
      value: 20, // €20/month for first 6 months
    },
  },
  {
    id: "DSL_100",
    name: "DSL 100",
    monthlyNet: 35,
    oneTimeNet: 70,
    features: ["100 Mbit/s Download", "40 Mbit/s Upload", "Router inklusive"],
    promo: {
      type: "PCT_OFF_BASE",
      durationMonths: 3,
      value: 0.5, // 50% off for 3 months
    },
  },
];

// ============================================
// Complete Catalog Export
// ============================================

export const dummyCatalog: DummyCatalog = {
  version: "dummy-v0",
  subVariants,
  mobileTariffs,
  promos,
  fixedNetProducts,
};

// ============================================
// Helper Functions
// ============================================

export function getSubVariant(id: string): SubVariant | undefined {
  return subVariants.find((sv) => sv.id === id);
}

export function getMobileTariff(id: string): MobileTariff | undefined {
  return mobileTariffs.find((t) => t.id === id);
}

export function getPromo(id: string): Promo | undefined {
  return promos.find((p) => p.id === id);
}

export function getFixedNetProduct(id: string): FixedNetProduct | undefined {
  return fixedNetProducts.find((p) => p.id === id);
}
