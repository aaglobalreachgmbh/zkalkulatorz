// ============================================
// OMO-Matrix - Oktober 2025
// Quelle: SoHo_Provisionsliste_Mobilfunk_TK-World.pdf
// Gültig: 01.10.2025 - 31.10.2025
// ============================================
// SICHERHEITSHINWEIS: Diese Daten sind nur über authentifizierte
// Routen zugänglich und nicht öffentlich einsehbar.
// ============================================

export interface OMOMatrixEntry {
  tariffId: string;
  tariffName: string;
  
  // OMO-Abzüge nach Rabattstufe (in €)
  omo10: number | null;   // 10% Rabatt
  omo15: number | null;   // 15% Rabatt
  omo20: number | null;   // 20% Rabatt
  omo25: number | null;   // 25% Rabatt
  omo30: number | null;   // 30% Rabatt (NEU)
  omo35: number | null;   // 35% Rabatt (NEU)
  
  notes?: string;
}

/**
 * OMO-Matrix aus TK-World SoHo-Liste Oktober 2025
 * 
 * Erklärung:
 * - OMO = "Online-Mobil-Option" - Rabatt auf den Grundpreis
 * - Bei Gewährung von OMO-Rabatt wird ein fester Betrag von der Provision abgezogen
 * - null = Stufe für diesen Tarif nicht verfügbar/gesperrt
 */
export const omoMatrix: OMOMatrixEntry[] = [
  // ============================================
  // BUSINESS SMART (kein OMO)
  // ============================================
  {
    tariffId: "BUSINESS_SMART_S",
    tariffName: "Business Smart S",
    omo10: null,
    omo15: null,
    omo20: null,
    omo25: null,
    omo30: null,
    omo35: null,
    notes: "Business Smart hat keinen OMO",
  },
  {
    tariffId: "BUSINESS_SMART_M",
    tariffName: "Business Smart M",
    omo10: null,
    omo15: null,
    omo20: null,
    omo25: null,
    omo30: null,
    omo35: null,
    notes: "Business Smart hat keinen OMO",
  },
  
  // ============================================
  // BUSINESS PRIME S
  // ============================================
  {
    tariffId: "PRIME_S",
    tariffName: "Business Prime S",
    omo10: 40,
    omo15: 45,
    omo20: 50,
    omo25: 55,
    omo30: 100,
    omo35: 110,
  },
  
  // ============================================
  // BUSINESS PRIME M (04_2025 Version)
  // ============================================
  {
    tariffId: "PRIME_M",
    tariffName: "Business Prime M (04_2025)",
    omo10: 55,
    omo15: 55,
    omo20: 55,
    omo25: 55,
    omo30: 160,
    omo35: 185,
    notes: "04_2025 Version - OMO 10-25% gleich",
  },
  
  // ============================================
  // BUSINESS PRIME M (10_2025 Version - falls relevant)
  // ============================================
  {
    tariffId: "PRIME_M_10_2025",
    tariffName: "Business Prime M (10_2025)",
    omo10: 60,
    omo15: 60,
    omo20: 60,
    omo25: 60,
    omo30: 170,
    omo35: 200,
    notes: "10_2025 Version",
  },
  
  // ============================================
  // BUSINESS PRIME L
  // ============================================
  {
    tariffId: "PRIME_L",
    tariffName: "Business Prime L",
    omo10: 60,
    omo15: 60,
    omo20: 60,
    omo25: 60,
    omo30: 185,
    omo35: 215,
  },
  
  // ============================================
  // BUSINESS PRIME XL
  // Hinweis: 30% und 35% nicht verfügbar
  // ============================================
  {
    tariffId: "PRIME_XL",
    tariffName: "Business Prime XL",
    omo10: 70,
    omo15: 70,
    omo20: 70,
    omo25: 70,
    omo30: null, // Nicht verfügbar
    omo35: null, // Nicht verfügbar
    notes: "OMO 30% und 35% nicht verfügbar",
  },
];

// Verfügbare OMO-Stufen
export type OMORate = 0 | 10 | 15 | 20 | 25 | 30 | 35;

export const AVAILABLE_OMO_RATES: OMORate[] = [0, 10, 15, 20, 25, 30, 35];

/**
 * Hilfsfunktion: OMO-Abzug für Tarif und Rate abrufen
 * @returns Abzugsbetrag in € oder null wenn nicht verfügbar
 */
export function getOMODeduction(
  tariffId: string,
  omoRate: OMORate
): number | null {
  if (omoRate === 0) return 0;
  
  const entry = omoMatrix.find((m) => m.tariffId === tariffId);
  if (!entry) {
    console.warn(`[OMO-Matrix] Kein Eintrag für ${tariffId}`);
    return null;
  }
  
  const key = `omo${omoRate}` as keyof OMOMatrixEntry;
  const value = entry[key];
  
  if (value === null) {
    console.warn(`[OMO-Matrix] ${tariffId} hat keinen OMO ${omoRate}%`);
    return null;
  }
  
  return typeof value === "number" ? value : null;
}

/**
 * Hilfsfunktion: Verfügbare OMO-Stufen für einen Tarif
 */
export function getAvailableOMORates(tariffId: string): OMORate[] {
  const entry = omoMatrix.find((m) => m.tariffId === tariffId);
  if (!entry) return [0]; // Nur 0% wenn kein Eintrag
  
  const available: OMORate[] = [0]; // 0% immer verfügbar
  
  if (entry.omo10 !== null) available.push(10);
  if (entry.omo15 !== null) available.push(15);
  if (entry.omo20 !== null) available.push(20);
  if (entry.omo25 !== null) available.push(25);
  if (entry.omo30 !== null) available.push(30);
  if (entry.omo35 !== null) available.push(35);
  
  return available;
}

/**
 * Hilfsfunktion: Prüfen ob OMO für einen Tarif verfügbar ist
 */
export function hasOMO(tariffId: string): boolean {
  const entry = omoMatrix.find((m) => m.tariffId === tariffId);
  if (!entry) return false;
  
  return (
    entry.omo10 !== null ||
    entry.omo15 !== null ||
    entry.omo20 !== null ||
    entry.omo25 !== null ||
    entry.omo30 !== null ||
    entry.omo35 !== null
  );
}
