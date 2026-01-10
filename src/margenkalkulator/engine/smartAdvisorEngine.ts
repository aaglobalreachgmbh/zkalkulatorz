// ============================================
// Smart-Advisor Engine
// Findet optimale Tarifkonfigurationen:
// Niedriger Kundenpreis + Maximale Händler-Marge
// ============================================

import type {
  OfferOptionState,
  CalculationResult,
  MobileTariff,
  SubVariant,
  Promo,
  ContractType,
} from "./types";
import { calculateOffer } from "./offer";
import {
  listMobileTariffs,
  listSubVariants,
  listPromos,
  getActiveDataset,
} from "./catalogResolver";
import { isPromoValid } from "./calculators/promo";

// ============================================
// Types
// ============================================

export type RecommendationType = 
  | "sim_only"           // Gleicher Tarif ohne Hardware
  | "cheaper_hardware"   // Gleicher Tarif mit günstigerer Hardware
  | "tariff_downgrade"   // Kleinerer Tarif mit genug Daten
  | "tariff_upgrade"     // Größerer Tarif mit besserer Provision
  | "teamdeal"           // Mehrere kleinere Tarife
  | "gigakombi"          // Mit Festnetz-Kombi
  | "promo"              // Aktive Promo nutzen
  | "bundle";            // Multi-Tarif-Bundle

export interface AlternativeConfig {
  tariffId: string;
  tariffName: string;
  quantity: number;
  subVariantId: string;
  promoId?: string;
  hardwareOption: "same" | "sim_only" | "cheaper";
  hardwareEkNet: number;
}

export interface SmartRecommendation {
  id: string;
  type: RecommendationType;
  configuration: AlternativeConfig[];
  customerMonthly: number;      // Was der Kunde Ø zahlt
  dealerMargin: number;         // Was der Händler verdient
  marginGain: number;           // Zusätzliche Marge vs. aktuell
  customerSavings: number;      // Ersparnis für Kunde vs. aktuell
  score: number;                // Kombinierter Score (0-100)
  reason: string;               // Kurze Erklärung
  details: string;              // Ausführliche Erklärung
  priority: number;             // Sortierreihenfolge (niedriger = besser)
}

export interface SmartAdvisorConstraints {
  maxCustomerPrice?: number;     // Kunde darf nicht mehr zahlen
  minMargin?: number;            // Mindest-Marge
  sameHardware?: boolean;        // Hardware beibehalten
  maxAlternatives?: number;      // Max. Anzahl Vorschläge
}

export interface SmartAdvisorResult {
  recommendations: SmartRecommendation[];
  hasBetterOptions: boolean;
  bestRecommendation: SmartRecommendation | null;
  currentBaseline: {
    customerMonthly: number;
    dealerMargin: number;
  };
}

// ============================================
// Main Function
// ============================================

/**
 * Findet optimale Tarifkonfigurationen
 * Pareto-optimal: Niedrigster Kundenpreis + Höchste Marge
 */
