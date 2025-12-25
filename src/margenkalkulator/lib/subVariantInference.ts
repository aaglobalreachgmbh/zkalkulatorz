// ============================================
// SUB Variant Inference Module
// Automatische Ableitung der Geräteklasse aus Hardware-Name
// ============================================

import type { SubVariantId } from "../engine/types";

/**
 * Hardware-Muster für SUB-Varianten-Erkennung
 * Sortiert nach Priorität (speziellere Muster zuerst)
 */
const HARDWARE_PATTERNS: Array<{
  pattern: RegExp;
  subVariant: SubVariantId;
}> = [
  // Ultra-Premium / Special Premium
  { pattern: /ultra|pro\s*max|fold|flip/i, subVariant: "SPECIAL_PREMIUM_SMARTPHONE" },
  
  // Premium (iPhone Pro, Galaxy S, Pixel Pro)
  { pattern: /iphone\s*\d+\s*pro|galaxy\s*s\d+|pixel\s*\d+\s*pro|galaxy\s*z/i, subVariant: "PREMIUM_SMARTPHONE" },
  
  // Standard Smartphones (iPhone, Galaxy A, Pixel, Xiaomi, etc.)
  { pattern: /iphone|galaxy\s*a|pixel|xiaomi|redmi|poco|oppo|oneplus|motorola|honor|realme/i, subVariant: "SMARTPHONE" },
  
  // Basic Phones (Feature Phones)
  { pattern: /nokia|doro|emporia|feature|basic/i, subVariant: "BASIC_PHONE" },
  
  // SIM Only (explizit oder keine Hardware)
  { pattern: /sim[\s-]*only|nur\s*sim|ohne\s*gerät/i, subVariant: "SIM_ONLY" },
];

/**
 * Leitet die SUB-Variante aus dem Hardware-Namen ab
 * 
 * VERWENDUNG:
 * - Beim Hardware-Wechsel wird automatisch eine passende SUB-Variante vorgeschlagen
 * - Der Nutzer kann die Auswahl manuell überschreiben
 * 
 * @param hardwareName - Name des Geräts (z.B. "iPhone 16 Pro Max 256GB")
 * @returns Empfohlene SUB-Variante oder undefined wenn keine Erkennung möglich
 * 
 * @example
 * inferSubVariantFromHardware("iPhone 16 Pro Max") // → "SPECIAL_PREMIUM_SMARTPHONE"
 * inferSubVariantFromHardware("Galaxy A55") // → "SMARTPHONE"
 * inferSubVariantFromHardware("SIM Only") // → "SIM_ONLY"
 */
export function inferSubVariantFromHardware(hardwareName: string): SubVariantId | undefined {
  if (!hardwareName || hardwareName.trim() === "") {
    return "SIM_ONLY";
  }
  
  const trimmedName = hardwareName.trim();
  
  for (const { pattern, subVariant } of HARDWARE_PATTERNS) {
    if (pattern.test(trimmedName)) {
      return subVariant;
    }
  }
  
  // Kein Match → Default zu SMARTPHONE wenn es nach einem Gerät aussieht
  // (mindestens ein Buchstabe und eine Zahl)
  if (/[a-zA-Z].*\d|\d.*[a-zA-Z]/.test(trimmedName)) {
    return "SMARTPHONE";
  }
  
  return undefined;
}

/**
 * Prüft ob eine SUB-Variante für einen Tarif erlaubt ist
 * 
 * @param subVariantId - Gewünschte SUB-Variante
 * @param allowedSubVariants - Erlaubte Varianten des Tarifs
 * @returns true wenn erlaubt, false sonst
 */
export function isSubVariantAllowed(
  subVariantId: SubVariantId | string,
  allowedSubVariants: SubVariantId[] | undefined
): boolean {
  if (!allowedSubVariants || allowedSubVariants.length === 0) {
    return true; // Keine Einschränkung
  }
  return allowedSubVariants.includes(subVariantId as SubVariantId);
}

/**
 * Findet die beste erlaubte SUB-Variante basierend auf Hardware
 * 
 * @param hardwareName - Name des Geräts
 * @param allowedSubVariants - Erlaubte Varianten des Tarifs
 * @returns Beste erlaubte SUB-Variante (fallback: erste erlaubte oder SIM_ONLY)
 */
export function getBestAllowedSubVariant(
  hardwareName: string,
  allowedSubVariants: SubVariantId[] | undefined
): SubVariantId {
  const inferred = inferSubVariantFromHardware(hardwareName);
  
  // Wenn keine Einschränkung oder inferred erlaubt → direkt zurück
  if (!allowedSubVariants || allowedSubVariants.length === 0) {
    return inferred ?? "SIM_ONLY";
  }
  
  if (inferred && allowedSubVariants.includes(inferred)) {
    return inferred;
  }
  
  // Fallback: Erste erlaubte Variante (normalerweise SIM_ONLY)
  return allowedSubVariants[0] ?? "SIM_ONLY";
}
