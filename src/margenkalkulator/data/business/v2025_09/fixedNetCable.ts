// ============================================
// Fixed Net Cable Products (RBI + RBIP) - Slice B
// Source: https://www.vodafone.de/business/media/preisliste-und-leistungsbeschreibung-kh-00745-b8-00.pdf
// Stand: 26.11.2025, Aktion gültig bis 28.01.2026
// ============================================

import type { FixedNetProduct } from "../../../../margenkalkulator/engine/types";

// RBI = Red Business Internet Cable (Data only)
// RBIP = Red Business Internet & Phone Cable (Data + Voice)

// Constants
const SETUP_FEE_NET = 19.90;   // Bereitstellungsentgelt
const SHIPPING_FEE_NET = 8.40; // Versandkosten Hardware
const TOTAL_ONETIME_NET = SETUP_FEE_NET + SHIPPING_FEE_NET; // 28.30€

// Promo validity (Slice B)
const PROMO_VALID_FROM = "2025-11-26";
const PROMO_VALID_UNTIL = "2026-01-28";

export const fixedNetCableProducts: FixedNetProduct[] = [
  // ============================================
  // RBI Cable Products (Internet only, Vodafone Station)
  // ============================================
  {
    id: "RBI_100",
    name: "Red Business Internet Cable 100",
    productLine: "RBI",
    accessType: "CABLE",
    speed: 100,
    monthlyNet: 29.90,
    oneTimeNet: TOTAL_ONETIME_NET,
    setupWaived: false,
    routerType: "VODAFONE_STATION",
    includesRouter: true,
    routerModelDefault: "Vodafone Station",
    includesPhone: false,
    fixedIpIncluded: false,
    fixedIpAddonNet: 5.00,
    expertSetupAvailable: true,
    features: [
      "100 Mbit/s Download",
      "50 Mbit/s Upload",
      "Vodafone Station inklusive",
      "Feste IP optional (+5€/mtl.)",
      "24 Monate Laufzeit",
    ],
    promo: {
      type: "INTRO_PRICE",
      durationMonths: 6,
      value: 19.90,
      validFromISO: PROMO_VALID_FROM,
      validUntilISO: PROMO_VALID_UNTIL,
    },
  },
  {
    id: "RBI_300",
    name: "Red Business Internet Cable 300",
    productLine: "RBI",
    accessType: "CABLE",
    speed: 300,
    monthlyNet: 39.90,
    oneTimeNet: TOTAL_ONETIME_NET,
    setupWaived: false,
    routerType: "VODAFONE_STATION",
    includesRouter: true,
    routerModelDefault: "Vodafone Station",
    includesPhone: false,
    fixedIpIncluded: false,
    fixedIpAddonNet: 5.00,
    expertSetupAvailable: true,
    features: [
      "300 Mbit/s Download",
      "50 Mbit/s Upload",
      "Vodafone Station inklusive",
      "Feste IP optional (+5€/mtl.)",
      "24 Monate Laufzeit",
    ],
    promo: {
      type: "INTRO_PRICE",
      durationMonths: 12,
      value: 19.90,
      validFromISO: PROMO_VALID_FROM,
      validUntilISO: PROMO_VALID_UNTIL,
    },
  },
  {
    id: "RBI_500",
    name: "Red Business Internet Cable 500",
    productLine: "RBI",
    accessType: "CABLE",
    speed: 500,
    monthlyNet: 49.90,
    oneTimeNet: TOTAL_ONETIME_NET,
    setupWaived: false,
    routerType: "VODAFONE_STATION",
    includesRouter: true,
    routerModelDefault: "Vodafone Station",
    includesPhone: false,
    fixedIpIncluded: true,
    expertSetupAvailable: true,
    features: [
      "500 Mbit/s Download",
      "50 Mbit/s Upload",
      "Vodafone Station inklusive",
      "Feste IP inklusive",
      "24 Monate Laufzeit",
    ],
    promo: {
      type: "INTRO_PRICE",
      durationMonths: 12,
      value: 19.90,
      validFromISO: PROMO_VALID_FROM,
      validUntilISO: PROMO_VALID_UNTIL,
    },
  },
  {
    id: "RBI_1000",
    name: "Red Business Internet Cable 1000",
    productLine: "RBI",
    accessType: "CABLE",
    speed: 1000,
    monthlyNet: 54.90,
    oneTimeNet: TOTAL_ONETIME_NET,
    setupWaived: false,
    routerType: "VODAFONE_STATION",
    includesRouter: true,
    routerModelDefault: "Vodafone Station",
    includesPhone: false,
    fixedIpIncluded: true,
    expertSetupAvailable: true,
    features: [
      "1000 Mbit/s Download",
      "50 Mbit/s Upload",
      "Vodafone Station inklusive",
      "Feste IP inklusive",
      "Priority Support",
      "24 Monate Laufzeit",
    ],
    promo: {
      type: "INTRO_PRICE",
      durationMonths: 12,
      value: 14.90,
      validFromISO: PROMO_VALID_FROM,
      validUntilISO: PROMO_VALID_UNTIL,
    },
  },

  // ============================================
  // RBIP Cable Products (Internet + Phone, FRITZ!Box)
  // ============================================
  {
    id: "RBIP_100",
    name: "Red Business Internet & Phone Cable 100",
    productLine: "RBIP",
    accessType: "CABLE",
    speed: 100,
    monthlyNet: 34.90,
    oneTimeNet: TOTAL_ONETIME_NET,
    setupWaived: false,
    routerType: "FRITZBOX",
    includesRouter: true,
    routerModelDefault: "FRITZ!Box 6690",
    includesPhone: true,
    fixedIpIncluded: false,
    fixedIpAddonNet: 5.00,
    expertSetupAvailable: true,
    features: [
      "100 Mbit/s Download",
      "50 Mbit/s Upload",
      "FRITZ!Box 6690 inklusive",
      "Telefon-Flat Deutschland Festnetz",
      "Feste IP optional (+5€/mtl.)",
      "24 Monate Laufzeit",
    ],
    promo: {
      type: "INTRO_PRICE",
      durationMonths: 6,
      value: 19.90,
      validFromISO: PROMO_VALID_FROM,
      validUntilISO: PROMO_VALID_UNTIL,
    },
  },
  {
    id: "RBIP_300",
    name: "Red Business Internet & Phone Cable 300",
    productLine: "RBIP",
    accessType: "CABLE",
    speed: 300,
    monthlyNet: 44.90,
    oneTimeNet: TOTAL_ONETIME_NET,
    setupWaived: false,
    routerType: "FRITZBOX",
    includesRouter: true,
    routerModelDefault: "FRITZ!Box 6690",
    includesPhone: true,
    fixedIpIncluded: false,
    fixedIpAddonNet: 5.00,
    expertSetupAvailable: true,
    features: [
      "300 Mbit/s Download",
      "50 Mbit/s Upload",
      "FRITZ!Box 6690 inklusive",
      "Telefon-Flat Deutschland Festnetz",
      "Feste IP optional (+5€/mtl.)",
      "24 Monate Laufzeit",
    ],
    promo: {
      type: "INTRO_PRICE",
      durationMonths: 12,
      value: 19.90,
      validFromISO: PROMO_VALID_FROM,
      validUntilISO: PROMO_VALID_UNTIL,
    },
  },
  {
    id: "RBIP_500",
    name: "Red Business Internet & Phone Cable 500",
    productLine: "RBIP",
    accessType: "CABLE",
    speed: 500,
    monthlyNet: 54.90,
    oneTimeNet: TOTAL_ONETIME_NET,
    setupWaived: false,
    routerType: "FRITZBOX",
    includesRouter: true,
    routerModelDefault: "FRITZ!Box 6690",
    includesPhone: true,
    fixedIpIncluded: true,
    expertSetupAvailable: true,
    features: [
      "500 Mbit/s Download",
      "50 Mbit/s Upload",
      "FRITZ!Box 6690 inklusive",
      "Telefon-Flat Deutschland Festnetz",
      "Feste IP inklusive",
      "Priority Support",
      "24 Monate Laufzeit",
    ],
    promo: {
      type: "INTRO_PRICE",
      durationMonths: 12,
      value: 19.90,
      validFromISO: PROMO_VALID_FROM,
      validUntilISO: PROMO_VALID_UNTIL,
    },
  },
  {
    id: "RBIP_1000",
    name: "Red Business Internet & Phone Cable 1000",
    productLine: "RBIP",
    accessType: "CABLE",
    speed: 1000,
    monthlyNet: 59.90,
    oneTimeNet: TOTAL_ONETIME_NET,
    setupWaived: false,
    routerType: "FRITZBOX",
    includesRouter: true,
    routerModelDefault: "FRITZ!Box 6690",
    includesPhone: true,
    fixedIpIncluded: true,
    expertSetupAvailable: true,
    features: [
      "1000 Mbit/s Download",
      "50 Mbit/s Upload",
      "FRITZ!Box 6690 inklusive",
      "Telefon-Flat Deutschland Festnetz",
      "Feste IP inklusive",
      "Priority Support",
      "24 Monate Laufzeit",
    ],
    promo: {
      type: "INTRO_PRICE",
      durationMonths: 12,
      value: 14.90,
      validFromISO: PROMO_VALID_FROM,
      validUntilISO: PROMO_VALID_UNTIL,
    },
  },
];

// ============================================
// Optional Add-ons (for UI display / future use)
// ============================================
export const FIXED_IP_ADDON_NET = 5.00; // €/Monat für 100/300 Mbit
export const EXPERT_SETUP_NET = 89.99;  // Einmalig optional