export function findOptimalConfigurations(
  currentConfig: OfferOptionState,
  currentResult: CalculationResult,
  constraints: SmartAdvisorConstraints = {}
): SmartAdvisorResult {
  const {
    maxCustomerPrice = currentResult.totals.avgTermNet * 1.1, // Max 10% teurer
    minMargin = -Infinity,
    sameHardware = false,
    maxAlternatives = 5,
  } = constraints;

  const baseline = {
    customerMonthly: currentResult.totals.avgTermNet,
    dealerMargin: currentResult.dealer.margin,
  };

  const recommendations: SmartRecommendation[] = [];
  const asOfISO = currentConfig.meta.asOfISO;

  // Get catalog data
  const catalog = getActiveDataset();
  const allTariffs = catalog.mobileTariffs;
  const allSubVariants = catalog.subVariants;
  const allPromos = catalog.promos.filter(p => isPromoValid(p, asOfISO));

  // 1. SIM-Only Alternative (wenn Hardware gewählt)
  if (currentConfig.hardware.ekNet > 0) {
    const simOnlyRec = generateSimOnlyAlternative(
      currentConfig,
      currentResult,
      baseline
    );
    if (simOnlyRec && simOnlyRec.dealerMargin > baseline.dealerMargin) {
      recommendations.push(simOnlyRec);
    }
  }

  // 2. Günstigere Hardware Alternative
  if (currentConfig.hardware.ekNet > 200) {
    const cheaperHwRec = generateCheaperHardwareAlternative(
      currentConfig,
      currentResult,
      baseline
    );
    if (cheaperHwRec && cheaperHwRec.dealerMargin > baseline.dealerMargin) {
      recommendations.push(cheaperHwRec);
    }
  }

  // 3. Tarif-Alternativen (gleiches Datenvolumen, bessere Marge)
  const tariffAlternatives = generateTariffAlternatives(
    currentConfig,
    currentResult,
    baseline,
    allTariffs,
    maxCustomerPrice
  );
  recommendations.push(...tariffAlternatives);

  // 4. TeamDeal-Alternative (mehrere kleinere Tarife)
  if (currentConfig.mobile.quantity === 1) {
    const teamDealRec = generateTeamDealAlternative(
      currentConfig,
      currentResult,
      baseline,
      allTariffs
    );
    if (teamDealRec && teamDealRec.marginGain > 50) {
      recommendations.push(teamDealRec);
    }
  }

  // 5. Promo-Alternativen
  const promoAlternatives = generatePromoAlternatives(
    currentConfig,
    currentResult,
    baseline,
    allPromos
  );
  recommendations.push(...promoAlternatives);

  // 6. GigaKombi-Alternative (wenn kein Festnetz)
  if (!currentConfig.fixedNet.enabled) {
    const gkRec = generateGigaKombiAlternative(
      currentConfig,
      currentResult,
      baseline
    );
    if (gkRec && gkRec.marginGain > 0) {
      recommendations.push(gkRec);
    }
  }

  // Filter: Nur bessere Alternativen
  const betterRecs = recommendations.filter(rec => {
    // Muss entweder bessere Marge ODER niedrigeren Kundenpreis haben
    const betterMargin = rec.marginGain > 10; // Mindestens 10€ mehr
    const betterPrice = rec.customerSavings > 2; // Mindestens 2€ günstiger
    const withinPriceLimit = rec.customerMonthly <= maxCustomerPrice;
    const meetsMinMargin = rec.dealerMargin >= minMargin;
    
    return (betterMargin || betterPrice) && withinPriceLimit && meetsMinMargin;
  });

  // Sortieren nach Score (höher = besser)
  betterRecs.sort((a, b) => b.score - a.score);

  // Limit
  const finalRecs = betterRecs.slice(0, maxAlternatives);

  return {
    recommendations: finalRecs,
    hasBetterOptions: finalRecs.length > 0,
    bestRecommendation: finalRecs[0] || null,
    currentBaseline: baseline,
  };
}

// ============================================
// Alternative Generators
// ============================================

