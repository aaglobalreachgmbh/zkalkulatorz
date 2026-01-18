import { describe, it, expect } from "vitest";
import {
  extractStorage,
  extractConfig,
  extractSubModel,
  extractFamilyName,
  groupHardwareFamilies,
  findFamilyAndConfig,
  groupHardwareItems,
  findGroupAndVariant,
} from "../lib/hardwareGrouping";
import type { HardwareItem } from "../engine/types";

// ============================================
// Test-Daten
// ============================================

const MOCK_HARDWARE: HardwareItem[] = [
  // iPhone 16 Familie
  { id: "iphone_16_128", brand: "Apple", model: "iPhone 16 128GB", category: "smartphone", ekNet: 799, sortOrder: 10 },
  { id: "iphone_16_256", brand: "Apple", model: "iPhone 16 256GB", category: "smartphone", ekNet: 899, sortOrder: 11 },
  { id: "iphone_16_plus_128", brand: "Apple", model: "iPhone 16 Plus 128GB", category: "smartphone", ekNet: 949, sortOrder: 12 },
  { id: "iphone_16_plus_256", brand: "Apple", model: "iPhone 16 Plus 256GB", category: "smartphone", ekNet: 1049, sortOrder: 13 },
  { id: "iphone_16_pro_128", brand: "Apple", model: "iPhone 16 Pro 128GB", category: "smartphone", ekNet: 1099, sortOrder: 14 },
  { id: "iphone_16_pro_256", brand: "Apple", model: "iPhone 16 Pro 256GB", category: "smartphone", ekNet: 1199, sortOrder: 15 },
  { id: "iphone_16_pro_max_256", brand: "Apple", model: "iPhone 16 Pro Max 256GB", category: "smartphone", ekNet: 1349, sortOrder: 16 },
  { id: "iphone_16_pro_max_512", brand: "Apple", model: "iPhone 16 Pro Max 512GB", category: "smartphone", ekNet: 1549, sortOrder: 17 },
  
  // Galaxy S24 Familie
  { id: "samsung_s24_128", brand: "Samsung", model: "Galaxy S24 128GB", category: "smartphone", ekNet: 699, sortOrder: 30 },
  { id: "samsung_s24_256", brand: "Samsung", model: "Galaxy S24 256GB", category: "smartphone", ekNet: 799, sortOrder: 31 },
  { id: "samsung_s24_ultra_256", brand: "Samsung", model: "Galaxy S24 Ultra 256GB", category: "smartphone", ekNet: 1149, sortOrder: 34 },
  { id: "samsung_s24_ultra_512", brand: "Samsung", model: "Galaxy S24 Ultra 512GB", category: "smartphone", ekNet: 1299, sortOrder: 35 },
  
  // Tablets
  { id: "ipad_10_64", brand: "Apple", model: "iPad 10.Gen 64GB WiFi+Cell", category: "tablet", ekNet: 549, sortOrder: 100 },
  { id: "ipad_10_256", brand: "Apple", model: "iPad 10.Gen 256GB WiFi+Cell", category: "tablet", ekNet: 699, sortOrder: 101 },
  
  // Spezialfälle
  { id: "no_hardware", brand: "-", model: "KEINE HARDWARE", category: "none", ekNet: 0, sortOrder: 0 },
  { id: "custom_device", brand: "Sonstiges", model: "Gerät (manuelle EK-Eingabe)", category: "custom", ekNet: 0, sortOrder: 999 },
];

// ============================================
// Unit Tests: Extraction Functions
// ============================================

describe("extractStorage", () => {
  it("extrahiert Speicher aus Standard-Formaten", () => {
    expect(extractStorage("iPhone 16 128GB")).toBe("128GB");
    expect(extractStorage("Galaxy S24 Ultra 512GB")).toBe("512GB");
    expect(extractStorage("iPad Pro 1TB")).toBe("1TB");
  });

  it("gibt null zurück wenn kein Speicher gefunden", () => {
    expect(extractStorage("iPhone 16")).toBeNull();
    expect(extractStorage("KEINE HARDWARE")).toBeNull();
  });

  it("ist case-insensitive", () => {
    expect(extractStorage("Device 256gb")).toBe("256GB");
    expect(extractStorage("Device 1tb")).toBe("1TB");
  });
});

