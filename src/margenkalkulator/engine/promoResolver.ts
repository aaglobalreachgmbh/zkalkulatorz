// ============================================
// Promo Resolver - Dataset-driven Compatibility
// Phase 1: Promo Compatibility Layer
// ============================================

import type { Promo, DatasetVersion, MobileTariff } from "./types";
import { getAvailableOMORates, type OMORate } from "../data/business/v2025_10/omoMatrix";

// ============================================
// Types
// ============================================

/**
 * Promo-Kompatibilitäts-Felder (erweitert Promo)
 */
export interface PromoCompatibility {
  /** Gruppe für Exklusivität (nur eine aus Gruppe erlaubt) */
  exclusiveGroup?: string;
  /** Inkompatible Gruppen */
  incompatibleWithGroups?: string[];
  /** Erfordert Berechtigung */
  requiresEligibility?: boolean;
  /** Priorität bei Konflikten */
  priority: number;
  /** Mit allem kombinierbar */
  stackableWithAll?: boolean;
  /** Für Kunden sichtbar */
  isCustomerVisible: boolean;
  /** Dealer-sensitiv */
  isDealerSensitive: boolean;
  /** Quellen-Metadaten */
  sourceMeta?: {
    document: string;
    version: string;
    page?: number;
  };
}

/**
 * Promo mit Kompatibilitäts-Daten
 */
export type ExtendedPromo = Promo & Partial<PromoCompatibility>;

/**
 * Validierungsergebnis
 */
export interface PromoValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  appliedPromos: ExtendedPromo[];
  conflictingPromos: ExtendedPromo[];
}

// ============================================
// Default Compatibility Rules
// ============================================

/**
 * Default-Kompatibilitäts-Regeln (Admin-konfigurierbar)
 */
export const DEFAULT_COMPATIBILITY_RULES: Record<string, Partial<PromoCompatibility>> = {
  // OMO-Gruppe: Nur eine OMO-Stufe erlaubt
  OMO: {
    exclusiveGroup: "OMO",
    incompatibleWithGroups: ["ABS_DISCOUNT"],
    isDealerSensitive: true,
    isCustomerVisible: false,
    priority: 50,
  },
  
  // ABS_DISCOUNT: Inkompatibel mit OMO
  ABS_DISCOUNT: {
    exclusiveGroup: "ABS_DISCOUNT",
    incompatibleWithGroups: ["OMO"],
    isDealerSensitive: false,
    isCustomerVisible: true,
    priority: 40,
  },
  
  // BP_FREE: Basispreis-Befreiung, kombinierbar mit allem
  BP_FREE: {
    stackableWithAll: true,
    isCustomerVisible: true,
    isDealerSensitive: false,
    priority: 100, // Höchste Priorität (wird zuerst angewendet)
  },
  
  // DATA_BOOST: Kombinierbar mit OMO und RV
  DATA_BOOST: {
    isCustomerVisible: true,
    isDealerSensitive: false,
    priority: 30,
  },
  
  // DISCOUNT_BOOST: Exklusiv, nicht mit OMO kombinierbar
  DISCOUNT_BOOST: {
    exclusiveGroup: "DISCOUNT_BOOST",
    incompatibleWithGroups: ["OMO", "RV_DISCOUNT"],
    isCustomerVisible: true,
    isDealerSensitive: false,
    priority: 60,
  },
};

// ============================================
// Promo ID to Group Mapping
// ============================================

/**
 * Mappt Promo-IDs auf Kompatibilitäts-Gruppen
 */
export function getPromoGroup(promo: Promo | ExtendedPromo): string | undefined {
  // Explizite exclusiveGroup
  if ("exclusiveGroup" in promo && promo.exclusiveGroup) {
    return promo.exclusiveGroup;
  }
  
  // Heuristik basierend auf ID/Type
  const id = promo.id.toUpperCase();
  
  if (id.startsWith("OMO") || id.includes("OMO")) {
    return "OMO";
  }
  if (promo.type === "ABS_OFF_BASE" && id.includes("AKTION")) {
    return "ABS_DISCOUNT";
  }
  if (id.includes("BP_FREI") || id.includes("BP_FREE")) {
    return "BP_FREE";
  }
  if (id.includes("DATA") && id.includes("BOOST")) {
    return "DATA_BOOST";
  }
  
  return undefined;
}

