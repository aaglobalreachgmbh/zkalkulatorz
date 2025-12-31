// ============================================
// Smart-Engine: Upsell Recommendations
// Modul 1.5 - Automatische Upsell-Empfehlungen
// ============================================

import type { TariffDefinition } from "./tariffEngine";
import { TARIFF_CATALOG, listTariffsByCategory } from "./tariffEngine";
import type { MarginCalculationOutput, ProfitabilityStatus } from "./marginWaterfallEngine";
import { calculateMarginWaterfall } from "./marginWaterfallEngine";
import { getNextTeamDealTier } from "./discountEngine";

/**
 * Upsell-Empfehlung
 */
export interface UpsellRecommendation {
  /** Empfehlungs-Typ */
  type: UpsellType;
  /** Titel */
  title: string;
  /** Beschreibung */
  description: string;
  /** Potenzielle Margen-Steigerung in € */
  potentialMarginGain: number;
  /** Aktion für den Händler */
  action: string;
  /** Priorität (1 = höchste) */
  priority: 1 | 2 | 3;
  /** Icon für UI */
  icon?: string;
}

export type UpsellType = 
  | "tariff_upgrade" 
  | "hardware_downgrade" 
  | "sim_only"
  | "gigakombi" 
  | "teamdeal" 
  | "soho"
  | "term_extension";

/**
 * Context für Upsell-Berechnung
 */
export interface UpsellContext {
  /** Aktueller Tarif */
  currentTariff: TariffDefinition;
  /** Aktuelle Marge pro Vertrag */
  currentMargin: number;
  /** Aktueller Status */
  currentStatus: ProfitabilityStatus;
  /** Anzahl Verträge */
  quantity: number;
  /** Hardware-EK */
  hardwareEK: number;
  /** Vertragslaufzeit */
  termMonths: 24 | 36;
  /** Hat Festnetz? */
  hasFixedNetContract: boolean;
  /** Ist SOHO? */
  isSOHO: boolean;
}

// ============================================
// Main Upsell Engine
// ============================================

/**
 * Generiert Upsell-Empfehlungen basierend auf aktueller Konfiguration
 */
export function getUpsellRecommendations(
  context: UpsellContext
): UpsellRecommendation[] {
  const recommendations: UpsellRecommendation[] = [];
  
  // === 1. Bei negativer Marge: Hardware-Alternativen ===
  if (context.currentStatus === "critical") {
    // Empfehle günstigere Hardware
    if (context.hardwareEK > 300) {
      recommendations.push({
        type: "hardware_downgrade",
        title: "Günstigeres Gerät wählen",
        description: `Mit einem Gerät unter 300€ EK wäre die Marge positiv.`,
        potentialMarginGain: context.hardwareEK - 300,
        action: "Alternative Geräte im mittleren Preissegment vorschlagen",
        priority: 1,
        icon: "smartphone",
      });
    }
    
    // Empfehle SIM-Only
    recommendations.push({
      type: "sim_only",
      title: "SIM-Only anbieten",
      description: `Ohne Hardware beträgt die Marge ca. ${formatCurrency(context.currentMargin + context.hardwareEK)} pro Vertrag.`,
      potentialMarginGain: context.hardwareEK,
      action: "Kunde auf eigenes Gerät oder günstiges Zubehör hinweisen",
      priority: 1,
      icon: "sim-card",
    });
  }
  
  // === 2. Bei geringer Marge: Tarif-Upgrade ===
  if (context.currentStatus !== "positive") {
    const upgradeTariff = findUpgradeTariff(context.currentTariff);
    if (upgradeTariff) {
      const marginGain = estimateTariffUpgradeMarginGain(
        context.currentTariff,
        upgradeTariff,
        context.quantity,
        context.termMonths
      );
      
      if (marginGain > 20) {
        recommendations.push({
          type: "tariff_upgrade",
          title: `Upgrade auf ${upgradeTariff.name}`,
          description: `Höhere Provision bei nur ${upgradeTariff.basePrice - context.currentTariff.basePrice}€/Monat Mehrkosten für den Kunden.`,
          potentialMarginGain: marginGain,
          action: `Vorteile von ${upgradeTariff.name} präsentieren (z.B. mehr Datenvolumen)`,
          priority: 2,
          icon: "trending-up",
        });
      }
    }
  }
  
  // === 3. Kein Festnetz: GigaKombi empfehlen ===
  if (!context.hasFixedNetContract) {
    const gigaKombiSavings = context.quantity >= 5 ? 10 : 5;
    const monthlyProvisionImpact = gigaKombiSavings * 0.1; // ~10% Provision
    const totalGain = monthlyProvisionImpact * context.termMonths;
    
    recommendations.push({
      type: "gigakombi",
      title: "GigaKombi Business aktivieren",
      description: `Mit Festnetz erhält der Kunde ${gigaKombiSavings}€/Monat Rabatt und Sie bauen die Kundenbeziehung aus.`,
      potentialMarginGain: totalGain,
      action: "Festnetz-Bedarf des Kunden erfragen",
      priority: 2,
      icon: "home",
    });
  }
  
  // === 4. TeamDeal-Staffel ===
  const nextTeamDeal = getNextTeamDealTier(context.quantity);
  if (nextTeamDeal && context.quantity < 20) {
    const additionalContracts = nextTeamDeal.requiredContracts - context.quantity;
    const percentageGain = nextTeamDeal.newPercentage - (context.quantity > 1 ? getTeamDealCurrentPercentage(context.quantity) : 0);
    
    recommendations.push({
      type: "teamdeal",
      title: `${additionalContracts} weitere Verträge = ${percentageGain}% mehr Rabatt`,
      description: `Ab ${nextTeamDeal.requiredContracts} Verträgen gilt der TeamDeal ${nextTeamDeal.newPercentage}% Rabatt.`,
      potentialMarginGain: estimateTeamDealGain(context, nextTeamDeal.requiredContracts),
      action: "Weitere Mitarbeiter/Geräte des Kunden erfassen",
      priority: 2,
      icon: "users",
    });
  }
  
  // === 5. SOHO-Status prüfen ===
  if (!context.isSOHO && context.quantity <= 3) {
    recommendations.push({
      type: "soho",
      title: "SOHO-Vorteil prüfen",
      description: "Einzelunternehmer/Freiberufler erhalten 10% Extra-Rabatt auf Airtime.",
      potentialMarginGain: context.currentTariff.basePrice * 0.1 * context.termMonths * context.quantity * 0.1, // ~10% der 10% auf Provision
      action: "Gewerbeanmeldung oder Steuernummer erfragen",
      priority: 3,
      icon: "briefcase",
    });
  }
  
  // === 6. Laufzeit verlängern ===
  if (context.termMonths === 24 && context.hardwareEK > 200) {
    const savings36 = estimateLaufzeitExtensionSavings(context);
    if (savings36 > 30) {
      recommendations.push({
        type: "term_extension",
        title: "36 Monate Laufzeit anbieten",
        description: "Längere Laufzeit = niedrigere Hardware-Zuzahlung für den Kunden.",
        potentialMarginGain: savings36,
        action: "Kunde auf günstigere Monatsrate bei 36 Monaten hinweisen",
        priority: 3,
        icon: "calendar",
      });
    }
  }
  
  // Sortieren nach Priorität und Gain
  return recommendations
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.potentialMarginGain - a.potentialMarginGain;
    })
    .slice(0, 5); // Max 5 Empfehlungen
}

