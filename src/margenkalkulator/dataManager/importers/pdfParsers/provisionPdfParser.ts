// ============================================
// TK-World Provision PDF Parser
// Parses Mobilfunk Provisions + OMO Matrix
// ============================================

import type { ProvisionRow, OMOMatrixRow } from "../../types";
import { parseGermanPrice, generateIdFromText, type PdfParseResult, type ProvisionParseResult } from "../pdfImporter";

// ============================================
// Tariff Pattern Matching
// ============================================

// Known tariff families for pattern matching
const TARIFF_PATTERNS = [
  { regex: /business\s*prime\s*(xs|s|m|l|xl)/i, family: "prime" },
  { regex: /business\s*smart\s*(xs|s|m|l|xl)/i, family: "business_smart" },
  { regex: /gigamobil\s*(xs|s|m|l|xl)/i, family: "gigamobil" },
  { regex: /smart\s*business\s*(xs|s|m|l|xl)/i, family: "smart_business" },
  { regex: /red\s*business\s*prime/i, family: "prime" },
];

// OMO percentage columns we look for
const OMO_PERCENTAGES = [0, 5, 10, 15, 17.5, 20, 25, 30, 35];

// ============================================
// Line-by-Line Parser
// ============================================

type ParsedTariffLine = {
  name: string;
  id: string;
  family: string;
  rvCode?: string;
  provisionNew?: number;
  provisionNewPush?: number;
  provisionVVL?: number;
  provisionVVLPush?: number;
  omoValues: Map<number, number | null>;
};

function extractTariffFromLine(line: string): ParsedTariffLine | null {
  // Skip headers and empty lines
  if (!line.trim() || line.length < 10) return null;
  
  // Check against known patterns
  for (const { regex, family } of TARIFF_PATTERNS) {
    const match = line.match(regex);
    if (match) {
      const name = match[0].trim();
      const id = generateIdFromText(name);
      
      return {
        name,
        id,
        family,
        omoValues: new Map(),
      };
    }
  }
  
  return null;
}

function extractProvisionValues(line: string): {
  provisionNew?: number;
  provisionNewPush?: number;
  provisionVVL?: number;
  provisionVVLPush?: number;
} {
  const result: ReturnType<typeof extractProvisionValues> = {};
  
  // Look for Euro amounts in the line
  const euroPattern = /(\d{1,3}(?:[.,]\d{2})?)\s*€?/g;
  const matches = [...line.matchAll(euroPattern)];
  
  // Typical pattern: "505 € | 10 € | 515 €" for Basis | Push | Gesamt
  if (matches.length >= 2) {
    const values = matches.map(m => parseGermanPrice(m[1])).filter(v => v !== null) as number[];
    
    // Heuristic: larger values are provisions, small values are push bonuses
    const sorted = [...values].sort((a, b) => b - a);
    
    if (sorted.length >= 1) {
      result.provisionNew = sorted[0]; // Highest = base provision
    }
    if (sorted.length >= 2 && sorted[1] < 100) {
      result.provisionNewPush = sorted[1]; // Small value = push
    } else if (sorted.length >= 2) {
      result.provisionVVL = sorted[1]; // Otherwise VVL
    }
  }
  
  return result;
}

function extractOmoValues(line: string, tariff: ParsedTariffLine): void {
  // Pattern: "10% = 40 €; 15% = 45 €; ..."
  const omoPattern = /(\d{1,2}(?:[.,]5)?)\s*%\s*[=:]\s*(\d{1,3}(?:[.,]\d{2})?)\s*€?/g;
  const matches = [...line.matchAll(omoPattern)];
  
  for (const match of matches) {
    const percent = parseFloat(match[1].replace(",", "."));
    const value = parseGermanPrice(match[2]);
    
    if (OMO_PERCENTAGES.includes(percent) && value !== null) {
      tariff.omoValues.set(percent, value);
    }
  }
  
  // Also check for locked OMO (marked with - or x)
  const lockedPattern = /(\d{1,2}(?:[.,]5)?)\s*%\s*[=:]\s*[-xX]/g;
  const lockedMatches = [...line.matchAll(lockedPattern)];
  
  for (const match of lockedMatches) {
    const percent = parseFloat(match[1].replace(",", "."));
    if (OMO_PERCENTAGES.includes(percent)) {
      tariff.omoValues.set(percent, null); // null = locked
    }
  }
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
  
  const seenTariffs = new Map<string, ParsedTariffLine>();
  let currentTariff: ParsedTariffLine | null = null;
  
  let totalLines = 0;
  
  for (const pageText of pages) {
    // Split into lines (PDF text often has irregular spacing)
    const lines = pageText.split(/\s{3,}|\n/).filter(l => l.trim().length > 5);
    totalLines += lines.length;
    
    for (const line of lines) {
      // Try to extract a new tariff
      const tariff = extractTariffFromLine(line);
      if (tariff) {
        // Save previous tariff if exists
        if (currentTariff && !seenTariffs.has(currentTariff.id)) {
          seenTariffs.set(currentTariff.id, currentTariff);
        }
        currentTariff = tariff;
        continue;
      }
      
      // If we have a current tariff, try to extract values
      if (currentTariff) {
        // Extract provision values
        const provValues = extractProvisionValues(line);
        if (provValues.provisionNew !== undefined) {
          currentTariff.provisionNew = provValues.provisionNew;
        }
        if (provValues.provisionNewPush !== undefined) {
          currentTariff.provisionNewPush = provValues.provisionNewPush;
        }
        if (provValues.provisionVVL !== undefined) {
          currentTariff.provisionVVL = provValues.provisionVVL;
        }
        
        // Extract OMO values
        extractOmoValues(line, currentTariff);
        
        // Look for RV code
        const rvMatch = line.match(/[A-Z]{2,4}[_-]?[A-Z]?\d{1,2}/);
        if (rvMatch) {
          currentTariff.rvCode = rvMatch[0];
        }
      }
    }
  }
  
  // Save last tariff
  if (currentTariff && !seenTariffs.has(currentTariff.id)) {
    seenTariffs.set(currentTariff.id, currentTariff);
  }
  
  // Convert to output format
  for (const [id, tariff] of seenTariffs) {
    // Only include tariffs with at least provision data
    if (tariff.provisionNew !== undefined && tariff.provisionNew > 0) {
      provisions.push({
        tariff_id: id,
        tariff_type: "mobile",
        provision_new_net: tariff.provisionNew,
        provision_renewal_net: tariff.provisionVVL,
        notes: tariff.rvCode ? `RV: ${tariff.rvCode}` : undefined,
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
  
  if (provisions.length === 0) {
    errors.push("Keine Tarife mit Provisionsdaten gefunden");
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
    if (prov.provision_new_net <= 0) {
      errors.push(`Tarif ${prov.tariff_id}: Ungültige Neuvertrag-Provision`);
    }
    if (prov.provision_new_net > 1000) {
      warnings.push(`Tarif ${prov.tariff_id}: Sehr hohe Provision (${prov.provision_new_net}€)`);
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
