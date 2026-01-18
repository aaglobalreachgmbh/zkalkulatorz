// ============================================
// TK-World Provision PDF Parser (Enhanced)
// Parses Mobilfunk Provisions + OMO Matrix
// With NEU/VVL Section Recognition
// ============================================

import type { ProvisionRow, OMOMatrixRow } from "../../types";
import { parseGermanPrice, generateIdFromText, type PdfParseResult, type ProvisionParseResult } from "../pdfImporter";

// ============================================
// Enhanced Tariff Pattern Matching
// ============================================

// Known tariff families for pattern matching
const TARIFF_PATTERNS = [
  // Business Prime
  { regex: /business\s*prime\s*(xs|s|m|l|xl)/i, family: "prime", tier: "$1" },
  { regex: /red\s*business\s*prime\s*(xs|s|m|l|xl)?/i, family: "prime", tier: "$1" },
  
  // Business Smart / Smart Business
  { regex: /business\s*smart\s*(xs|s|m|l|xl)/i, family: "business_smart", tier: "$1" },
  { regex: /smart\s*business\s*(xs|s|m|l|xl)/i, family: "smart_business", tier: "$1" },
  
  // GigaMobil
  { regex: /gigamobil\s*(young|basic)?\s*(xs|s|m|l|xl)/i, family: "gigamobil", tier: "$2", variant: "$1" },
  { regex: /giga\s*mobil\s*(young|basic)?\s*(xs|s|m|l|xl)/i, family: "gigamobil", tier: "$2", variant: "$1" },
  
  // SoHo Tarife
  { regex: /soho\s*(prime|smart)?\s*(xs|s|m|l|xl)/i, family: "soho", tier: "$2" },
  
  // Red Business (ohne Prime)
  { regex: /red\s*business\s*(xs|s|m|l|xl)/i, family: "red_business", tier: "$1" },
  
  // Young Tarife
  { regex: /young\s*(xs|s|m|l|xl)/i, family: "young", tier: "$1" },
];

// OMO percentage columns we look for
const OMO_PERCENTAGES = [0, 5, 10, 15, 17.5, 20, 25, 30, 35];

// Section detection patterns
const SECTION_PATTERNS = {
  neu: [
    /neuvertrag/i,
    /\bneu\b/i,
    /neue?\s*vertr/i,
    /new\s*contract/i,
    /neuanschluss/i,
    /neuabschluss/i,
  ],
  vvl: [
    /verlängerung/i,
    /\bvvl\b/i,
    /vertrags?verlängerung/i,
    /renewal/i,
    /existing\s*customer/i,
    /bestandskunde/i,
  ],
};

// ============================================
// Section & Context Tracking
// ============================================

type ParseContext = {
  currentSection: "neu" | "vvl" | "unknown";
  currentFamily: string | null;
  pageNumber: number;
  lineNumber: number;
};

function detectSection(line: string): "neu" | "vvl" | null {
  const upper = line.toUpperCase();
  
  for (const pattern of SECTION_PATTERNS.neu) {
    if (pattern.test(line)) return "neu";
  }
  for (const pattern of SECTION_PATTERNS.vvl) {
    if (pattern.test(line)) return "vvl";
  }
  
  // Look for column headers indicating section
  if (upper.includes("NEU") && !upper.includes("VVL")) return "neu";
  if (upper.includes("VVL") || upper.includes("VERLÄN")) return "vvl";
  
  return null;
}

// ============================================
// Line-by-Line Parser
// ============================================

type ParsedTariffLine = {
  name: string;
  id: string;
  family: string;
  tier?: string;
  variant?: string;
  rvCode?: string;
  provisionNew?: number;
  provisionNewPush?: number;
  provisionVVL?: number;
  provisionVVLPush?: number;
  omoValues: Map<number, number | null>;
  section: "neu" | "vvl" | "both" | "unknown";
  confidence: number;
};

function extractTariffFromLine(line: string, context: ParseContext): ParsedTariffLine | null {
  // Skip headers and empty lines
  if (!line.trim() || line.length < 8) return null;
  
  // Skip obvious non-tariff lines
  const skipPatterns = [
    /^seite\s*\d/i,
    /^stand\s*:/i,
    /^\d{2}\.\d{2}\.\d{4}/,
    /^gültig\s*(ab|bis)/i,
    /^provision/i,
    /^tarif\s*name/i,
  ];
  for (const pattern of skipPatterns) {
    if (pattern.test(line.trim())) return null;
  }
  
  // Check against known patterns
  for (const { regex, family, tier } of TARIFF_PATTERNS) {
    const match = line.match(regex);
    if (match) {
      const name = match[0].trim();
      const extractedTier = tier?.replace("$1", match[1] || "").replace("$2", match[2] || "").trim();
      
      // Generate normalized ID
      const idParts = [family];
      if (extractedTier) idParts.push(extractedTier);
      const id = generateIdFromText(idParts.join("_"));
      
      // Calculate confidence based on match quality
      let confidence = 0.7;
      if (match[0].length > 10) confidence += 0.1;
      if (line.includes("€")) confidence += 0.1;
      
      return {
        name,
        id,
        family,
        tier: extractedTier,
        omoValues: new Map(),
        section: context.currentSection,
        confidence,
      };
    }
  }
  
  return null;
}

