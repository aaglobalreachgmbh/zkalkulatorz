// ============================================
// Smart-Engine: Hardware Subsidies & Provisions
// Modul 1.4 - Hardware-Subventionen und Provisionen
// ============================================

import { HARDWARE_SUBSIDIES, type HardwareSubvention } from "./tariffEngine";

/**
 * Hardware-Berechnung Input
 */
export interface HardwareCalculationInput {
  /** Einkaufspreis netto */
  hardwareEK: number;
  /** Sub-Stufe des Tarifs (1-5) */
  subsidyLevel: 1 | 2 | 3 | 4 | 5;
  /** Vertragslaufzeit */
  termMonths: 24 | 36;
}

/**
 * Hardware-Berechnung Output
 */
export interface HardwareCalculationOutput {
  /** Zuzahlung vom Distributor */
  subsidy: number;
  /** Provision auf Hardware */
  provision: number;
  /** Amortisierung pro Monat (optional) */
  monthlyAmortization: number;
  /** Effektiver Hardware-Preis nach Subvention */
  effectivePrice: number;
}

/**
 * Berechnet Hardware-Subvention und Provision
 */
export function calculateHardwareEconomics(
  input: HardwareCalculationInput
): HardwareCalculationOutput {
  const subsidyConfig = getSubsidyConfig(input.subsidyLevel);
  
  // Zuzahlung basierend auf Laufzeit
  const subsidy = input.termMonths === 36 
    ? subsidyConfig.months36 
    : subsidyConfig.months24;
  
  // Provision = Prozentsatz der Subvention
  const provision = subsidy * (subsidyConfig.provisionPercentage / 100);
  
  // Amortisierung pro Monat
  const monthlyAmortization = input.hardwareEK > 0 
    ? input.hardwareEK / input.termMonths 
    : 0;
  
  // Effektiver Preis (nach Subvention)
  const effectivePrice = Math.max(0, input.hardwareEK - subsidy);
  
  return {
    subsidy,
    provision,
    monthlyAmortization,
    effectivePrice,
  };
}

/**
 * Holt Subventions-Konfiguration für Sub-Stufe
 */
export function getSubsidyConfig(level: 1 | 2 | 3 | 4 | 5): HardwareSubvention {
  return HARDWARE_SUBSIDIES.find((s) => s.subsidyLevel === level) ?? HARDWARE_SUBSIDIES[0];
}

/**
 * Ermittelt Sub-Stufe aus Tarifpreis
 */
export function inferSubsidyLevel(basePrice: number): 1 | 2 | 3 | 4 | 5 {
  if (basePrice <= 29) return 1;
  if (basePrice <= 39) return 2;
  if (basePrice <= 49) return 3;
  if (basePrice <= 59) return 4;
  return 5;
}

/**
 * Berechnet maximale sinnvolle Hardware-EK für positive Marge
 */
export function calculateMaxProfitableHardwareEK(
  provision: number,
  subsidyLevel: 1 | 2 | 3 | 4 | 5,
  termMonths: 24 | 36 = 24
): number {
  const subsidyConfig = getSubsidyConfig(subsidyLevel);
  const subsidy = termMonths === 36 ? subsidyConfig.months36 : subsidyConfig.months24;
  const hardwareProvision = subsidy * (subsidyConfig.provisionPercentage / 100);
  
  // Maximaler EK = Provision + Hardware-Provision
  return provision + hardwareProvision;
}

/**
 * Prüft ob Hardware-Wahl profitabel ist
 */
export function isHardwareProfitable(
  hardwareEK: number,
  provision: number,
  subsidyLevel: 1 | 2 | 3 | 4 | 5,
  termMonths: 24 | 36 = 24
): boolean {
  const maxEK = calculateMaxProfitableHardwareEK(provision, subsidyLevel, termMonths);
  return hardwareEK <= maxEK;
}

/**
 * Sub-Stufe Label für UI
 */
export function getSubsidyLevelLabel(level: 1 | 2 | 3 | 4 | 5): string {
  const labels: Record<number, string> = {
    1: "Sub-Stufe 1 (Basis)",
    2: "Sub-Stufe 2 (Standard)",
    3: "Sub-Stufe 3 (Premium)",
    4: "Sub-Stufe 4 (High-End)",
    5: "Sub-Stufe 5 (Ultra)",
  };
  return labels[level] ?? `Sub-Stufe ${level}`;
}

/**
 * Typische Tarife pro Sub-Stufe
 */
export function getTariffsForSubsidyLevel(level: 1 | 2 | 3 | 4 | 5): string[] {
  const mapping: Record<number, string[]> = {
    1: ["Prime S", "Prime M"],
    2: ["Prime L", "GigaMobil S"],
    3: ["Prime XL", "GigaMobil M", "Black S"],
    4: ["GigaMobil L", "Black M"],
    5: ["GigaMobil XL", "Black L", "Black XL"],
  };
  return mapping[level] ?? [];
}
