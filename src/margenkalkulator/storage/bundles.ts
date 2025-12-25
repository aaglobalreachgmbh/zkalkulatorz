/**
 * Corporate Bundles Storage
 * 
 * Typen und Demo-Daten für vorgefertigte Business-Bundles.
 * Bundles sind vorkonfigurierte Angebote für verschiedene Kundensektoren.
 */

import type { OfferOptionState } from "../engine/types";

/**
 * Kundensektor für Bundle-Filterung
 */
export type Sector = "private" | "business" | "enterprise";

/**
 * Corporate Bundle - vorkonfiguriertes Angebot
 */
export interface CorporateBundle {
  id: string;
  sector: Sector;
  name: string;
  description: string;
  tags: string[];
  icon?: string;
  config: Partial<OfferOptionState>;
  createdAt: string;
  featured?: boolean;
}

/**
 * Persönliche Template-Struktur
 */
export interface PersonalTemplate {
  id: string;
  name: string;
  folderId?: string;
  config: OfferOptionState;
  createdAt: string;
  updatedAt: string;
}

/**
 * Template-Ordner
 */
export interface TemplateFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
}

// ============================================
// Demo Corporate Bundles
// ============================================

export const DEMO_BUNDLES: CorporateBundle[] = [
  // Business Sector
  {
    id: "startup-basic",
    sector: "business",
    name: "Start-Up Basic",
    description: "Einsteiger-Paket für junge Unternehmen – günstig und flexibel",
    tags: ["Einsteiger", "Günstig", "Flexibel"],
    featured: true,
    createdAt: "2025-01-01",
    config: {
      mobile: {
        tariffId: "PRIME_S",
        subVariantId: "SIM_ONLY",
        promoId: "NONE",
        contractType: "new",
        quantity: 1,
      },
      hardware: {
        name: "SIM Only",
        ekNet: 0,
        amortize: false,
        amortMonths: 24,
      },
    },
  },
  {
    id: "business-professional",
    sector: "business",
    name: "Business Professional",
    description: "Für etablierte KMU – Premium-Tarif mit Flaggschiff-Gerät",
    tags: ["KMU", "Premium", "iPhone"],
    featured: true,
    createdAt: "2025-01-01",
    config: {
      mobile: {
        tariffId: "PRIME_M",
        subVariantId: "PREMIUM_SMARTPHONE",
        promoId: "NONE",
        contractType: "new",
        quantity: 1,
      },
      hardware: {
        name: "iPhone 16 Pro 256GB",
        ekNet: 999,
        amortize: true,
        amortMonths: 24,
      },
    },
  },
  {
    id: "team-connect-5",
    sector: "business",
    name: "Team Connect 5",
    description: "5 Mitarbeiter vernetzen – mit TeamDeal-Rabatt",
    tags: ["Team", "5 Verträge", "Rabatt"],
    createdAt: "2025-01-01",
    config: {
      mobile: {
        tariffId: "PRIME_M",
        subVariantId: "SMARTPHONE",
        promoId: "NONE",
        contractType: "new",
        quantity: 5,
        primeOnAccount: true,
      },
      hardware: {
        name: "Samsung Galaxy A55",
        ekNet: 399,
        amortize: true,
        amortMonths: 24,
      },
    },
  },
  // Enterprise Sector
  {
    id: "executive-suite",
    sector: "enterprise",
    name: "Executive Suite",
    description: "C-Level Ausstattung – maximale Performance, volle Leistung",
    tags: ["C-Level", "Premium", "Unlimited"],
    featured: true,
    createdAt: "2025-01-01",
    config: {
      mobile: {
        tariffId: "PRIME_XL",
        subVariantId: "SPECIAL_PREMIUM_SMARTPHONE",
        promoId: "NONE",
        contractType: "new",
        quantity: 1,
      },
      hardware: {
        name: "iPhone 16 Pro Max 512GB",
        ekNet: 1299,
        amortize: true,
        amortMonths: 24,
      },
      fixedNet: {
        enabled: true,
        accessType: "FIBER",
        productId: "FIBER_1000",
      },
    },
  },
  {
    id: "enterprise-fleet-10",
    sector: "enterprise",
    name: "Enterprise Fleet 10+",
    description: "Großkunden-Paket für 10+ Geräte mit Sonderkonditionen",
    tags: ["Großkunde", "10+ Geräte", "Sonderpreis"],
    createdAt: "2025-01-01",
    config: {
      mobile: {
        tariffId: "PRIME_L",
        subVariantId: "SMARTPHONE",
        promoId: "NONE",
        contractType: "new",
        quantity: 10,
        primeOnAccount: true,
        omoRate: 15,
      },
      hardware: {
        name: "Samsung Galaxy S24",
        ekNet: 749,
        amortize: true,
        amortMonths: 24,
      },
    },
  },
  // Private Sector (Kleinunternehmer)
  {
    id: "solo-starter",
    sector: "private",
    name: "Solo Starter",
    description: "Für Einzelunternehmer und Freelancer – einfach loslegen",
    tags: ["Solo", "Freelancer", "Einfach"],
    featured: true,
    createdAt: "2025-01-01",
    config: {
      mobile: {
        tariffId: "SMART_S",
        subVariantId: "SIM_ONLY",
        promoId: "NONE",
        contractType: "new",
        quantity: 1,
      },
      hardware: {
        name: "SIM Only",
        ekNet: 0,
        amortize: false,
        amortMonths: 24,
      },
    },
  },
  {
    id: "home-office-combo",
    sector: "private",
    name: "Home Office Combo",
    description: "Mobil + Festnetz für produktives Arbeiten von zu Hause",
    tags: ["Home Office", "Festnetz", "Kombi"],
    createdAt: "2025-01-01",
    config: {
      mobile: {
        tariffId: "PRIME_S",
        subVariantId: "SMARTPHONE",
        promoId: "NONE",
        contractType: "new",
        quantity: 1,
      },
      hardware: {
        name: "Google Pixel 8a",
        ekNet: 449,
        amortize: true,
        amortMonths: 24,
      },
      fixedNet: {
        enabled: true,
        accessType: "CABLE",
        productId: "CABLE_250",
      },
    },
  },
];

