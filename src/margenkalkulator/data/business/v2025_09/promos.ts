// ============================================
// Business Promos - 2025-09 (Slice B: Time-based validity)
// ============================================

import type { Promo } from "../../../../margenkalkulator/engine/types";

export const businessPromos: Promo[] = [
  {
    id: "NONE",
    type: "NONE",
    appliesTo: "both",
    appliesToTariffs: "*", // Gilt für alle Tarife
    label: "Keine Aktion",
    durationMonths: 0,
    value: 0,
  },
  
  // ============================================
  // Business Prime Aktionsrabatt (bis 18.12.2025)
  // Source: https://www.vodafone.de/business/mobilfunk/business-prime.html
  // Jede Promo ist TARIF-SPEZIFISCH zugeordnet
  // ============================================
  {
    id: "PRIME_AKTION_S",
    type: "ABS_OFF_BASE",
    appliesTo: "mobile",
    appliesToTariffs: ["PRIME_S"], // NUR für Prime S
    label: "Prime S Aktion (−5€/mtl.)",
    durationMonths: 24,
    value: 0,
    amountNetPerMonth: 5,
    validFromISO: "2025-09-01",
    validUntilISO: "2025-12-18",
    eligibilityNote: "Gültig bei Aktivierung bis 18.12.2025",
    sourceRef: "https://www.vodafone.de/business/mobilfunk/business-prime.html",
  },
  {
    id: "PRIME_AKTION_M",
    type: "ABS_OFF_BASE",
    appliesTo: "mobile",
    appliesToTariffs: ["PRIME_M"], // NUR für Prime M
    label: "Prime M Aktion (−10€/mtl.)",
    durationMonths: 24,
    value: 0,
    amountNetPerMonth: 10,
    validFromISO: "2025-09-01",
    validUntilISO: "2025-12-18",
    eligibilityNote: "Gültig bei Aktivierung bis 18.12.2025",
    sourceRef: "https://www.vodafone.de/business/mobilfunk/business-prime.html",
  },
  {
    id: "PRIME_AKTION_L",
    type: "ABS_OFF_BASE",
    appliesTo: "mobile",
    appliesToTariffs: ["PRIME_L"], // NUR für Prime L
    label: "Prime L Aktion (−15€/mtl.)",
    durationMonths: 24,
    value: 0,
    amountNetPerMonth: 15,
    validFromISO: "2025-09-01",
    validUntilISO: "2025-12-18",
    eligibilityNote: "Gültig bei Aktivierung bis 18.12.2025",
    sourceRef: "https://www.vodafone.de/business/mobilfunk/business-prime.html",
  },
  {
    id: "PRIME_AKTION_XL",
    type: "ABS_OFF_BASE",
    appliesTo: "mobile",
    appliesToTariffs: ["PRIME_XL"], // NUR für Prime XL
    label: "Prime XL Aktion (−25€/mtl.)",
    durationMonths: 24,
    value: 0,
    amountNetPerMonth: 25,
    validFromISO: "2025-09-01",
    validUntilISO: "2025-12-18",
    eligibilityNote: "Gültig bei Aktivierung bis 18.12.2025",
    sourceRef: "https://www.vodafone.de/business/mobilfunk/business-prime.html",
  },
  
  // ============================================
  // BP-frei Aktionen (Basispreisbefreiung)
  // Gilt für alle Prime-Tarife
  // ============================================
  {
    id: "BP_FREI_6M",
    type: "INTRO_PRICE",
    appliesTo: "mobile",
    appliesToTariffs: ["PRIME_S", "PRIME_M", "PRIME_L", "PRIME_XL"], // Alle Prime
    label: "BP frei 6 Monate",
    durationMonths: 6,
    value: 0, // 0€ Basispreis für 6 Monate
    eligibilityNote: "Standard BP-Befreiung für 6 Monate",
  },
  {
    id: "BP_FREI_12M_DGRV",
    type: "INTRO_PRICE",
    appliesTo: "mobile",
    appliesToTariffs: ["PRIME_S", "PRIME_M", "PRIME_L", "PRIME_XL"], // Alle Prime, DGRV-berechtigt
    label: "BP frei 12 Monate (DGRV)",
    durationMonths: 12,
    value: 0, // 0€ Basispreis für 12 Monate
    eligibilityNote: "Nur für DGRV-berechtigte Tarife (Verbände, Genossenschaften)",
  },
  
  // ============================================
  // Legacy Promos (für alle Tarife)
  // ============================================
  {
    id: "12X50",
    type: "PCT_OFF_BASE",
    appliesTo: "mobile",
    appliesToTariffs: "*", // Alle Tarife
    label: "12×50% auf Base",
    durationMonths: 12,
    value: 0.5,
  },
  {
    id: "OMO25",
    type: "PCT_OFF_BASE",
    appliesTo: "mobile",
    appliesToTariffs: "*", // Alle Tarife
    label: "OMO 25% (Dauerhaft)",
    durationMonths: 24,
    value: 0.25,
  },
];
