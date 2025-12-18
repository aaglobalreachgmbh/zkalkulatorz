// ============================================
// Business Dataset v2025-09 - Hardware Catalog
// EK-Preise sind Platzhalter - via XLSX-Import aktualisieren
// ============================================

import type { HardwareItem } from "../../../../margenkalkulator/engine/types";

export const hardwareCatalog: HardwareItem[] = [
  // === KEINE HARDWARE ===
  { id: "no_hardware", brand: "-", model: "KEINE HARDWARE", category: "none", ekNet: 0, sortOrder: 0 },
  
  // === APPLE iPhone ===
  { id: "iphone_16_128", brand: "Apple", model: "iPhone 16 128GB", category: "smartphone", ekNet: 799, sortOrder: 10 },
  { id: "iphone_16_256", brand: "Apple", model: "iPhone 16 256GB", category: "smartphone", ekNet: 899, sortOrder: 11 },
  { id: "iphone_16_plus_128", brand: "Apple", model: "iPhone 16 Plus 128GB", category: "smartphone", ekNet: 949, sortOrder: 12 },
  { id: "iphone_16_plus_256", brand: "Apple", model: "iPhone 16 Plus 256GB", category: "smartphone", ekNet: 1049, sortOrder: 13 },
  { id: "iphone_16_pro_128", brand: "Apple", model: "iPhone 16 Pro 128GB", category: "smartphone", ekNet: 1099, sortOrder: 14 },
  { id: "iphone_16_pro_256", brand: "Apple", model: "iPhone 16 Pro 256GB", category: "smartphone", ekNet: 1199, sortOrder: 15 },
  { id: "iphone_16_pro_max_256", brand: "Apple", model: "iPhone 16 Pro Max 256GB", category: "smartphone", ekNet: 1349, sortOrder: 16 },
  { id: "iphone_16_pro_max_512", brand: "Apple", model: "iPhone 16 Pro Max 512GB", category: "smartphone", ekNet: 1549, sortOrder: 17 },
  { id: "iphone_15_128", brand: "Apple", model: "iPhone 15 128GB", category: "smartphone", ekNet: 699, sortOrder: 18 },
  { id: "iphone_se_64", brand: "Apple", model: "iPhone SE 64GB", category: "smartphone", ekNet: 449, sortOrder: 19 },
  
  // === SAMSUNG Galaxy S ===
  { id: "samsung_s24_128", brand: "Samsung", model: "Galaxy S24 128GB", category: "smartphone", ekNet: 699, sortOrder: 30 },
  { id: "samsung_s24_256", brand: "Samsung", model: "Galaxy S24 256GB", category: "smartphone", ekNet: 799, sortOrder: 31 },
  { id: "samsung_s24_plus_256", brand: "Samsung", model: "Galaxy S24+ 256GB", category: "smartphone", ekNet: 899, sortOrder: 32 },
  { id: "samsung_s24_plus_512", brand: "Samsung", model: "Galaxy S24+ 512GB", category: "smartphone", ekNet: 1049, sortOrder: 33 },
  { id: "samsung_s24_ultra_256", brand: "Samsung", model: "Galaxy S24 Ultra 256GB", category: "smartphone", ekNet: 1149, sortOrder: 34 },
  { id: "samsung_s24_ultra_512", brand: "Samsung", model: "Galaxy S24 Ultra 512GB", category: "smartphone", ekNet: 1299, sortOrder: 35 },
  
  // === SAMSUNG Galaxy A ===
  { id: "samsung_a55_128", brand: "Samsung", model: "Galaxy A55 128GB", category: "smartphone", ekNet: 349, sortOrder: 40 },
  { id: "samsung_a55_256", brand: "Samsung", model: "Galaxy A55 256GB", category: "smartphone", ekNet: 399, sortOrder: 41 },
  { id: "samsung_a35_128", brand: "Samsung", model: "Galaxy A35 128GB", category: "smartphone", ekNet: 299, sortOrder: 42 },
  { id: "samsung_a15_128", brand: "Samsung", model: "Galaxy A15 128GB", category: "smartphone", ekNet: 179, sortOrder: 43 },
  
  // === SAMSUNG Galaxy Z (Foldables) ===
  { id: "samsung_z_fold6_256", brand: "Samsung", model: "Galaxy Z Fold6 256GB", category: "smartphone", ekNet: 1599, sortOrder: 50 },
  { id: "samsung_z_flip6_256", brand: "Samsung", model: "Galaxy Z Flip6 256GB", category: "smartphone", ekNet: 1049, sortOrder: 51 },
  
  // === GOOGLE Pixel ===
  { id: "pixel_9_128", brand: "Google", model: "Pixel 9 128GB", category: "smartphone", ekNet: 749, sortOrder: 60 },
  { id: "pixel_9_256", brand: "Google", model: "Pixel 9 256GB", category: "smartphone", ekNet: 849, sortOrder: 61 },
  { id: "pixel_9_pro_128", brand: "Google", model: "Pixel 9 Pro 128GB", category: "smartphone", ekNet: 899, sortOrder: 62 },
  { id: "pixel_9_pro_256", brand: "Google", model: "Pixel 9 Pro 256GB", category: "smartphone", ekNet: 999, sortOrder: 63 },
  { id: "pixel_9_pro_xl_256", brand: "Google", model: "Pixel 9 Pro XL 256GB", category: "smartphone", ekNet: 1099, sortOrder: 64 },
  { id: "pixel_8a_128", brand: "Google", model: "Pixel 8a 128GB", category: "smartphone", ekNet: 499, sortOrder: 65 },
  
  // === XIAOMI ===
  { id: "xiaomi_14_256", brand: "Xiaomi", model: "14 256GB", category: "smartphone", ekNet: 599, sortOrder: 70 },
  { id: "xiaomi_14_ultra_512", brand: "Xiaomi", model: "14 Ultra 512GB", category: "smartphone", ekNet: 1199, sortOrder: 71 },
  { id: "xiaomi_redmi_note_13_pro", brand: "Xiaomi", model: "Redmi Note 13 Pro 256GB", category: "smartphone", ekNet: 299, sortOrder: 72 },
  
  // === TABLETS - Apple iPad ===
  { id: "ipad_10_64", brand: "Apple", model: "iPad 10.Gen 64GB WiFi+Cell", category: "tablet", ekNet: 549, sortOrder: 100 },
  { id: "ipad_10_256", brand: "Apple", model: "iPad 10.Gen 256GB WiFi+Cell", category: "tablet", ekNet: 699, sortOrder: 101 },
  { id: "ipad_air_m2_128", brand: "Apple", model: "iPad Air M2 128GB WiFi+Cell", category: "tablet", ekNet: 849, sortOrder: 102 },
  { id: "ipad_pro_m4_256", brand: "Apple", model: "iPad Pro M4 11\" 256GB WiFi+Cell", category: "tablet", ekNet: 1149, sortOrder: 103 },
  
  // === TABLETS - Samsung ===
  { id: "samsung_tab_s9_128", brand: "Samsung", model: "Galaxy Tab S9 128GB 5G", category: "tablet", ekNet: 849, sortOrder: 110 },
  { id: "samsung_tab_s9_plus_256", brand: "Samsung", model: "Galaxy Tab S9+ 256GB 5G", category: "tablet", ekNet: 999, sortOrder: 111 },
  { id: "samsung_tab_a9_plus_64", brand: "Samsung", model: "Galaxy Tab A9+ 64GB 5G", category: "tablet", ekNet: 329, sortOrder: 112 },
  
  // === SONSTIGES (manuelle EK-Eingabe Fallback) ===
  { id: "custom_device", brand: "Sonstiges", model: "Gerät (manuelle EK-Eingabe)", category: "custom", ekNet: 0, sortOrder: 999 },
];