// ============================================
// LocalStorage Helpers für Templates
// ============================================

const TEMPLATES_KEY = "margenkalkulator_templates";
const FOLDERS_KEY = "margenkalkulator_template_folders";

export function loadTemplates(): PersonalTemplate[] {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveTemplate(template: PersonalTemplate): void {
  const templates = loadTemplates();
  const existing = templates.findIndex((t) => t.id === template.id);
  if (existing >= 0) {
    templates[existing] = template;
  } else {
    templates.push(template);
  }
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export function deleteTemplate(id: string): void {
  const templates = loadTemplates().filter((t) => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export function loadFolders(): TemplateFolder[] {
  try {
    const stored = localStorage.getItem(FOLDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveFolder(folder: TemplateFolder): void {
  const folders = loadFolders();
  const existing = folders.findIndex((f) => f.id === folder.id);
  if (existing >= 0) {
    folders[existing] = folder;
  } else {
    folders.push(folder);
  }
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export function deleteFolder(id: string): void {
  // Delete folder and move templates to root
  const folders = loadFolders().filter((f) => f.id !== id);
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  
  const templates = loadTemplates().map((t) =>
    t.folderId === id ? { ...t, folderId: undefined } : t
  );
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

// ============================================
// Sector Display Helpers
// ============================================

export const SECTOR_LABELS: Record<Sector, string> = {
  private: "Privat / Solo",
  business: "Gewerbe / KMU",
  enterprise: "Konzern / Enterprise",
};

export const SECTOR_ICONS: Record<Sector, string> = {
  private: "User",
  business: "Building2",
  enterprise: "Building",
};