function generateSimOnlyAlternative(
  currentConfig: OfferOptionState,
  currentResult: CalculationResult,
  baseline: { customerMonthly: number; dealerMargin: number }
): SmartRecommendation | null {
  // Berechne mit SIM-Only
  const simOnlyConfig: OfferOptionState = {
    ...currentConfig,
    hardware: {
      name: "SIM Only",
      ekNet: 0,
      amortize: false,
      amortMonths: 24,
    },
    mobile: {
      ...currentConfig.mobile,
      subVariantId: "SIM_ONLY",
    },
  };

  const simOnlyResult = calculateOffer(simOnlyConfig);
  const marginGain = simOnlyResult.dealer.margin - baseline.dealerMargin;
  const customerSavings = baseline.customerMonthly - simOnlyResult.totals.avgTermNet;

  if (marginGain <= 0) return null;

  // Score: Gewichtung Marge (70%) + Kundenersparnis (30%)
  const normalizedMarginGain = Math.min(marginGain / 500, 1); // Max 500€ Gain = 1
  const normalizedSavings = Math.min(customerSavings / 30, 1); // Max 30€ Ersparnis = 1
  const score = (normalizedMarginGain * 0.7 + normalizedSavings * 0.3) * 100;

  return {
    id: "sim_only_" + Date.now(),
    type: "sim_only",
    configuration: [{
      tariffId: currentConfig.mobile.tariffId,
      tariffName: getTariffName(currentConfig.mobile.tariffId),
      quantity: currentConfig.mobile.quantity,
      subVariantId: "SIM_ONLY",
      hardwareOption: "sim_only",
      hardwareEkNet: 0,
    }],
    customerMonthly: simOnlyResult.totals.avgTermNet,
    dealerMargin: simOnlyResult.dealer.margin,
    marginGain,
    customerSavings,
    score,
    reason: `SIM-Only spart ${customerSavings.toFixed(0)}€/mtl.`,
    details: `Ohne Hardware-Subvention steigt Ihre Marge um ${marginGain.toFixed(0)}€. Ideal wenn der Kunde bereits ein Gerät hat.`,
    priority: 1,
  };
}

function generateCheaperHardwareAlternative(
  currentConfig: OfferOptionState,
  currentResult: CalculationResult,
  baseline: { customerMonthly: number; dealerMargin: number }
): SmartRecommendation | null {
  // Simuliere günstigere Hardware (50% des aktuellen EK)
  const cheaperEk = Math.round(currentConfig.hardware.ekNet * 0.5);
  
  const cheaperConfig: OfferOptionState = {
    ...currentConfig,
    hardware: {
      ...currentConfig.hardware,
      name: "Günstigeres Gerät",
      ekNet: cheaperEk,
    },
  };

  const cheaperResult = calculateOffer(cheaperConfig);
  const marginGain = cheaperResult.dealer.margin - baseline.dealerMargin;
  const customerSavings = baseline.customerMonthly - cheaperResult.totals.avgTermNet;

  if (marginGain <= 50) return null; // Mindestens 50€ Gewinn

  const score = Math.min(marginGain / 300, 1) * 100;

  return {
    id: "cheaper_hw_" + Date.now(),
    type: "cheaper_hardware",
    configuration: [{
      tariffId: currentConfig.mobile.tariffId,
      tariffName: getTariffName(currentConfig.mobile.tariffId),
      quantity: currentConfig.mobile.quantity,
      subVariantId: currentConfig.mobile.subVariantId,
      hardwareOption: "cheaper",
      hardwareEkNet: cheaperEk,
    }],
    customerMonthly: cheaperResult.totals.avgTermNet,
    dealerMargin: cheaperResult.dealer.margin,
    marginGain,
    customerSavings,
    score,
    reason: `Günstigeres Gerät: +${marginGain.toFixed(0)}€ Marge`,
    details: `Mit einem günstigeren Gerät (EK ${cheaperEk}€ statt ${currentConfig.hardware.ekNet}€) steigt Ihre Marge deutlich.`,
    priority: 2,
  };
}

