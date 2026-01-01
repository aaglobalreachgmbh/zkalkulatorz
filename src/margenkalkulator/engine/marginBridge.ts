// ============================================
// Margin Bridge: Legacy-to-SmartEngine Adapter
// Verbindet bestehende CalculationResult mit MarginWaterfall
// ============================================

import type { TariffDefinition, Distributor } from "./tariffEngine";
import { TARIFF_CATALOG, getProvisionForDistributor } from "./tariffEngine";
import type { MarginCalculationInput, MarginCalculationOutput } from "./marginWaterfallEngine";
import { calculateMarginWaterfall } from "./marginWaterfallEngine";
import type { DiscountResult } from "./discountEngine";
import { calculateDiscounts } from "./discountEngine";
import type { UpsellContext, UpsellRecommendation } from "./upsellEngine";
import { getUpsellRecommendations } from "./upsellEngine";

/**
 * Bridge-Options für die Konvertierung
 */
export interface BridgeOptions {
  /** Tarif-ID oder -Name */
  tariffId?: string;
  /** Anzahl Verträge */
  quantity: number;
  /** Hardware-EK */
  hardwareEK: number;
  /** Hardware-Name */
  hardwareName?: string;
  /** Vertragslaufzeit */
  termMonths: 24 | 36;
  /** Distributor */
  distributor?: Distributor;
  /** Hat Festnetz? */
  hasFixedNetContract?: boolean;
  /** Ist SOHO? */
  isSOHO?: boolean;
  /** Zusatzoptionen */
  additionalOptions?: {
    redPlusCount?: number;
    oneNumber?: boolean;
    insurance?: boolean;
  };
}

/**
 * Findet Tarif anhand ID oder Name
 */
export function findTariff(idOrName: string): TariffDefinition | undefined {
  return TARIFF_CATALOG.find(
    (t) => t.id === idOrName || t.name.toLowerCase() === idOrName.toLowerCase()
  );
}

/**
 * Erstellt MarginCalculationInput aus Bridge-Options
 */
export function createMarginInput(options: BridgeOptions): MarginCalculationInput | null {
  const tariff = options.tariffId 
    ? findTariff(options.tariffId) 
    : TARIFF_CATALOG[0]; // Fallback auf ersten Tarif
  
  if (!tariff) return null;

  const discounts = calculateDiscounts({
    contractCount: options.quantity,
    hasFixedNetContract: options.hasFixedNetContract ?? false,
    isSOHO: options.isSOHO ?? false,
    distributor: options.distributor ?? "herweck",
  });

  return {
    tariff,
    quantity: options.quantity,
    hardwareEK: options.hardwareEK,
    termMonths: options.termMonths,
    discounts,
    distributor: options.distributor,
    hasFixedNetContract: options.hasFixedNetContract,
    isSOHO: options.isSOHO,
    additionalOptions: options.additionalOptions,
  };
}

/**
 * Vollständige Bridge-Funktion:
 * Konvertiert einfache Optionen zu vollständigem MarginCalculationOutput
 */
export function bridgeToMarginWaterfall(
  options: BridgeOptions
): MarginCalculationOutput | null {
  const input = createMarginInput(options);
  if (!input) return null;
  
  return calculateMarginWaterfall(input);
}

/**
 * Erstellt Upsell-Context aus Bridge-Options und Margin-Result
 */
export function createUpsellContext(
  options: BridgeOptions,
  marginResult: MarginCalculationOutput
): UpsellContext | null {
  const tariff = options.tariffId 
    ? findTariff(options.tariffId) 
    : TARIFF_CATALOG[0];
  
  if (!tariff) return null;

  return {
    currentTariff: tariff,
    currentMargin: marginResult.netMarginPerContract,
    currentStatus: marginResult.profitabilityStatus,
    quantity: options.quantity,
    hardwareEK: options.hardwareEK,
    termMonths: options.termMonths,
    hasFixedNetContract: options.hasFixedNetContract ?? false,
    isSOHO: options.isSOHO ?? false,
  };
}

/**
 * Vollständige Bridge mit Upsell-Empfehlungen
 */
export function bridgeWithUpsells(
  options: BridgeOptions
): {
  marginResult: MarginCalculationOutput;
  recommendations: UpsellRecommendation[];
  tariff: TariffDefinition;
} | null {
  const marginResult = bridgeToMarginWaterfall(options);
  if (!marginResult) return null;

  const tariff = options.tariffId 
    ? findTariff(options.tariffId) 
    : TARIFF_CATALOG[0];
  if (!tariff) return null;

  const upsellContext = createUpsellContext(options, marginResult);
  if (!upsellContext) return null;

  const recommendations = getUpsellRecommendations(upsellContext);

  return {
    marginResult,
    recommendations,
    tariff,
  };
}

/**
 * Quick-Access: Berechnet nur Status ohne vollständige Waterfall
 */
export function getQuickProfitabilityStatus(
  options: Omit<BridgeOptions, "additionalOptions">
): {
  status: "positive" | "warning" | "critical";
  margin: number;
  description: string;
} {
  const result = bridgeToMarginWaterfall(options);
  if (!result) {
    return {
      status: "critical",
      margin: 0,
      description: "Kalkulation fehlgeschlagen",
    };
  }

  return {
    status: result.profitabilityStatus,
    margin: result.netMarginPerContract,
    description: result.statusDescription,
  };
}

/**
 * Vergleicht zwei Konfigurationen
 */
export function compareConfigurations(
  optionA: BridgeOptions,
  optionB: BridgeOptions
): {
  optionA: MarginCalculationOutput;
  optionB: MarginCalculationOutput;
  difference: number;
  winner: "A" | "B" | "tie";
} | null {
  const resultA = bridgeToMarginWaterfall(optionA);
  const resultB = bridgeToMarginWaterfall(optionB);

  if (!resultA || !resultB) return null;

  const difference = resultB.netMarginTotal - resultA.netMarginTotal;

  return {
    optionA: resultA,
    optionB: resultB,
    difference,
    winner: difference > 0 ? "B" : difference < 0 ? "A" : "tie",
  };
}
