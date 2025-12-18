// ============================================
// Fixed Net Glasfaser Products - Phase 2 Slice B
// Source: https://www.vodafone.de/business/media/preisliste-business-internet-glasfaser-ftth.pdf
// Version: 25.10.2025
// ============================================

import type { FixedNetProduct } from "../../../engine/types";
import { DATA_SOURCES } from "./sources";

export const fixedNetFiberProducts: FixedNetProduct[] = [
  {
    id: "FIBER_150",
    name: "Red Business Internet 150",
    productLine: "FIBER",
    accessType: "FIBER",
    speed: 150,
    monthlyNet: 39.90,
    oneTimeNet: 0,
    includesRouter: true,
    routerModelDefault: "Glasfaser-Router",
    fixedIpIncluded: false,
    fixedIpAddonNet: 5.00,
    features: [
      "150 Mbit/s Download",
      "150 Mbit/s Upload (symmetrisch)",
      "Glasfaser-Technologie",
      "Router inklusive",
      "Feste IP optional (+5€/mtl.)",
      "24 Monate Laufzeit",
    ],
    sources: [DATA_SOURCES.GLASFASER],
  },
  {
    id: "FIBER_300",
    name: "Red Business Internet 300",
    productLine: "FIBER",
    accessType: "FIBER",
    speed: 300,
    monthlyNet: 44.90,
    oneTimeNet: 0,
    includesRouter: true,
    routerModelDefault: "Glasfaser-Router",
    fixedIpIncluded: false,
    fixedIpAddonNet: 5.00,
    features: [
      "300 Mbit/s Download",
      "300 Mbit/s Upload (symmetrisch)",
      "Glasfaser-Technologie",
      "Router inklusive",
      "Feste IP optional (+5€/mtl.)",
      "24 Monate Laufzeit",
    ],
    sources: [DATA_SOURCES.GLASFASER],
  },
  {
    id: "FIBER_600",
    name: "Red Business Internet 600",
    productLine: "FIBER",
    accessType: "FIBER",
    speed: 600,
    monthlyNet: 54.90,
    oneTimeNet: 0,
    includesRouter: true,
    routerModelDefault: "Glasfaser-Router",
    fixedIpIncluded: false,
    fixedIpAddonNet: 5.00,
    features: [
      "600 Mbit/s Download",
      "600 Mbit/s Upload (symmetrisch)",
      "Glasfaser-Technologie",
      "Router inklusive",
      "Feste IP optional (+5€/mtl.)",
      "24 Monate Laufzeit",
    ],
    sources: [DATA_SOURCES.GLASFASER],
  },
  {
    id: "FIBER_1000",
    name: "Red Business Internet 1000",
    productLine: "FIBER",
    accessType: "FIBER",
    speed: 1000,
    monthlyNet: 64.90,
    oneTimeNet: 0,
    includesRouter: true,
    routerModelDefault: "Glasfaser-Router",
    fixedIpIncluded: true,
    features: [
      "1000 Mbit/s Download",
      "1000 Mbit/s Upload (symmetrisch)",
      "Glasfaser-Technologie",
      "Router inklusive",
      "Feste IP inklusive",
      "Priority Support",
      "24 Monate Laufzeit",
    ],
    sources: [DATA_SOURCES.GLASFASER],
  },
];
