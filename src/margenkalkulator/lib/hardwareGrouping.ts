/**
 * Hardware-Gruppierung mit 3-Ebenen-Hierarchie.
 * 
 * ZWECK:
 * Statt 32+ einzelne Karten zeigen wir eine hierarchische Struktur:
 * 1. FAMILIE: z.B. "iPhone 16" (alle Varianten zusammen)
 * 2. SUB-MODEL: z.B. "Pro Max", "Plus", "Standard"
 * 3. KONFIGURATION: z.B. "256GB", "512GB"
 * 
 * PATTERN-ERKENNUNG:
 * - "iPhone 16 Pro Max 256GB" → Familie: "iPhone 16", SubModel: "Pro Max", Config: "256GB"
 * - "Galaxy S24 Ultra 512GB" → Familie: "Galaxy S24", SubModel: "Ultra", Config: "512GB"
 */

import type { HardwareItem } from "../engine/types";

// ============================================
// EBENE 3: Einzelne Konfiguration
// ============================================
export type HardwareConfig = {
  id: string;
  storage: string;         // "128GB", "256GB", "512GB", "1TB"
  connectivity?: string;   // "WiFi", "WiFi+Cell", "5G" (für Tablets)
  ekNet: number;
  fullModel: string;       // Vollständiger Modellname aus Katalog
};

// ============================================
// EBENE 2: Modellvariante (SubModel)
// ============================================
export type HardwareSubModel = {
  subModelId: string;
  subModelName: string;    // "Pro Max", "Plus", "Ultra", "" (Standard)
  displayName: string;     // Anzeigename: "Pro Max" oder "(Standard)"
  configs: HardwareConfig[];
  lowestPrice: number;
  highestPrice: number;
};

// ============================================
// EBENE 1: Produktfamilie
// ============================================
export type HardwareFamily = {
  familyId: string;
  brand: string;
  familyName: string;      // "iPhone 16", "Galaxy S24", "Pixel 9"
  category: "smartphone" | "tablet";
  subModels: HardwareSubModel[];
  lowestPrice: number;
  highestPrice: number;
  totalConfigs: number;    // Gesamtzahl aller Konfigurationen
};

// ============================================
// Legacy-Typen für Rückwärtskompatibilität
// ============================================
export type HardwareVariant = {
  id: string;
  storage: string;
  ekNet: number;
  fullModel: string;
};

export type HardwareGroup = {
  baseId: string;
  brand: string;
  baseName: string;
  category: "smartphone" | "tablet" | "none";
  variants: HardwareVariant[];
  lowestPrice: number;
  highestPrice: number;
};

// ============================================
// Pattern-Erkennung
// ============================================

/**
 * Bekannte SubModel-Suffixe in Prioritätsreihenfolge (längste zuerst).
 * Diese werden vom Modellnamen extrahiert, um SubModels zu identifizieren.
 */
const SUB_MODEL_PATTERNS = [
  // Apple iPhone
  "Pro Max",
  "Plus",
  "Pro",
  // Samsung Galaxy
  "Ultra",
  "FE",
  // Samsung Foldables (als eigenständige Familie behandelt)
  "Z Fold6",
  "Z Flip6",
  // Google Pixel
  "Pro XL",
  // Xiaomi
  // Samsung Galaxy A Serie (behandelt als Familie)
];

/**
 * Regex für Speicher-/Konnektivitätsangaben am Ende des Modellnamens.
 * Erfasst: "128GB", "256GB WiFi+Cell", "512GB 5G"
 */
const CONFIG_REGEX = /\s+(\d+(?:\.\d+)?)\s*(GB|TB)(?:\s+(WiFi\+Cell|WiFi|5G|LTE))?$/i;

/**
 * Regex für nur Speicherangaben.
 */
const STORAGE_REGEX = /\s*(\d+(?:\.\d+)?)\s*(GB|TB)$/i;

/**
 * Extrahiert Speicherangabe aus Model-Namen.
 */
export function extractStorage(model: string): string | null {
  const match = model.match(STORAGE_REGEX);
  if (!match) return null;
  return `${match[1]}${match[2].toUpperCase()}`;
}

/**
 * Extrahiert Konfiguration (Speicher + optional Konnektivität) aus Model-Namen.
 */
export function extractConfig(model: string): { storage: string; connectivity?: string } | null {
  const match = model.match(CONFIG_REGEX);
  if (!match) return null;
  return {
    storage: `${match[1]}${match[2].toUpperCase()}`,
    connectivity: match[3] || undefined,
  };
}

/**
 * Extrahiert SubModel-Suffix aus Model-Namen.
 * 
 * @example
 * extractSubModel("iPhone 16 Pro Max 256GB") → "Pro Max"
 * extractSubModel("iPhone 16 256GB") → null (Standard)
 * extractSubModel("Galaxy S24 Ultra 512GB") → "Ultra"
 */
