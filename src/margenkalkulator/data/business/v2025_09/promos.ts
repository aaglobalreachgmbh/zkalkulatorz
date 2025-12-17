// ============================================
// Business Promos - 2025-09
// ============================================

import type { Promo } from "../../../../margenkalkulator/engine/types";

export const businessPromos: Promo[] = [
  {
    id: "NONE",
    type: "NONE",
    label: "Keine Aktion",
    durationMonths: 0,
    value: 0,
  },
  {
    id: "12X50",
    type: "PCT_OFF_BASE",
    label: "12×50% auf Base",
    durationMonths: 12,
    value: 0.5, // 50% off base for 12 months
  },
  {
    id: "OMO25",
    type: "PCT_OFF_BASE",
    label: "OMO 25% (Dauerhaft)",
    durationMonths: 24, // Full term = permanent
    value: 0.25, // 25% off base permanently
  },
];
