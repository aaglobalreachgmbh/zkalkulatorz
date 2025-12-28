// ============================================
// Hardware-Katalog - Dezember 2025
// Quelle: Preisliste2025FachhandelKW52_2025-12-23.pdf (einsamobile)
// Gültig ab: 23.12.2025
// ============================================
// SICHERHEITSHINWEIS: EK-Preise sind vertrauliche Händlerdaten
// und nur über authentifizierte Routen zugänglich.
// ============================================

import type { HardwareItem } from "../../../../margenkalkulator/engine/types";

export const hardwareCatalog: HardwareItem[] = [
  // === KEINE HARDWARE ===
  { id: "no_hardware", brand: "-", model: "KEINE HARDWARE", category: "none", ekNet: 0, sortOrder: 0 },
  
  // ============================================
  // APPLE iPhone 16 Serie
  // ============================================
  { id: "iphone_16_128", brand: "Apple", model: "iPhone 16 128GB", category: "smartphone", ekNet: 699.00, sortOrder: 10 },
  { id: "iphone_16_256", brand: "Apple", model: "iPhone 16 256GB", category: "smartphone", ekNet: 739.00, sortOrder: 11 },
  { id: "iphone_16_512", brand: "Apple", model: "iPhone 16 512GB", category: "smartphone", ekNet: 869.00, sortOrder: 12 },
  
  { id: "iphone_16_plus_128", brand: "Apple", model: "iPhone 16 Plus 128GB", category: "smartphone", ekNet: 799.00, sortOrder: 15 },
  { id: "iphone_16_plus_256", brand: "Apple", model: "iPhone 16 Plus 256GB", category: "smartphone", ekNet: 869.00, sortOrder: 16 },
  { id: "iphone_16_plus_512", brand: "Apple", model: "iPhone 16 Plus 512GB", category: "smartphone", ekNet: 999.00, sortOrder: 17 },
  
  { id: "iphone_16_pro_128", brand: "Apple", model: "iPhone 16 Pro 128GB", category: "smartphone", ekNet: 929.00, sortOrder: 20 },
  { id: "iphone_16_pro_256", brand: "Apple", model: "iPhone 16 Pro 256GB", category: "smartphone", ekNet: 999.00, sortOrder: 21 },
  { id: "iphone_16_pro_512", brand: "Apple", model: "iPhone 16 Pro 512GB", category: "smartphone", ekNet: 1129.00, sortOrder: 22 },
  { id: "iphone_16_pro_1tb", brand: "Apple", model: "iPhone 16 Pro 1TB", category: "smartphone", ekNet: 1319.00, sortOrder: 23 },
  
  { id: "iphone_16_pro_max_256", brand: "Apple", model: "iPhone 16 Pro Max 256GB", category: "smartphone", ekNet: 1055.00, sortOrder: 25 },
  { id: "iphone_16_pro_max_512", brand: "Apple", model: "iPhone 16 Pro Max 512GB", category: "smartphone", ekNet: 1149.00, sortOrder: 26 },
  { id: "iphone_16_pro_max_1tb", brand: "Apple", model: "iPhone 16 Pro Max 1TB", category: "smartphone", ekNet: 1379.00, sortOrder: 27 },
  
  // ============================================
  // APPLE iPhone 17 Serie (NEU)
  // ============================================
  { id: "iphone_17_256", brand: "Apple", model: "iPhone 17 256GB", category: "smartphone", ekNet: 812.00, sortOrder: 30 },
  { id: "iphone_17_512", brand: "Apple", model: "iPhone 17 512GB", category: "smartphone", ekNet: 942.00, sortOrder: 31 },
  
  { id: "iphone_17_air_256", brand: "Apple", model: "iPhone 17 Air 256GB", category: "smartphone", ekNet: 1029.00, sortOrder: 33 },
  { id: "iphone_17_air_512", brand: "Apple", model: "iPhone 17 Air 512GB", category: "smartphone", ekNet: 1159.00, sortOrder: 34 },
  
  { id: "iphone_17_pro_256", brand: "Apple", model: "iPhone 17 Pro 256GB", category: "smartphone", ekNet: 1012.00, sortOrder: 36 },
  { id: "iphone_17_pro_512", brand: "Apple", model: "iPhone 17 Pro 512GB", category: "smartphone", ekNet: 1142.00, sortOrder: 37 },
  { id: "iphone_17_pro_1tb", brand: "Apple", model: "iPhone 17 Pro 1TB", category: "smartphone", ekNet: 1332.00, sortOrder: 38 },
  
  { id: "iphone_17_pro_max_256", brand: "Apple", model: "iPhone 17 Pro Max 256GB", category: "smartphone", ekNet: 1142.00, sortOrder: 40 },
  { id: "iphone_17_pro_max_512", brand: "Apple", model: "iPhone 17 Pro Max 512GB", category: "smartphone", ekNet: 1272.00, sortOrder: 41 },
  { id: "iphone_17_pro_max_1tb", brand: "Apple", model: "iPhone 17 Pro Max 1TB", category: "smartphone", ekNet: 1462.00, sortOrder: 42 },
  
  // ============================================
  // APPLE iPhone SE / ältere Modelle
  // ============================================
  { id: "iphone_15_128", brand: "Apple", model: "iPhone 15 128GB", category: "smartphone", ekNet: 599.00, sortOrder: 50 },
  { id: "iphone_15_256", brand: "Apple", model: "iPhone 15 256GB", category: "smartphone", ekNet: 669.00, sortOrder: 51 },
  { id: "iphone_15_plus_128", brand: "Apple", model: "iPhone 15 Plus 128GB", category: "smartphone", ekNet: 679.00, sortOrder: 52 },
  { id: "iphone_se_4_128", brand: "Apple", model: "iPhone SE 4 128GB", category: "smartphone", ekNet: 469.00, sortOrder: 55 },
  { id: "iphone_se_4_256", brand: "Apple", model: "iPhone SE 4 256GB", category: "smartphone", ekNet: 539.00, sortOrder: 56 },
  
  // ============================================
  // SAMSUNG Galaxy S25 Serie
  // ============================================
  { id: "samsung_s25_128", brand: "Samsung", model: "Galaxy S25 128GB", category: "smartphone", ekNet: 649.00, sortOrder: 60 },
  { id: "samsung_s25_256", brand: "Samsung", model: "Galaxy S25 256GB", category: "smartphone", ekNet: 709.00, sortOrder: 61 },
  { id: "samsung_s25_512", brand: "Samsung", model: "Galaxy S25 512GB", category: "smartphone", ekNet: 799.00, sortOrder: 62 },
  
  { id: "samsung_s25_plus_256", brand: "Samsung", model: "Galaxy S25+ 256GB", category: "smartphone", ekNet: 859.00, sortOrder: 65 },
  { id: "samsung_s25_plus_512", brand: "Samsung", model: "Galaxy S25+ 512GB", category: "smartphone", ekNet: 949.00, sortOrder: 66 },
  
  { id: "samsung_s25_ultra_256", brand: "Samsung", model: "Galaxy S25 Ultra 256GB", category: "smartphone", ekNet: 1019.00, sortOrder: 70 },
  { id: "samsung_s25_ultra_512", brand: "Samsung", model: "Galaxy S25 Ultra 512GB", category: "smartphone", ekNet: 1109.00, sortOrder: 71 },
  { id: "samsung_s25_ultra_1tb", brand: "Samsung", model: "Galaxy S25 Ultra 1TB", category: "smartphone", ekNet: 1249.00, sortOrder: 72 },
  
  // ============================================
  // SAMSUNG Galaxy S24 Serie (weiterhin verfügbar)
  // ============================================
  { id: "samsung_s24_128", brand: "Samsung", model: "Galaxy S24 128GB", category: "smartphone", ekNet: 519.00, sortOrder: 75 },
  { id: "samsung_s24_256", brand: "Samsung", model: "Galaxy S24 256GB", category: "smartphone", ekNet: 569.00, sortOrder: 76 },
  { id: "samsung_s24_plus_256", brand: "Samsung", model: "Galaxy S24+ 256GB", category: "smartphone", ekNet: 679.00, sortOrder: 78 },
  { id: "samsung_s24_ultra_256", brand: "Samsung", model: "Galaxy S24 Ultra 256GB", category: "smartphone", ekNet: 869.00, sortOrder: 80 },
  { id: "samsung_s24_ultra_512", brand: "Samsung", model: "Galaxy S24 Ultra 512GB", category: "smartphone", ekNet: 949.00, sortOrder: 81 },
  
  // ============================================
  // SAMSUNG Galaxy A Serie
  // ============================================
  { id: "samsung_a56_128", brand: "Samsung", model: "Galaxy A56 128GB", category: "smartphone", ekNet: 369.00, sortOrder: 85 },
  { id: "samsung_a56_256", brand: "Samsung", model: "Galaxy A56 256GB", category: "smartphone", ekNet: 409.00, sortOrder: 86 },
  { id: "samsung_a55_128", brand: "Samsung", model: "Galaxy A55 128GB", category: "smartphone", ekNet: 299.00, sortOrder: 88 },
  { id: "samsung_a55_256", brand: "Samsung", model: "Galaxy A55 256GB", category: "smartphone", ekNet: 339.00, sortOrder: 89 },
  { id: "samsung_a36_128", brand: "Samsung", model: "Galaxy A36 128GB", category: "smartphone", ekNet: 269.00, sortOrder: 90 },
  { id: "samsung_a35_128", brand: "Samsung", model: "Galaxy A35 128GB", category: "smartphone", ekNet: 239.00, sortOrder: 91 },
  { id: "samsung_a16_128", brand: "Samsung", model: "Galaxy A16 128GB", category: "smartphone", ekNet: 159.00, sortOrder: 93 },
  
  // ============================================
  // SAMSUNG Galaxy Z Serie (Foldables)
  // ============================================
  { id: "samsung_z_fold6_256", brand: "Samsung", model: "Galaxy Z Fold6 256GB", category: "smartphone", ekNet: 1349.00, sortOrder: 100 },
  { id: "samsung_z_fold6_512", brand: "Samsung", model: "Galaxy Z Fold6 512GB", category: "smartphone", ekNet: 1449.00, sortOrder: 101 },
  { id: "samsung_z_flip6_256", brand: "Samsung", model: "Galaxy Z Flip6 256GB", category: "smartphone", ekNet: 799.00, sortOrder: 105 },
  { id: "samsung_z_flip6_512", brand: "Samsung", model: "Galaxy Z Flip6 512GB", category: "smartphone", ekNet: 879.00, sortOrder: 106 },
  
  // ============================================
  // GOOGLE Pixel 9 Serie
  // ============================================
  { id: "pixel_9_128", brand: "Google", model: "Pixel 9 128GB", category: "smartphone", ekNet: 549.00, sortOrder: 110 },
  { id: "pixel_9_256", brand: "Google", model: "Pixel 9 256GB", category: "smartphone", ekNet: 619.00, sortOrder: 111 },
  
  { id: "pixel_9_pro_128", brand: "Google", model: "Pixel 9 Pro 128GB", category: "smartphone", ekNet: 659.00, sortOrder: 115 },
  { id: "pixel_9_pro_256", brand: "Google", model: "Pixel 9 Pro 256GB", category: "smartphone", ekNet: 729.00, sortOrder: 116 },
  { id: "pixel_9_pro_512", brand: "Google", model: "Pixel 9 Pro 512GB", category: "smartphone", ekNet: 849.00, sortOrder: 117 },
  
  { id: "pixel_9_pro_xl_128", brand: "Google", model: "Pixel 9 Pro XL 128GB", category: "smartphone", ekNet: 729.00, sortOrder: 120 },
  { id: "pixel_9_pro_xl_256", brand: "Google", model: "Pixel 9 Pro XL 256GB", category: "smartphone", ekNet: 799.00, sortOrder: 121 },
  { id: "pixel_9_pro_xl_512", brand: "Google", model: "Pixel 9 Pro XL 512GB", category: "smartphone", ekNet: 919.00, sortOrder: 122 },
  
  // ============================================
  // GOOGLE Pixel 9a (NEU)
  // ============================================
  { id: "pixel_9a_128", brand: "Google", model: "Pixel 9a 128GB", category: "smartphone", ekNet: 399.00, sortOrder: 125 },
  { id: "pixel_9a_256", brand: "Google", model: "Pixel 9a 256GB", category: "smartphone", ekNet: 469.00, sortOrder: 126 },
  
  // ============================================
  // GOOGLE Pixel 8a / ältere
  // ============================================
  { id: "pixel_8a_128", brand: "Google", model: "Pixel 8a 128GB", category: "smartphone", ekNet: 369.00, sortOrder: 130 },
  { id: "pixel_8a_256", brand: "Google", model: "Pixel 8a 256GB", category: "smartphone", ekNet: 429.00, sortOrder: 131 },
  
  // ============================================
  // XIAOMI
  // ============================================
  { id: "xiaomi_15_256", brand: "Xiaomi", model: "Xiaomi 15 256GB", category: "smartphone", ekNet: 679.00, sortOrder: 140 },
  { id: "xiaomi_15_512", brand: "Xiaomi", model: "Xiaomi 15 512GB", category: "smartphone", ekNet: 749.00, sortOrder: 141 },
  { id: "xiaomi_15_pro_512", brand: "Xiaomi", model: "Xiaomi 15 Pro 512GB", category: "smartphone", ekNet: 999.00, sortOrder: 143 },
  { id: "xiaomi_14_256", brand: "Xiaomi", model: "Xiaomi 14 256GB", category: "smartphone", ekNet: 479.00, sortOrder: 145 },
  { id: "xiaomi_14_ultra_512", brand: "Xiaomi", model: "Xiaomi 14 Ultra 512GB", category: "smartphone", ekNet: 879.00, sortOrder: 147 },
  { id: "xiaomi_redmi_note_14_pro_256", brand: "Xiaomi", model: "Redmi Note 14 Pro 256GB", category: "smartphone", ekNet: 269.00, sortOrder: 150 },
  { id: "xiaomi_redmi_note_14_pro_plus_256", brand: "Xiaomi", model: "Redmi Note 14 Pro+ 256GB", category: "smartphone", ekNet: 349.00, sortOrder: 151 },
  
  // ============================================
  // MOTOROLA
  // ============================================
  { id: "motorola_edge_50_pro_256", brand: "Motorola", model: "Edge 50 Pro 256GB", category: "smartphone", ekNet: 429.00, sortOrder: 160 },
  { id: "motorola_razr_50_ultra_256", brand: "Motorola", model: "Razr 50 Ultra 256GB", category: "smartphone", ekNet: 789.00, sortOrder: 163 },
  { id: "motorola_razr_50_256", brand: "Motorola", model: "Razr 50 256GB", category: "smartphone", ekNet: 529.00, sortOrder: 165 },
  { id: "motorola_moto_g85_256", brand: "Motorola", model: "Moto G85 256GB", category: "smartphone", ekNet: 229.00, sortOrder: 168 },
  
  // ============================================
  // TABLETS - Apple iPad
  // ============================================
  { id: "ipad_10_64_cell", brand: "Apple", model: "iPad 10.Gen 64GB WiFi+Cell", category: "tablet", ekNet: 499.00, sortOrder: 200 },
  { id: "ipad_10_256_cell", brand: "Apple", model: "iPad 10.Gen 256GB WiFi+Cell", category: "tablet", ekNet: 619.00, sortOrder: 201 },
  { id: "ipad_air_m3_128_cell", brand: "Apple", model: "iPad Air M3 11\" 128GB WiFi+Cell", category: "tablet", ekNet: 769.00, sortOrder: 205 },
  { id: "ipad_air_m3_256_cell", brand: "Apple", model: "iPad Air M3 11\" 256GB WiFi+Cell", category: "tablet", ekNet: 869.00, sortOrder: 206 },
  { id: "ipad_pro_m4_256_11_cell", brand: "Apple", model: "iPad Pro M4 11\" 256GB WiFi+Cell", category: "tablet", ekNet: 1069.00, sortOrder: 210 },
  { id: "ipad_pro_m4_256_13_cell", brand: "Apple", model: "iPad Pro M4 13\" 256GB WiFi+Cell", category: "tablet", ekNet: 1419.00, sortOrder: 212 },
  
  // ============================================
  // TABLETS - Samsung
  // ============================================
  { id: "samsung_tab_s10_plus_256_5g", brand: "Samsung", model: "Galaxy Tab S10+ 256GB 5G", category: "tablet", ekNet: 899.00, sortOrder: 220 },
  { id: "samsung_tab_s10_ultra_256_5g", brand: "Samsung", model: "Galaxy Tab S10 Ultra 256GB 5G", category: "tablet", ekNet: 1099.00, sortOrder: 222 },
  { id: "samsung_tab_s9_128_5g", brand: "Samsung", model: "Galaxy Tab S9 128GB 5G", category: "tablet", ekNet: 699.00, sortOrder: 225 },
  { id: "samsung_tab_a9_plus_64_5g", brand: "Samsung", model: "Galaxy Tab A9+ 64GB 5G", category: "tablet", ekNet: 269.00, sortOrder: 230 },
  
  // ============================================
  // WEARABLES - Apple Watch
  // ============================================
  { id: "apple_watch_se_44_cell", brand: "Apple", model: "Watch SE 2 44mm GPS+Cell", category: "accessory", ekNet: 289.00, sortOrder: 250 },
  { id: "apple_watch_s10_42_cell", brand: "Apple", model: "Watch Series 10 42mm GPS+Cell", category: "accessory", ekNet: 439.00, sortOrder: 252 },
  { id: "apple_watch_s10_46_cell", brand: "Apple", model: "Watch Series 10 46mm GPS+Cell", category: "accessory", ekNet: 469.00, sortOrder: 253 },
  { id: "apple_watch_ultra_2_cell", brand: "Apple", model: "Watch Ultra 2 GPS+Cell", category: "accessory", ekNet: 719.00, sortOrder: 255 },
  
  // ============================================
  // WEARABLES - Samsung
  // ============================================
  { id: "samsung_watch_7_44_lte", brand: "Samsung", model: "Galaxy Watch7 44mm LTE", category: "accessory", ekNet: 309.00, sortOrder: 260 },
  { id: "samsung_watch_ultra_47_lte", brand: "Samsung", model: "Galaxy Watch Ultra 47mm LTE", category: "accessory", ekNet: 529.00, sortOrder: 262 },
  
  // ============================================
  // SONSTIGES
  // ============================================
  { id: "custom_device", brand: "Sonstiges", model: "Gerät (manuelle EK-Eingabe)", category: "custom", ekNet: 0, sortOrder: 999 },
];