function extractProvisionValues(line: string, context: ParseContext): {
  provisionNew?: number;
  provisionNewPush?: number;
  provisionVVL?: number;
  provisionVVLPush?: number;
} {
  const result: ReturnType<typeof extractProvisionValues> = {};
  
  // Look for Euro amounts in the line
  const euroPattern = /(\d{1,4}(?:[.,]\d{2})?)\s*€?/g;
  const matches = [...line.matchAll(euroPattern)];
  
  if (matches.length === 0) return result;
  
  // Parse all values
  const values = matches
    .map(m => parseGermanPrice(m[1]))
    .filter((v): v is number => v !== null && v > 0);
  
  if (values.length === 0) return result;
  
  // Different parsing strategies based on column count and section
  if (values.length === 1) {
    // Single value - assign based on section
    if (context.currentSection === "vvl") {
      result.provisionVVL = values[0];
    } else {
      result.provisionNew = values[0];
    }
  } else if (values.length === 2) {
    // Two values: could be Basis + Push OR NEU + VVL
    const [first, second] = values;
    
    if (second < 100 && first > 100) {
      // First large, second small = Basis + Push
      result.provisionNew = first;
      result.provisionNewPush = second;
    } else if (first > 100 && second > 100) {
      // Both large = NEU + VVL
      result.provisionNew = Math.max(first, second);
      result.provisionVVL = Math.min(first, second);
    } else {
      // Assign based on current section
      if (context.currentSection === "vvl") {
        result.provisionVVL = first;
      } else {
        result.provisionNew = first;
      }
    }
  } else if (values.length >= 3) {
    // Multiple values: Try to identify pattern
    // Common: [Basis, Push, Gesamt] or [NEU, Push, VVL, Push]
    const sorted = [...values].sort((a, b) => b - a);
    
    // Highest value is typically NEU base provision
    result.provisionNew = sorted[0];
    
    // Look for small values (< 100) as push bonuses
    const pushValues = values.filter(v => v < 100 && v > 0);
    if (pushValues.length > 0) {
      result.provisionNewPush = pushValues[0];
    }
    
    // Second-highest large value might be VVL
    const largeValues = sorted.filter(v => v >= 100);
    if (largeValues.length >= 2) {
      result.provisionVVL = largeValues[1];
    }
  }
  
  return result;
}

function extractOmoValues(line: string, tariff: ParsedTariffLine): void {
  // Pattern 1: "10% = 40 €" or "10 % = 40€"
  const omoPattern1 = /(\d{1,2}(?:[.,]5)?)\s*%\s*[=:]\s*(\d{1,3}(?:[.,]\d{2})?)\s*€?/g;
  const matches1 = [...line.matchAll(omoPattern1)];
  
  for (const match of matches1) {
    const percent = parseFloat(match[1].replace(",", "."));
    const value = parseGermanPrice(match[2]);
    
    if (OMO_PERCENTAGES.includes(percent) && value !== null) {
      tariff.omoValues.set(percent, value);
    }
  }
  
  // Pattern 2: "10 = 40" (no %)
  const omoPattern2 = /\b(\d{1,2}(?:[.,]5)?)\s*=\s*(\d{1,3}(?:[.,]\d{2})?)\b/g;
  const matches2 = [...line.matchAll(omoPattern2)];
  
  for (const match of matches2) {
    const percent = parseFloat(match[1].replace(",", "."));
    const value = parseGermanPrice(match[2]);
    
    if (OMO_PERCENTAGES.includes(percent) && value !== null && !tariff.omoValues.has(percent)) {
      tariff.omoValues.set(percent, value);
    }
  }
  
  // Pattern 3: Locked OMO (marked with - or x or "gesperrt")
  const lockedPattern = /(\d{1,2}(?:[.,]5)?)\s*%?\s*[=:]\s*[-xX]|gesperrt|blocked/gi;
  const lockedMatches = [...line.matchAll(lockedPattern)];
  
  for (const match of lockedMatches) {
    if (match[1]) {
      const percent = parseFloat(match[1].replace(",", "."));
      if (OMO_PERCENTAGES.includes(percent)) {
        tariff.omoValues.set(percent, null); // null = locked
      }
    }
  }
}

