// ============================================
// TeamDeal Tariffs - 2025-09
// Source: https://www.vodafone.de/business/teamdeal/
// 
// TeamDeal is based on Smart Business Plus (1GB, 13€/month)
// with volume bonuses and price deltas.
// REQUIREMENT: Active Business Prime on same customer account
// ============================================

import type { MobileTariff } from "../../../../margenkalkulator/engine/types";

// Fallback constants (when no Prime on account)
export const TEAMDEAL_FALLBACK = {
  priceNet: 13,      // Smart Business Plus SIM-only
  dataVolumeGB: 1,   // 1 GB
  tariffId: "SMART_BUSINESS_PLUS",
} as const;

export const teamDealTariffs: MobileTariff[] = [
  {
    id: "TEAMDEAL_XS",
    name: "TeamDeal XS",
    family: "teamdeal",
    productLine: "TEAMDEAL",
    tier: "XS",
    dataVolumeGB: 15, // Smart Business Plus 1GB + 14GB bonus
    baseNet: 9.50,    // 13€ - 3.50€ delta
    pricesByVariant: {
      SIM_ONLY: 9.50,
    },
    features: [
      "15 GB Datenvolumen",
      "Allnet-Flat (Sprache & SMS)",
      "LTE/5G",
      "Voraussetzung: Business Prime auf Kundenkonto",
    ],
    minTermMonths: 24,
    setupFeeNet: 0,
    teamDealBase: "SMART_BUSINESS_PLUS",
    teamDealDelta: -3.50,
    provisionBase: 0, // No provision for TeamDeal
    deductionRate: 0,
  },
  {
    id: "TEAMDEAL_S",
    name: "TeamDeal S",
    family: "teamdeal",
    productLine: "TEAMDEAL",
    tier: "S",
    dataVolumeGB: 30, // 1GB + 29GB bonus
    baseNet: 14.50,   // 13€ + 1.50€ delta
    pricesByVariant: {
      SIM_ONLY: 14.50,
    },
    features: [
      "30 GB Datenvolumen",
      "Allnet-Flat (Sprache & SMS)",
      "LTE/5G",
      "Voraussetzung: Business Prime auf Kundenkonto",
    ],
    minTermMonths: 24,
    setupFeeNet: 0,
    teamDealBase: "SMART_BUSINESS_PLUS",
    teamDealDelta: 1.50,
    provisionBase: 0,
    deductionRate: 0,
  },
  {
    id: "TEAMDEAL_M",
    name: "TeamDeal M",
    family: "teamdeal",
    productLine: "TEAMDEAL",
    tier: "M",
    dataVolumeGB: 75, // 1GB + 74GB bonus
    baseNet: 19.50,   // 13€ + 6.50€ delta
    pricesByVariant: {
      SIM_ONLY: 19.50,
    },
    features: [
      "75 GB Datenvolumen",
      "Allnet-Flat (Sprache & SMS)",
      "LTE/5G",
      "Voraussetzung: Business Prime auf Kundenkonto",
    ],
    minTermMonths: 24,
    setupFeeNet: 0,
    teamDealBase: "SMART_BUSINESS_PLUS",
    teamDealDelta: 6.50,
    provisionBase: 0,
    deductionRate: 0,
  },
  {
    id: "TEAMDEAL_XL",
    name: "TeamDeal XL",
    family: "teamdeal",
    productLine: "TEAMDEAL",
    tier: "XL",
    dataVolumeGB: "unlimited",
    baseNet: 29.50,   // 13€ + 16.50€ delta
    pricesByVariant: {
      SIM_ONLY: 29.50,
    },
    features: [
      "Unbegrenztes Datenvolumen in DE",
      "Allnet-Flat (Sprache & SMS)",
      "LTE/5G",
      "Voraussetzung: Business Prime auf Kundenkonto",
    ],
    minTermMonths: 24,
    setupFeeNet: 0,
    teamDealBase: "SMART_BUSINESS_PLUS",
    teamDealDelta: 16.50,
    provisionBase: 0,
    deductionRate: 0,
  },
];
