// ============================================
// Hardware Distributor PDF Parser (Enhanced)
// Parses einsamobile-style price lists
// With Position-Based Column Recognition
// ============================================

import type { HardwareItemRow } from "../../types";
import { parseGermanPrice, generateIdFromText, type PdfParseResult } from "../pdfImporter";

// ============================================
// Brand Detection
// ============================================

const KNOWN_BRANDS = [
  { pattern: /^apple/i, brand: "Apple" },
  { pattern: /^iphone/i, brand: "Apple", prefix: "iPhone" },
  { pattern: /^ipad/i, brand: "Apple", prefix: "iPad" },
  { pattern: /^airpods/i, brand: "Apple", prefix: "AirPods" },
  { pattern: /^samsung/i, brand: "Samsung" },
  { pattern: /^galaxy/i, brand: "Samsung", prefix: "Galaxy" },
  { pattern: /^google/i, brand: "Google" },
  { pattern: /^pixel/i, brand: "Google", prefix: "Pixel" },
  { pattern: /^xiaomi/i, brand: "Xiaomi" },
  { pattern: /^redmi/i, brand: "Xiaomi", prefix: "Redmi" },
  { pattern: /^poco/i, brand: "Xiaomi", prefix: "POCO" },
  { pattern: /^motorola/i, brand: "Motorola" },
  { pattern: /^moto\s/i, brand: "Motorola", prefix: "Moto" },
  { pattern: /^oppo/i, brand: "OPPO" },
  { pattern: /^oneplus/i, brand: "OnePlus" },
  { pattern: /^nokia/i, brand: "Nokia" },
  { pattern: /^sony/i, brand: "Sony" },
  { pattern: /^xperia/i, brand: "Sony", prefix: "Xperia" },
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
  { pattern: /^realme/i, brand: "Realme" },
  { pattern: /^vivo/i, brand: "Vivo" },
  { pattern: /^tcl/i, brand: "TCL" },
];