export function extractSubModel(modelWithoutConfig: string): string | null {
  for (const pattern of SUB_MODEL_PATTERNS) {
    // Check if model ends with this pattern (case insensitive)
    const regex = new RegExp(`\\s+${escapeRegex(pattern)}$`, "i");
    if (regex.test(modelWithoutConfig)) {
      return pattern;
    }
  }
  return null;
}

/**
 * Escape special regex characters.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extrahiert Familien-Namen aus Model-Namen.
 * Entfernt SubModel-Suffix und Konfiguration.
 * 
 * @example
 * extractFamilyName("iPhone 16 Pro Max 256GB") → "iPhone 16"
 * extractFamilyName("Galaxy S24 Ultra 512GB") → "Galaxy S24"
 * extractFamilyName("Galaxy A55 128GB") → "Galaxy A55"
 */
export function extractFamilyName(model: string): string {
  // 1. Entferne Konfiguration (Speicher + Konnektivität)
  let cleaned = model.replace(CONFIG_REGEX, "").trim();
  
  // 2. Entferne SubModel-Suffix
  for (const pattern of SUB_MODEL_PATTERNS) {
    const regex = new RegExp(`\\s+${escapeRegex(pattern)}$`, "i");
    cleaned = cleaned.replace(regex, "").trim();
  }
  
  return cleaned;
}

/**
 * Generiert eindeutige ID aus Marke und Name.
 */