describe("extractConfig", () => {
  it("extrahiert Speicher und Konnektivität", () => {
    expect(extractConfig("iPad 10.Gen 64GB WiFi+Cell")).toEqual({
      storage: "64GB",
      connectivity: "WiFi+Cell",
    });
    expect(extractConfig("Galaxy Tab S9 128GB 5G")).toEqual({
      storage: "128GB",
      connectivity: "5G",
    });
  });

  it("extrahiert nur Speicher wenn keine Konnektivität", () => {
    expect(extractConfig("iPhone 16 256GB")).toEqual({
      storage: "256GB",
      connectivity: undefined,
    });
  });

  it("gibt null zurück wenn keine Config gefunden", () => {
    expect(extractConfig("KEINE HARDWARE")).toBeNull();
  });
});

describe("extractSubModel", () => {
  it("erkennt bekannte SubModel-Patterns", () => {
    expect(extractSubModel("iPhone 16 Pro Max")).toBe("Pro Max");
    expect(extractSubModel("iPhone 16 Pro")).toBe("Pro");
    expect(extractSubModel("iPhone 16 Plus")).toBe("Plus");
    expect(extractSubModel("Galaxy S24 Ultra")).toBe("Ultra");
    expect(extractSubModel("Pixel 9 Pro XL")).toBe("Pro XL");
  });

  it("gibt null zurück für Standard-Modelle", () => {
    expect(extractSubModel("iPhone 16")).toBeNull();
    expect(extractSubModel("Galaxy S24")).toBeNull();
    expect(extractSubModel("Pixel 9")).toBeNull();
  });

  it("priorisiert längere Patterns (Pro Max vor Pro)", () => {
    expect(extractSubModel("iPhone 16 Pro Max")).toBe("Pro Max");
  });
});

describe("extractFamilyName", () => {
  it("extrahiert Familien-Namen korrekt", () => {
    expect(extractFamilyName("iPhone 16 Pro Max 256GB")).toBe("iPhone 16");
    expect(extractFamilyName("iPhone 16 256GB")).toBe("iPhone 16");
    expect(extractFamilyName("Galaxy S24 Ultra 512GB")).toBe("Galaxy S24");
    expect(extractFamilyName("Galaxy S24 128GB")).toBe("Galaxy S24");
  });

  it("handhabt Tablets mit Konnektivität", () => {
    expect(extractFamilyName("iPad 10.Gen 64GB WiFi+Cell")).toBe("iPad 10.Gen");
    expect(extractFamilyName("Galaxy Tab S9 128GB 5G")).toBe("Galaxy Tab S9");
  });

  it("gibt vollen Namen zurück wenn keine Pattern erkannt", () => {
    expect(extractFamilyName("Redmi Note 13 Pro 256GB")).toBe("Redmi Note 13");
  });
});

// ============================================
// Integration Tests: 3-Ebenen-Hierarchie
// ============================================