// ============================================
// Helper Functions
// ============================================

function findUpgradeTariff(currentTariff: TariffDefinition): TariffDefinition | undefined {
  const sameCategoryTariffs = listTariffsByCategory(currentTariff.category);
  const tierOrder: Record<string, number> = { S: 1, M: 2, L: 3, XL: 4 };
  const currentTierOrder = tierOrder[currentTariff.tier] ?? 0;
  
  return sameCategoryTariffs.find(
    (t) => (tierOrder[t.tier] ?? 0) === currentTierOrder + 1
  );
}

function estimateTariffUpgradeMarginGain(
  currentTariff: TariffDefinition,
  upgradeTariff: TariffDefinition,
  quantity: number,
  termMonths: number
): number {
  // Höherer Tarif = höhere Provision (vereinfacht: +10€ pro Stufe)
  const provisionDiff = (upgradeTariff.basePrice - currentTariff.basePrice) * 0.1;
  return provisionDiff * termMonths * quantity;
}

function getTeamDealCurrentPercentage(quantity: number): number {
  if (quantity <= 1) return 0;
  if (quantity <= 4) return 5;
  if (quantity <= 9) return 10;
  if (quantity <= 19) return 15;
  return 20;
}

function estimateTeamDealGain(context: UpsellContext, newQuantity: number): number {
  const currentPercent = getTeamDealCurrentPercentage(context.quantity);
  const newPercent = getTeamDealCurrentPercentage(newQuantity);
  const percentGain = newPercent - currentPercent;
  
  // Zusätzliche Provision durch mehr Verträge
  const additionalContracts = newQuantity - context.quantity;
  const provisionPerContract = context.currentTariff.basePrice * 0.1 * context.termMonths;
  
  return additionalContracts * provisionPerContract * (1 + percentGain / 100);
}

function estimateLaufzeitExtensionSavings(context: UpsellContext): number {
  // Bei 36 Monaten ist die Hardware-Subvention höher
  // Grob: 30% weniger Zuzahlung
  return context.hardwareEK * 0.3 * 0.25; // 25% davon als Provisions-Vorteil
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Kurzform-Empfehlung für UI-Badges
 */
export function getQuickRecommendation(
  status: ProfitabilityStatus,
  margin: number
): string | null {
  if (status === "critical") {
    return "💡 SIM-Only oder günstigeres Gerät empfohlen";
  }
  if (status === "warning") {
    return "💡 Tarif-Upgrade könnte Marge verbessern";
  }
  return null;
}

/**
 * Prüft ob Upsell sinnvoll ist
 */
export function hasUpsellPotential(context: UpsellContext): boolean {
  return (
    context.currentStatus !== "positive" ||
    !context.hasFixedNetContract ||
    context.quantity < 5 ||
    !context.isSOHO
  );
}