function generateTariffAlternatives(
  currentConfig: OfferOptionState,
  currentResult: CalculationResult,
  baseline: { customerMonthly: number; dealerMargin: number },
  allTariffs: MobileTariff[],
  maxCustomerPrice: number
): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];
  const currentTariff = allTariffs.find(t => t.id === currentConfig.mobile.tariffId);
  
  if (!currentTariff) return recommendations;

  // Finde Tarife mit besserer Provision bei ähnlichem Preis
  const currentDataGB = typeof currentTariff.dataVolumeGB === 'number' ? currentTariff.dataVolumeGB : 999;
  
  const alternativeTariffs = allTariffs.filter(t => {
    // Nicht der aktuelle Tarif
    if (t.id === currentTariff.id) return false;
    // Ähnliches Datenvolumen (mindestens 80%)
    const altDataGB = typeof t.dataVolumeGB === 'number' ? t.dataVolumeGB : 999;
    const dataRatio = altDataGB / currentDataGB;
    if (dataRatio < 0.8) return false;
    // Nicht viel teurer
    if (t.baseNet > currentTariff.baseNet * 1.2) return false;
    return true;
  });

  for (const altTariff of alternativeTariffs.slice(0, 3)) {
    const altConfig: OfferOptionState = {
      ...currentConfig,
      mobile: {
        ...currentConfig.mobile,
        tariffId: altTariff.id,
      },
    };

    const altResult = calculateOffer(altConfig);
    const marginGain = altResult.dealer.margin - baseline.dealerMargin;
    const customerSavings = baseline.customerMonthly - altResult.totals.avgTermNet;

    if (marginGain > 20 && altResult.totals.avgTermNet <= maxCustomerPrice) {
      const score = (marginGain / 200 + Math.max(0, customerSavings) / 20) * 50;
      
      recommendations.push({
        id: `tariff_${altTariff.id}_${Date.now()}`,
        type: customerSavings > 0 ? "tariff_downgrade" : "tariff_upgrade",
        configuration: [{
          tariffId: altTariff.id,
          tariffName: altTariff.name,
          quantity: currentConfig.mobile.quantity,
          subVariantId: currentConfig.mobile.subVariantId,
          hardwareOption: "same",
          hardwareEkNet: currentConfig.hardware.ekNet,
        }],
        customerMonthly: altResult.totals.avgTermNet,
        dealerMargin: altResult.dealer.margin,
        marginGain,
        customerSavings,
        score,
        reason: `${altTariff.name}: ${marginGain > 0 ? '+' : ''}${marginGain.toFixed(0)}€ Marge`,
        details: `${altTariff.name} bietet ${typeof altTariff.dataVolumeGB === 'number' ? altTariff.dataVolumeGB + 'GB' : 'unbegrenzt'}GB und eine bessere Provisions-Struktur.`,
        priority: 3,
      });
    }
  }

  return recommendations;
}

function generateTeamDealAlternative(
  currentConfig: OfferOptionState,
  currentResult: CalculationResult,
  baseline: { customerMonthly: number; dealerMargin: number },
  allTariffs: MobileTariff[]
): SmartRecommendation | null {
  // TeamDeal: 2 kleinere Tarife statt 1 großer
  const currentTariff = allTariffs.find(t => t.id === currentConfig.mobile.tariffId);
  if (!currentTariff) return null;

  // Finde einen kleineren Tarif aus der gleichen Familie
  const currentDataGB = typeof currentTariff.dataVolumeGB === 'number' ? currentTariff.dataVolumeGB : 999;
  
  const smallerTariff = allTariffs.find(t => 
    t.family === currentTariff.family &&
    t.baseNet < currentTariff.baseNet &&
    (typeof t.dataVolumeGB === 'number' ? t.dataVolumeGB : 999) >= (currentDataGB * 0.5)
  );

  if (!smallerTariff) return null;

  // Simuliere 2x den kleineren Tarif
  const teamDealConfig: OfferOptionState = {
    ...currentConfig,
    mobile: {
      ...currentConfig.mobile,
      tariffId: smallerTariff.id,
      quantity: 2,
    },
  };

  const teamDealResult = calculateOffer(teamDealConfig);
  
  // Bei TeamDeal: Gesamtpreis für alle Verträge
  const totalCustomerMonthly = teamDealResult.totals.avgTermNet;
  const totalDealerMargin = teamDealResult.dealer.margin;
  
  const marginGain = totalDealerMargin - baseline.dealerMargin;
  const customerDiff = totalCustomerMonthly - baseline.customerMonthly;

  // Nur empfehlen wenn signifikant besser
  if (marginGain < 100) return null;

  const score = Math.min(marginGain / 400, 1) * 80;

  return {
    id: "teamdeal_" + Date.now(),
    type: "teamdeal",
    configuration: [{
      tariffId: smallerTariff.id,
      tariffName: smallerTariff.name,
      quantity: 2,
      subVariantId: currentConfig.mobile.subVariantId,
      hardwareOption: "same",
      hardwareEkNet: currentConfig.hardware.ekNet,
    }],
    customerMonthly: totalCustomerMonthly,
    dealerMargin: totalDealerMargin,
    marginGain,
    customerSavings: -customerDiff, // Negativ wenn teurer
    score,
    reason: `TeamDeal: 2× ${smallerTariff.name} für +${marginGain.toFixed(0)}€ Marge`,
    details: `Zwei ${smallerTariff.name} Tarife im TeamDeal bieten zusammen mehr Datenvolumen und höhere Gesamtprovision als ein einzelner ${currentTariff.name}.`,
    priority: 4,
  };
}

