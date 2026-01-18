// ============================================
// TeamDeal Tariffs - 2025-09
// Source: https://www.vodafone.de/business/teamdeal/
// 
// TeamDeal is based on Smart Business Plus (1GB, 13€/month)
// with volume bonuses and price deltas.
// REQUIREMENT: Active Business Prime on same customer account
// 
// UPDATED: Added correct provisions and SUB variants based on
// actual Vodafone partner data (December 2025).
// ============================================

import type { MobileTariff, SubVariantId } from "../../../../margenkalkulator/engine/types";

// Fallback constants (when no Prime on account)
export const TEAMDEAL_FALLBACK = {
  priceNet: 13,      // Smart Business Plus SIM-only
  dataVolumeGB: 1,   // 1 GB
  tariffId: "SMART_BUSINESS_PLUS",
} as const;

// TeamDeal supports SIM-only and SUB variants (SUB_5, SUB_10)
const TEAMDEAL_ALLOWED_SUBS: SubVariantId[] = ["SIM_ONLY", "BASIC_PHONE", "SMARTPHONE"];

export const teamDealTariffs: MobileTariff[] = [
  // ============================================
  // TeamDeal XS - 10 GB
  // ============================================
  {
    id: "TEAMDEAL_XS",
    name: "TeamDeal XS",
    family: "teamdeal",
    productLine: "TEAMDEAL",
    tier: "XS",
    dataVolumeGB: 10,
    baseNet: 9.50,
    pricesByVariant: {
      SIM_ONLY: 9.50,
      BASIC: 14.50,     // SUB 5: +5€
      SMARTPHONE: 19.50, // SUB 10: +10€
    },
    provisionsByVariant: {
      SIM_ONLY: 55,
      BASIC: 120,
      SMARTPHONE: 170,
    },
    euRoamingNote: "wie in DE",
    allowedSubVariants: TEAMDEAL_ALLOWED_SUBS,
    features: [
      "10 GB Datenvolumen",
      "Allnet-Flat (Sprache & SMS)",
      "LTE/5G",
      "EU: Daten wie in DE",
      "Voraussetzung: Business Prime",
    ],
    minTermMonths: 24,
    setupFeeNet: 0,
    teamDealBase: "SMART_BUSINESS_PLUS",
    teamDealDelta: -3.50,
    provisionBase: 55, // SIM-Only provision
    deductionRate: 0,
  },
  // ============================================
  // TeamDeal S - 20 GB
  // ============================================
  {
    id: "TEAMDEAL_S",
    name: "TeamDeal S",
    family: "teamdeal",
    productLine: "TEAMDEAL",
    tier: "S",
    dataVolumeGB: 20,
    baseNet: 14.50,
    pricesByVariant: {
      SIM_ONLY: 14.50,
      BASIC: 19.50,     // SUB 5: +5€
      SMARTPHONE: 24.50, // SUB 10: +10€
    },
    provisionsByVariant: {
      SIM_ONLY: 135,
      BASIC: 190,
      SMARTPHONE: 235,
    },
    euRoamingNote: "wie in DE",
    allowedSubVariants: TEAMDEAL_ALLOWED_SUBS,
    features: [
      "20 GB Datenvolumen",
      "Allnet-Flat (Sprache & SMS)",
      "LTE/5G",
      "EU: Daten wie in DE",
      "Voraussetzung: Business Prime",
    ],
    minTermMonths: 24,
    setupFeeNet: 0,
    teamDealBase: "SMART_BUSINESS_PLUS",
    teamDealDelta: 1.50,
    provisionBase: 135, // SIM-Only provision
    deductionRate: 0,
  },
  // ============================================
  // TeamDeal M - 50 GB
  // ============================================
  {
    id: "TEAMDEAL_M",
    name: "TeamDeal M",
    family: "teamdeal",
    productLine: "TEAMDEAL",
    tier: "M",
    dataVolumeGB: 50,
    baseNet: 19.50,
    pricesByVariant: {
      SIM_ONLY: 19.50,
      BASIC: 24.50,     // SUB 5: +5€
      SMARTPHONE: 29.50, // SUB 10: +10€
    },
    provisionsByVariant: {
      SIM_ONLY: 210,
      BASIC: 265,
      SMARTPHONE: 305,
    },
    euRoamingNote: "wie in DE",
    allowedSubVariants: TEAMDEAL_ALLOWED_SUBS,
    features: [
      "50 GB Datenvolumen",
      "Allnet-Flat (Sprache & SMS)",
      "LTE/5G",
      "EU: Daten wie in DE",
      "Voraussetzung: Business Prime",
    ],
    minTermMonths: 24,
    setupFeeNet: 0,
    teamDealBase: "SMART_BUSINESS_PLUS",
    teamDealDelta: 6.50,
    provisionBase: 210, // SIM-Only provision
    deductionRate: 0,
  },
  // ============================================
  // TeamDeal XL - Unlimited
  // ============================================
  {
    id: "TEAMDEAL_XL",
    name: "TeamDeal XL",
    family: "teamdeal",
    productLine: "TEAMDEAL",
    tier: "XL",
    dataVolumeGB: "unlimited",
    baseNet: 29.50,
    pricesByVariant: {
      SIM_ONLY: 29.50,
      BASIC: 34.50,     // SUB 5: +5€
      SMARTPHONE: 39.50, // SUB 10: +10€
    },
    provisionsByVariant: {
      SIM_ONLY: 360,
      BASIC: 400,
      SMARTPHONE: 425,
    },
    euRoamingNote: "wie in DE",
    allowedSubVariants: TEAMDEAL_ALLOWED_SUBS,
    features: [
      "Unbegrenztes Datenvolumen in DE",
      "Allnet-Flat (Sprache & SMS)",
      "LTE/5G",
      "EU: Daten wie in DE",
      "Voraussetzung: Business Prime",
    ],
    minTermMonths: 24,
    setupFeeNet: 0,
    teamDealBase: "SMART_BUSINESS_PLUS",
    teamDealDelta: 16.50,
    provisionBase: 360, // SIM-Only provision
    deductionRate: 0,
  },
];
