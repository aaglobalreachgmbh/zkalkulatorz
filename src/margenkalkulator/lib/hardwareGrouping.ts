/**
 * Hardware-Gruppierung nach Basis-Modell.
 * 
 * ZWECK:
 * Statt 32 einzelne Karten (jede Speichervariante) zeigen wir gruppierte
 * Basis-Modelle mit Dropdown für Varianten-Auswahl.
 * 
 * PATTERN-ERKENNUNG:
 * - Model-Namen enthalten Speicherangaben: "iPhone 16 128GB", "Galaxy S24 256GB"
 * - Basis = alles ohne Speicherangabe: "iPhone 16", "Galaxy S24"
 * - Varianten = Speicheroptionen: 128GB, 256GB, 512GB, 1TB
 */

import type { HardwareItem } from "../engine/types";

/**
 * Eine Speicher-Variante eines Basis-Modells.
 */
export type HardwareVariant = {
  id: string;
  storage: string;
  ekNet: number;
  fullModel: string;
};

/**
 * Gruppiertes Hardware-Modell mit allen Speicher-Varianten.
 */
export type HardwareGroup = {
  baseId: string;
  brand: string;
  baseName: string;
  category: "smartphone" | "tablet" | "none";
  variants: HardwareVariant[];
  lowestPrice: number;
  highestPrice: number;
};

/**
 * Regex für Speicherangaben im Model-Namen.
 * Erfasst: 64GB, 128GB, 256GB, 512GB, 1TB, 2TB
 */
const STORAGE_REGEX = /\s*(\d+(?:\.\d+)?)\s*(GB|TB)$/i;

/**
 * Extrahiert Speicherangabe aus Model-Namen.
 * 
 * @example
 * extractStorage("iPhone 16 128GB") → "128GB"
 * extractStorage("Galaxy S24 Ultra 1TB") → "1TB"
 * extractStorage("Pixel 9") → null
 */
export function extractStorage(model: string): string | null {
  const match = model.match(STORAGE_REGEX);
  if (!match) return null;
  return `${match[1]}${match[2].toUpperCase()}`;
}

/**
 * Generiert Basis-Namen ohne Speicherangabe.
 * 
 * @example
 * extractBaseName("iPhone 16 128GB") → "iPhone 16"
 * extractBaseName("Galaxy S24 Ultra 1TB") → "Galaxy S24 Ultra"
 */
export function extractBaseName(model: string): string {
  return model.replace(STORAGE_REGEX, "").trim();
}

/**
 * Generiert eindeutige Basis-ID aus Marke und Basis-Namen.
 * 
 * @example
 * generateBaseId("Apple", "iPhone 16") → "apple_iphone_16"
 */
function generateBaseId(brand: string, baseName: string): string {
  return `${brand}_${baseName}`
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * Konvertiert Speicher-String zu Bytes für Sortierung.
 * 
 * @example
 * storageToBytes("128GB") → 128000000000
 * storageToBytes("1TB") → 1000000000000
 */
function storageToBytes(storage: string): number {
  const match = storage.match(/^(\d+(?:\.\d+)?)\s*(GB|TB)$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  return unit === "TB" ? value * 1000 : value;
}

/**
 * Gruppiert Hardware-Items nach Basis-Modell.
 * 
 * ALGORITHMUS:
 * 1. Extrahiere Speicher und Basis-Name aus jedem Item
 * 2. Gruppiere nach Marke + Basis-Name
 * 3. Sortiere Varianten nach Speichergröße (aufsteigend)
 * 4. Berechne niedrigsten und höchsten Preis
 * 
 * SONDERFÄLLE:
 * - Items ohne Speicherangabe → eigene Gruppe mit einer Variante
 * - "no_hardware" → wird nicht gruppiert (separat behandelt)
 * 
 * @example
 * // Input: [
 * //   { id: "iphone_16_128", model: "iPhone 16 128GB", ekNet: 799 },
 * //   { id: "iphone_16_256", model: "iPhone 16 256GB", ekNet: 899 },
 * // ]
 * // Output: [{
 * //   baseId: "apple_iphone_16",
 * //   baseName: "iPhone 16",
 * //   variants: [{ storage: "128GB", ekNet: 799 }, { storage: "256GB", ekNet: 899 }],
 * //   lowestPrice: 799
 * // }]
 */
export function groupHardwareItems(items: HardwareItem[]): HardwareGroup[] {
  const groups = new Map<string, HardwareGroup>();

  for (const item of items) {
    // Skip no_hardware und custom items
    if (item.id === "no_hardware" || item.category === "custom" || item.category === "none") {
      continue;
    }

    const storage = extractStorage(item.model);
    const baseName = storage ? extractBaseName(item.model) : item.model;
    const baseId = generateBaseId(item.brand, baseName);

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
    group.variants.sort((a, b) => {
      const bytesA = storageToBytes(a.storage);
      const bytesB = storageToBytes(b.storage);
      return bytesA - bytesB;
    });
  }

  // Gruppen nach Marke und dann nach Basisname sortieren
  return Array.from(groups.values()).sort((a, b) => {
    const brandCompare = a.brand.localeCompare(b.brand);
    if (brandCompare !== 0) return brandCompare;
    return a.baseName.localeCompare(b.baseName);
  });
}

/**
 * Findet die Gruppe und Variante für eine gegebene Hardware-ID.
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
