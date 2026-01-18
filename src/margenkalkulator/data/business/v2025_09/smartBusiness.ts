// ============================================
// Smart Business / Smart Business Plus Tariffs - 2025-09
// Source: InfoDok 4260 (April 2025)
// https://www.vodafone.de/infofaxe/4260.pdf
// Smart Business Plus serves as BASIS for TeamDeal
// ============================================

import type { MobileTariff, SubVariantId } from "../../../../margenkalkulator/engine/types";

const SMART_BUSINESS_ALLOWED_SUBS: SubVariantId[] = [
  "SIM_ONLY",
  "BASIC_PHONE",
  "SMARTPHONE",
];

export const smartBusinessTariffs: MobileTariff[] = [
  {
    id: "SMART_BUSINESS",
    name: "Smart Business",
    family: "smart_business",
    productLine: "SMART_BUSINESS",
    dataVolumeGB: 0.5, // 500 MB
    baseNet: 9,
    pricesByVariant: {
      SIM_ONLY: 9,
      BASIC: 14,
      SMARTPHONE: 19,
    },
    euRoamingNote: "wie in DE",
    allowedSubVariants: SMART_BUSINESS_ALLOWED_SUBS,
    features: [
      "500 MB Datenvolumen",
      "Allnet-Flat (Sprache & SMS)",
      "LTE",
      "EU: Daten wie in DE",
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
    baseNet: 13,
    pricesByVariant: {
      SIM_ONLY: 13,
      BASIC: 18,
      SMARTPHONE: 23,
    },
    euRoamingNote: "wie in DE",
    allowedSubVariants: SMART_BUSINESS_ALLOWED_SUBS,
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
];