function generateId(brand: string, name: string): string {
  return `${brand}_${name}`
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * Konvertiert Speicher-String zu Bytes für Sortierung.
 */
function storageToBytes(storage: string): number {
  const match = storage.match(/^(\d+(?:\.\d+)?)\s*(GB|TB)$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  return unit === "TB" ? value * 1000 : value;
}

// ============================================
// Hauptfunktion: Gruppierung in 3 Ebenen
// ============================================

/**
 * Gruppiert Hardware-Items in 3-Ebenen-Hierarchie.
 * 
 * ALGORITHMUS:
 * 1. Für jedes Item: Extrahiere Familie, SubModel, Config
 * 2. Gruppiere nach Familie → SubModel → Config
 * 3. Sortiere: Familien alphabetisch, SubModels nach Reihenfolge, Configs nach Speicher
 * 4. Berechne Preisbereiche auf allen Ebenen
 * 
 * @example
 * Input: [
 *   { model: "iPhone 16 128GB", ... },
 *   { model: "iPhone 16 Pro 256GB", ... },
 *   { model: "iPhone 16 Pro Max 512GB", ... },
 * ]
 * Output: [{
 *   familyName: "iPhone 16",
 *   subModels: [
 *     { subModelName: "", configs: [{ storage: "128GB" }] },
 *     { subModelName: "Pro", configs: [{ storage: "256GB" }] },
 *     { subModelName: "Pro Max", configs: [{ storage: "512GB" }] },
 *   ]
 * }]
 */
export function groupHardwareFamilies(items: HardwareItem[]): HardwareFamily[] {
  const familyMap = new Map<string, {
    brand: string;
    familyName: string;
    category: "smartphone" | "tablet";
    subModels: Map<string, {
      subModelName: string;
      configs: HardwareConfig[];
    }>;
  }>();

  for (const item of items) {
    // Skip special items
    if (item.id === "no_hardware" || item.category === "custom" || item.category === "none") {
      continue;
    }

    // Extrahiere Informationen
    const configInfo = extractConfig(item.model);
    const storage = configInfo?.storage || "Standard";
    const connectivity = configInfo?.connectivity;
    
    // Model ohne Config für SubModel-Erkennung
    const modelWithoutConfig = item.model.replace(CONFIG_REGEX, "").trim();
    const subModelName = extractSubModel(modelWithoutConfig) || "";
    const familyName = extractFamilyName(item.model);
    
    const familyId = generateId(item.brand, familyName);
    const subModelId = generateId(item.brand, `${familyName}_${subModelName || "standard"}`);
    
    // Config erstellen
    const config: HardwareConfig = {
      id: item.id,
      storage,
      connectivity,
      ekNet: item.ekNet,
      fullModel: item.model,
    };

    // Familie finden oder erstellen
    if (!familyMap.has(familyId)) {
      familyMap.set(familyId, {
        brand: item.brand,
        familyName,
        category: item.category as "smartphone" | "tablet",
        subModels: new Map(),
      });
    }
    const family = familyMap.get(familyId)!;

    // SubModel finden oder erstellen
    if (!family.subModels.has(subModelId)) {
      family.subModels.set(subModelId, {
        subModelName,
        configs: [],
      });
    }
    family.subModels.get(subModelId)!.configs.push(config);
  }

  // Map zu Array konvertieren und sortieren
  const families: HardwareFamily[] = [];

  for (const [familyId, familyData] of familyMap) {
    const subModels: HardwareSubModel[] = [];
    let familyLowest = Infinity;
    let familyHighest = 0;
    let totalConfigs = 0;

    for (const [subModelId, subModelData] of familyData.subModels) {
      // Configs nach Speicher sortieren
      subModelData.configs.sort((a, b) => storageToBytes(a.storage) - storageToBytes(b.storage));
      
      const prices = subModelData.configs.map(c => c.ekNet);
      const lowestPrice = Math.min(...prices);
      const highestPrice = Math.max(...prices);

      familyLowest = Math.min(familyLowest, lowestPrice);
      familyHighest = Math.max(familyHighest, highestPrice);
      totalConfigs += subModelData.configs.length;

      subModels.push({
        subModelId,
        subModelName: subModelData.subModelName,
        displayName: subModelData.subModelName || "(Standard)",
        configs: subModelData.configs,
        lowestPrice,
        highestPrice,
      });
    }

    // SubModels sortieren: Standard zuerst, dann alphabetisch
    subModels.sort((a, b) => {
      if (a.subModelName === "" && b.subModelName !== "") return -1;
      if (a.subModelName !== "" && b.subModelName === "") return 1;
      return a.subModelName.localeCompare(b.subModelName);
    });

    families.push({
      familyId,
      brand: familyData.brand,
      familyName: familyData.familyName,
      category: familyData.category,
      subModels,
      lowestPrice: familyLowest,
      highestPrice: familyHighest,
      totalConfigs,
    });
  }

  // Familien nach Marke und dann nach Name sortieren
  families.sort((a, b) => {
    const brandCompare = a.brand.localeCompare(b.brand);
    if (brandCompare !== 0) return brandCompare;
    return a.familyName.localeCompare(b.familyName);
  });

  return families;
}

/**
 * Findet Familie, SubModel und Config für eine gegebene Hardware-ID.
 */
export function findFamilyAndConfig(
  families: HardwareFamily[],
  hardwareId: string
): { family: HardwareFamily; subModel: HardwareSubModel; config: HardwareConfig } | null {
  for (const family of families) {
    for (const subModel of family.subModels) {
      const config = subModel.configs.find(c => c.id === hardwareId);
      if (config) {
        return { family, subModel, config };
      }
    }
  }
  return null;
}

// ============================================
// Legacy-Funktionen für Rückwärtskompatibilität
// ============================================

/**
 * Generiert Basis-Namen ohne Speicherangabe.
 * @deprecated Verwende extractFamilyName für neue Implementierungen
 */
export function extractBaseName(model: string): string {
  return model.replace(STORAGE_REGEX, "").trim();
}

/**
 * Legacy-Gruppierung (flache 2-Ebenen-Struktur).
 * @deprecated Verwende groupHardwareFamilies für 3-Ebenen-Hierarchie
 */
export function groupHardwareItems(items: HardwareItem[]): HardwareGroup[] {
  const groups = new Map<string, HardwareGroup>();

  for (const item of items) {
    if (item.id === "no_hardware" || item.category === "custom" || item.category === "none") {
      continue;
    }

    const storage = extractStorage(item.model);
    const baseName = storage ? extractBaseName(item.model) : item.model;
    const baseId = generateId(item.brand, baseName);

    const variant: HardwareVariant = {
      id: item.id,
      storage: storage || "Standard",
      ekNet: item.ekNet,
      fullModel: item.model,
    };

    if (groups.has(baseId)) {
      const group = groups.get(baseId)!;
      group.variants.push(variant);
      group.lowestPrice = Math.min(group.lowestPrice, item.ekNet);
      group.highestPrice = Math.max(group.highestPrice, item.ekNet);
    } else {
      groups.set(baseId, {
        baseId,
        brand: item.brand,
        baseName,
        category: item.category as "smartphone" | "tablet" | "none",
        variants: [variant],
        lowestPrice: item.ekNet,
        highestPrice: item.ekNet,
      });
    }
  }

  // Varianten nach Speichergröße sortieren
  for (const group of groups.values()) {
    group.variants.sort((a, b) => storageToBytes(a.storage) - storageToBytes(b.storage));
  }

  return Array.from(groups.values()).sort((a, b) => {
    const brandCompare = a.brand.localeCompare(b.brand);
    if (brandCompare !== 0) return brandCompare;
    return a.baseName.localeCompare(b.baseName);
  });
}

/**
 * Legacy: Findet Gruppe und Variante für eine Hardware-ID.
 * @deprecated Verwende findFamilyAndConfig für neue Implementierungen
 */
export function findGroupAndVariant(
  groups: HardwareGroup[],
  hardwareId: string
): { group: HardwareGroup; variant: HardwareVariant } | null {
  for (const group of groups) {
    const variant = group.variants.find(v => v.id === hardwareId);
    if (variant) {
      return { group, variant };
    }
  }
  return null;
}
