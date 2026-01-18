// ============================================
// Komfort-Anschluss Plus Products - Phase 2 Slice B
// Sources: 
// - Regio: https://www.vodafone.de/business/media/preisliste-komfort-anschluss-plus-regio.pdf (13.06.2025)
// - FTTH: https://www.vodafone.de/business/media/preisliste-komfort-anschluss-plus-glasfaser-ftth.pdf (25.10.2025)
// ============================================

import type { FixedNetProduct } from "../../../engine/types";
import { DATA_SOURCES } from "./sources";

// ============================================
// Komfort Regio - Phone Tiers + Internet Options
// ============================================

export type KomfortPhoneTier = {
  id: string;
  name: string;
  tier: "M" | "L" | "XL" | "XXL";
  monthlyNet: number;
};

export type KomfortInternetOption = {
  id: string;
  name: string;
  speed: number;
  addonNet: number;
};

// Regio Phone Tiers
export const komfortRegioPhoneTiers: KomfortPhoneTier[] = [
  { id: "KOMFORT_REGIO_M", name: "Phone Basis M", tier: "M", monthlyNet: 19.90 },
  { id: "KOMFORT_REGIO_L", name: "Phone Basis L", tier: "L", monthlyNet: 24.90 },
  { id: "KOMFORT_REGIO_XL", name: "Phone Basis XL", tier: "XL", monthlyNet: 29.90 },
  { id: "KOMFORT_REGIO_XXL", name: "Phone Basis XXL", tier: "XXL", monthlyNet: 44.90 },
];

// Regio Internet Options (add-on pricing)
export const komfortRegioInternetOptions: KomfortInternetOption[] = [
  { id: "KOMFORT_REGIO_I16", name: "Internet 16", speed: 16, addonNet: 5.00 },
  { id: "KOMFORT_REGIO_I50", name: "Internet 50", speed: 50, addonNet: 10.00 },
  { id: "KOMFORT_REGIO_I100", name: "Internet 100", speed: 100, addonNet: 15.00 },
  { id: "KOMFORT_REGIO_I250", name: "Internet 250", speed: 250, addonNet: 25.00 },
];

// ============================================
// Komfort FTTH - Phone Tiers + Internet Options
// ============================================

// FTTH Phone Tiers (no M tier)
export const komfortFTTHPhoneTiers: KomfortPhoneTier[] = [
  { id: "KOMFORT_FTTH_L", name: "Phone Basis L", tier: "L", monthlyNet: 24.90 },
  { id: "KOMFORT_FTTH_XL", name: "Phone Basis XL", tier: "XL", monthlyNet: 29.90 },
  { id: "KOMFORT_FTTH_XXL", name: "Phone Basis XXL", tier: "XXL", monthlyNet: 44.90 },
];

// FTTH Internet Options
export const komfortFTTHInternetOptions: KomfortInternetOption[] = [
  { id: "KOMFORT_FTTH_I150", name: "Internet 150", speed: 150, addonNet: 20.00 },
  { id: "KOMFORT_FTTH_I300", name: "Internet 300", speed: 300, addonNet: 25.00 },
  { id: "KOMFORT_FTTH_I600", name: "Internet 600", speed: 600, addonNet: 35.00 },
  { id: "KOMFORT_FTTH_I1000", name: "Internet 1000", speed: 1000, addonNet: 45.00 },
];

// Fixed IP add-on price for Komfort
export const KOMFORT_FIXED_IP_ADDON_NET = 5.00;

// ============================================
// Combined Komfort Products (for catalog)
// These are generated from phone tier + internet option combinations
// ============================================

export const fixedNetKomfortProducts: FixedNetProduct[] = [
  // Komfort Regio base products (phone only, no internet)
  ...komfortRegioPhoneTiers.map((tier): FixedNetProduct => ({
    id: `KOMFORT_REGIO_${tier.tier}`,
    name: `Komfort-Anschluss Plus Regio ${tier.tier}`,
    productLine: "KOMFORT",
    accessType: "KOMFORT_REGIO",
    speed: 0,
    monthlyNet: tier.monthlyNet,
    oneTimeNet: 0,
    includesRouter: true,
    routerModelDefault: "Standard-Router",
    includesPhone: true,
    fixedIpIncluded: false,
    fixedIpAddonNet: KOMFORT_FIXED_IP_ADDON_NET,
    komfortTier: tier.tier,
    features: [
      `Phone Basis ${tier.tier}`,
      "Telefon-Flat Deutschland Festnetz",
      "Router inklusive",
      "Internetoption zubuchbar",
      "Feste IP optional (+5€/mtl.)",
      "24 Monate Laufzeit",
    ],
    sources: [DATA_SOURCES.KOMFORT_REGIO],
  })),
  
  // Komfort FTTH base products (phone only, no internet)
  ...komfortFTTHPhoneTiers.map((tier): FixedNetProduct => ({
    id: `KOMFORT_FTTH_${tier.tier}`,
    name: `Komfort-Anschluss Plus Glasfaser ${tier.tier}`,
    productLine: "KOMFORT",
    accessType: "KOMFORT_FTTH",
    speed: 0,
    monthlyNet: tier.monthlyNet,
    oneTimeNet: 0,
    includesRouter: true,
    routerModelDefault: "Glasfaser-Router",
    includesPhone: true,
    fixedIpIncluded: false,
    fixedIpAddonNet: KOMFORT_FIXED_IP_ADDON_NET,
    komfortTier: tier.tier,
    features: [
      `Phone Basis ${tier.tier}`,
      "Telefon-Flat Deutschland Festnetz",
      "Glasfaser-Technologie",
      "Router inklusive",
      "Internetoption zubuchbar",
      "Feste IP optional (+5€/mtl.)",
      "24 Monate Laufzeit",
    ],
    sources: [DATA_SOURCES.KOMFORT_FTTH],
  })),
];

// ============================================
// Helper functions for Komfort pricing
// ============================================

export function getKomfortPhoneTier(
  accessType: "KOMFORT_REGIO" | "KOMFORT_FTTH",
  tierId: string
): KomfortPhoneTier | undefined {
  const tiers = accessType === "KOMFORT_REGIO" 
    ? komfortRegioPhoneTiers 
    : komfortFTTHPhoneTiers;
  return tiers.find(t => t.id === tierId);
}

export function getKomfortInternetOption(
  accessType: "KOMFORT_REGIO" | "KOMFORT_FTTH",
  optionId: string
): KomfortInternetOption | undefined {
  const options = accessType === "KOMFORT_REGIO"
    ? komfortRegioInternetOptions
    : komfortFTTHInternetOptions;
  return options.find(o => o.id === optionId);
}

export function calculateKomfortMonthly(
  phoneTier: KomfortPhoneTier | undefined,
  internetOption: KomfortInternetOption | undefined,
  fixedIpEnabled: boolean
): number {
  let total = 0;
  if (phoneTier) total += phoneTier.monthlyNet;
  if (internetOption) total += internetOption.addonNet;
  if (fixedIpEnabled) total += KOMFORT_FIXED_IP_ADDON_NET;
  return total;
}
