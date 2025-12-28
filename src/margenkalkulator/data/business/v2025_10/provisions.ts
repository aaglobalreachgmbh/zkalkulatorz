// ============================================
// Zentrale Provisions-Tabelle - Oktober 2025
// Quelle: SoHo_Provisionsliste_Mobilfunk_TK-World.pdf
// Gültig: 01.10.2025 - 31.10.2025
// ============================================
// SICHERHEITSHINWEIS: Diese Daten sind nur über authentifizierte
// Routen zugänglich und nicht öffentlich einsehbar.
// ============================================

export interface ProvisionEntry {
  tariffId: string;
  tariffName: string;
  family: "prime" | "business_smart" | "soho" | "gigamobil";
  
  // Neuvertrag
  provisionNewBase: number;     // Basis-Provision NEU
  provisionNewPush: number;     // Push-Bonus NEU (aktuell 10€ Standard)
  provisionNewTotal: number;    // Gesamt NEU (Basis + Push)
  
  // Verlängerung (VVL)
  provisionVVLBase: number;     // Basis-Provision VVL
  provisionVVLPush: number;     // Push-Bonus VVL (aktuell 20€ Standard)
  provisionVVLTotal: number;    // Gesamt VVL (Basis + Push)
  
  // Varianten-spezifisch
  subVariant: "SIM_ONLY" | "SMARTPHONE" | "ALL";
  
  // Zusätzliche Boni
  primeExtraPush?: number;      // Zusätzlicher Prime-Push (80€ für M/L/XL)
  
  notes?: string;
}

/**
 * Provisions-Tabelle aus TK-World SoHo-Liste Oktober 2025
 * 
 * Struktur:
 * - Basis = Grundprovision vom Netzbetreiber
 * - Push = Aktueller Aktions-Bonus
 * - Gesamt = Basis + Push (+ ggf. Prime-Extra-Push)
 */
