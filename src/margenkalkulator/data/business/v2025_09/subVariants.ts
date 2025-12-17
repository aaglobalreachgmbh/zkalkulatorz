// ============================================
// SUB Variants - 2025-09
// ============================================

import type { SubVariant } from "../../../../margenkalkulator/engine/types";

export const businessSubVariants: SubVariant[] = [
  { 
    id: "SIM_ONLY", 
    label: "SIM only", 
    monthlyAddNet: 0 
  },
  { 
    id: "SUB5", 
    label: "SUB5 (+5€)", 
    monthlyAddNet: 5 
  },
  { 
    id: "SUB10", 
    label: "SUB10 (+10€)", 
    monthlyAddNet: 10 
  },
];