/**
 * Reichert Promo mit Default-Kompatibilitäts-Regeln an
 */
export function enrichPromoWithCompatibility(promo: Promo): ExtendedPromo {
  const group = getPromoGroup(promo);
  const defaults = group ? DEFAULT_COMPATIBILITY_RULES[group] : undefined;
  
  return {
    ...promo,
    priority: defaults?.priority ?? 10,
    isCustomerVisible: defaults?.isCustomerVisible ?? true,
    isDealerSensitive: defaults?.isDealerSensitive ?? false,
    exclusiveGroup: defaults?.exclusiveGroup,
    incompatibleWithGroups: defaults?.incompatibleWithGroups,
    stackableWithAll: defaults?.stackableWithAll,
  };
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validiert Promo-Kombinationen
 */
export function validatePromoCompatibility(
  selectedPromos: (Promo | ExtendedPromo)[],
  tariffId: string,
  options?: { 
    hasEligibility?: boolean;
    adminOverrideEnabled?: boolean;
  }
): PromoValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const conflictingPromos: ExtendedPromo[] = [];
  
  // Enriche alle Promos
  const enrichedPromos = selectedPromos.map(enrichPromoWithCompatibility);
  
  // Filtere "NONE" heraus
  const activePromos = enrichedPromos.filter(p => p.id !== "NONE" && p.type !== "NONE");
  
  if (activePromos.length === 0) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      appliedPromos: [],
      conflictingPromos: [],
    };
  }
  
  // 1. Prüfe exclusiveGroup-Konflikte
  const groupCounts = new Map<string, ExtendedPromo[]>();
  for (const promo of activePromos) {
    const group = promo.exclusiveGroup;
    if (group) {
      if (!groupCounts.has(group)) {
        groupCounts.set(group, []);
      }
      groupCounts.get(group)!.push(promo);
    }
  }
  
  for (const [group, promos] of groupCounts) {
    if (promos.length > 1) {
      // Nur eine aus Gruppe erlaubt
      errors.push(`Nur eine Promo aus Gruppe "${group}" erlaubt. Konflikte: ${promos.map(p => p.label).join(", ")}`);
      // Behalte nur die mit höchster Priorität
      promos.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
      conflictingPromos.push(...promos.slice(1));
    }
  }
  
  // 2. Prüfe incompatibleWithGroups
  for (const promo of activePromos) {
    if (promo.incompatibleWithGroups) {
      for (const incompatibleGroup of promo.incompatibleWithGroups) {
        const conflicting = activePromos.filter(p => 
          p !== promo && 
          p.exclusiveGroup === incompatibleGroup &&
          !p.stackableWithAll
        );
        if (conflicting.length > 0) {
          errors.push(`"${promo.label}" ist nicht kombinierbar mit ${incompatibleGroup}`);
          conflictingPromos.push(...conflicting);
        }
      }
    }
  }
  
  // 3. Prüfe Eligibility
  const requiresEligibility = activePromos.filter(p => p.requiresEligibility);
  if (requiresEligibility.length > 0 && !options?.hasEligibility) {
    if (options?.adminOverrideEnabled) {
      warnings.push(`Promos erfordern Berechtigung: ${requiresEligibility.map(p => p.label).join(", ")}`);
    } else {
      errors.push(`Fehlende Berechtigung für: ${requiresEligibility.map(p => p.label).join(", ")}`);
    }
  }
  
  // Sortiere appliedPromos nach Priorität
  const appliedPromos = activePromos
    .filter(p => !conflictingPromos.includes(p))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    appliedPromos,
    conflictingPromos: [...new Set(conflictingPromos)],
  };
}

