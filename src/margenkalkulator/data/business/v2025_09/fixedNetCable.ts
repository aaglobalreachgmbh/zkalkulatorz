// ============================================
// Fixed Net Cable Products (RBI + RBIP) - 2025-12-17
// Source: https://www.vodafone.de/business/media/preisliste-und-leistungsbeschreibung-kh-00745-b8-00.pdf
// Stand: 26.11.2025
// ============================================

import type { FixedNetProduct } from "../../../../margenkalkulator/engine/types";

// RBI = Red Business Internet Cable (Data only)
// RBIP = Red Business Internet & Phone Cable (Data + Voice)

// Constants
const SETUP_FEE_NET = 19.90;   // Bereitstellungsentgelt
const SHIPPING_FEE_NET = 8.40; // Versandkosten Hardware
const TOTAL_ONETIME_NET = SETUP_FEE_NET + SHIPPING_FEE_NET; // 28.30€

export const fixedNetCableProducts: FixedNetProduct[] = [
  // ============================================
  // RBI Cable Products (Internet only, Vodafone Station)
  // ============================================
  {
    id: "RBI_100",
    name: "Red Business Internet Cable 100",
    productLine: "RBI",
    speed: 100,
    monthlyNet: 29.99,
    oneTimeNet: TOTAL_ONETIME_NET,
    setupWaived: false,
    routerType: "VODAFONE_STATION",
    includesPhone: false,
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
      value: 19.99, // Aktionspreis Monat 1-6
    },
  },
  {
    id: "RBI_300",
    name: "Red Business Internet Cable 300",
    productLine: "RBI",
    speed: 300,
    monthlyNet: 39.99,
    oneTimeNet: TOTAL_ONETIME_NET,
    setupWaived: false,
    routerType: "VODAFONE_STATION",
    includesPhone: false,
    features: [
      "300 Mbit/s Download",
      "50 Mbit/s Upload",
      "Vodafone Station inklusive",
      "Feste IP optional (+5€/mtl.)",
      "24 Monate Laufzeit",
    ],
    promo: {
      type: "PCT_OFF_BASE",
      durationMonths: 24,
      value: 0.5, // 50% Rabatt für 24 Monate
    },
  },
  {
    id: "RBI_500",
    name: "Red Business Internet Cable 500",
    productLine: "RBI",
    speed: 500,
    monthlyNet: 49.99,
    oneTimeNet: TOTAL_ONETIME_NET,
    setupWaived: false,
    routerType: "VODAFONE_STATION",
    includesPhone: false,
    features: [
      "500 Mbit/s Download",
      "50 Mbit/s Upload",
      "Vodafone Station inklusive",
      "Feste IP inklusive",
      "24 Monate Laufzeit",
    ],
    promo: {
      type: "PCT_OFF_BASE",
      durationMonths: 24,
      value: 0.5,
    },
  },
  {
    id: "RBI_1000",
    name: "Red Business Internet Cable 1000",
    productLine: "RBI",
    speed: 1000,
    monthlyNet: 69.99,
    oneTimeNet: TOTAL_ONETIME_NET,
    setupWaived: false,
    routerType: "VODAFONE_STATION",
    includesPhone: false,
    features: [
      "1000 Mbit/s Download",
      "50 Mbit/s Upload",
      "Vodafone Station inklusive",
      "Feste IP inklusive",
      "Priority Support",
      "24 Monate Laufzeit",
    ],
    promo: {
      type: "PCT_OFF_BASE",
      durationMonths: 24,
      value: 0.5,
    },
  },

  // ============================================
  // RBIP Cable Products (Internet + Phone, FRITZ!Box)
  // ============================================
  {
    id: "RBIP_100",
    name: "Red Business Internet & Phone Cable 100",
    productLine: "RBIP",
    speed: 100,
    monthlyNet: 34.99,
    oneTimeNet: TOTAL_ONETIME_NET,
    setupWaived: false,
    routerType: "FRITZBOX",
    includesPhone: true,
    features: [
      "100 Mbit/s Download",
      "50 Mbit/s Upload",
      "FRITZ!Box 6660/6690 inklusive",
      "Telefon-Flat Deutschland Festnetz",
      "Feste IP optional (+5€/mtl.)",
      "24 Monate Laufzeit",
    ],
    promo: {
      type: "INTRO_PRICE",
      durationMonths: 6,
      value: 24.99,
    },
  },
  {
    id: "RBIP_300",
    name: "Red Business Internet & Phone Cable 300",
    productLine: "RBIP",
    speed: 300,
    monthlyNet: 44.99,
    oneTimeNet: TOTAL_ONETIME_NET,
    setupWaived: false,
    routerType: "FRITZBOX",
    includesPhone: true,
    features: [
      "300 Mbit/s Download",
      "50 Mbit/s Upload",
      "FRITZ!Box 6660/6690 inklusive",
      "Telefon-Flat Deutschland Festnetz",
      "Feste IP optional (+5€/mtl.)",
      "24 Monate Laufzeit",
    ],
    promo: {
      type: "PCT_OFF_BASE",
      durationMonths: 24,
      value: 0.5,
    },
  },
  {
    id: "RBIP_500",
    name: "Red Business Internet & Phone Cable 500",
    productLine: "RBIP",
    speed: 500,
    monthlyNet: 54.99,
    oneTimeNet: TOTAL_ONETIME_NET,
    setupWaived: false,
    routerType: "FRITZBOX",
    includesPhone: true,
    features: [
      "500 Mbit/s Download",
      "50 Mbit/s Upload",
      "FRITZ!Box 6660/6690 inklusive",
      "Telefon-Flat Deutschland Festnetz",
      "Feste IP inklusive",
      "Priority Support",
      "24 Monate Laufzeit",
    ],
    promo: {
      type: "PCT_OFF_BASE",
      durationMonths: 24,
      value: 0.5,
    },
  },
  {
    id: "RBIP_1000",
    name: "Red Business Internet & Phone Cable 1000",
    productLine: "RBIP",
    speed: 1000,
    monthlyNet: 74.99,
    oneTimeNet: TOTAL_ONETIME_NET,
    setupWaived: false,
    routerType: "FRITZBOX",
    includesPhone: true,
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
      type: "PCT_OFF_BASE",
      durationMonths: 24,
      value: 0.5,
    },
  },
];

// ============================================
// Optional Add-ons (for UI display / future use)
// ============================================
export const FIXED_IP_ADDON_NET = 5.00; // €/Monat für 100/300 Mbit
export const EXPERT_SETUP_NET = 89.99;  // Einmalig optional