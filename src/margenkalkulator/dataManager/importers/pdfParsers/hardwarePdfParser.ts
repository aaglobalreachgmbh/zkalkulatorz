// ============================================
// Hardware Distributor PDF Parser
// Parses einsamobile-style price lists
// ============================================

import type { HardwareItemRow } from "../../types";
import { parseGermanPrice, generateIdFromText, type PdfParseResult } from "../pdfImporter";

// ============================================
// Brand Detection
// ============================================

const KNOWN_BRANDS = [
  { pattern: /^apple/i, brand: "Apple" },
  { pattern: /^samsung/i, brand: "Samsung" },
  { pattern: /^google/i, brand: "Google" },
  { pattern: /^xiaomi/i, brand: "Xiaomi" },
  { pattern: /^motorola/i, brand: "Motorola" },
  { pattern: /^oppo/i, brand: "OPPO" },
  { pattern: /^oneplus/i, brand: "OnePlus" },
  { pattern: /^nokia/i, brand: "Nokia" },
  { pattern: /^sony/i, brand: "Sony" },
  { pattern: /^huawei/i, brand: "Huawei" },
  { pattern: /^honor/i, brand: "Honor" },
  { pattern: /^fairphone/i, brand: "Fairphone" },
  { pattern: /^nothing/i, brand: "Nothing" },
  { pattern: /^cat\b/i, brand: "CAT" },
  { pattern: /^gigaset/i, brand: "Gigaset" },
  { pattern: /^zte/i, brand: "ZTE" },
  { pattern: /^alcatel/i, brand: "Alcatel" },
  { pattern: /^emporia/i, brand: "Emporia" },
  { pattern: /^doro/i, brand: "Doro" },
];

function detectBrand(text: string): { brand: string; model: string } | null {
  const trimmed = text.trim();
  
  for (const { pattern, brand } of KNOWN_BRANDS) {
    if (pattern.test(trimmed)) {
      // Extract model (everything after brand name)
      const model = trimmed.replace(pattern, "").trim();
      return { brand, model };
    }
  }
  
  return null;
}

// ============================================
// Category Detection
// ============================================

function detectCategory(text: string): HardwareItemRow["category"] {
  const lower = text.toLowerCase();
  
  if (lower.includes("tablet") || lower.includes("ipad")) {
    return "tablet";
  }
  if (lower.includes("watch") || lower.includes("uhr")) {
    return "accessory";
  }
  if (lower.includes("airpods") || lower.includes("buds") || lower.includes("kopfhörer")) {
    return "accessory";
  }
  if (lower.includes("router") || lower.includes("fritzbox") || lower.includes("speedport")) {
    return "router";
  }
  if (lower.includes("hülle") || lower.includes("case") || lower.includes("ladegerät")) {
    return "accessory";
  }
  
  // Default for phones
  return "smartphone";
}

// ============================================
// Article Number Detection
// ============================================

function extractArticleNumber(text: string): string | null {
  // Pattern: 6-12 digit numbers (common article number format)
  const match = text.match(/\b(\d{6,12})\b/);
  return match ? match[1] : null;
}

// ============================================
// Line Parser
// ============================================

type ParsedHardwareLine = {
  articleNr?: string;
  fullText: string;
  brand?: string;
  model?: string;
  category: HardwareItemRow["category"];
  ekNet?: number;
  status?: string;
};

function parseHardwareLine(line: string): ParsedHardwareLine | null {
  // Skip headers and very short lines
  if (!line || line.length < 15) return null;
  
  // Skip common header words
  const headerPatterns = [
    /^status/i,
    /^artikel/i,
    /^bezeichnung/i,
    /^preis/i,
    /^seite/i,
    /^datum/i,
    /^gültig/i,
    /^preisliste/i,
    /^fachhandel/i,
  ];
  
  for (const pattern of headerPatterns) {
    if (pattern.test(line.trim())) return null;
  }
  
  const result: ParsedHardwareLine = {
    fullText: line,
    category: "smartphone",
  };
  
  // Extract article number
  result.articleNr = extractArticleNumber(line) ?? undefined;
  
  // Try to detect brand and model
  const brandInfo = detectBrand(line);
  if (brandInfo) {
    result.brand = brandInfo.brand;
    result.model = brandInfo.model;
    result.category = detectCategory(line);
  }
  
  // Extract price (looking for Euro amounts)
  // Pattern: handles "1.055,00 €" or "1055,00" or "1.055,00"
  const pricePattern = /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*€?/g;
  const matches = [...line.matchAll(pricePattern)];
  
  // Take the last match as EK (usually rightmost column)
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    result.ekNet = parseGermanPrice(lastMatch[1]) ?? undefined;
  }
  
  // Only return if we have meaningful data
  if (!result.brand && !result.ekNet) return null;
  
  return result;
}

