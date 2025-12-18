// ============================================
// SUB Variants (Geräteklassen) - 2025-09
// Source: InfoDok 4246 (Oktober 2025)
// ============================================

import type { SubVariant } from "../../../../margenkalkulator/engine/types";

export const businessSubVariants: SubVariant[] = [
  { 
    id: "SIM_ONLY", 
    label: "SIM only", 
    monthlyAddNet: 0 
  },
  { 
    id: "BASIC_PHONE", 
    label: "Basic Phone (+5€)", 
    monthlyAddNet: 5 
  },
  { 
    id: "SMARTPHONE", 
    label: "Smartphone (+10€)", 
    monthlyAddNet: 10 
  },
  { 
    id: "PREMIUM_SMARTPHONE", 
    label: "Premium Smartphone (+25€)", 
    monthlyAddNet: 25 
  },
  { 
    id: "SPECIAL_PREMIUM_SMARTPHONE", 
    label: "Special Premium (+40€)", 
    monthlyAddNet: 40 
  },
];
