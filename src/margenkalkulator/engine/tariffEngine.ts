// ============================================
// Smart-Engine: Tariff Catalog & Provision Matrix
// Modul 1.1 - Zentrale Tarif-Definitionen
// ============================================

/**
 * Tariff-Definition mit allen relevanten Feldern für Margenberechnung
 */
export interface TariffDefinition {
  /** Eindeutige ID (z.B. "bp_m_2025") */
  id: string;
  /** Anzeigename (z.B. "Prime M") */
  name: string;
  /** Tarif-Kategorie */
  category: "prime" | "gigamobil" | "black" | "smart";
  /** Monatlicher Basispreis netto in EUR */
  basePrice: number;
  /** Datenvolumen in GB */
  dataVolumeGB: number | "unlimited";
  /** Boost-Datenvolumen (temporär +50%) */
  boostDataVolumeGB?: number;
  /** EU-Roaming FUP in GB */
  euRoamingCapGB: number;
  /** Aktivierungsgebühr */
  activationFee: number;
  /** Hardware-Subventionsstufe (1-5) */
  subsidyLevel: 1 | 2 | 3 | 4 | 5;
  /** Tier-Bezeichnung */
  tier: "S" | "M" | "L" | "XL";
}

/**
 * Provision-Definition pro Distributor
 */
export interface ProvisionDefinition {
  /** Distributor-ID */
  distributor: Distributor;
  /** Tarif-Kategorie */
  tariffCategory: TariffCategory;
  /** Airtime-Provision in % */
  airtimePercentage: number;
  /** Einmal-Provision bei Aktivierung */
  activationFee: number;
}

/**
 * Hardware-Subventions-Definition
 */
export interface HardwareSubvention {
  /** Sub-Stufe (1-5) */
  subsidyLevel: 1 | 2 | 3 | 4 | 5;
  /** Zuzahlung bei 24 Monaten Laufzeit */
  months24: number;
  /** Zuzahlung bei 36 Monaten Laufzeit */
  months36: number;
  /** Provision auf Hardware in % */
  provisionPercentage: number;
}

export type Distributor = "herweck" | "komsa" | "ingram";
export type TariffCategory = "prime" | "gigamobil" | "black" | "smart";

// ============================================
// TARIFF CATALOG - Alle Vodafone Business Tarife
// ============================================

export const TARIFF_CATALOG: TariffDefinition[] = [
  // === Vodafone Prime (Business-Einsteiger) ===
  {
    id: "bp_s_2025",
    name: "Prime S",
    category: "prime",
    basePrice: 29,
    dataVolumeGB: 20,
    boostDataVolumeGB: 30,
    euRoamingCapGB: 45,
    activationFee: 19,
    subsidyLevel: 1,
    tier: "S",
  },
  {
    id: "bp_m_2025",
    name: "Prime M",
    category: "prime",
    basePrice: 42,
    dataVolumeGB: 50,
    boostDataVolumeGB: 75,
    euRoamingCapGB: 65,
    activationFee: 19,
    subsidyLevel: 2,
    tier: "M",
  },
  {
    id: "bp_l_2025",
    name: "Prime L",
    category: "prime",
    basePrice: 49,
    dataVolumeGB: 200,
    boostDataVolumeGB: 300,
    euRoamingCapGB: 80,
    activationFee: 19,
    subsidyLevel: 3,
    tier: "L",
  },
  {
    id: "bp_xl_2025",
    name: "Prime XL",
    category: "prime",
    basePrice: 59,
    dataVolumeGB: "unlimited",
    euRoamingCapGB: 95,
    activationFee: 19,
    subsidyLevel: 4,
    tier: "XL",
  },

  // === Vodafone GigaMobil (Daten-fokussiert) ===
  {
    id: "gm_s_2025",
    name: "GigaMobil S",
    category: "gigamobil",
    basePrice: 35,
    dataVolumeGB: 10,
    euRoamingCapGB: 20,
    activationFee: 19,
    subsidyLevel: 2,
    tier: "S",
  },
  {
    id: "gm_m_2025",
    name: "GigaMobil M",
    category: "gigamobil",
    basePrice: 45,
    dataVolumeGB: 20,
    euRoamingCapGB: 20,
    activationFee: 19,
    subsidyLevel: 3,
    tier: "M",
  },
  {
    id: "gm_l_2025",
    name: "GigaMobil L",
    category: "gigamobil",
    basePrice: 55,
    dataVolumeGB: 50,
    euRoamingCapGB: 20,
    activationFee: 19,
    subsidyLevel: 4,
    tier: "L",
  },
  {
    id: "gm_xl_2025",
    name: "GigaMobil XL",
    category: "gigamobil",
    basePrice: 65,
    dataVolumeGB: 100,
    euRoamingCapGB: 20,
    activationFee: 19,
    subsidyLevel: 5,
    tier: "XL",
  },

  // === Vodafone Black (Premium) ===
  {
    id: "black_s_2025",
    name: "Black S",
    category: "black",
    basePrice: 49,
    dataVolumeGB: 10,
    euRoamingCapGB: 30,
    activationFee: 0,
    subsidyLevel: 3,
    tier: "S",
  },
  {
    id: "black_m_2025",
    name: "Black M",
    category: "black",
    basePrice: 59,
    dataVolumeGB: 20,
    euRoamingCapGB: 30,
    activationFee: 0,
    subsidyLevel: 4,
    tier: "M",
  },
  {
    id: "black_l_2025",
    name: "Black L",
    category: "black",
    basePrice: 69,
    dataVolumeGB: 50,
    euRoamingCapGB: 30,
    activationFee: 0,
    subsidyLevel: 5,
    tier: "L",
  },
  {
    id: "black_xl_2025",
    name: "Black XL",
    category: "black",
    basePrice: 79,
    dataVolumeGB: 100,
    euRoamingCapGB: 30,
    activationFee: 0,
    subsidyLevel: 5,
    tier: "XL",
  },
];