function generatePromoAlternatives(
  currentConfig: OfferOptionState,
  currentResult: CalculationResult,
  baseline: { customerMonthly: number; dealerMargin: number },
  validPromos: Promo[]
): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];
  
  // Nur wenn aktuell keine Promo aktiv
  if (currentConfig.mobile.promoId && currentConfig.mobile.promoId !== "NONE") {
    return recommendations;
  }

  // Finde passende Promos für den aktuellen Tarif
  const applicablePromos = validPromos.filter(p => {
    if (!p.appliesToTariffs) return true;
    if (p.appliesToTariffs === "*") return true;
    return p.appliesToTariffs.includes(currentConfig.mobile.tariffId);
  });

  for (const promo of applicablePromos.slice(0, 2)) {
    const promoConfig: OfferOptionState = {
      ...currentConfig,
      mobile: {
        ...currentConfig.mobile,
        promoId: promo.id,
      },
    };

    const promoResult = calculateOffer(promoConfig);
    const marginGain = promoResult.dealer.margin - baseline.dealerMargin;
    const customerSavings = baseline.customerMonthly - promoResult.totals.avgTermNet;

    // Promos können die Marge reduzieren - nur empfehlen wenn Kunde spart und Marge akzeptabel
    if (customerSavings > 5 && marginGain > -50) {
      const score = (customerSavings / 20 + Math.max(0, marginGain) / 100) * 40;

      recommendations.push({
        id: `promo_${promo.id}_${Date.now()}`,
        type: "promo",
        configuration: [{
          tariffId: currentConfig.mobile.tariffId,
          tariffName: getTariffName(currentConfig.mobile.tariffId),
          quantity: currentConfig.mobile.quantity,
          subVariantId: currentConfig.mobile.subVariantId,
          promoId: promo.id,
          hardwareOption: "same",
          hardwareEkNet: currentConfig.hardware.ekNet,
        }],
        customerMonthly: promoResult.totals.avgTermNet,
        dealerMargin: promoResult.dealer.margin,
        marginGain,
        customerSavings,
        score,
        reason: `${promo.label}: Kunde spart ${customerSavings.toFixed(0)}€/mtl.`,
        details: `Mit der Aktion "${promo.label}" spart der Kunde ${customerSavings.toFixed(0)}€ pro Monat. ${marginGain >= 0 ? 'Ihre Marge bleibt stabil.' : `Ihre Marge reduziert sich um ${Math.abs(marginGain).toFixed(0)}€.`}`,
        priority: 5,
      });
    }
  }

  return recommendations;
}

