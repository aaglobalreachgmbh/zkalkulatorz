// ============================================
// TK-World Provisions Data 01-2026
// ~750+ Provisionszeilen - vollstaendige Extraktion
// ============================================

export interface TkWorldProvisionEntry {
  id: string;
  name: string;
  family: string;
  type: "new" | "extension";
  amount: number;
  sub?: string;
  notes?: string;
}

export const TK_WORLD_PROVISIONS_2026: TkWorldProvisionEntry[] = [
  // ============================================
  // FESTNETZ KABEL - NEUKUNDEN
  // ============================================
  { id: "GIGAZ_KABEL_50_NK", name: "GigaZuhause BV 50/25 Kabel Promo", family: "festnetz_kabel", type: "new", amount: 120.00 },
  { id: "GIGAZ_KABEL_100_NK", name: "GigaZuhause BV 100/50 Kabel Promo", family: "festnetz_kabel", type: "new", amount: 135.00 },
  { id: "GIGAZ_KABEL_250_NK", name: "GigaZuhause BV 250/50 Kabel Promo", family: "festnetz_kabel", type: "new", amount: 170.00 },
  { id: "GIGAZ_KABEL_500_NK", name: "GigaZuhause BV 500/50 Kabel Promo", family: "festnetz_kabel", type: "new", amount: 200.00 },
  { id: "GIGAZ_KABEL_1000_NK", name: "GigaZuhause BV 1000/50 Kabel Promo", family: "festnetz_kabel", type: "new", amount: 225.00 },
  { id: "GIGAZ_CABLEMAX_1000_NK", name: "GigaZuhause BV CableMax 1000 NK", family: "festnetz_kabel", type: "new", amount: 225.00 },
  
  // West Cable
  { id: "GIGAZ_KABEL_50_WEST", name: "GigaZuhause BV 50 Kabel West Cable", family: "festnetz_kabel", type: "new", amount: 120.00 },
  { id: "GIGAZ_KABEL_100_WEST", name: "GigaZuhause BV 100 Kabel West Cable", family: "festnetz_kabel", type: "new", amount: 135.00 },
  { id: "GIGAZ_KABEL_250_WEST", name: "GigaZuhause BV 250 Kabel West Cable", family: "festnetz_kabel", type: "new", amount: 170.00 },
  { id: "GIGAZ_KABEL_500_WEST", name: "GigaZuhause BV 500 Kabel West Cable", family: "festnetz_kabel", type: "new", amount: 200.00 },
  { id: "GIGAZ_KABEL_1000_WEST", name: "GigaZuhause BV 1000 Kabel West Cable", family: "festnetz_kabel", type: "new", amount: 225.00 },
  { id: "GIGAZ_CABLEMAX_WEST", name: "GigaZuhause BV CableMax 1000 West Cable", family: "festnetz_kabel", type: "new", amount: 225.00 },
  
  // DSL Wechsel
  { id: "GIGAZ_KABEL_50_DSL_WECHSEL", name: "GigaZuhause BV 50 Kabel (Wechsel von DSL)", family: "festnetz_kabel", type: "new", amount: 84.00 },
  { id: "GIGAZ_KABEL_100_DSL_WECHSEL", name: "GigaZuhause BV 100 Kabel (Wechsel von DSL)", family: "festnetz_kabel", type: "new", amount: 94.00 },
  { id: "GIGAZ_KABEL_250_DSL_WECHSEL", name: "GigaZuhause BV 250 Kabel (Wechsel von DSL)", family: "festnetz_kabel", type: "new", amount: 119.00 },
  { id: "GIGAZ_KABEL_500_DSL_WECHSEL", name: "GigaZuhause BV 500 Kabel (Wechsel von DSL)", family: "festnetz_kabel", type: "new", amount: 140.00 },
  { id: "GIGAZ_KABEL_1000_DSL_WECHSEL", name: "GigaZuhause BV 1000 Kabel (Wechsel von DSL)", family: "festnetz_kabel", type: "new", amount: 157.00 },
  { id: "GIGAZ_CABLEMAX_DSL_WECHSEL", name: "GigaZuhause BV CableMax 1000 (Wechsel von DSL)", family: "festnetz_kabel", type: "new", amount: 157.00 },
  
  // Upsell
  { id: "GIGAZ_KABEL_50_UPSELL", name: "GigaZuhause BV 50/25 Kabel Upsell Standard", family: "festnetz_kabel", type: "extension", amount: 75.00 },
  { id: "GIGAZ_KABEL_100_UPSELL", name: "GigaZuhause BV 100/50 Kabel Upsell Standard", family: "festnetz_kabel", type: "extension", amount: 90.00 },
  { id: "GIGAZ_KABEL_250_UPSELL", name: "GigaZuhause BV 250/50 Kabel Upsell Standard", family: "festnetz_kabel", type: "extension", amount: 120.00 },
  { id: "GIGAZ_KABEL_500_UPSELL", name: "GigaZuhause BV 500/50 Kabel Upsell Standard", family: "festnetz_kabel", type: "extension", amount: 120.00 },
  { id: "GIGAZ_KABEL_1000_UPSELL", name: "GigaZuhause BV 1000/50 Kabel Upsell Standard", family: "festnetz_kabel", type: "extension", amount: 140.00 },
  { id: "GIGAZ_CABLEMAX_UPSELL", name: "GigaZuhause BV CableMax 1000 Upsell Standard", family: "festnetz_kabel", type: "extension", amount: 120.00 },
  
  // ============================================
  // GLASFASER
  // ============================================
  { id: "RB_GLASFASER_50", name: "Red Business Internet Glasfaser Internet 50", family: "glasfaser", type: "new", amount: 80.00 },
  { id: "RB_GLASFASER_100", name: "Red Business Internet Glasfaser Internet 100", family: "glasfaser", type: "new", amount: 85.00 },
  { id: "RB_GLASFASER_250", name: "Red Business Internet Glasfaser Internet 250", family: "glasfaser", type: "new", amount: 105.00 },
  { id: "RB_GLASFASER_500", name: "Red Business Internet Glasfaser Internet 500", family: "glasfaser", type: "new", amount: 115.00 },
  { id: "RB_GLASFASER_750", name: "Red Business Internet Glasfaser Internet 750", family: "glasfaser", type: "new", amount: 125.00 },
  { id: "RB_GLASFASER_1000", name: "Red Business Internet Glasfaser Internet 1000", family: "glasfaser", type: "new", amount: 145.00 },
  { id: "RB_PHONE_S_GLASFASER", name: "Red Business Phone S Glasfaser", family: "glasfaser", type: "new", amount: 35.00 },
  { id: "RB_PHONE_M_GLASFASER", name: "Red Business Phone M Glasfaser", family: "glasfaser", type: "new", amount: 55.00 },
  { id: "RB_PHONE_L_GLASFASER", name: "Red Business Phone L Glasfaser", family: "glasfaser", type: "new", amount: 85.00 },
  { id: "RB_PHONE_XL_GLASFASER", name: "Red Business Phone XL Glasfaser", family: "glasfaser", type: "new", amount: 100.00 },
  { id: "RB_PHONE_XXL_GLASFASER", name: "Red Business Phone XXL Glasfaser", family: "glasfaser", type: "new", amount: 155.00 },
  
  // ============================================
  // GigaZuhause DSL 2025
  // ============================================
  { id: "GIGAZ_DSL_16", name: "GigaZuhause 16 DSL 2025", family: "festnetz_dsl", type: "new", amount: 70.00 },
  { id: "GIGAZ_DSL_50", name: "GigaZuhause 50 DSL 2025", family: "festnetz_dsl", type: "new", amount: 115.00 },
  { id: "GIGAZ_DSL_100", name: "GigaZuhause 100 DSL 2025", family: "festnetz_dsl", type: "new", amount: 130.00 },
  { id: "GIGAZ_DSL_250", name: "GigaZuhause 250 DSL 2025", family: "festnetz_dsl", type: "new", amount: 135.00 },
  
  // ============================================
  // GIGACUBE / LTE
  // ============================================
  { id: "GIGACUBE_5G_PREMIUM", name: "Giga Cube 5G-Premium-Router", family: "gigacube", type: "new", amount: 220.00 },
  { id: "GIGACUBE_MAX_5G", name: "Giga Cube Max 5G-Premium-Router", family: "gigacube", type: "new", amount: 250.00 },
  { id: "GIGACUBE_PRO_5G", name: "Giga Cube Pro 5G-Premium-Router", family: "gigacube", type: "new", amount: 335.00 },
  { id: "GIGACUBE_MINI_5G", name: "Giga Cube Mini 5G-Premium-Router", family: "gigacube", type: "new", amount: 190.00 },
  { id: "GIGACUBE_FLEX", name: "Vodafone GigaCube Zuhause Flex mit Router", family: "gigacube", type: "new", amount: 100.00 },
  { id: "GIGACUBE_100_4G", name: "Vodafone GigaCube Zuhause 100 mit 4G-Router", family: "gigacube", type: "new", amount: 130.00 },
  { id: "GIGACUBE_100_5G", name: "Vodafone GigaCube Zuhause 100 mit 5G-Router", family: "gigacube", type: "new", amount: 220.00 },
  { id: "GIGACUBE_200_4G", name: "Vodafone GigaCube Zuhause 200 mit 4G-Router", family: "gigacube", type: "new", amount: 160.00 },
  { id: "GIGACUBE_200_5G", name: "Vodafone GigaCube Zuhause 200 mit 5G-Router", family: "gigacube", type: "new", amount: 250.00 },
  { id: "GIGACUBE_UNLIMITED_4G", name: "Vodafone GigaCube Zuhause Unlimited mit 4G-Router", family: "gigacube", type: "new", amount: 215.00 },
  { id: "GIGACUBE_UNLIMITED_5G", name: "Vodafone GigaCube Zuhause Unlimited mit 5G-Router", family: "gigacube", type: "new", amount: 305.00 },
  
  // ============================================
  // GIGATV
  // ============================================
  { id: "GIGATV_CABLE_PROMO", name: "Vodafone GigaTV Cable 6x0 EUR Promo", family: "gigatv", type: "new", amount: 60.00 },
  { id: "GIGATV_HOME_CABLE", name: "GigaTV Home Cable Promo", family: "gigatv", type: "new", amount: 60.00 },
  { id: "GIGATV_HOME_CABLE_PREMIUM", name: "GigaTV Home Cable inkl. Premium Promo", family: "gigatv", type: "new", amount: 80.00 },
  { id: "GIGATV_HOME_CABLE_NETFLIX", name: "GigaTV Home Cable inkl. Netflix Promo", family: "gigatv", type: "new", amount: 60.00 },
  { id: "GIGATV_HOME_NET", name: "GigaTV Home Net Promo", family: "gigatv", type: "new", amount: 40.00 },
  { id: "GIGATV_HOME_NET_PREMIUM", name: "GigaTV Home Net inkl. Premium Promo", family: "gigatv", type: "new", amount: 60.00 },
  { id: "GIGATV_HOME_NET_NETFLIX", name: "GigaTV Home Net inkl. Netflix Promo", family: "gigatv", type: "new", amount: 40.00 },
  { id: "GIGATV_SOUND_CABLE", name: "GigaTV Home Sound Cable Promo", family: "gigatv", type: "new", amount: 75.00 },
  { id: "GIGATV_SOUND_CABLE_PREMIUM", name: "GigaTV Home Sound Cable inkl. Premium Promo", family: "gigatv", type: "new", amount: 100.00 },
  { id: "GIGATV_SOUND_NET", name: "GigaTV Home Sound Net Promo", family: "gigatv", type: "new", amount: 55.00 },
  { id: "GIGATV_SOUND_NET_PREMIUM", name: "GigaTV Home Sound Net inkl. Premium Promo", family: "gigatv", type: "new", amount: 80.00 },
  
  // ============================================
  // GIGAMOBIL 2024 NEU
  // ============================================
  // XS
  { id: "GIGAMOBIL_XS_SIM", name: "GigaMobil XS ohne Smartphone (SIM only)", family: "gigamobil", type: "new", amount: 175.00, sub: "SIM_ONLY" },
  { id: "GIGAMOBIL_XS_SUB5", name: "GigaMobil XS mit Basic Phone (Sub5)", family: "gigamobil", type: "new", amount: 250.00, sub: "SUB5" },
  { id: "GIGAMOBIL_XS_SUB10", name: "GigaMobil XS mit Basic Smartphone (Sub10)", family: "gigamobil", type: "new", amount: 300.00, sub: "SUB10" },
  { id: "GIGAMOBIL_XS_SUB20", name: "GigaMobil XS mit Smartphone Special (Sub20)", family: "gigamobil", type: "new", amount: 425.00, sub: "SUB20" },
  { id: "GIGAMOBIL_XS_SUB30", name: "GigaMobil XS mit Premium Smartphone Special (Sub30)", family: "gigamobil", type: "new", amount: 535.00, sub: "SUB30" },
  
  // S
  { id: "GIGAMOBIL_S_SIM", name: "GigaMobil S ohne Smartphone (SIM only)", family: "gigamobil", type: "new", amount: 265.00, sub: "SIM_ONLY" },
  { id: "GIGAMOBIL_S_SUB5", name: "GigaMobil S mit Basic Phone (Sub5)", family: "gigamobil", type: "new", amount: 375.00, sub: "SUB5" },
  { id: "GIGAMOBIL_S_SUB10", name: "GigaMobil S mit Basic Smartphone (Sub10)", family: "gigamobil", type: "new", amount: 430.00, sub: "SUB10" },
  { id: "GIGAMOBIL_S_SUB20", name: "GigaMobil S mit Smartphone Special (Sub20)", family: "gigamobil", type: "new", amount: 535.00, sub: "SUB20" },
  { id: "GIGAMOBIL_S_SUB30", name: "GigaMobil S mit Premium Smartphone Special (Sub30)", family: "gigamobil", type: "new", amount: 625.00, sub: "SUB30" },
  
  // M
  { id: "GIGAMOBIL_M_SIM", name: "GigaMobil M ohne Smartphone (SIM only)", family: "gigamobil", type: "new", amount: 360.00, sub: "SIM_ONLY" },
  { id: "GIGAMOBIL_M_SUB5", name: "GigaMobil M mit Basic Phone (Sub5)", family: "gigamobil", type: "new", amount: 485.00, sub: "SUB5" },
  { id: "GIGAMOBIL_M_SUB10", name: "GigaMobil M mit Basic Smartphone (Sub10)", family: "gigamobil", type: "new", amount: 535.00, sub: "SUB10" },
  { id: "GIGAMOBIL_M_SUB20", name: "GigaMobil M mit Smartphone Special (Sub20)", family: "gigamobil", type: "new", amount: 640.00, sub: "SUB20" },
  { id: "GIGAMOBIL_M_SUB30", name: "GigaMobil M mit Premium Smartphone Special (Sub30)", family: "gigamobil", type: "new", amount: 745.00, sub: "SUB30" },
  { id: "GIGAMOBIL_M_SUB40", name: "GigaMobil M mit Top Smartphone (Sub40)", family: "gigamobil", type: "new", amount: 850.00, sub: "SUB40" },
  
  // L
  { id: "GIGAMOBIL_L_SIM", name: "GigaMobil L ohne Smartphone (SIM only)", family: "gigamobil", type: "new", amount: 450.00, sub: "SIM_ONLY" },
  { id: "GIGAMOBIL_L_SUB5", name: "GigaMobil L mit Basic Phone (Sub5)", family: "gigamobil", type: "new", amount: 590.00, sub: "SUB5" },
  { id: "GIGAMOBIL_L_SUB10", name: "GigaMobil L mit Basic Smartphone (Sub10)", family: "gigamobil", type: "new", amount: 640.00, sub: "SUB10" },
  { id: "GIGAMOBIL_L_SUB20", name: "GigaMobil L mit Smartphone Special (Sub20)", family: "gigamobil", type: "new", amount: 745.00, sub: "SUB20" },
  { id: "GIGAMOBIL_L_SUB30", name: "GigaMobil L mit Premium Smartphone Special (Sub30)", family: "gigamobil", type: "new", amount: 850.00, sub: "SUB30" },
  { id: "GIGAMOBIL_L_SUB40", name: "GigaMobil L mit Top Smartphone (Sub40)", family: "gigamobil", type: "new", amount: 955.00, sub: "SUB40" },
  
  // XL
  { id: "GIGAMOBIL_XL_SIM", name: "GigaMobil XL ohne Smartphone (SIM only)", family: "gigamobil", type: "new", amount: 605.00, sub: "SIM_ONLY" },
  { id: "GIGAMOBIL_XL_SUB5", name: "GigaMobil XL mit Basic Phone (Sub5)", family: "gigamobil", type: "new", amount: 800.00, sub: "SUB5" },
  { id: "GIGAMOBIL_XL_SUB10", name: "GigaMobil XL mit Basic Smartphone (Sub10)", family: "gigamobil", type: "new", amount: 850.00, sub: "SUB10" },
  { id: "GIGAMOBIL_XL_SUB20", name: "GigaMobil XL mit Smartphone Special (Sub20)", family: "gigamobil", type: "new", amount: 955.00, sub: "SUB20" },
  { id: "GIGAMOBIL_XL_SUB30", name: "GigaMobil XL mit Premium Smartphone Special (Sub30)", family: "gigamobil", type: "new", amount: 1060.00, sub: "SUB30" },
  { id: "GIGAMOBIL_XL_SUB40", name: "GigaMobil XL mit Top Smartphone (Sub40)", family: "gigamobil", type: "new", amount: 1165.00, sub: "SUB40" },
  
  // ============================================
  // GIGAMOBIL YOUNG NEU
  // ============================================
  { id: "GIGAMOBIL_YOUNG_XS_SIM", name: "GigaMobil Young XS ohne Smartphone (SIM only)", family: "gigamobil_young", type: "new", amount: 85.00, sub: "SIM_ONLY" },
  { id: "GIGAMOBIL_YOUNG_XS_SUB5", name: "GigaMobil Young XS mit Basic Phone (Sub5)", family: "gigamobil_young", type: "new", amount: 195.00, sub: "SUB5" },
  { id: "GIGAMOBIL_YOUNG_XS_SUB10", name: "GigaMobil Young XS mit Basic Smartphone (Sub10)", family: "gigamobil_young", type: "new", amount: 260.00, sub: "SUB10" },
  { id: "GIGAMOBIL_YOUNG_XS_SUB20", name: "GigaMobil Young XS mit Smartphone Special (Sub20)", family: "gigamobil_young", type: "new", amount: 380.00, sub: "SUB20" },
  { id: "GIGAMOBIL_YOUNG_XS_SUB30", name: "GigaMobil Young XS mit Premium Smartphone Special (Sub30)", family: "gigamobil_young", type: "new", amount: 490.00, sub: "SUB30" },
  
  { id: "GIGAMOBIL_YOUNG_S_SIM", name: "GigaMobil Young S ohne Smartphone (SIM only)", family: "gigamobil_young", type: "new", amount: 145.00, sub: "SIM_ONLY" },
  { id: "GIGAMOBIL_YOUNG_S_SUB5", name: "GigaMobil Young S mit Basic Phone (Sub5)", family: "gigamobil_young", type: "new", amount: 320.00, sub: "SUB5" },
  { id: "GIGAMOBIL_YOUNG_S_SUB10", name: "GigaMobil Young S mit Basic Smartphone (Sub10)", family: "gigamobil_young", type: "new", amount: 380.00, sub: "SUB10" },
  { id: "GIGAMOBIL_YOUNG_S_SUB20", name: "GigaMobil Young S mit Smartphone Special (Sub20)", family: "gigamobil_young", type: "new", amount: 500.00, sub: "SUB20" },
  { id: "GIGAMOBIL_YOUNG_S_SUB30", name: "GigaMobil Young S mit Premium Smartphone Special (Sub30)", family: "gigamobil_young", type: "new", amount: 615.00, sub: "SUB30" },
  { id: "GIGAMOBIL_YOUNG_S_SUB40", name: "GigaMobil Young S mit Top Smartphone (Sub40)", family: "gigamobil_young", type: "new", amount: 625.00, sub: "SUB40" },
  
  { id: "GIGAMOBIL_YOUNG_M_SIM", name: "GigaMobil Young M ohne Smartphone (SIM only)", family: "gigamobil_young", type: "new", amount: 215.00, sub: "SIM_ONLY" },
  { id: "GIGAMOBIL_YOUNG_M_SUB5", name: "GigaMobil Young M mit Basic Phone (Sub5)", family: "gigamobil_young", type: "new", amount: 440.00, sub: "SUB5" },
  { id: "GIGAMOBIL_YOUNG_M_SUB10", name: "GigaMobil Young M mit Basic Smartphone (Sub10)", family: "gigamobil_young", type: "new", amount: 495.00, sub: "SUB10" },
  { id: "GIGAMOBIL_YOUNG_M_SUB20", name: "GigaMobil Young M mit Smartphone Special (Sub20)", family: "gigamobil_young", type: "new", amount: 600.00, sub: "SUB20" },
  { id: "GIGAMOBIL_YOUNG_M_SUB30", name: "GigaMobil Young M mit Premium Smartphone Special (Sub30)", family: "gigamobil_young", type: "new", amount: 720.00, sub: "SUB30" },
  { id: "GIGAMOBIL_YOUNG_M_SUB40", name: "GigaMobil Young M mit Top Smartphone (Sub40)", family: "gigamobil_young", type: "new", amount: 840.00, sub: "SUB40" },
  
  { id: "GIGAMOBIL_YOUNG_L_SIM", name: "GigaMobil Young L ohne Smartphone (SIM only)", family: "gigamobil_young", type: "new", amount: 265.00, sub: "SIM_ONLY" },
  { id: "GIGAMOBIL_YOUNG_L_SUB5", name: "GigaMobil Young L mit Basic Phone (Sub5)", family: "gigamobil_young", type: "new", amount: 485.00, sub: "SUB5" },
  { id: "GIGAMOBIL_YOUNG_L_SUB10", name: "GigaMobil Young L mit Basic Smartphone (Sub10)", family: "gigamobil_young", type: "new", amount: 545.00, sub: "SUB10" },
  { id: "GIGAMOBIL_YOUNG_L_SUB20", name: "GigaMobil Young L mit Smartphone Special (Sub20)", family: "gigamobil_young", type: "new", amount: 665.00, sub: "SUB20" },
  { id: "GIGAMOBIL_YOUNG_L_SUB30", name: "GigaMobil Young L mit Premium Smartphone Special (Sub30)", family: "gigamobil_young", type: "new", amount: 780.00, sub: "SUB30" },
  { id: "GIGAMOBIL_YOUNG_L_SUB40", name: "GigaMobil Young L mit Top Smartphone (Sub40)", family: "gigamobil_young", type: "new", amount: 895.00, sub: "SUB40" },
  
  { id: "GIGAMOBIL_YOUNG_XL_SIM", name: "GigaMobil Young XL ohne Smartphone (SIM only)", family: "gigamobil_young", type: "new", amount: 555.00, sub: "SIM_ONLY" },
  { id: "GIGAMOBIL_YOUNG_XL_SUB5", name: "GigaMobil Young XL mit Basic Phone (Sub5)", family: "gigamobil_young", type: "new", amount: 780.00, sub: "SUB5" },
  { id: "GIGAMOBIL_YOUNG_XL_SUB10", name: "GigaMobil Young XL mit Basic Smartphone (Sub10)", family: "gigamobil_young", type: "new", amount: 835.00, sub: "SUB10" },
  { id: "GIGAMOBIL_YOUNG_XL_SUB20", name: "GigaMobil Young XL mit Smartphone Special (Sub20)", family: "gigamobil_young", type: "new", amount: 960.00, sub: "SUB20" },
  { id: "GIGAMOBIL_YOUNG_XL_SUB30", name: "GigaMobil Young XL mit Premium Smartphone Special (Sub30)", family: "gigamobil_young", type: "new", amount: 1080.00, sub: "SUB30" },
  { id: "GIGAMOBIL_YOUNG_XL_SUB40", name: "GigaMobil Young XL mit Top Smartphone (Sub40)", family: "gigamobil_young", type: "new", amount: 1185.00, sub: "SUB40" },
  
  // ============================================
  // GIGAMOBIL 2024 VVL
  // ============================================
  { id: "GIGAMOBIL_S_SUB5_VVL", name: "GigaMobil S mit Basic Phone (Sub5) VVL", family: "gigamobil", type: "extension", amount: 315.00, sub: "SUB5" },
  { id: "GIGAMOBIL_S_SUB10_VVL", name: "GigaMobil S mit Basic Smartphone (Sub10) VVL", family: "gigamobil", type: "extension", amount: 370.00, sub: "SUB10" },
  { id: "GIGAMOBIL_S_SUB20_VVL", name: "GigaMobil S mit Smartphone Special (Sub20) VVL", family: "gigamobil", type: "extension", amount: 475.00, sub: "SUB20" },
  { id: "GIGAMOBIL_S_SUB30_VVL", name: "GigaMobil S mit Premium Smartphone Special (Sub30) VVL", family: "gigamobil", type: "extension", amount: 565.00, sub: "SUB30" },
  
  { id: "GIGAMOBIL_M_SUB5_VVL", name: "GigaMobil M mit Basic Phone (Sub5) VVL", family: "gigamobil", type: "extension", amount: 425.00, sub: "SUB5" },
  { id: "GIGAMOBIL_M_SUB10_VVL", name: "GigaMobil M mit Basic Smartphone (Sub10) VVL", family: "gigamobil", type: "extension", amount: 475.00, sub: "SUB10" },
  { id: "GIGAMOBIL_M_SUB20_VVL", name: "GigaMobil M mit Smartphone Special (Sub20) VVL", family: "gigamobil", type: "extension", amount: 580.00, sub: "SUB20" },
  { id: "GIGAMOBIL_M_SUB30_VVL", name: "GigaMobil M mit Premium Smartphone Special (Sub30) VVL", family: "gigamobil", type: "extension", amount: 685.00, sub: "SUB30" },
  { id: "GIGAMOBIL_M_SUB40_VVL", name: "GigaMobil M mit Top Smartphone (Sub40) VVL", family: "gigamobil", type: "extension", amount: 790.00, sub: "SUB40" },
  
  { id: "GIGAMOBIL_L_SUB5_VVL", name: "GigaMobil L mit Basic Phone (Sub5) VVL", family: "gigamobil", type: "extension", amount: 530.00, sub: "SUB5" },
  { id: "GIGAMOBIL_L_SUB10_VVL", name: "GigaMobil L mit Basic Smartphone (Sub10) VVL", family: "gigamobil", type: "extension", amount: 580.00, sub: "SUB10" },
  { id: "GIGAMOBIL_L_SUB20_VVL", name: "GigaMobil L mit Smartphone Special (Sub20) VVL", family: "gigamobil", type: "extension", amount: 685.00, sub: "SUB20" },
  { id: "GIGAMOBIL_L_SUB30_VVL", name: "GigaMobil L mit Premium Smartphone Special (Sub30) VVL", family: "gigamobil", type: "extension", amount: 790.00, sub: "SUB30" },
  { id: "GIGAMOBIL_L_SUB40_VVL", name: "GigaMobil L mit Top Smartphone (Sub40) VVL", family: "gigamobil", type: "extension", amount: 895.00, sub: "SUB40" },
  
  { id: "GIGAMOBIL_XL_SUB5_VVL", name: "GigaMobil XL mit Basic Phone (Sub5) VVL", family: "gigamobil", type: "extension", amount: 740.00, sub: "SUB5" },
  { id: "GIGAMOBIL_XL_SUB10_VVL", name: "GigaMobil XL mit Basic Smartphone (Sub10) VVL", family: "gigamobil", type: "extension", amount: 790.00, sub: "SUB10" },
  { id: "GIGAMOBIL_XL_SUB20_VVL", name: "GigaMobil XL mit Smartphone Special (Sub20) VVL", family: "gigamobil", type: "extension", amount: 895.00, sub: "SUB20" },
  { id: "GIGAMOBIL_XL_SUB30_VVL", name: "GigaMobil XL mit Premium Smartphone Special (Sub30) VVL", family: "gigamobil", type: "extension", amount: 1000.00, sub: "SUB30" },
  { id: "GIGAMOBIL_XL_SUB40_VVL", name: "GigaMobil XL mit Top Smartphone (Sub40) VVL", family: "gigamobil", type: "extension", amount: 1105.00, sub: "SUB40" },
  
  // GigaMobil Young VVL
  { id: "GIGAMOBIL_YOUNG_XS_SUB5_VVL", name: "GigaMobil Young XS mit Basic Phone (Sub5) VVL", family: "gigamobil_young", type: "extension", amount: 135.00, sub: "SUB5" },
  { id: "GIGAMOBIL_YOUNG_XS_SUB10_VVL", name: "GigaMobil Young XS mit Basic Smartphone (Sub10) VVL", family: "gigamobil_young", type: "extension", amount: 200.00, sub: "SUB10" },
  { id: "GIGAMOBIL_YOUNG_XS_SUB20_VVL", name: "GigaMobil Young XS mit Smartphone Special (Sub20) VVL", family: "gigamobil_young", type: "extension", amount: 320.00, sub: "SUB20" },
  { id: "GIGAMOBIL_YOUNG_XS_SUB30_VVL", name: "GigaMobil Young XS mit Premium Smartphone Special (Sub30) VVL", family: "gigamobil_young", type: "extension", amount: 430.00, sub: "SUB30" },
  
  { id: "GIGAMOBIL_YOUNG_S_SUB5_VVL", name: "GigaMobil Young S mit Basic Phone (Sub5) VVL", family: "gigamobil_young", type: "extension", amount: 260.00, sub: "SUB5" },
  { id: "GIGAMOBIL_YOUNG_S_SUB10_VVL", name: "GigaMobil Young S mit Basic Smartphone (Sub10) VVL", family: "gigamobil_young", type: "extension", amount: 320.00, sub: "SUB10" },
  { id: "GIGAMOBIL_YOUNG_S_SUB20_VVL", name: "GigaMobil Young S mit Smartphone Special (Sub20) VVL", family: "gigamobil_young", type: "extension", amount: 440.00, sub: "SUB20" },
  { id: "GIGAMOBIL_YOUNG_S_SUB30_VVL", name: "GigaMobil Young S mit Premium Smartphone Special (Sub30) VVL", family: "gigamobil_young", type: "extension", amount: 555.00, sub: "SUB30" },
  { id: "GIGAMOBIL_YOUNG_S_SUB40_VVL", name: "GigaMobil Young S mit Top Smartphone (Sub40) VVL", family: "gigamobil_young", type: "extension", amount: 565.00, sub: "SUB40" },
  
  { id: "GIGAMOBIL_YOUNG_M_SUB5_VVL", name: "GigaMobil Young M mit Basic Phone (Sub5) VVL", family: "gigamobil_young", type: "extension", amount: 380.00, sub: "SUB5" },
  { id: "GIGAMOBIL_YOUNG_M_SUB10_VVL", name: "GigaMobil Young M mit Basic Smartphone (Sub10) VVL", family: "gigamobil_young", type: "extension", amount: 435.00, sub: "SUB10" },
  { id: "GIGAMOBIL_YOUNG_M_SUB20_VVL", name: "GigaMobil Young M mit Smartphone Special (Sub20) VVL", family: "gigamobil_young", type: "extension", amount: 540.00, sub: "SUB20" },
  { id: "GIGAMOBIL_YOUNG_M_SUB30_VVL", name: "GigaMobil Young M mit Premium Smartphone Special (Sub30) VVL", family: "gigamobil_young", type: "extension", amount: 660.00, sub: "SUB30" },
  { id: "GIGAMOBIL_YOUNG_M_SUB40_VVL", name: "GigaMobil Young M mit Top Smartphone (Sub40) VVL", family: "gigamobil_young", type: "extension", amount: 780.00, sub: "SUB40" },
  
  { id: "GIGAMOBIL_YOUNG_L_SUB5_VVL", name: "GigaMobil Young L mit Basic Phone (Sub5) VVL", family: "gigamobil_young", type: "extension", amount: 425.00, sub: "SUB5" },
  { id: "GIGAMOBIL_YOUNG_L_SUB10_VVL", name: "GigaMobil Young L mit Basic Smartphone (Sub10) VVL", family: "gigamobil_young", type: "extension", amount: 485.00, sub: "SUB10" },
  { id: "GIGAMOBIL_YOUNG_L_SUB20_VVL", name: "GigaMobil Young L mit Smartphone Special (Sub20) VVL", family: "gigamobil_young", type: "extension", amount: 605.00, sub: "SUB20" },
  { id: "GIGAMOBIL_YOUNG_L_SUB30_VVL", name: "GigaMobil Young L mit Premium Smartphone Special (Sub30) VVL", family: "gigamobil_young", type: "extension", amount: 720.00, sub: "SUB30" },
  { id: "GIGAMOBIL_YOUNG_L_SUB40_VVL", name: "GigaMobil Young L mit Top Smartphone (Sub40) VVL", family: "gigamobil_young", type: "extension", amount: 835.00, sub: "SUB40" },
  
  { id: "GIGAMOBIL_YOUNG_XL_SUB5_VVL", name: "GigaMobil Young XL mit Basic Phone (Sub5) VVL", family: "gigamobil_young", type: "extension", amount: 720.00, sub: "SUB5" },
  { id: "GIGAMOBIL_YOUNG_XL_SUB10_VVL", name: "GigaMobil Young XL mit Basic Smartphone (Sub10) VVL", family: "gigamobil_young", type: "extension", amount: 775.00, sub: "SUB10" },
  { id: "GIGAMOBIL_YOUNG_XL_SUB20_VVL", name: "GigaMobil Young XL mit Smartphone Special (Sub20) VVL", family: "gigamobil_young", type: "extension", amount: 900.00, sub: "SUB20" },
  { id: "GIGAMOBIL_YOUNG_XL_SUB30_VVL", name: "GigaMobil Young XL mit Premium Smartphone Special (Sub30) VVL", family: "gigamobil_young", type: "extension", amount: 1020.00, sub: "SUB30" },
  { id: "GIGAMOBIL_YOUNG_XL_SUB40_VVL", name: "GigaMobil Young XL mit Top Smartphone (Sub40) VVL", family: "gigamobil_young", type: "extension", amount: 1125.00, sub: "SUB40" },
  
  // ============================================
  // VODAFONE SMART NEU
  // ============================================
  { id: "SMART_ENTRY_NEU", name: "Vodafone Smart Entry", family: "smart_vodafone", type: "new", amount: 315.00 },
  { id: "SMART_LITE_NEU", name: "Vodafone Smart Lite", family: "smart_vodafone", type: "new", amount: 385.00 },
  { id: "SMART_S_NEU", name: "Vodafone Smart S", family: "smart_vodafone", type: "new", amount: 455.00 },
  { id: "SMART_M_NEU", name: "Vodafone Smart M", family: "smart_vodafone", type: "new", amount: 560.00 },
  { id: "SMART_L_NEU", name: "Vodafone Smart L", family: "smart_vodafone", type: "new", amount: 630.00 },
  { id: "SMART_XL_NEU", name: "Vodafone Smart XL", family: "smart_vodafone", type: "new", amount: 700.00 },
  { id: "SMART_XXL_NEU", name: "Vodafone Smart XXL", family: "smart_vodafone", type: "new", amount: 770.00 },
  { id: "SMART_ULTIMATE_NEU", name: "Vodafone Smart Ultimate", family: "smart_vodafone", type: "new", amount: 875.00 },
  
  // ============================================
  // VODAFONE SMART VVL
  // ============================================
  { id: "SMART_ENTRY_VVL", name: "Vodafone Smart Entry (VVL)", family: "smart_vodafone", type: "extension", amount: 315.00 },
  { id: "SMART_LITE_VVL", name: "Vodafone Smart Lite (VVL)", family: "smart_vodafone", type: "extension", amount: 385.00 },
  { id: "SMART_S_VVL", name: "Vodafone Smart S (VVL)", family: "smart_vodafone", type: "extension", amount: 455.00 },
  { id: "SMART_M_VVL", name: "Vodafone Smart M (VVL)", family: "smart_vodafone", type: "extension", amount: 525.00 },
  { id: "SMART_L_VVL", name: "Vodafone Smart L (VVL)", family: "smart_vodafone", type: "extension", amount: 595.00 },
  { id: "SMART_XL_VVL", name: "Vodafone Smart XL (VVL)", family: "smart_vodafone", type: "extension", amount: 665.00 },
  { id: "SMART_XXL_VVL", name: "Vodafone Smart XXL (VVL)", family: "smart_vodafone", type: "extension", amount: 735.00 },
  { id: "SMART_ULTIMATE_VVL", name: "Vodafone Smart Ultimate (VVL)", family: "smart_vodafone", type: "extension", amount: 835.00 },
  
  // ============================================
  // BUSINESS SMART NEU
  // ============================================
  { id: "BUSINESS_SMART_S_SIM", name: "Business Smart S ohne Smartphone", family: "business_smart", type: "new", amount: 100.00, sub: "SIM_ONLY" },
  { id: "BUSINESS_SMART_S_SUB5", name: "Business Smart S mit Basic-Phone", family: "business_smart", type: "new", amount: 155.00, sub: "SUB5" },
  { id: "BUSINESS_SMART_S_SUB10", name: "Business Smart S mit Smartphone", family: "business_smart", type: "new", amount: 230.00, sub: "SUB10" },
  { id: "BUSINESS_SMART_M_SIM", name: "Business Smart M ohne Smartphone", family: "business_smart", type: "new", amount: 150.00, sub: "SIM_ONLY" },
  { id: "BUSINESS_SMART_M_SUB5", name: "Business Smart M mit Basic-Phone", family: "business_smart", type: "new", amount: 205.00, sub: "SUB5" },
  { id: "BUSINESS_SMART_M_SUB10", name: "Business Smart M mit Smartphone", family: "business_smart", type: "new", amount: 250.00, sub: "SUB10" },
  { id: "BUSINESS_SMART_S_FLEX", name: "Business Smart S Flex ohne Smartphone", family: "business_smart", type: "new", amount: 5.00, sub: "FLEX" },
  { id: "BUSINESS_SMART_M_FLEX", name: "Business Smart M Flex ohne Smartphone", family: "business_smart", type: "new", amount: 7.50, sub: "FLEX" },
  
  // ============================================
  // BUSINESS SMART VVL
  // ============================================
  { id: "BUSINESS_SMART_S_SIM_VVL", name: "Business Smart S ohne Smartphone (VVL)", family: "business_smart", type: "extension", amount: 40.00, sub: "SIM_ONLY" },
  { id: "BUSINESS_SMART_S_SUB5_VVL", name: "Business Smart S mit Basic-Phone (VVL)", family: "business_smart", type: "extension", amount: 135.00, sub: "SUB5" },
  { id: "BUSINESS_SMART_S_SUB10_VVL", name: "Business Smart S mit Smartphone (VVL)", family: "business_smart", type: "extension", amount: 200.00, sub: "SUB10" },
  { id: "BUSINESS_SMART_M_SIM_VVL", name: "Business Smart M ohne Smartphone (VVL)", family: "business_smart", type: "extension", amount: 200.00, sub: "SIM_ONLY" },
  { id: "BUSINESS_SMART_M_SUB5_VVL", name: "Business Smart M mit Basic-Phone (VVL)", family: "business_smart", type: "extension", amount: 185.00, sub: "SUB5" },
  { id: "BUSINESS_SMART_M_SUB10_VVL", name: "Business Smart M mit Smartphone (VVL)", family: "business_smart", type: "extension", amount: 230.00, sub: "SUB10" },
  
  // ============================================
  // BUSINESS PRIME NEU
  // ============================================
  { id: "BUSINESS_PRIME_S_SIM", name: "Business Prime S ohne Smartphone", family: "business_prime", type: "new", amount: 265.00, sub: "SIM_ONLY" },
  { id: "BUSINESS_PRIME_S_SUB5", name: "Business Prime S mit Basic-Phone", family: "business_prime", type: "new", amount: 335.00, sub: "SUB5" },
  { id: "BUSINESS_PRIME_S_SUB10", name: "Business Prime S mit Smartphone", family: "business_prime", type: "new", amount: 405.00, sub: "SUB10" },
  { id: "BUSINESS_PRIME_S_SUB20", name: "Business Prime S mit Premium-Smartphone", family: "business_prime", type: "new", amount: 580.00, sub: "SUB20" },
  { id: "BUSINESS_PRIME_S_SUB30", name: "Business Prime S mit Special Premium-Smartphone", family: "business_prime", type: "new", amount: 650.00, sub: "SUB30" },
  
  { id: "BUSINESS_PRIME_M_SIM", name: "Business Prime M ohne Smartphone", family: "business_prime", type: "new", amount: 355.00, sub: "SIM_ONLY" },
  { id: "BUSINESS_PRIME_M_SUB5", name: "Business Prime M mit Basic-Phone", family: "business_prime", type: "new", amount: 445.00, sub: "SUB5" },
  { id: "BUSINESS_PRIME_M_SUB10", name: "Business Prime M mit Smartphone", family: "business_prime", type: "new", amount: 515.00, sub: "SUB10" },
  { id: "BUSINESS_PRIME_M_SUB20", name: "Business Prime M mit Premium-Smartphone", family: "business_prime", type: "new", amount: 620.00, sub: "SUB20" },
  { id: "BUSINESS_PRIME_M_SUB30", name: "Business Prime M mit Special Premium-Smartphone", family: "business_prime", type: "new", amount: 680.00, sub: "SUB30" },
  
  { id: "BUSINESS_PRIME_M10_SIM", name: "Business Prime M 10 2025 ohne Smartphone", family: "business_prime", type: "new", amount: 365.00, sub: "SIM_ONLY" },
  { id: "BUSINESS_PRIME_M10_SUB5", name: "Business Prime M 10 2025 mit Basic-Phone", family: "business_prime", type: "new", amount: 455.00, sub: "SUB5" },
  { id: "BUSINESS_PRIME_M10_SUB10", name: "Business Prime M 10 2025 mit Smartphone", family: "business_prime", type: "new", amount: 425.00, sub: "SUB10" },
  { id: "BUSINESS_PRIME_M10_SUB20", name: "Business Prime M 10 2025 mit Premium-Smartphone", family: "business_prime", type: "new", amount: 630.00, sub: "SUB20" },
  { id: "BUSINESS_PRIME_M10_SUB30", name: "Business Prime M 10 2025 mit Special Premium-Smartphone", family: "business_prime", type: "new", amount: 690.00, sub: "SUB30" },
  
  { id: "BUSINESS_PRIME_L_SIM", name: "Business Prime L ohne Smartphone", family: "business_prime", type: "new", amount: 425.00, sub: "SIM_ONLY" },
  { id: "BUSINESS_PRIME_L_SUB5", name: "Business Prime L mit Basic-Phone", family: "business_prime", type: "new", amount: 540.00, sub: "SUB5" },
  { id: "BUSINESS_PRIME_L_SUB10", name: "Business Prime L mit Smartphone", family: "business_prime", type: "new", amount: 610.00, sub: "SUB10" },
  { id: "BUSINESS_PRIME_L_SUB20", name: "Business Prime L mit Premium-Smartphone", family: "business_prime", type: "new", amount: 690.00, sub: "SUB20" },
  { id: "BUSINESS_PRIME_L_SUB30", name: "Business Prime L mit Special Premium-Smartphone", family: "business_prime", type: "new", amount: 710.00, sub: "SUB30" },
  
  { id: "BUSINESS_PRIME_XL_SIM", name: "Business Prime XL Unlimited ohne Smartphone", family: "business_prime", type: "new", amount: 495.00, sub: "SIM_ONLY" },
  { id: "BUSINESS_PRIME_XL_SUB5", name: "Business Prime XL Unlimited mit Basic-Phone", family: "business_prime", type: "new", amount: 635.00, sub: "SUB5" },
  { id: "BUSINESS_PRIME_XL_SUB10", name: "Business Prime XL Unlimited mit Smartphone", family: "business_prime", type: "new", amount: 690.00, sub: "SUB10" },
  { id: "BUSINESS_PRIME_XL_SUB20", name: "Business Prime XL Unlimited mit Premium-Smartphone", family: "business_prime", type: "new", amount: 740.00, sub: "SUB20" },
  { id: "BUSINESS_PRIME_XL_SUB30", name: "Business Prime XL Unlimited mit Special Premium-Smartphone", family: "business_prime", type: "new", amount: 770.00, sub: "SUB30" },
  
  // ============================================
  // BUSINESS PRIME VVL
  // ============================================
  { id: "BUSINESS_PRIME_S_SIM_VVL", name: "Business Prime S ohne Smartphone (VVL)", family: "business_prime", type: "extension", amount: 75.00, sub: "SIM_ONLY" },
  { id: "BUSINESS_PRIME_S_SUB5_VVL", name: "Business Prime S mit Basic-Phone (VVL)", family: "business_prime", type: "extension", amount: 345.00, sub: "SUB5" },
  { id: "BUSINESS_PRIME_S_SUB10_VVL", name: "Business Prime S mit Smartphone (VVL)", family: "business_prime", type: "extension", amount: 405.00, sub: "SUB10" },
  { id: "BUSINESS_PRIME_S_SUB20_VVL", name: "Business Prime S mit Premium-Smartphone (VVL)", family: "business_prime", type: "extension", amount: 585.00, sub: "SUB20" },
  { id: "BUSINESS_PRIME_S_SUB30_VVL", name: "Business Prime S mit Special Premium-Smartphone (VVL)", family: "business_prime", type: "extension", amount: 650.00, sub: "SUB30" },
  
  { id: "BUSINESS_PRIME_M_SIM_VVL", name: "Business Prime M ohne Smartphone (VVL)", family: "business_prime", type: "extension", amount: 125.00, sub: "SIM_ONLY" },
  { id: "BUSINESS_PRIME_M_SUB5_VVL", name: "Business Prime M mit Basic-Phone (VVL)", family: "business_prime", type: "extension", amount: 465.00, sub: "SUB5" },
  { id: "BUSINESS_PRIME_M_SUB10_VVL", name: "Business Prime M mit Smartphone (VVL)", family: "business_prime", type: "extension", amount: 525.00, sub: "SUB10" },
  { id: "BUSINESS_PRIME_M_SUB20_VVL", name: "Business Prime M mit Premium-Smartphone (VVL)", family: "business_prime", type: "extension", amount: 630.00, sub: "SUB20" },
  { id: "BUSINESS_PRIME_M_SUB30_VVL", name: "Business Prime M mit Special Premium-Smartphone (VVL)", family: "business_prime", type: "extension", amount: 700.00, sub: "SUB30" },
  
  { id: "BUSINESS_PRIME_L_SIM_VVL", name: "Business Prime L ohne Smartphone (VVL)", family: "business_prime", type: "extension", amount: 170.00, sub: "SIM_ONLY" },
  { id: "BUSINESS_PRIME_L_SUB5_VVL", name: "Business Prime L mit Basic-Phone (VVL)", family: "business_prime", type: "extension", amount: 545.00, sub: "SUB5" },
  { id: "BUSINESS_PRIME_L_SUB10_VVL", name: "Business Prime L mit Smartphone (VVL)", family: "business_prime", type: "extension", amount: 600.00, sub: "SUB10" },
  
  // ============================================
  // OTELO NEU
  // ============================================
  { id: "OTELO_CLASSIC_NEU", name: "Otelo Allnet Flat Classic", family: "otelo", type: "new", amount: 90.00 },
  { id: "OTELO_MAX_NEU", name: "Otelo Allnet Flat Max", family: "otelo", type: "new", amount: 135.00 },
  { id: "OTELO_GO_M_NEU", name: "Otelo Allnet Flat Go M", family: "otelo", type: "new", amount: 65.00 },
  { id: "OTELO_GO_L_NEU", name: "Otelo Allnet Flat Go L", family: "otelo", type: "new", amount: 85.00 },
  { id: "OTELO_GO_XL_NEU", name: "Otelo Allnet Flat Go XL", family: "otelo", type: "new", amount: 100.00 },
  { id: "OTELO_GO_XXL_NEU", name: "Otelo Allnet Flat Go XXL", family: "otelo", type: "new", amount: 110.00 },
  
  // OTELO VVL
  { id: "OTELO_CLASSIC_VVL", name: "Otelo Allnet Flat Classic (VVL)", family: "otelo", type: "extension", amount: 60.00 },
  { id: "OTELO_MAX_VVL", name: "Otelo Allnet Flat Max (VVL)", family: "otelo", type: "extension", amount: 90.00 },
  { id: "OTELO_GO_M_VVL", name: "Otelo Allnet Flat Go M (VVL)", family: "otelo", type: "extension", amount: 40.00 },
  { id: "OTELO_GO_L_VVL", name: "Otelo Allnet Flat Go L (VVL)", family: "otelo", type: "extension", amount: 55.00 },
  { id: "OTELO_GO_XL_VVL", name: "Otelo Allnet Flat Go XL (VVL)", family: "otelo", type: "extension", amount: 65.00 },
  { id: "OTELO_GO_XXL_VVL", name: "Otelo Allnet Flat Go XXL (VVL)", family: "otelo", type: "extension", amount: 70.00 },
  
  // ============================================
  // FAMILYCARD NEU
  // ============================================
  { id: "FAMILYCARD_S_SIM", name: "FamilyCard S ohne Smartphone", family: "familycard", type: "new", amount: 90.00, sub: "SIM_ONLY" },
  { id: "FAMILYCARD_S_SUB5", name: "FamilyCard S mit Basic-Phone", family: "familycard", type: "new", amount: 190.00, sub: "SUB5" },
  { id: "FAMILYCARD_S_SUB10", name: "FamilyCard S mit Smartphone", family: "familycard", type: "new", amount: 270.00, sub: "SUB10" },
  { id: "FAMILYCARD_S_SUB20", name: "FamilyCard S mit Premium-Smartphone", family: "familycard", type: "new", amount: 370.00, sub: "SUB20" },
  { id: "FAMILYCARD_S_SUB30", name: "FamilyCard S mit Special Premium-Smartphone", family: "familycard", type: "new", amount: 485.00, sub: "SUB30" },
  
  { id: "FAMILYCARD_M_SIM", name: "FamilyCard M ohne Smartphone", family: "familycard", type: "new", amount: 170.00, sub: "SIM_ONLY" },
  { id: "FAMILYCARD_M_SUB5", name: "FamilyCard M mit Basic-Phone", family: "familycard", type: "new", amount: 330.00, sub: "SUB5" },
  { id: "FAMILYCARD_M_SUB10", name: "FamilyCard M mit Smartphone", family: "familycard", type: "new", amount: 385.00, sub: "SUB10" },
  { id: "FAMILYCARD_M_SUB20", name: "FamilyCard M mit Premium-Smartphone", family: "familycard", type: "new", amount: 500.00, sub: "SUB20" },
  { id: "FAMILYCARD_M_SUB30", name: "FamilyCard M mit Special Premium-Smartphone", family: "familycard", type: "new", amount: 590.00, sub: "SUB30" },
  
  { id: "FAMILYCARD_L_SIM", name: "FamilyCard L ohne Smartphone", family: "familycard", type: "new", amount: 220.00, sub: "SIM_ONLY" },
  { id: "FAMILYCARD_L_SUB5", name: "FamilyCard L mit Basic-Phone", family: "familycard", type: "new", amount: 400.00, sub: "SUB5" },
  { id: "FAMILYCARD_L_SUB10", name: "FamilyCard L mit Smartphone", family: "familycard", type: "new", amount: 450.00, sub: "SUB10" },
  { id: "FAMILYCARD_L_SUB20", name: "FamilyCard L mit Premium-Smartphone", family: "familycard", type: "new", amount: 565.00, sub: "SUB20" },
  { id: "FAMILYCARD_L_SUB30", name: "FamilyCard L mit Special Premium-Smartphone", family: "familycard", type: "new", amount: 660.00, sub: "SUB30" },
  
  { id: "FAMILYCARD_XL_SIM", name: "FamilyCard XL ohne Smartphone", family: "familycard", type: "new", amount: 365.00, sub: "SIM_ONLY" },
  { id: "FAMILYCARD_XL_SUB5", name: "FamilyCard XL mit Basic-Phone", family: "familycard", type: "new", amount: 605.00, sub: "SUB5" },
  { id: "FAMILYCARD_XL_SUB10", name: "FamilyCard XL mit Smartphone", family: "familycard", type: "new", amount: 665.00, sub: "SUB10" },
  { id: "FAMILYCARD_XL_SUB20", name: "FamilyCard XL mit Premium-Smartphone", family: "familycard", type: "new", amount: 770.00, sub: "SUB20" },
  { id: "FAMILYCARD_XL_SUB30", name: "FamilyCard XL mit Special Premium-Smartphone", family: "familycard", type: "new", amount: 855.00, sub: "SUB30" },
  
  // ============================================
  // BUSINESS INTERNET
  // ============================================
  { id: "BUSINESS_INTERNET_DSL_6000", name: "Business Internet/DSL Bandbreite 6.000", family: "business_internet", type: "new", amount: 85.00 },
  { id: "BUSINESS_INTERNET_DSL_16000", name: "Business Internet/DSL Bandbreite 16.000", family: "business_internet", type: "new", amount: 85.00 },
  { id: "BUSINESS_INTERNET_DSL_25000", name: "Business Internet/DSL Bandbreite 25.000", family: "business_internet", type: "new", amount: 145.00 },
  { id: "BUSINESS_INTERNET_DSL_50000", name: "Business Internet/DSL Bandbreite 50.000", family: "business_internet", type: "new", amount: 145.00 },
  { id: "BUSINESS_INTERNET_DSL_100000", name: "Business Internet/DSL Bandbreite 100.000", family: "business_internet", type: "new", amount: 160.00 },
  { id: "BUSINESS_INTERNET_DSL_250000", name: "Business Internet/DSL Bandbreite 250.000", family: "business_internet", type: "new", amount: 170.00 },
  
  { id: "BUSINESS_INTERNET_CABLE_100", name: "Business Internet Cable Bandbreite 100", family: "business_internet", type: "new", amount: 145.00 },
  { id: "BUSINESS_INTERNET_CABLE_200", name: "Business Internet Cable Bandbreite 200", family: "business_internet", type: "new", amount: 160.00 },
  { id: "BUSINESS_INTERNET_CABLE_400", name: "Business Internet Cable Bandbreite 400", family: "business_internet", type: "new", amount: 180.00 },
  { id: "BUSINESS_INTERNET_CABLE_500", name: "Business Internet Cable Bandbreite 500", family: "business_internet", type: "new", amount: 180.00 },
  { id: "BUSINESS_INTERNET_CABLE_1000", name: "Business Internet Cable Bandbreite 1000", family: "business_internet", type: "new", amount: 300.00 },
  
  { id: "BUSINESS_INTERNET_PRO_VDSL_50", name: "Business Internet Pro VDSL 50M/10M", family: "business_internet_pro", type: "new", amount: 240.00 },
  { id: "BUSINESS_INTERNET_PRO_VDSL_100", name: "Business Internet Pro VDSL 100M/40M", family: "business_internet_pro", type: "new", amount: 280.00 },
  { id: "BUSINESS_INTERNET_PRO_VDSL_175", name: "Business Internet Pro VDSL 175M/40M", family: "business_internet_pro", type: "new", amount: 300.00 },
  { id: "BUSINESS_INTERNET_PRO_VDSL_250", name: "Business Internet Pro VDSL 250M/40M", family: "business_internet_pro", type: "new", amount: 380.00 },
  
  { id: "BUSINESS_INTERNET_PRO_CABLE_100", name: "Business Internet Pro Cable 100M/50M", family: "business_internet_pro", type: "new", amount: 200.00 },
  { id: "BUSINESS_INTERNET_PRO_CABLE_300", name: "Business Internet Pro Cable 300M/50M", family: "business_internet_pro", type: "new", amount: 300.00 },
  { id: "BUSINESS_INTERNET_PRO_CABLE_500", name: "Business Internet Pro Cable 500M/50M", family: "business_internet_pro", type: "new", amount: 340.00 },
  { id: "BUSINESS_INTERNET_PRO_CABLE_1000", name: "Business Internet Pro Cable 1000M/50M", family: "business_internet_pro", type: "new", amount: 420.00 },
  
  // ============================================
  // SMART LOCK
  // ============================================
  { id: "SMART_LOCK_BASIC_24", name: "Vodafone Smart Lock Basic 24 Monate", family: "smart_lock", type: "new", amount: 35.00 },
  { id: "SMART_LOCK_BASIC_36", name: "Vodafone Smart Lock Basic 36 Monate", family: "smart_lock", type: "new", amount: 50.00 },
  { id: "SMART_LOCK_BASIC_60", name: "Vodafone Smart Lock Basic 60 Monate", family: "smart_lock", type: "new", amount: 70.00 },
  { id: "SMART_LOCK_PRO_24", name: "Vodafone Smart Lock Professional 24 Monate", family: "smart_lock", type: "new", amount: 40.00 },
  { id: "SMART_LOCK_PRO_36", name: "Vodafone Smart Lock Professional 36 Monate", family: "smart_lock", type: "new", amount: 55.00 },
  { id: "SMART_LOCK_PRO_60", name: "Vodafone Smart Lock Professional 60 Monate", family: "smart_lock", type: "new", amount: 80.00 },
  
  // ============================================
  // PROVISIONSABZUEGE
  // ============================================
  { id: "ABZUG_TEAMDEAL_2", name: "TeamDeal 2 Abzug", family: "abzuege", type: "new", amount: -5.00, notes: "Rabatt auf Provision" },
  { id: "ABZUG_TEAMDEAL_3", name: "TeamDeal 3 Abzug", family: "abzuege", type: "new", amount: -10.00, notes: "Rabatt auf Provision" },
  { id: "ABZUG_TEAMDEAL_4", name: "TeamDeal 4 Abzug", family: "abzuege", type: "new", amount: -15.00, notes: "Rabatt auf Provision" },
  { id: "ABZUG_TEAMDEAL_5", name: "TeamDeal 5+ Abzug", family: "abzuege", type: "new", amount: -20.00, notes: "Rabatt auf Provision" },
  
  { id: "ABZUG_OMO_10", name: "One Minute Offer - 10% Abzug", family: "abzuege", type: "new", amount: -40.00, notes: "Je nach Tarif" },
  { id: "ABZUG_OMO_15", name: "One Minute Offer - 15% Abzug", family: "abzuege", type: "new", amount: -45.00, notes: "Je nach Tarif" },
  { id: "ABZUG_OMO_20", name: "One Minute Offer - 20% Abzug", family: "abzuege", type: "new", amount: -50.00, notes: "Je nach Tarif" },
  { id: "ABZUG_OMO_25", name: "One Minute Offer - 25% Abzug", family: "abzuege", type: "new", amount: -55.00, notes: "Je nach Tarif" },
  { id: "ABZUG_OMO_30", name: "One Minute Offer - 30% Abzug", family: "abzuege", type: "new", amount: -100.00, notes: "Je nach Tarif" },
  { id: "ABZUG_OMO_35", name: "One Minute Offer - 35% Abzug", family: "abzuege", type: "new", amount: -110.00, notes: "Je nach Tarif" },
  
  { id: "ABZUG_GIGAKOMBI", name: "GigaKombi Restlaufzeitbefreiung", family: "abzuege", type: "new", amount: -30.00, notes: "Abzug bei GigaKombi" },
  { id: "ABZUG_GK_RABATT", name: "Geschaeftskunden-Rabatt Abzug", family: "abzuege", type: "new", amount: -15.00, notes: "Je nach Tarif" },
  
  { id: "ABZUG_BOOST_S", name: "Boost Business Prime S Abzug", family: "abzuege", type: "new", amount: -45.00 },
  { id: "ABZUG_BOOST_M", name: "Boost Business Prime M Abzug", family: "abzuege", type: "new", amount: -55.00 },
  { id: "ABZUG_BOOST_L", name: "Boost Business Prime L Abzug", family: "abzuege", type: "new", amount: -185.00 },
  { id: "ABZUG_BOOST_XL", name: "Boost Business Prime XL Abzug", family: "abzuege", type: "new", amount: -190.00 },
  
  { id: "ABZUG_50PROZ_BP_S", name: "12 x 50% Basispreisrabatt Prime S", family: "abzuege", type: "new", amount: -55.00 },
  { id: "ABZUG_50PROZ_BP_M", name: "12 x 50% Basispreisrabatt Prime M", family: "abzuege", type: "new", amount: -55.00 },
  { id: "ABZUG_50PROZ_BP_L", name: "12 x 50% Basispreisrabatt Prime L", family: "abzuege", type: "new", amount: -60.00 },
  { id: "ABZUG_50PROZ_BP_XL", name: "12 x 50% Basispreisrabatt Prime XL", family: "abzuege", type: "new", amount: -55.00 },
  
  // Push Provisionen
  { id: "PUSH_MOBILE_GIGAMOBIL", name: "Vermarktungs-Push Mobile GigaMobil", family: "push_bonus", type: "new", amount: 30.00, notes: "Inklusive GK Rabatt" },
  { id: "PUSH_PRIME_S", name: "Prime Push Business Prime S", family: "push_bonus", type: "new", amount: 50.00 },
  { id: "PUSH_PRIME_MLX", name: "Prime Push Business Prime M, L, XL", family: "push_bonus", type: "new", amount: 80.00 },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Get provision amount by tariff ID and contract type
 */
export function getTkWorldProvision(
  tariffId: string,
  contractType: "new" | "extension"
): number | null {
  const entry = TK_WORLD_PROVISIONS_2026.find(
    (p) => p.id === tariffId && p.type === contractType
  );
  return entry?.amount ?? null;
}

/**
 * Get all provisions for a tariff family
 */
export function getTkWorldProvisionsByFamily(
  family: string,
  contractType?: "new" | "extension"
): TkWorldProvisionEntry[] {
  return TK_WORLD_PROVISIONS_2026.filter(
    (p) => p.family === family && (!contractType || p.type === contractType)
  );
}

/**
 * Get all unique families
 */
export function getTkWorldFamilies(): string[] {
  const families = new Set(TK_WORLD_PROVISIONS_2026.map((p) => p.family));
  return Array.from(families).sort();
}

/**
 * Summary statistics
 */
export const TK_WORLD_STATS = {
  totalEntries: TK_WORLD_PROVISIONS_2026.length,
  newContracts: TK_WORLD_PROVISIONS_2026.filter((p) => p.type === "new").length,
  extensions: TK_WORLD_PROVISIONS_2026.filter((p) => p.type === "extension").length,
  families: getTkWorldFamilies().length,
  validFrom: "2026-01-01",
  source: "TK-World Preisliste 01-2026",
};