describe("groupHardwareFamilies", () => {
  it("gruppiert iPhone 16 Familie korrekt in 4 SubModels", () => {
    const families = groupHardwareFamilies(MOCK_HARDWARE);
    const iPhoneFamily = families.find(f => f.familyName === "iPhone 16");
    
    expect(iPhoneFamily).toBeDefined();
    expect(iPhoneFamily!.brand).toBe("Apple");
    expect(iPhoneFamily!.subModels.length).toBe(4); // Standard, Plus, Pro, Pro Max
    
    // Prüfe SubModel-Namen
    const subModelNames = iPhoneFamily!.subModels.map(s => s.subModelName);
    expect(subModelNames).toContain("");        // Standard
    expect(subModelNames).toContain("Plus");
    expect(subModelNames).toContain("Pro");
    expect(subModelNames).toContain("Pro Max");
  });

  it("berechnet Preisbereiche korrekt", () => {
    const families = groupHardwareFamilies(MOCK_HARDWARE);
    const iPhoneFamily = families.find(f => f.familyName === "iPhone 16");
    
    expect(iPhoneFamily!.lowestPrice).toBe(799);   // iPhone 16 128GB
    expect(iPhoneFamily!.highestPrice).toBe(1549); // iPhone 16 Pro Max 512GB
    expect(iPhoneFamily!.totalConfigs).toBe(8);
  });

  it("sortiert SubModels: Standard zuerst", () => {
    const families = groupHardwareFamilies(MOCK_HARDWARE);
    const iPhoneFamily = families.find(f => f.familyName === "iPhone 16");
    
    expect(iPhoneFamily!.subModels[0].subModelName).toBe(""); // Standard zuerst
    expect(iPhoneFamily!.subModels[0].displayName).toBe("(Standard)");
  });

  it("sortiert Configs nach Speichergröße", () => {
    const families = groupHardwareFamilies(MOCK_HARDWARE);
    const iPhoneFamily = families.find(f => f.familyName === "iPhone 16");
    const standardSubModel = iPhoneFamily!.subModels[0];
    
    expect(standardSubModel.configs[0].storage).toBe("128GB");
    expect(standardSubModel.configs[1].storage).toBe("256GB");
  });

  it("ignoriert no_hardware und custom Items", () => {
    const families = groupHardwareFamilies(MOCK_HARDWARE);
    
    const noHardwareFamily = families.find(f => f.familyName === "KEINE HARDWARE");
    const customFamily = families.find(f => f.brand === "Sonstiges");
    
    expect(noHardwareFamily).toBeUndefined();
    expect(customFamily).toBeUndefined();
  });

  it("behandelt Tablets mit Konnektivität", () => {
    const families = groupHardwareFamilies(MOCK_HARDWARE);
    const iPadFamily = families.find(f => f.familyName === "iPad 10.Gen");
    
    expect(iPadFamily).toBeDefined();
    expect(iPadFamily!.category).toBe("tablet");
    expect(iPadFamily!.subModels.length).toBe(1);
    expect(iPadFamily!.subModels[0].configs[0].connectivity).toBe("WiFi+Cell");
  });

  it("sortiert Familien nach Marke und Name", () => {
    const families = groupHardwareFamilies(MOCK_HARDWARE);
    
    // Apple kommt vor Samsung alphabetisch
    const appleIndex = families.findIndex(f => f.brand === "Apple");
    const samsungIndex = families.findIndex(f => f.brand === "Samsung");
    
    expect(appleIndex).toBeLessThan(samsungIndex);
  });
});

describe("findFamilyAndConfig", () => {
  it("findet Familie, SubModel und Config für gültige ID", () => {
    const families = groupHardwareFamilies(MOCK_HARDWARE);
    const result = findFamilyAndConfig(families, "iphone_16_pro_max_256");
    
    expect(result).not.toBeNull();
    expect(result!.family.familyName).toBe("iPhone 16");
    expect(result!.subModel.subModelName).toBe("Pro Max");
    expect(result!.config.storage).toBe("256GB");
    expect(result!.config.ekNet).toBe(1349);
  });

  it("gibt null zurück für ungültige ID", () => {
    const families = groupHardwareFamilies(MOCK_HARDWARE);
    const result = findFamilyAndConfig(families, "non_existent_id");
    
    expect(result).toBeNull();
  });

  it("findet Standard-SubModel (kein Suffix)", () => {
    const families = groupHardwareFamilies(MOCK_HARDWARE);
    const result = findFamilyAndConfig(families, "iphone_16_128");
    
    expect(result).not.toBeNull();
    expect(result!.subModel.subModelName).toBe("");
    expect(result!.subModel.displayName).toBe("(Standard)");
  });
});

// ============================================
// Legacy-Kompatibilitäts-Tests
// ============================================

describe("Legacy: groupHardwareItems", () => {
  it("gruppiert nach Basis-Modell (2-Ebenen)", () => {
    const groups = groupHardwareItems(MOCK_HARDWARE);
    
    // Legacy gruppiert iPhone 16 und iPhone 16 Plus separat
    const iphone16 = groups.find(g => g.baseName === "iPhone 16");
    const iphone16Plus = groups.find(g => g.baseName === "iPhone 16 Plus");
    
    expect(iphone16).toBeDefined();
    expect(iphone16Plus).toBeDefined();
    expect(iphone16!.variants.length).toBe(2);
  });

  it("sortiert Varianten nach Speicher", () => {
    const groups = groupHardwareItems(MOCK_HARDWARE);
    const iphone16 = groups.find(g => g.baseName === "iPhone 16");
    
    expect(iphone16!.variants[0].storage).toBe("128GB");
    expect(iphone16!.variants[1].storage).toBe("256GB");
  });
});

describe("Legacy: findGroupAndVariant", () => {
  it("findet Gruppe und Variante", () => {
    const groups = groupHardwareItems(MOCK_HARDWARE);
    const result = findGroupAndVariant(groups, "samsung_s24_128");
    
    expect(result).not.toBeNull();
    expect(result!.group.baseName).toBe("Galaxy S24");
    expect(result!.variant.storage).toBe("128GB");
  });
});