function detectBrand(text: string): { brand: string; model: string } | null {
  const trimmed = text.trim();
  
  for (const { pattern, brand, prefix } of KNOWN_BRANDS) {
    if (pattern.test(trimmed)) {
      // Extract model (everything after brand name)
      let model = trimmed.replace(pattern, "").trim();
      
      // If we have a prefix (e.g., "iPhone" for Apple), prepend it to model
      if (prefix && !model.toLowerCase().startsWith(prefix.toLowerCase())) {
        model = prefix + " " + model;
      }
      
      // Clean up model name
      model = model.replace(/\s+/g, " ").trim();
      
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
  
  if (lower.includes("tablet") || lower.includes("ipad") || lower.includes("tab ")) {
    return "tablet";
  }
  if (lower.includes("watch") || lower.includes("uhr") || lower.includes("band") || lower.includes("fit")) {
    return "accessory";
  }
  if (lower.includes("airpods") || lower.includes("buds") || lower.includes("kopfhörer") || lower.includes("headphone")) {
    return "accessory";
  }
  if (lower.includes("router") || lower.includes("fritzbox") || lower.includes("speedport") || lower.includes("hotspot")) {
    return "router";
  }
  if (lower.includes("hülle") || lower.includes("case") || lower.includes("ladegerät") || lower.includes("charger") || lower.includes("kabel")) {
    return "accessory";
  }
  
  // Default for phones
  return "smartphone";
}

// ============================================
// Enhanced Column Detection
// ============================================

type ParsedColumn = {
  type: "status" | "articleNr" | "description" | "price" | "unknown";
  startPos: number;
  endPos: number;
  content: string;
};

type ColumnLayout = {
  statusCol?: { start: number; end: number };
  articleCol?: { start: number; end: number };
  descriptionCol?: { start: number; end: number };
  priceCol?: { start: number; end: number };
};

function detectColumnLayout(lines: string[]): ColumnLayout {
  // Analyze first few lines to detect column structure
  const layout: ColumnLayout = {};
  
  // Look for header patterns
  for (const line of lines.slice(0, 20)) {
    const lower = line.toLowerCase();
    
    // Find article number column
    const artMatch = line.match(/artikel[-\s]?nr|art\.?\s*nr/i);
    if (artMatch && artMatch.index !== undefined) {
      layout.articleCol = { start: artMatch.index, end: artMatch.index + 15 };
    }
    
    // Find description column
    const descMatch = line.match(/bezeichnung|beschreibung|produkt/i);
    if (descMatch && descMatch.index !== undefined) {
      layout.descriptionCol = { start: descMatch.index, end: descMatch.index + 60 };
    }
    
    // Find price column (usually at the end)
    const priceMatch = line.match(/ek\s*netto|preis|€|einkauf/i);
    if (priceMatch && priceMatch.index !== undefined) {
      layout.priceCol = { start: priceMatch.index, end: line.length };
    }
  }
  
  return layout;
}

// ============================================
// Article Number Detection
// ============================================

function extractArticleNumber(text: string): string | null {
  // Pattern 1: 6-12 digit numbers (common article number format)
  const match1 = text.match(/\b(\d{6,12})\b/);
  if (match1) return match1[1];
  
  // Pattern 2: EAN-like format
  const match2 = text.match(/\b(\d{13})\b/);
  if (match2) return match2[1];
  
  // Pattern 3: Mixed alphanumeric (e.g., SM-A556B)
  const match3 = text.match(/\b([A-Z]{2}[-]?[A-Z0-9]{4,8})\b/);
  if (match3) return match3[1];
  
  return null;
}

// ============================================
// Position-Based Line Parser
// ============================================

type ParsedHardwareLine = {
  articleNr?: string;
  fullText: string;
  brand?: string;
  model?: string;
  category: HardwareItemRow["category"];
  ekNet?: number;
  status?: string;
  confidence: number;
};

function parseHardwareLine(line: string, layout: ColumnLayout): ParsedHardwareLine | null {
  // Skip headers and very short lines
  if (!line || line.length < 15) return null;
  
  // Skip common header/footer words
  const skipPatterns = [
    /^status/i,
    /^artikel/i,
    /^bezeichnung/i,
    /^preis/i,
    /^seite\s*\d/i,
    /^datum/i,
    /^gültig/i,
    /^preisliste/i,
    /^fachhandel/i,
    /^stand\s*:/i,
    /^\d{2}\.\d{2}\.\d{4}/,  // Date at start
    /^kw\s*\d+/i,            // Week number
    /^copyright/i,
    /^alle\s*preise/i,
    /^irrtümer/i,
  ];
  
  for (const pattern of skipPatterns) {
    if (pattern.test(line.trim())) return null;
  }
  
  const result: ParsedHardwareLine = {
    fullText: line,
    category: "smartphone",
    confidence: 0.5,
  };
  
  // Use column layout if available
  if (layout.priceCol) {
    // Extract price from expected column position
    const priceSection = line.substring(layout.priceCol.start).trim();
    const priceMatch = priceSection.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
    if (priceMatch) {
      result.ekNet = parseGermanPrice(priceMatch[1]) ?? undefined;
      result.confidence += 0.2;
    }
  }
  
  // Extract article number
  result.articleNr = extractArticleNumber(line) ?? undefined;
  if (result.articleNr) result.confidence += 0.1;
  
  // Try to detect brand and model
  const brandInfo = detectBrand(line);
  if (brandInfo) {
    result.brand = brandInfo.brand;
    result.model = brandInfo.model;
    result.category = detectCategory(line);
    result.confidence += 0.2;
  }
  
  // Extract price if not found via layout
  if (result.ekNet === undefined) {
    // Enhanced price pattern - handles "1.055,00 €" or "1055,00" or "999,00"
    // Look for the rightmost price (usually EK)
    const pricePattern = /(\d{1,3}(?:\.\d{3})*(?:,\d{2}))\s*€?/g;
    const matches = [...line.matchAll(pricePattern)];
    
    // Take the last match as EK (usually rightmost column)
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      result.ekNet = parseGermanPrice(lastMatch[1]) ?? undefined;
    }
  }
  
  // Extract storage/memory info for model
  if (result.model) {
    const storageMatch = line.match(/(\d{2,4})\s*(?:GB|TB)/i);
    if (storageMatch && !result.model.includes(storageMatch[0])) {
      result.model = result.model + " " + storageMatch[0].toUpperCase();
    }
    
    // Color detection
    const colorPattern = /\b(schwarz|black|weiß|white|blau|blue|grün|green|rot|red|gold|silber|silver|grau|gray|grey|pink|purple|violett|mint|cream|titanium)\b/gi;
    const colorMatch = line.match(colorPattern);
    if (colorMatch && !result.model.toLowerCase().includes(colorMatch[0].toLowerCase())) {
      result.model = result.model + " " + colorMatch[0];
    }
  }
  
  // Only return if we have meaningful data
  if (!result.brand && !result.ekNet) return null;
  
  return result;
}

// ============================================
// Two-Column Layout Handler
// ============================================

function splitTwoColumnPage(pageText: string): string[] {
  const lines: string[] = [];
  const rawLines = pageText.split(/\n/);
  
  // Detect if page has two-column layout
  // Check for consistent large gaps in the middle of lines
  let twoColumnCount = 0;
  const midGapLines: string[] = [];
  
  for (const rawLine of rawLines) {
    // Look for large gaps (10+ spaces) roughly in the middle
    const midPoint = rawLine.length / 2;
    const leftHalf = rawLine.substring(0, Math.floor(midPoint));
    const rightHalf = rawLine.substring(Math.floor(midPoint));
    
    // Check for gap at the end of left half or beginning of right half
    if (/\s{10,}$/.test(leftHalf) || /^\s{10,}/.test(rightHalf)) {
      twoColumnCount++;
      midGapLines.push(rawLine);
    }
  }
  
  // If significant portion has mid-page gaps, treat as two-column
  const isTwoColumn = twoColumnCount > rawLines.length * 0.3;
  
  if (isTwoColumn) {
    // Split each line at the large gap
    for (const rawLine of rawLines) {
      const columnSplit = rawLine.split(/\s{10,}/);
      
      if (columnSplit.length >= 2) {
        // Add left column content
        if (columnSplit[0].trim().length > 10) {
          lines.push(columnSplit[0].trim());
        }
        // Add right column content
        if (columnSplit[1].trim().length > 10) {
          lines.push(columnSplit[1].trim());
        }
      } else if (rawLine.trim().length > 10) {
        lines.push(rawLine.trim());
      }
    }
  } else {
    // Single column - just clean up
    for (const rawLine of rawLines) {
      if (rawLine.trim().length > 10) {
        lines.push(rawLine.trim());
      }
    }
  }
  
  return lines;
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
  
  // Collect all lines first for column detection
  const allLines: string[] = [];
  for (const pageText of pages) {
    allLines.push(...splitTwoColumnPage(pageText));
  }
  
  // Detect column layout from header lines
  const layout = detectColumnLayout(allLines);
  
  // Track current brand context
  let currentBrandContext: string | null = null;
  
  for (const line of allLines) {
    // Check if this line starts a new brand section
    const brandOnlyMatch = line.match(/^(Apple|Samsung|Google|Xiaomi|Motorola|OPPO|OnePlus|Nokia|Sony|Huawei|Honor|Fairphone|Nothing|CAT|Gigaset|ZTE|Alcatel|Emporia|Doro|Realme|Vivo|TCL)\s*$/i);
    if (brandOnlyMatch) {
      currentBrandContext = brandOnlyMatch[1];
      continue;
    }
    
    const parsed = parseHardwareLine(line, layout);
    if (!parsed) continue;
    
    // Apply brand context if brand wasn't detected from line
    if (!parsed.brand && currentBrandContext) {
      parsed.brand = currentBrandContext;
      // Try to use the whole line as model
      parsed.model = line.replace(/^\d{6,}\s*/, "").trim().substring(0, 80);
      parsed.category = detectCategory(line);
    }
    
    // Need at least brand for valid item
    if (!parsed.brand) continue;
    
    // Generate ID
    const modelForId = parsed.model?.substring(0, 50) || parsed.fullText.substring(0, 30);
    const baseId = generateIdFromText(`${parsed.brand}_${modelForId}`);
    let id = baseId;
    
    // Handle duplicates by appending suffix
    if (seenIds.has(id)) {
      let suffix = 2;
      while (seenIds.has(`${baseId}_${suffix}`)) suffix++;
      id = `${baseId}_${suffix}`;
    }
    seenIds.add(id);
    
    // Create hardware item
    // Note: article_nr is stored in model if present for reference
    const modelWithArticle = parsed.articleNr 
      ? `${parsed.model || parsed.fullText.substring(0, 50)} (Art: ${parsed.articleNr})`
      : (parsed.model || parsed.fullText.substring(0, 50));
    
    const item: HardwareItemRow = {
      id,
      brand: parsed.brand,
      model: modelWithArticle.substring(0, 100),
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
      warnings.push(`${item.brand} ${item.model}: Sehr hoher EK (${item.ek_net}€) - bitte prüfen`);
    }
    
    items.push(item);
  }
  
  if (items.length === 0) {
    errors.push("Keine Hardware-Artikel gefunden");
  }
  
  // Group by brand for summary
  const brandCounts = new Map<string, number>();
  for (const item of items) {
    brandCounts.set(item.brand, (brandCounts.get(item.brand) || 0) + 1);
  }
  
  // Add summary
  if (items.length > 0) {
    const summary = [...brandCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([brand, count]) => `${brand}: ${count}`)
      .join(", ");
    warnings.unshift(`Erkannte Marken: ${summary}`);
    
    // Price statistics
    const prices = items.map(i => i.ek_net).filter(p => p > 0);
    if (prices.length > 0) {
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      warnings.unshift(`Preise: Ø ${avg.toFixed(0)}€ (${min.toFixed(0)}€ - ${max.toFixed(0)}€)`);
    }
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
