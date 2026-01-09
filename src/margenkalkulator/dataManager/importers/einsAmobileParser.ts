// ============================================
// einsAmobile Preislisten-Parser
// Spezialisiert für das exakte Format der einsAmobile Distributor-Preislisten
// ============================================

import type { HardwareItemRow } from "../types";

/**
 * Parsed Hardware-Zeile aus einsAmobile PDF
 */
interface ParsedHardwareLine {
  status: string;        // NP = Neuprodukt, leer = Standard
  articleNr: string;     // 6-9 stellige Artikel-Nr.
  designation: string;   // Vollständige Bezeichnung
  price: number;         // EK netto in Euro
}

/**
 * Ergebnis des Parsings
 */
export interface EinsAmobileParseResult {
  items: HardwareItemRow[];
  warnings: string[];
  errors: string[];
  stats: {
    total: number;
    byBrand: Record<string, number>;
    priceRange: { min: number; max: number; avg: number };
  };
}

// ============================================
// Marken-Erkennung
// ============================================

const BRAND_PATTERNS: { pattern: RegExp; brand: string }[] = [
  { pattern: /^Apple\s+/i, brand: "Apple" },
  { pattern: /^Samsung\s+/i, brand: "Samsung" },
  { pattern: /^Google\s+/i, brand: "Google" },
  { pattern: /^Xiaomi\s+/i, brand: "Xiaomi" },
  { pattern: /^Motorola\s+/i, brand: "Motorola" },
  { pattern: /^Honor\s+/i, brand: "Honor" },
  { pattern: /^OnePlus\s+/i, brand: "OnePlus" },
  { pattern: /^Oppo\s+/i, brand: "OPPO" },
  { pattern: /^Vivo\s+/i, brand: "Vivo" },
  { pattern: /^Nothing\s+/i, brand: "Nothing" },
  { pattern: /^Fairphone\s+/i, brand: "Fairphone" },
  { pattern: /^CAT\s+/i, brand: "CAT" },
  { pattern: /^TCL\s+/i, brand: "TCL" },
  { pattern: /^Telekom\s+/i, brand: "Telekom" },
  { pattern: /^Vodafone\s+/i, brand: "Vodafone" },
  { pattern: /^Realme\s+/i, brand: "Realme" },
  { pattern: /^POCO\s+/i, brand: "Xiaomi" },
  { pattern: /^Redmi\s+/i, brand: "Xiaomi" },
];

// Samsung Modell-Codes zu lesbaren Namen
const SAMSUNG_MODEL_MAP: Record<string, string> = {
  "A057G": "Galaxy A05s",
  "A165F": "Galaxy A16",
  "A166B": "Galaxy A16 5G",
  "A175F": "Galaxy A17",
  "A176B": "Galaxy A17 5G",
  "A236B": "Galaxy A23 5G",
  "A256B": "Galaxy A25 5G",
  "A266B": "Galaxy A26 5G",
  "A356B": "Galaxy A35 5G",
  "A366B": "Galaxy A36 5G",
  "A556B": "Galaxy A55 5G",
  "A566B": "Galaxy A56 5G",
  "F741B": "Galaxy Z Flip6 5G",
  "F761B": "Galaxy Z Flip7 FE 5G",
  "F766B": "Galaxy Z Flip7 5G",
  "F966B": "Galaxy Z Fold7 5G",
  "G556B": "Galaxy Xcover7",
  "G736B": "Galaxy Xcover 6 Pro 5G",
  "S721B": "Galaxy S24 FE 5G",
  "S731B": "Galaxy S25 FE 5G",
  "S921B": "Galaxy S24 5G",
  "S928B": "Galaxy S24 Ultra 5G",
  "S931B": "Galaxy S25 5G",
  "S937B": "Galaxy S25 Edge 5G",
  "S938B": "Galaxy S25 Ultra 5G",
  "T636B": "Galaxy Tab Active4 Pro",
  "X110N": "Galaxy Tab A9",
  "X230N": "Galaxy Tab A11+",
  "X236B": "Galaxy Tab A11+ 5G",
  "X306B": "Galaxy Tab Active5 5G",
  "X400N": "Galaxy Tab S10 Lite",
  "X516B": "Galaxy Tab S9 FE 5G",
  "X520N": "Galaxy Tab S10 FE",
  "X526B": "Galaxy Tab S10 FE 5G",
  "X620N": "Galaxy Tab S10 FE+",
  "X716B": "Galaxy Tab S9 5G",
  "X730N": "Galaxy Tab S11",
  "X736B": "Galaxy Tab S11 5G",
  "X920N": "Galaxy Tab S10 Ultra",
  "X926N": "Galaxy Tab S10 Ultra 5G",
  "X930N": "Galaxy Tab S11 Ultra",
  "X936B": "Galaxy Tab S11 Ultra 5G",
};