function extractRvCode(line: string): string | null {
  // Pattern: 2-4 uppercase letters + optional separator + optional letter + 1-2 digits
  // Examples: BPXS_01, SM_12, RB1, GIGA_L01
  const rvPattern = /\b([A-Z]{2,4}[_-]?[A-Z]?\d{1,2})\b/;
  const match = line.match(rvPattern);
  return match ? match[1] : null;
}

// ============================================
// Main Parser Function
// ============================================

export function parseProvisionPdf(
  pages: string[]
): PdfParseResult<ProvisionParseResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  const provisions: ProvisionRow[] = [];
  const omoMatrix: OMOMatrixRow[] = [];
  
  // Track tariffs by ID, merging NEU and VVL data
  const tariffMap = new Map<string, ParsedTariffLine>();
  
  const context: ParseContext = {
    currentSection: "unknown",
    currentFamily: null,
    pageNumber: 0,
    lineNumber: 0,
  };
  
  let currentTariff: ParsedTariffLine | null = null;
  let totalLines = 0;
  
  for (const pageText of pages) {
    context.pageNumber++;
    
    // Split into lines, handling PDF's irregular spacing
    const lines = pageText
      .split(/\n/)
      .flatMap(line => {
        // Split on very large gaps (column separators)
        const parts = line.split(/\s{8,}/).filter(p => p.trim().length > 3);
        return parts.length > 1 ? parts : [line];
      })
      .filter(l => l.trim().length > 3);
    
    totalLines += lines.length;
    
    for (const line of lines) {
      context.lineNumber++;
      
      // Check for section changes
      const detectedSection = detectSection(line);
      if (detectedSection) {
        context.currentSection = detectedSection;
        continue; // Section headers are not tariff data
      }
      
      // Try to extract a new tariff
      const tariff = extractTariffFromLine(line, context);
      if (tariff) {
        // Save previous tariff
        if (currentTariff) {
          mergeTariffData(tariffMap, currentTariff);
        }
        currentTariff = tariff;
        
        // Also try to extract values from the same line
        const provValues = extractProvisionValues(line, context);
        Object.assign(currentTariff, provValues);
        
        const rvCode = extractRvCode(line);
        if (rvCode) currentTariff.rvCode = rvCode;
        
        continue;
      }
      
      // If we have a current tariff, try to extract values
      if (currentTariff) {
        // Extract provision values
        const provValues = extractProvisionValues(line, context);
        
        // Only update if we found new values
        if (provValues.provisionNew !== undefined && !currentTariff.provisionNew) {
          currentTariff.provisionNew = provValues.provisionNew;
        }
        if (provValues.provisionNewPush !== undefined && !currentTariff.provisionNewPush) {
          currentTariff.provisionNewPush = provValues.provisionNewPush;
        }
        if (provValues.provisionVVL !== undefined && !currentTariff.provisionVVL) {
          currentTariff.provisionVVL = provValues.provisionVVL;
        }
        if (provValues.provisionVVLPush !== undefined && !currentTariff.provisionVVLPush) {
          currentTariff.provisionVVLPush = provValues.provisionVVLPush;
        }
        
        // Extract OMO values
        extractOmoValues(line, currentTariff);
        
        // Look for RV code if not found yet
        if (!currentTariff.rvCode) {
          const rvCode = extractRvCode(line);
          if (rvCode) currentTariff.rvCode = rvCode;
        }
      }
    }
  }
  
  // Save last tariff
  if (currentTariff) {
    mergeTariffData(tariffMap, currentTariff);
  }
  
  // Convert to output format
  for (const [id, tariff] of tariffMap) {
    // Only include tariffs with at least provision data
    const hasNewProv = tariff.provisionNew !== undefined && tariff.provisionNew > 0;
    const hasVvlProv = tariff.provisionVVL !== undefined && tariff.provisionVVL > 0;
    
    if (hasNewProv || hasVvlProv) {
      // Build notes including push values if present
      const noteParts: string[] = [];
      if (tariff.rvCode) noteParts.push(`RV: ${tariff.rvCode}`);
      if (tariff.provisionNewPush) noteParts.push(`Push NEU: ${tariff.provisionNewPush}€`);
      if (tariff.provisionVVLPush) noteParts.push(`Push VVL: ${tariff.provisionVVLPush}€`);
      
      provisions.push({
        tariff_id: id,
        tariff_type: "mobile",
        provision_new_net: tariff.provisionNew ?? 0,
        provision_renewal_net: tariff.provisionVVL,
        push_modifier: tariff.provisionNewPush ? tariff.provisionNewPush : undefined,
        notes: noteParts.length > 0 ? noteParts.join(", ") : undefined,
      });
      
      // Add OMO matrix if we have values
      if (tariff.omoValues.size > 0) {
        omoMatrix.push({
          tariff_id: id,
          omo_0: 0,
          omo_5: tariff.omoValues.get(5) ?? null,
          omo_10: tariff.omoValues.get(10) ?? null,
          omo_15: tariff.omoValues.get(15) ?? null,
          omo_17_5: tariff.omoValues.get(17.5) ?? null,
          omo_20: tariff.omoValues.get(20) ?? null,
          omo_25: tariff.omoValues.get(25) ?? null,
        });
      }
    } else {
      warnings.push(`Tarif "${tariff.name}" ohne Provisionsdaten übersprungen`);
    }
  }
  
  // Summary
  if (provisions.length === 0) {
    errors.push("Keine Tarife mit Provisionsdaten gefunden");
  } else {
    // Group by family for summary
    const familyCounts = new Map<string, number>();
    for (const [_, tariff] of tariffMap) {
      familyCounts.set(tariff.family, (familyCounts.get(tariff.family) || 0) + 1);
    }
    const summary = [...familyCounts.entries()]
      .map(([f, c]) => `${f}: ${c}`)
      .join(", ");
    warnings.unshift(`Erkannte Tariffamilien: ${summary}`);
  }
  
  return {
    success: errors.length === 0,
    data: [{ provisions, omoMatrix }],
    warnings,
    errors,
    meta: {
      format: "provision_tkworld",
      pagesProcessed: pages.length,
      rowsExtracted: provisions.length,
    },
  };
}