export const provisionTable: ProvisionEntry[] = [
  // ============================================
  // BUSINESS SMART
  // ============================================
  {
    tariffId: "BUSINESS_SMART_S",
    tariffName: "Business Smart S",
    family: "business_smart",
    provisionNewBase: 90,
    provisionNewPush: 10,
    provisionNewTotal: 100,
    provisionVVLBase: 20,
    provisionVVLPush: 20,
    provisionVVLTotal: 40,
    subVariant: "SIM_ONLY",
  },
  {
    tariffId: "BUSINESS_SMART_S",
    tariffName: "Business Smart S",
    family: "business_smart",
    provisionNewBase: 220,
    provisionNewPush: 10,
    provisionNewTotal: 230,
    provisionVVLBase: 180,
    provisionVVLPush: 20,
    provisionVVLTotal: 200,
    subVariant: "SMARTPHONE",
  },
  {
    tariffId: "BUSINESS_SMART_M",
    tariffName: "Business Smart M",
    family: "business_smart",
    provisionNewBase: 140,
    provisionNewPush: 10,
    provisionNewTotal: 150,
    provisionVVLBase: 15,
    provisionVVLPush: 20,
    provisionVVLTotal: 35,
    subVariant: "SIM_ONLY",
  },
  {
    tariffId: "BUSINESS_SMART_M",
    tariffName: "Business Smart M",
    family: "business_smart",
    provisionNewBase: 300,
    provisionNewPush: 10,
    provisionNewTotal: 310,
    provisionVVLBase: 260,
    provisionVVLPush: 20,
    provisionVVLTotal: 280,
    subVariant: "SMARTPHONE",
  },
  
  // ============================================
  // BUSINESS PRIME S
  // ============================================
  {
    tariffId: "PRIME_S",
    tariffName: "Business Prime S",
    family: "prime",
    provisionNewBase: 255,
    provisionNewPush: 10,
    provisionNewTotal: 265,
    provisionVVLBase: 55,
    provisionVVLPush: 20,
    provisionVVLTotal: 75,
    subVariant: "SIM_ONLY",
  },
  {
    tariffId: "PRIME_S",
    tariffName: "Business Prime S",
    family: "prime",
    provisionNewBase: 385,
    provisionNewPush: 10,
    provisionNewTotal: 395,
    provisionVVLBase: 385,
    provisionVVLPush: 20,
    provisionVVLTotal: 405,
    subVariant: "SMARTPHONE",
  },
  
  // ============================================
  // BUSINESS PRIME M (04_2025 Version)
  // Hinweis: +80€ Prime-Extra-Push
  // ============================================
  {
    tariffId: "PRIME_M",
    tariffName: "Business Prime M",
    family: "prime",
    provisionNewBase: 345,
    provisionNewPush: 10,
    provisionNewTotal: 435, // 345 + 80 + 10
    provisionVVLBase: 105,
    provisionVVLPush: 20,
    provisionVVLTotal: 125,
    subVariant: "SIM_ONLY",
    primeExtraPush: 80,
    notes: "04_2025 Version mit 80€ Prime-Extra-Push",
  },
  {
    tariffId: "PRIME_M",
    tariffName: "Business Prime M",
    family: "prime",
    provisionNewBase: 505,
    provisionNewPush: 10,
    provisionNewTotal: 595, // 505 + 80 + 10
    provisionVVLBase: 505,
    provisionVVLPush: 20,
    provisionVVLTotal: 525,
    subVariant: "SMARTPHONE",
    primeExtraPush: 80,
    notes: "04_2025 Version mit 80€ Prime-Extra-Push",
  },
  
  // ============================================
  // BUSINESS PRIME L
  // Hinweis: +80€ Prime-Extra-Push
  // ============================================
  {
    tariffId: "PRIME_L",
    tariffName: "Business Prime L",
    family: "prime",
    provisionNewBase: 415,
    provisionNewPush: 10,
    provisionNewTotal: 505, // 415 + 80 + 10
    provisionVVLBase: 150,
    provisionVVLPush: 20,
    provisionVVLTotal: 170,
    subVariant: "SIM_ONLY",
    primeExtraPush: 80,
  },
  {
    tariffId: "PRIME_L",
    tariffName: "Business Prime L",
    family: "prime",
    provisionNewBase: 605,
    provisionNewPush: 10,
    provisionNewTotal: 695,
    provisionVVLBase: 605,
    provisionVVLPush: 20,
    provisionVVLTotal: 625,
    subVariant: "SMARTPHONE",
    primeExtraPush: 80,
  },
  
  // ============================================
  // BUSINESS PRIME XL
  // Hinweis: +80€ Prime-Extra-Push
  // ============================================
  {
    tariffId: "PRIME_XL",
    tariffName: "Business Prime XL",
    family: "prime",
    provisionNewBase: 485,
    provisionNewPush: 10,
    provisionNewTotal: 575, // 485 + 80 + 10
    provisionVVLBase: 245,
    provisionVVLPush: 20,
    provisionVVLTotal: 265,
    subVariant: "SIM_ONLY",
    primeExtraPush: 80,
  },
  {
    tariffId: "PRIME_XL",
    tariffName: "Business Prime XL",
    family: "prime",
    provisionNewBase: 705,
    provisionNewPush: 10,
    provisionNewTotal: 795,
    provisionVVLBase: 705,
    provisionVVLPush: 20,
    provisionVVLTotal: 725,
    subVariant: "SMARTPHONE",
    primeExtraPush: 80,
  },
];

/**
 * Hilfsfunktion: Provision für Tarif und Variante abrufen
 */
export function getProvision(
  tariffId: string,
  subVariant: "SIM_ONLY" | "SMARTPHONE",
  contractType: "new" | "renewal"
): number {
  const entry = provisionTable.find(
    (p) => p.tariffId === tariffId && 
           (p.subVariant === subVariant || p.subVariant === "ALL")
  );
  
  if (!entry) {
    console.warn(`[Provisions] Keine Provision gefunden für ${tariffId} / ${subVariant}`);
    return 0;
  }
  
  return contractType === "new" 
    ? entry.provisionNewTotal 
    : entry.provisionVVLTotal;
}

/**
 * Hilfsfunktion: Alle Details zu einer Provision abrufen
 */
export function getProvisionDetails(
  tariffId: string,
  subVariant: "SIM_ONLY" | "SMARTPHONE"
): ProvisionEntry | undefined {
  return provisionTable.find(
    (p) => p.tariffId === tariffId && 
           (p.subVariant === subVariant || p.subVariant === "ALL")
  );
}