function generateGigaKombiAlternative(
  currentConfig: OfferOptionState,
  currentResult: CalculationResult,
  baseline: { customerMonthly: number; dealerMargin: number }
): SmartRecommendation | null {
  // Simuliere mit Festnetz
  const gkConfig: OfferOptionState = {
    ...currentConfig,
    fixedNet: {
      enabled: true,
      productId: "CABLE_100", // Standard-Festnetz
      accessType: "CABLE",
    },
  };

  const gkResult = calculateOffer(gkConfig);
  
  // GigaKombi addiert Festnetz-Kosten, aber auch Festnetz-Provision
  const marginGain = gkResult.dealer.margin - baseline.dealerMargin;
  const additionalCost = gkResult.totals.avgTermNet - baseline.customerMonthly;

  // Nur empfehlen wenn Marge deutlich steigt
  if (marginGain < 50) return null;

  const score = (marginGain / 150) * 60;

  return {
    id: "gigakombi_" + Date.now(),
    type: "gigakombi",
    configuration: [{
      tariffId: currentConfig.mobile.tariffId,
      tariffName: getTariffName(currentConfig.mobile.tariffId),
      quantity: currentConfig.mobile.quantity,
      subVariantId: currentConfig.mobile.subVariantId,
      hardwareOption: "same",
      hardwareEkNet: currentConfig.hardware.ekNet,
    }],
    customerMonthly: gkResult.totals.avgTermNet,
    dealerMargin: gkResult.dealer.margin,
    marginGain,
    customerSavings: -additionalCost, // Negativ = teurer
    score,
    reason: `Mit GigaKombi: +${marginGain.toFixed(0)}€ Marge`,
    details: `Mit Festnetz-Kombi erhalten Sie zusätzliche Provision. Der Kunde bekommt 5€ GigaKombi-Rabatt auf den Mobilfunktarif und baut eine stärkere Kundenbindung auf.`,
    priority: 6,
  };
}

// ============================================
// Helpers
// ============================================

function getTariffName(tariffId: string): string {
  const catalog = getActiveDataset();
  const tariff = catalog.mobileTariffs.find(t => t.id === tariffId);
  return tariff?.name ?? tariffId;
}

/**
 * Quick check if there are better options available
 * Faster than full analysis for UI badges
 */
export function hasOptimizationPotential(
  currentConfig: OfferOptionState,
  currentResult: CalculationResult
): boolean {
  // Quick checks without full calculation
  
  // 1. Hardware mit hohem EK = SIM-Only würde helfen
  if (currentConfig.hardware.ekNet > 300 && currentResult.dealer.margin < 200) {
    return true;
  }
  
  // 2. Keine Promo aktiv bei niedrigem Margin
  if (
    (!currentConfig.mobile.promoId || currentConfig.mobile.promoId === "NONE") &&
    currentResult.dealer.margin < 100
  ) {
    return true;
  }
  
  // 3. Kein Festnetz = GigaKombi-Potenzial
  if (!currentConfig.fixedNet.enabled && currentResult.dealer.margin < 300) {
    return true;
  }
  
  // 4. Negative Marge = definitiv Optimierungsbedarf
  if (currentResult.dealer.margin < 0) {
    return true;
  }
  
  return false;
}

/**
 * Get a quick summary of the best optimization opportunity
 */
export function getQuickOptimizationHint(
  currentConfig: OfferOptionState,
  currentResult: CalculationResult
): string | null {
  if (currentResult.dealer.margin < 0) {
    if (currentConfig.hardware.ekNet > 500) {
      return "Mit SIM-Only oder günstigerem Gerät wird die Marge positiv";
    }
    return "Prüfen Sie alternative Tarifoptionen für positive Marge";
  }
  
  if (currentConfig.hardware.ekNet > 500 && currentResult.dealer.margin < 100) {
    return "SIM-Only würde Ihre Marge deutlich erhöhen";
  }
  
  if (!currentConfig.fixedNet.enabled && currentResult.dealer.margin < 200) {
    return "Mit GigaKombi könnten Sie zusätzliche Provision erhalten";
  }
  
  return null;
}