// Helper: Merge tariff data (combine NEU and VVL sections)
function mergeTariffData(map: Map<string, ParsedTariffLine>, tariff: ParsedTariffLine) {
  const existing = map.get(tariff.id);
  
  if (!existing) {
    map.set(tariff.id, tariff);
    return;
  }
  
  // Merge values
  if (tariff.provisionNew !== undefined && !existing.provisionNew) {
    existing.provisionNew = tariff.provisionNew;
  }
  if (tariff.provisionNewPush !== undefined && !existing.provisionNewPush) {
    existing.provisionNewPush = tariff.provisionNewPush;
  }
  if (tariff.provisionVVL !== undefined && !existing.provisionVVL) {
    existing.provisionVVL = tariff.provisionVVL;
  }
  if (tariff.provisionVVLPush !== undefined && !existing.provisionVVLPush) {
    existing.provisionVVLPush = tariff.provisionVVLPush;
  }
  if (tariff.rvCode && !existing.rvCode) {
    existing.rvCode = tariff.rvCode;
  }
  
  // Merge OMO values
  for (const [percent, value] of tariff.omoValues) {
    if (!existing.omoValues.has(percent)) {
      existing.omoValues.set(percent, value);
    }
  }
  
  // Update section info
  if (existing.section === "neu" && tariff.section === "vvl") {
    existing.section = "both";
  } else if (existing.section === "vvl" && tariff.section === "neu") {
    existing.section = "both";
  }
  
  // Update confidence
  existing.confidence = Math.max(existing.confidence, tariff.confidence);
}

// ============================================
// Validation
// ============================================

export function validateProvisionData(result: ProvisionParseResult): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  for (const prov of result.provisions) {
    if (prov.provision_new_net <= 0 && (!prov.provision_renewal_net || prov.provision_renewal_net <= 0)) {
      errors.push(`Tarif ${prov.tariff_id}: Keine gültigen Provisionswerte`);
    }
    if (prov.provision_new_net > 1000) {
      warnings.push(`Tarif ${prov.tariff_id}: Sehr hohe NEU-Provision (${prov.provision_new_net}€)`);
    }
    if (prov.provision_renewal_net && prov.provision_renewal_net > prov.provision_new_net) {
      warnings.push(`Tarif ${prov.tariff_id}: VVL-Provision höher als NEU-Provision`);
    }
  }
  
  for (const omo of result.omoMatrix) {
    // Check that OMO values increase with percentage
    const values = [omo.omo_5, omo.omo_10, omo.omo_15, omo.omo_20, omo.omo_25]
      .filter((v): v is number => v !== null);
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i - 1]) {
        warnings.push(`Tarif ${omo.tariff_id}: OMO-Werte nicht aufsteigend`);
        break;
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
