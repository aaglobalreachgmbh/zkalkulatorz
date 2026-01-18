// ============================================
// Business Smart Tariffs - 2025-09
// Source: InfoDok 4262 (https://www.vodafone.de/infofaxe/4262.pdf)
// ============================================

import type { MobileTariff, SubVariantId } from "../../../../margenkalkulator/engine/types";

const BUSINESS_SMART_ALLOWED_SUBS: SubVariantId[] = [
  "SIM_ONLY",
  "BASIC_PHONE",
  "SMARTPHONE",
];

export const businessSmartTariffs: MobileTariff[] = [
  {
    id: "BUSINESS_SMART_S",
    name: "Business Smart S",
    family: "business_smart",
    productLine: "BUSINESS_SMART",
    tier: "S",
    dataVolumeGB: 1,
    baseNet: 11,
    pricesByVariant: {
      SIM_ONLY: 11,
      BASIC: 16,
      SMARTPHONE: 21,
    },
    euRoamingNote: "wie in DE",
    allowedSubVariants: BUSINESS_SMART_ALLOWED_SUBS,
    features: [
      "1 GB Datenvolumen",
      "Allnet-Flat (Sprache & SMS)",
      "LTE/5G",
      "EU: Daten wie in DE",
    ],
    minTermMonths: 24,
    setupFeeNet: 0,
    provisionBase: 75,
    provisionRenewal: 37.50,
    deductionRate: 0,
  },
  {
    id: "BUSINESS_SMART_M",
    name: "Business Smart M",
    family: "business_smart",
    productLine: "BUSINESS_SMART",
    tier: "M",
    dataVolumeGB: 5,
    baseNet: 15,
    pricesByVariant: {
      SIM_ONLY: 15,
      BASIC: 20,
      SMARTPHONE: 25,
    },
    euRoamingNote: "wie in DE",
    allowedSubVariants: BUSINESS_SMART_ALLOWED_SUBS,
    features: [
      "5 GB Datenvolumen",
      "Allnet-Flat (Sprache & SMS)",
      "LTE/5G",
      "EU: Daten wie in DE",
    ],
    minTermMonths: 24,
    setupFeeNet: 0,
    provisionBase: 100,
    provisionRenewal: 50,
    deductionRate: 0,
  },
  // Flex variants (1-month minimum term) - SIM-only only
  {
    id: "BUSINESS_SMART_S_FLEX",
    name: "Business Smart S Flex",
    family: "business_smart",
    productLine: "BUSINESS_SMART",
    tier: "S",
    dataVolumeGB: 1,
    baseNet: 11,
    pricesByVariant: {
      SIM_ONLY: 11,
    },
    euRoamingNote: "wie in DE",
    allowedSubVariants: ["SIM_ONLY"],
    features: [
      "1 GB Datenvolumen",
      "Allnet-Flat",
      "1 Monat Mindestlaufzeit",
    ],
    minTermMonths: 1,
    setupFeeNet: 0,
    provisionBase: 0,
    deductionRate: 0,
  },
  {
    id: "BUSINESS_SMART_M_FLEX",
    name: "Business Smart M Flex",
    family: "business_smart",
    productLine: "BUSINESS_SMART",
    tier: "M",
    dataVolumeGB: 5,
    baseNet: 15,
    pricesByVariant: {
      SIM_ONLY: 15,
    },
    euRoamingNote: "wie in DE",
    allowedSubVariants: ["SIM_ONLY"],
    features: [
      "5 GB Datenvolumen",
      "Allnet-Flat",
      "1 Monat Mindestlaufzeit",
    ],
    minTermMonths: 1,
    setupFeeNet: 0,
    provisionBase: 0,
    deductionRate: 0,
  },
];
