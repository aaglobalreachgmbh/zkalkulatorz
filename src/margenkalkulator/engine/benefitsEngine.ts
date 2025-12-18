// ============================================
// GigaKombi Business Benefits Engine - Phase 2 Slice C
// Source: InfoDok 4511 GigaKombi Business Prime
// ============================================

import type { 
  MobileTariff, 
  FixedNetState,
  FixedNetAccessType,
  Catalog 
} from "./types";

// ============================================
// GigaKombi Types
// ============================================

export type GigaKombiResult = {
  eligible: boolean;
  unlimitedLinesCount: number;  // max 10
  primeLinesSorted: string[];   // tariff IDs sorted by priority
  explanation: string;
};

// ============================================
// Priority Configuration
// Business Prime: L > M > S
// ============================================

const PRIME_PRIORITY: Record<string, number> = {
  // Business Prime tiers
  "L": 1,
  "M": 2,
  "S": 3,
  // Red Business Prime (future expansion)
  "PLUS": 0,  // Prime Plus has highest priority
  "GO": 4,    // Prime Go has lowest
};

// Fixed net access types eligible for GigaKombi
const GK_ELIGIBLE_ACCESS_TYPES: FixedNetAccessType[] = [
  "CABLE",
  "DSL", 
  "FIBER",
];

// Maximum unlimited lines per GigaKombi
const MAX_UNLIMITED_LINES = 10;

// ============================================
// Main GigaKombi Calculation
// ============================================

/**
 * Calculate GigaKombi Business eligibility and benefits
 * 
 * Rules:
 * - Requires eligible fixed net product (Cable/DSL/Fiber)
 * - Benefits apply to Prime tariffs only
 * - Up to 10 Prime lines get unlimited data
 * - Priority: L > M > S
 */
export function calculateGigaKombi(
  mobileTariffs: { tariffId: string; quantity: number }[],
  fixedNetState: FixedNetState,
  catalog: Catalog
): GigaKombiResult {
  // Check if fixed net is enabled
  if (!fixedNetState.enabled) {
    return {
      eligible: false,
      unlimitedLinesCount: 0,
      primeLinesSorted: [],
      explanation: "Kein Festnetz gewählt",
    };
  }

  // Get fixed net product and check eligibility
  const fixedProduct = catalog.fixedNetProducts.find(
    (p) => p.id === fixedNetState.productId
  );
  
  if (!fixedProduct) {
    return {
      eligible: false,
      unlimitedLinesCount: 0,
      primeLinesSorted: [],
      explanation: "Festnetz-Produkt nicht gefunden",
    };
  }

  // Check if access type is GK-eligible
  const accessType = fixedProduct.accessType;
  if (!accessType || !GK_ELIGIBLE_ACCESS_TYPES.includes(accessType)) {
    return {
      eligible: false,
      unlimitedLinesCount: 0,
      primeLinesSorted: [],
      explanation: "Festnetz-Produkt nicht GigaKombi-berechtigt (nur Cable/DSL/Glasfaser)",
    };
  }

  // Collect Prime lines with their priority
  const primeLines: { tariffId: string; tier: string; priority: number }[] = [];

  for (const { tariffId, quantity } of mobileTariffs) {
    const tariff = catalog.mobileTariffs.find((t) => t.id === tariffId);
    
    // Only Prime product line is eligible
    if (tariff?.productLine === "PRIME" && tariff.tier) {
      const priority = PRIME_PRIORITY[tariff.tier] ?? 99;
      
      // Add one entry per line quantity
      for (let i = 0; i < quantity; i++) {
        primeLines.push({
          tariffId,
          tier: tariff.tier,
          priority,
        });
      }
    }
  }

  // No Prime lines = no GigaKombi benefit
  if (primeLines.length === 0) {
    return {
      eligible: false,
      unlimitedLinesCount: 0,
      primeLinesSorted: [],
      explanation: "Kein Business Prime im Angebot",
    };
  }

  // Sort by priority (lower number = higher priority)
  primeLines.sort((a, b) => a.priority - b.priority);

  // Limit to MAX_UNLIMITED_LINES
  const eligibleLines = primeLines.slice(0, MAX_UNLIMITED_LINES);
  const totalPrimeLines = primeLines.length;

  // Build explanation
  let explanation: string;
  if (eligibleLines.length === 1) {
    explanation = `Unlimited Datenvolumen auf 1 Prime-SIM (${eligibleLines[0].tier})`;
  } else if (totalPrimeLines <= MAX_UNLIMITED_LINES) {
    explanation = `Unlimited Datenvolumen auf ${eligibleLines.length} Prime-SIMs`;
  } else {
    explanation = `Unlimited Datenvolumen auf ${eligibleLines.length} von ${totalPrimeLines} Prime-SIMs (max. ${MAX_UNLIMITED_LINES})`;
  }

  return {
    eligible: true,
    unlimitedLinesCount: eligibleLines.length,
    primeLinesSorted: eligibleLines.map((l) => l.tariffId),
    explanation,
  };
}

// ============================================
// Helper: Check single tariff GK eligibility
// ============================================

export function isTariffGKEligible(tariff: MobileTariff | undefined): boolean {
  if (!tariff) return false;
  return tariff.productLine === "PRIME";
}

// ============================================
// Helper: Check fixed net GK eligibility
// ============================================

export function isFixedNetGKEligible(
  accessType: FixedNetAccessType | undefined
): boolean {
  if (!accessType) return false;
  return GK_ELIGIBLE_ACCESS_TYPES.includes(accessType);
}