/**
 * Erkennt Marke und extrahiert Modell aus Bezeichnung
 */
function parseBrandModel(designation: string): { brand: string; model: string; category: HardwareItemRow["category"] } {
  let brand = "Unknown";
  let model = designation;
  let category: HardwareItemRow["category"] = "smartphone";

  // Kategorie-Erkennung
  const lowerDes = designation.toLowerCase();
  if (lowerDes.includes("ipad") || lowerDes.includes("tab ") || lowerDes.includes("tab")) {
    category = "tablet";
  } else if (lowerDes.includes("macbook")) {
    category = "tablet"; // Laptop als Tablet kategorisieren für Kalkulationszwecke
  } else if (lowerDes.includes("router") || lowerDes.includes("fritzbox") || lowerDes.includes("speedport")) {
    category = "router";
  } else if (lowerDes.includes("watch") || lowerDes.includes("buds") || lowerDes.includes("airpods")) {
    category = "accessory";
  }

  // Marke erkennen
  for (const { pattern, brand: b } of BRAND_PATTERNS) {
    if (pattern.test(designation)) {
      brand = b;
      model = designation.replace(pattern, "").trim();
      break;
    }
  }

  // Samsung Modell-Codes auflösen
  if (brand === "Samsung") {
    // Pattern: Samsung [Modell-Code] [Rest]
    const samsungMatch = designation.match(/^Samsung\s+([A-Z]\d{3}[A-Z]?)\s+(.+)$/i);
    if (samsungMatch) {
      const modelCode = samsungMatch[1].toUpperCase();
      const rest = samsungMatch[2];
      const mappedModel = SAMSUNG_MODEL_MAP[modelCode];
      if (mappedModel) {
        // Extrahiere Speicher und Farbe aus rest
        model = `${mappedModel} ${rest}`;
      } else {
        model = `${modelCode} ${rest}`;
      }
    }
  }

  // Xiaomi POCO/Redmi erkennen
  if (brand === "Xiaomi" && (lowerDes.includes("poco") || lowerDes.includes("redmi"))) {
    // Behalte POCO/Redmi im Modellnamen
    const match = designation.match(/Xiaomi\s+((?:POCO|Redmi)\s+.+)/i);
    if (match) {
      model = match[1];
    }
  }

  // Aufräumen: Entferne (EU), EE, [W] am Ende, aber behalte Speicher/Farbe
  model = model
    .replace(/\s*\(EU\)\s*/g, " ")
    .replace(/\s*\[W\]\s*/g, " ")
    .replace(/\s+EE\s+/g, " ")
    .replace(/\s*\([A-Z0-9]+\)\s*$/g, "") // Apple Model-Codes am Ende
    .replace(/\s+/g, " ")
    .trim();

  return { brand, model, category };
}

/**
 * Parst eine einzelne Zeile aus dem PDF-Text
 * Format: [Status] ArticleNr Bezeichnung EK-Preis
 */
function parseLineData(line: string): ParsedHardwareLine | null {
  // Pattern für einsAmobile Format
  // Optional: NP am Anfang (Neuprodukt)
  // Dann: 6-9 stellige Artikel-Nr
  // Dann: Bezeichnung
  // Am Ende: Preis im Format 123,45 € oder 1.234,56 €

  // Bereinige die Zeile
  const cleanLine = line.trim();
  
  // Überspringe Header/Footer-Zeilen
  if (!cleanLine || cleanLine.length < 20) return null;
  if (/^(Status|Artikel|Bezeichnung|EK|Bestellhotline|Mo\.|support@|shop\.|Preisliste|einsAmobile|TK-Distribution)/i.test(cleanLine)) return null;
  if (/Verfügbarkeitshinweis|Händlershop|Mein Konto|Aktionen|FREI|Versandkostenfrei/i.test(cleanLine)) return null;
  if (/GmbH|Samerwiesen|Obertshausen/i.test(cleanLine)) return null;
  if (/^\d{2}\.\d{2}\.\d{4}/.test(cleanLine)) return null; // Datumszeilen

  // Preis extrahieren (am Ende der Zeile)
  const priceMatch = cleanLine.match(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*€?\s*$/);
  if (!priceMatch) return null;
  
  const priceStr = priceMatch[1].replace(/\./g, "").replace(",", ".");
  const price = parseFloat(priceStr);
  if (isNaN(price) || price <= 0) return null;

  // Entferne Preis vom Ende
  const withoutPrice = cleanLine.substring(0, cleanLine.lastIndexOf(priceMatch[1])).trim();

  // Status und Artikel-Nr. extrahieren
  // Format: [NP] 101300366 Apple iPad...
  const articleMatch = withoutPrice.match(/^(NP)?\s*(\d{8,9})\s+(.+)$/);
  if (!articleMatch) return null;

  const status = articleMatch[1] || "";
  const articleNr = articleMatch[2];
  const designation = articleMatch[3].trim();

  // Validierung: Bezeichnung muss eine bekannte Marke enthalten
  const hasBrand = BRAND_PATTERNS.some(({ pattern }) => pattern.test(designation));
  if (!hasBrand) return null;

  return {
    status,
    articleNr,
    designation,
    price,
  };
}