// ============================================
// PROVISION MATRIX - Provisionen pro Distributor
// ============================================

export const PROVISION_MATRIX: ProvisionDefinition[] = [
  // Herweck
  { distributor: "herweck", tariffCategory: "prime", airtimePercentage: 10, activationFee: 30 },
  { distributor: "herweck", tariffCategory: "gigamobil", airtimePercentage: 12, activationFee: 50 },
  { distributor: "herweck", tariffCategory: "black", airtimePercentage: 15, activationFee: 80 },
  { distributor: "herweck", tariffCategory: "smart", airtimePercentage: 8, activationFee: 20 },
  
  // Komsa
  { distributor: "komsa", tariffCategory: "prime", airtimePercentage: 9, activationFee: 28 },
  { distributor: "komsa", tariffCategory: "gigamobil", airtimePercentage: 11, activationFee: 45 },
  { distributor: "komsa", tariffCategory: "black", airtimePercentage: 14, activationFee: 75 },
  { distributor: "komsa", tariffCategory: "smart", airtimePercentage: 7, activationFee: 18 },
  
  // Ingram Micro
  { distributor: "ingram", tariffCategory: "prime", airtimePercentage: 8, activationFee: 25 },
  { distributor: "ingram", tariffCategory: "gigamobil", airtimePercentage: 10, activationFee: 40 },
  { distributor: "ingram", tariffCategory: "black", airtimePercentage: 12, activationFee: 70 },
  { distributor: "ingram", tariffCategory: "smart", airtimePercentage: 6, activationFee: 15 },
];

// ============================================
// HARDWARE SUBSIDIES - Sub-Stufen mit Zuzahlung
// ============================================

export const HARDWARE_SUBSIDIES: HardwareSubvention[] = [
  { subsidyLevel: 1, months24: 0, months36: 0, provisionPercentage: 20 },
  { subsidyLevel: 2, months24: 50, months36: 30, provisionPercentage: 20 },
  { subsidyLevel: 3, months24: 100, months36: 70, provisionPercentage: 25 },
  { subsidyLevel: 4, months24: 150, months36: 100, provisionPercentage: 25 },
  { subsidyLevel: 5, months24: 200, months36: 150, provisionPercentage: 30 },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Get tariff by ID
 */
export function getTariffById(id: string): TariffDefinition | undefined {
  return TARIFF_CATALOG.find((t) => t.id === id);
}

/**
 * Get tariff by legacy ID (maps PRIME_M → bp_m_2025)
 */
export function getTariffByLegacyId(legacyId: string): TariffDefinition | undefined {
  const mapping: Record<string, string> = {
    "PRIME_S": "bp_s_2025",
    "PRIME_M": "bp_m_2025",
    "PRIME_L": "bp_l_2025",
    "PRIME_XL": "bp_xl_2025",
  };
  const newId = mapping[legacyId];
  return newId ? getTariffById(newId) : undefined;
}

/**
 * Get provision for distributor and category
 */
export function getProvisionForDistributor(
  distributor: Distributor,
  category: TariffCategory
): ProvisionDefinition | undefined {
  return PROVISION_MATRIX.find(
    (p) => p.distributor === distributor && p.tariffCategory === category
  );
}

/**
 * Get hardware subsidy by level
 */
export function getHardwareSubsidy(level: 1 | 2 | 3 | 4 | 5): HardwareSubvention {
  return HARDWARE_SUBSIDIES.find((s) => s.subsidyLevel === level) ?? HARDWARE_SUBSIDIES[0];
}

/**
 * List tariffs by category
 */
export function listTariffsByCategory(category: TariffCategory): TariffDefinition[] {
  return TARIFF_CATALOG.filter((t) => t.category === category);
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: TariffCategory): string {
  const names: Record<TariffCategory, string> = {
    prime: "Business Prime",
    gigamobil: "GigaMobil",
    black: "Vodafone Black",
    smart: "Smart Business",
  };
  return names[category];
}