// ============================================
// Multi-Column Layout Handler
// ============================================

function splitMultiColumn(pageText: string): string[] {
  // Try to detect two-column layout by looking for patterns
  // For now, just split on large whitespace gaps
  const lines: string[] = [];
  
  // Split on newlines and large whitespace (3+ spaces often indicates column break)
  const rawLines = pageText.split(/\n/);
  
  for (const rawLine of rawLines) {
    // Check if line might contain two columns (large gap in middle)
    const columnSplit = rawLine.split(/\s{10,}/);
    
    if (columnSplit.length >= 2) {
      // Multi-column detected
      for (const col of columnSplit) {
        if (col.trim().length > 10) {
          lines.push(col.trim());
        }
      }
    } else {
      lines.push(rawLine.trim());
    }
  }
  
  return lines.filter(l => l.length > 10);
}

// ============================================
// Main Parser Function
// ============================================

export function parseHardwarePdf(
  pages: string[]
): PdfParseResult<HardwareItemRow> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const items: HardwareItemRow[] = [];
  
  const seenIds = new Set<string>();
  let sortOrder = 1;
  
  for (const pageText of pages) {
    const lines = splitMultiColumn(pageText);
    
    for (const line of lines) {
      const parsed = parseHardwareLine(line);
      if (!parsed) continue;
      
      // Need at least brand or clear product info
      if (!parsed.brand) {
        // Try harder to detect brand from full text
        const brandInfo = detectBrand(parsed.fullText);
        if (!brandInfo) continue;
        parsed.brand = brandInfo.brand;
        parsed.model = brandInfo.model;
      }
      
      // Generate ID
      const baseId = generateIdFromText(`${parsed.brand}_${parsed.model || ""}`);
      let id = baseId;
      
      // Handle duplicates by appending suffix
      if (seenIds.has(id)) {
        let suffix = 2;
        while (seenIds.has(`${baseId}_${suffix}`)) suffix++;
        id = `${baseId}_${suffix}`;
      }
      seenIds.add(id);
      
      // Create hardware item
      const item: HardwareItemRow = {
        id,
        brand: parsed.brand,
        model: parsed.model || parsed.fullText.substring(0, 50),
        category: parsed.category,
        ek_net: parsed.ekNet ?? 0,
        sort_order: sortOrder++,
        active: true,
      };
      
      // Validate price
      if (item.ek_net === 0) {
        warnings.push(`${item.brand} ${item.model}: Kein EK-Preis gefunden`);
      } else if (item.ek_net < 10) {
        warnings.push(`${item.brand} ${item.model}: Sehr niedriger EK (${item.ek_net}€)`);
      } else if (item.ek_net > 3000) {
        warnings.push(`${item.brand} ${item.model}: Sehr hoher EK (${item.ek_net}€)`);
      }
      
      items.push(item);
    }
  }
  
  if (items.length === 0) {
    errors.push("Keine Hardware-Artikel gefunden");
  }
  
  // Group by brand for summary
  const brandCounts = new Map<string, number>();
  for (const item of items) {
    brandCounts.set(item.brand, (brandCounts.get(item.brand) || 0) + 1);
  }
  
  // Add summary warning
  if (items.length > 0) {
    const summary = [...brandCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand, count]) => `${brand}: ${count}`)
      .join(", ");
    warnings.push(`Erkannte Marken: ${summary}`);
  }
  
  return {
    success: errors.length === 0,
    data: items,
    warnings,
    errors,
    meta: {
      format: "hardware_distri",
      pagesProcessed: pages.length,
      rowsExtracted: items.length,
    },
  };
}

// ============================================
// Validation
// ============================================

export function validateHardwareData(items: HardwareItemRow[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();
  
  for (const item of items) {
    // Check for duplicates
    if (seenIds.has(item.id)) {
      errors.push(`Doppelte ID: ${item.id}`);
    }
    seenIds.add(item.id);
    
    // Check required fields
    if (!item.brand) {
      errors.push(`Artikel ohne Marke: ${item.id}`);
    }
    if (!item.model || item.model.length < 3) {
      errors.push(`Artikel ohne Modell: ${item.id}`);
    }
    
    // Check price
    if (item.ek_net === 0) {
      warnings.push(`${item.id}: EK-Preis ist 0`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