/**
 * Generiert eine stabile ID aus Marke und Modell
 */
function generateHardwareId(brand: string, model: string, articleNr: string): string {
  // Normalisiere für ID
  const normalized = `${brand}_${model}`
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  
  // Kürze auf max 60 Zeichen und füge die letzten 4 Ziffern der Artikelnr. für Eindeutigkeit an
  const suffix = articleNr.slice(-4);
  const baseId = normalized.substring(0, 55);
  
  return `${baseId}_${suffix}`;
}

/**
 * Parst den gesamten PDF-Text und extrahiert alle Hardware-Artikel
 */
export function parseEinsAmobileText(pdfText: string): EinsAmobileParseResult {
  const items: HardwareItemRow[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const brandCounts: Record<string, number> = {};
  
  // Teile in Zeilen auf
  const lines = pdfText.split("\n");
  
  let sortOrder = 1;
  let duplicateCount = 0;

  for (const line of lines) {
    // Manchmal sind mehrere Artikel in einer Zeile (Two-Column-Layout)
    // Versuche, die Zeile an einem zweiten Artikel-Pattern zu splitten
    
    // Check für Two-Column: Suche nach Pattern wo nach dem ersten Preis eine neue Artikelnr. folgt
    const twoColumnMatch = line.match(/^(.+?\d{1,3}(?:\.\d{3})*,\d{2}\s*€?)\s+((?:NP\s+)?\d{8,9}\s+.+?\d{1,3}(?:\.\d{3})*,\d{2}\s*€?)$/);
    
    const linesToParse = twoColumnMatch 
      ? [twoColumnMatch[1].trim(), twoColumnMatch[2].trim()]
      : [line];

    for (const subLine of linesToParse) {
      const parsed = parseLineData(subLine);
      if (!parsed) continue;

      const { brand, model, category } = parseBrandModel(parsed.designation);
      
      if (brand === "Unknown") {
        warnings.push(`Unbekannte Marke: ${parsed.designation.substring(0, 50)}`);
        continue;
      }

      // ID generieren
      let id = generateHardwareId(brand, model, parsed.articleNr);
      
      // Duplikate behandeln
      if (seenIds.has(id)) {
        duplicateCount++;
        id = `${id}_${duplicateCount}`;
      }
      seenIds.add(id);

      // Marken-Counter
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;

      const item: HardwareItemRow = {
        id,
        brand,
        model: model.substring(0, 100), // Maximal 100 Zeichen
        category,
        ek_net: parsed.price,
        sort_order: sortOrder++,
        active: true,
      };

      items.push(item);
    }
  }

  // Statistiken berechnen
  const prices = items.map(i => i.ek_net).filter(p => p > 0);
  const stats = {
    total: items.length,
    byBrand: brandCounts,
    priceRange: prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
    } : { min: 0, max: 0, avg: 0 },
  };

  // Zusammenfassung erstellen
  const brandSummary = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([brand, count]) => `${brand}: ${count}`)
    .join(", ");

  if (items.length > 0) {
    warnings.unshift(`Preisbereich: ${stats.priceRange.min.toFixed(0)}€ - ${stats.priceRange.max.toFixed(0)}€ (Ø ${stats.priceRange.avg.toFixed(0)}€)`);
    warnings.unshift(`Marken: ${brandSummary}`);
  }

  if (items.length === 0) {
    errors.push("Keine Hardware-Artikel gefunden");
  }

  return { items, warnings, errors, stats };
}

/**
 * Konvertiert HardwareItemRow zu Datenbank-Format
 */
export function toTenantHardwareFormat(items: HardwareItemRow[]): Array<{
  hardware_id: string;
  brand: string;
  model: string;
  category: string;
  ek_net: number;
  sort_order: number;
}> {
  return items.map((item, index) => ({
    hardware_id: item.id,
    brand: item.brand,
    model: item.model,
    category: item.category || "smartphone",
    ek_net: item.ek_net,
    sort_order: item.sort_order ?? index,
  }));
}