/**
 * Prüft ob Promo mit anderen kompatibel ist
 */
export function isPromoCompatible(
  promo: Promo | ExtendedPromo,
  otherPromos: (Promo | ExtendedPromo)[]
): { compatible: boolean; conflictReason?: string } {
  const enriched = enrichPromoWithCompatibility(promo as Promo);
  const result = validatePromoCompatibility([enriched, ...otherPromos], "");
  
  if (result.isValid) {
    return { compatible: true };
  }
  
  const reason = result.errors[0] || "Nicht kombinierbar";
  return { compatible: false, conflictReason: reason };
}

// ============================================
// OMO Rate Functions (Dataset-driven)
// ============================================

/**
 * Gibt verfügbare OMO-Stufen aus Dataset zurück
 * NICHT hardcoded - liest aus OMO-Matrix
 */
export function getAvailableOMORatesFromDataset(
  tariffId: string,
  _datasetVersion?: DatasetVersion
): OMORate[] {
  // Verwendet die bestehende Funktion aus omoMatrix.ts
  return getAvailableOMORates(tariffId);
}

/**
 * Prüft ob OMO-Stufe für Tarif verfügbar ist
 */
export function isOMORateAvailable(
  tariffId: string,
  rate: number
): boolean {
  const available = getAvailableOMORates(tariffId);
  return available.includes(rate as OMORate);
}

/**
 * Gibt die höchste verfügbare OMO-Stufe zurück
 */
export function getMaxOMORate(tariffId: string): OMORate {
  const available = getAvailableOMORates(tariffId);
  return Math.max(...available) as OMORate;
}

// ============================================
// Breakdown Line Generation
// ============================================

export interface PromoBreakdownLine {
  key: string;
  label: string;
  net: number;
  isCustomerVisible: boolean;
  isDealerSensitive: boolean;
  periodRef?: string;
}

/**
 * Generiert Breakdown-Zeilen für Promos
 */
export function generatePromoBreakdownLines(
  appliedPromos: ExtendedPromo[],
  basePrice: number,
  termMonths: number
): PromoBreakdownLine[] {
  const lines: PromoBreakdownLine[] = [];
  
  for (const promo of appliedPromos) {
    if (promo.type === "NONE") continue;
    
    let discount = 0;
    const duration = promo.durationMonths || termMonths;
    
    switch (promo.type) {
      case "INTRO_PRICE":
        // Einführungspreis ersetzt Basispreis
        discount = -(basePrice - (promo.value ?? 0));
        break;
      case "PCT_OFF_BASE":
        // Prozent-Rabatt
        discount = -basePrice * (promo.value ?? 0);
        break;
      case "ABS_OFF_BASE":
        // Absoluter Rabatt
        discount = -(promo.amountNetPerMonth ?? 0);
        break;
    }
    
    lines.push({
      key: `promo_${promo.id.toLowerCase()}`,
      label: promo.label,
      net: discount,
      isCustomerVisible: promo.isCustomerVisible ?? true,
      isDealerSensitive: promo.isDealerSensitive ?? false,
      periodRef: duration < termMonths ? `1-${duration}` : undefined,
    });
  }
  
  return lines;
}

// ============================================
// Export Helpers
// ============================================

/**
 * Filtert Promos für Customer-View
 */
export function filterCustomerVisiblePromos(promos: ExtendedPromo[]): ExtendedPromo[] {
  return promos.filter(p => p.isCustomerVisible !== false);
}

/**
 * Filtert Promos für Dealer-View
 */
export function filterDealerPromos(promos: ExtendedPromo[]): ExtendedPromo[] {
  return promos; // Dealer sieht alles
}

export default {
  validatePromoCompatibility,
  isPromoCompatible,
  getAvailableOMORatesFromDataset,
  isOMORateAvailable,
  enrichPromoWithCompatibility,
  generatePromoBreakdownLines,
  filterCustomerVisiblePromos,
  filterDealerPromos,
};
