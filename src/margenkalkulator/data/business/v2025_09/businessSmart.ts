// ============================================
// Business Smart Tariffs - 2025-09
// Source: InfoDok 4262 (https://www.vodafone.de/infofaxe/4262.pdf)
// ============================================

import type { MobileTariff } from "../../../../margenkalkulator/engine/types";

export const businessSmartTariffs: MobileTariff[] = [
  {
    id: "BUSINESS_SMART_S",
    name: "Business Smart S",
    family: "business_smart",
    productLine: "BUSINESS_SMART",
    tier: "S",
    dataVolumeGB: 1,
    baseNet: 11, // SIM-only price
    pricesByVariant: {
      SIM_ONLY: 11,
      BASIC: 16,
      SMARTPHONE: 21,
    },
    features: [
      "1 GB Datenvolumen",
      "Allnet-Flat (Sprache & SMS)",
      "LTE/5G",
      "EU-Roaming inklusive",
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
    baseNet: 15, // SIM-only price
    pricesByVariant: {
      SIM_ONLY: 15,
      BASIC: 20,
      SMARTPHONE: 25,
    },
    features: [
      "5 GB Datenvolumen",
      "Allnet-Flat (Sprache & SMS)",
      "LTE/5G",
      "EU-Roaming inklusive",
    ],
    minTermMonths: 24,
    setupFeeNet: 0,
    provisionBase: 100,
    provisionRenewal: 50,
    deductionRate: 0,
  },
  // Flex variants (1-month minimum term) - display only
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
    features: [
      "1 GB Datenvolumen",
      "Allnet-Flat",
      "1 Monat Mindestlaufzeit",
    ],
    minTermMonths: 1,
    setupFeeNet: 0,
    provisionBase: 0, // No provision for Flex
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
