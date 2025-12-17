// ============================================
// Fixed Net Cable Products (RBI + RBIP) - 2025-09
// ============================================

import type { FixedNetProduct } from "../../../../margenkalkulator/engine/types";

// RBI = Red Business Internet (Data only)
// RBIP = Red Business Internet & Phone (Data + Voice)

export const fixedNetCableProducts: FixedNetProduct[] = [
  // RBI Cable Products
  {
    id: "RBI_100",
    name: "Red Business Internet 100",
    productLine: "RBI",
    speed: 100,
    monthlyNet: 29.99,
    oneTimeNet: 69.99,
    setupWaived: true,
    routerType: "VODAFONE_STATION",
    includesPhone: false,
    features: [
      "100 Mbit/s Download",
      "50 Mbit/s Upload",
      "Vodafone Station",
      "Statische IP optional",
    ],
    promo: {
      type: "INTRO_PRICE",
      durationMonths: 6,
      value: 19.99, // €19.99/month for first 6 months
    },
  },
  {
    id: "RBI_300",
    name: "Red Business Internet 300",
    productLine: "RBI",
    speed: 300,
    monthlyNet: 39.99,
    oneTimeNet: 69.99,
    setupWaived: true,
    routerType: "VODAFONE_STATION",
    includesPhone: false,
    features: [
      "300 Mbit/s Download",
      "50 Mbit/s Upload",
      "Vodafone Station",
      "Statische IP optional",
    ],
    promo: {
      type: "PCT_OFF_BASE",
      durationMonths: 24,
      value: 0.5, // 50% off for 24 months
    },
  },
  {
    id: "RBI_500",
    name: "Red Business Internet 500",
    productLine: "RBI",
    speed: 500,
    monthlyNet: 49.99,
    oneTimeNet: 69.99,
    setupWaived: true,
    routerType: "VODAFONE_STATION",
    includesPhone: false,
    features: [
      "500 Mbit/s Download",
      "50 Mbit/s Upload",
      "Vodafone Station",
      "Statische IP optional",
      "Priority Support",
    ],
    promo: {
      type: "PCT_OFF_BASE",
      durationMonths: 24,
      value: 0.5,
    },
  },
  {
    id: "RBI_1000",
    name: "Red Business Internet 1000",
    productLine: "RBI",
    speed: 1000,
    monthlyNet: 69.99,
    oneTimeNet: 69.99,
    setupWaived: true,
    routerType: "VODAFONE_STATION",
    includesPhone: false,
    features: [
      "1000 Mbit/s Download",
      "50 Mbit/s Upload",
      "Vodafone Station",
      "Statische IP inklusive",
      "Priority Support",
    ],
    promo: {
      type: "PCT_OFF_BASE",
      durationMonths: 24,
      value: 0.5,
    },
  },
  // RBIP Cable Products (with Phone)
  {
    id: "RBIP_100",
    name: "Red Business Internet & Phone 100",
    productLine: "RBIP",
    speed: 100,
    monthlyNet: 34.99,
    oneTimeNet: 69.99,
    setupWaived: true,
    routerType: "FRITZBOX",
    includesPhone: true,
    features: [
      "100 Mbit/s Download",
      "50 Mbit/s Upload",
      "FRITZ!Box 6660",
      "Telefon-Flat Deutschland",
      "2 Rufnummern",
    ],
    promo: {
      type: "INTRO_PRICE",
      durationMonths: 6,
      value: 24.99,
    },
  },
  {
    id: "RBIP_300",
    name: "Red Business Internet & Phone 300",
    productLine: "RBIP",
    speed: 300,
    monthlyNet: 44.99,
    oneTimeNet: 69.99,
    setupWaived: true,
    routerType: "FRITZBOX",
    includesPhone: true,
    features: [
      "300 Mbit/s Download",
      "50 Mbit/s Upload",
      "FRITZ!Box 6660",
      "Telefon-Flat Deutschland",
      "3 Rufnummern",
    ],
    promo: {
      type: "PCT_OFF_BASE",
      durationMonths: 24,
      value: 0.5,
    },
  },
  {
    id: "RBIP_500",
    name: "Red Business Internet & Phone 500",
    productLine: "RBIP",
    speed: 500,
    monthlyNet: 54.99,
    oneTimeNet: 69.99,
    setupWaived: true,
    routerType: "FRITZBOX",
    includesPhone: true,
    features: [
      "500 Mbit/s Download",
      "50 Mbit/s Upload",
      "FRITZ!Box 6660",
      "Telefon-Flat Deutschland",
      "5 Rufnummern",
      "Priority Support",
    ],
    promo: {
      type: "PCT_OFF_BASE",
      durationMonths: 24,
      value: 0.5,
    },
  },
  {
    id: "RBIP_1000",
    name: "Red Business Internet & Phone 1000",
    productLine: "RBIP",
    speed: 1000,
    monthlyNet: 74.99,
    oneTimeNet: 69.99,
    setupWaived: true,
    routerType: "FRITZBOX",
    includesPhone: true,
    features: [
      "1000 Mbit/s Download",
      "50 Mbit/s Upload",
      "FRITZ!Box 6690",
      "Telefon-Flat Deutschland",
      "10 Rufnummern",
      "Priority Support",
      "VoIP Enterprise",
    ],
    promo: {
      type: "PCT_OFF_BASE",
      durationMonths: 24,
      value: 0.5,
    },
  },
];
