// ============================================
// Smart Business / Smart Business Plus Tariffs - 2025-09
// Source: Vodafone Gesamtpreisliste Mobilfunk
// (https://www.vodafone.de/business/media/vodafone-gesamtpreisliste-mobilfunk.pdf)
// ============================================

import type { MobileTariff } from "../../../../margenkalkulator/engine/types";

export const smartBusinessTariffs: MobileTariff[] = [
  {
    id: "SMART_BUSINESS",
    name: "Smart Business",
    family: "smart_business",
    productLine: "SMART_BUSINESS",
    dataVolumeGB: 0.5, // 500 MB
    baseNet: 9, // SIM-only price
    pricesByVariant: {
      SIM_ONLY: 9,
      BASIC: 14,
      SMARTPHONE: 19,
    },
    features: [
      "500 MB Datenvolumen",
      "Allnet-Flat (Sprache & SMS)",
      "LTE",
    ],
    minTermMonths: 24,
    setupFeeNet: 0,
    provisionBase: 50,
    provisionRenewal: 25,
    deductionRate: 0,
  },
  {
    id: "SMART_BUSINESS_PLUS",
    name: "Smart Business Plus",
    family: "smart_business",
    productLine: "SMART_BUSINESS_PLUS",
    dataVolumeGB: 1,
    baseNet: 13, // SIM-only price
    pricesByVariant: {
      SIM_ONLY: 13,
      BASIC: 18,
      SMARTPHONE: 23,
    },
    features: [
      "1 GB Datenvolumen",
      "Allnet-Flat (Sprache & SMS)",
      "LTE/5G",
    ],
    minTermMonths: 24,
    setupFeeNet: 0,
    provisionBase: 75,
    provisionRenewal: 37.50,
    deductionRate: 0,
  },
];
