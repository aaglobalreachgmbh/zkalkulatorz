// ============================================
// Business Prime Tariffs - Oktober 2025
// Quellen: 
//   - InfoDok 4246 (Tarif-Details)
//   - SoHo_Provisionsliste_Mobilfunk_TK-World.pdf (Provisionen)
// Gültig: 01.10.2025 - 31.10.2025
// ============================================
// SICHERHEITSHINWEIS: Provisionsdaten sind vertraulich
// und nur über authentifizierte Routen zugänglich.
// ============================================

import type { MobileTariff, SubVariantId } from "../../../../margenkalkulator/engine/types";

const ALL_SUB_VARIANTS: SubVariantId[] = [
  "SIM_ONLY", 
  "BASIC_PHONE", 
  "SMARTPHONE", 
  "PREMIUM_SMARTPHONE", 
  "SPECIAL_PREMIUM_SMARTPHONE"
];

export const mobilePrimeTariffs: MobileTariff[] = [
  {
    id: "PRIME_S",
    name: "Business Prime S",
    family: "prime",
    tier: "S",
    productLine: "PRIME",
    baseNet: 29,
    dataVolumeGB: 20,
    euRoamingHighspeedGB: 45,
    euRoamingNote: undefined,
    roamingPacketZone1GB: 1,
    oneNumberIncludedCount: 1,
    gigaDepot: { status: "optional", priceNet: 3.95 },
    allowedSubVariants: ALL_SUB_VARIANTS,
    features: [
      "20 GB Daten in DE",
      "45 GB EU-Roaming Highspeed",
      "360° Europa Flat",
      "5G inklusive",
      "WiFi Calling",
      "1× OneNumber inkl.",
      "ReisePaket Zone 1 (1 GB)",
    ],
    oneNumberIncluded: true,
    // Provisionen aus TK-World Liste (Oktober 2025)
    provisionBase: 265,      // 255 Basis + 10 Push
    provisionRenewal: 75,    // 55 Basis + 20 Push
    deductionRate: 0,
    omoDeduction: 55,        // OMO 25% Abzug
  },
  {
    id: "PRIME_M",
    name: "Business Prime M",
    family: "prime",
    tier: "M",
    productLine: "PRIME",
    baseNet: 42,
    dataVolumeGB: 50,
    euRoamingHighspeedGB: 65,
    euRoamingNote: undefined,
    roamingPacketZone1GB: 2,
    oneNumberIncludedCount: 2,
    gigaDepot: { status: "included" },
    allowedSubVariants: ALL_SUB_VARIANTS,
    features: [
      "50 GB Daten in DE",
      "65 GB EU-Roaming Highspeed",
      "360° Europa Flat",
      "5G inklusive",
      "WiFi Calling",
      "2× OneNumber inkl.",
      "ReisePaket Zone 1 (2 GB)",
      "GigaDepot inklusive",
    ],
    oneNumberIncluded: true,
    // Provisionen aus TK-World Liste (Oktober 2025) - 04_2025 Version
    // Inkl. 80€ Prime-Extra-Push
    provisionBase: 435,      // 345 Basis + 80 Prime-Push + 10 Standard-Push
    provisionRenewal: 125,   // 105 Basis + 20 Push
    deductionRate: 0,
    omoDeduction: 55,        // OMO 25% Abzug
  },
  {
    id: "PRIME_L",
    name: "Business Prime L",
    family: "prime",
    tier: "L",
    productLine: "PRIME",
    baseNet: 49,
    dataVolumeGB: 200,
    euRoamingHighspeedGB: 80,
    euRoamingNote: undefined,
    roamingPacketZone1GB: 3,
    oneNumberIncludedCount: 3,
    gigaDepot: { status: "included" },
    allowedSubVariants: ALL_SUB_VARIANTS,
    features: [
      "200 GB Daten in DE",
      "80 GB EU-Roaming Highspeed",
      "360° Europa Flat",
      "5G inklusive",
      "WiFi Calling",
      "3× OneNumber inkl.",
      "ReisePaket Zone 1 (3 GB)",
      "GigaDepot inklusive",
    ],
    oneNumberIncluded: true,
    // Provisionen aus TK-World Liste (Oktober 2025)
    // Inkl. 80€ Prime-Extra-Push
    provisionBase: 505,      // 415 Basis + 80 Prime-Push + 10 Standard-Push
    provisionRenewal: 170,   // 150 Basis + 20 Push
    deductionRate: 0,
    omoDeduction: 60,        // OMO 25% Abzug
  },
  {
    id: "PRIME_XL",
    name: "Business Prime XL",
    family: "prime",
    tier: "XL",
    productLine: "PRIME",
    baseNet: 59,
    dataVolumeGB: "unlimited",
    euRoamingHighspeedGB: 95,
    euRoamingNote: undefined,
    roamingPacketZone1GB: 5,
    oneNumberIncludedCount: 1,
    gigaDepot: { status: "included" },
    allowedSubVariants: ALL_SUB_VARIANTS,
    features: [
      "Unbegrenztes Datenvolumen in DE",
      "95 GB EU-Roaming Highspeed",
      "360° Europa Flat",
      "5G Max",
      "WiFi Calling",
      "1× OneNumber inkl.",
      "ReisePaket Zone 1 (5 GB)",
      "GigaDepot inklusive",
    ],
    oneNumberIncluded: true,
    // Provisionen aus TK-World Liste (Oktober 2025)
    // Inkl. 80€ Prime-Extra-Push
    provisionBase: 575,      // 485 Basis + 80 Prime-Push + 10 Standard-Push
    provisionRenewal: 265,   // 245 Basis + 20 Push
    deductionRate: 0,
    omoDeduction: 70,        // OMO 25% Abzug (max verfügbar, 30%/35% gesperrt)
  },
];
