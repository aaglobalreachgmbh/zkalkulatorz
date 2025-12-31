// ============================================
// Smart-Engine: Margin Waterfall Calculation
// Modul 1.3 - Komplette Wasserfalllogik
// ============================================

import type { 
  TariffDefinition, 
  ProvisionDefinition, 
  Distributor,
  TariffCategory 
} from "./tariffEngine";
import { getProvisionForDistributor, getHardwareSubsidy } from "./tariffEngine";
import type { DiscountResult } from "./discountEngine";
import { calculateDiscounts, applyPercentageDiscount } from "./discountEngine";
import { calculateHardwareEconomics } from "./hardwareEngine";

/**
 * Input für Margen-Wasserfallberechnung
 */
export interface MarginCalculationInput {
  /** Gewählter Tarif */
  tariff: TariffDefinition;
  /** Anzahl Verträge */
  quantity: number;
  /** Hardware-Einkaufspreis netto */
  hardwareEK: number;
  /** Vertragslaufzeit */
  termMonths: 24 | 36;
  /** Rabatte (optional, wird berechnet wenn nicht übergeben) */
  discounts?: DiscountResult;
  /** Distributor */
  distributor?: Distributor;
  /** Hat Festnetzvertrag? */
  hasFixedNetContract?: boolean;
  /** Ist SOHO-Kunde? */
  isSOHO?: boolean;
  /** Zusatzoptionen */
  additionalOptions?: {
    /** Anzahl Red+ (Multi-SIM) */
    redPlusCount?: number;
    /** OneNumber aktiviert */
    oneNumber?: boolean;
    /** Versicherung aktiviert */
    insurance?: boolean;
  };
}

/**
 * Output der Margen-Wasserfallberechnung
 */
export interface MarginCalculationOutput {
  // === Airtime-Provision ===
  /** Basis-Airtime-Provision pro Monat (vor Rabatten) */
  airtimeProvisionMonthly: number;
  /** Airtime-Provision nach Rabatten pro Monat */
  airtimeProvisionAfterDiscounts: number;
  /** Gesamt-Airtime-Provision über Laufzeit */
  airtimeProvisionTotal: number;
  
  // === Einmal-Provisionen ===
  /** Aktivierungs-Provision */
  activationFeeTotal: number;
  /** Zusatz-Provisionen (Red+, OneNumber, etc.) */
  additionalProvisionsTotal: number;
  
  // === Hardware ===
  /** Hardware-Subvention vom Distributor */
  hardwareSubsidy: number;
  /** Provision auf Hardware */
  hardwareProvision: number;
  /** Hardware-Einkaufspreis */
  hardwareEK: number;
  
  // === Ergebnis ===
  /** Netto-Marge pro Vertrag */
  netMarginPerContract: number;
  /** Netto-Marge gesamt */
  netMarginTotal: number;
  /** Marge in % des Tarifpreises */
  marginPercentage: number;
  
  // === Status ===
  /** Profitability-Status */
  profitabilityStatus: ProfitabilityStatus;
  /** Status-Beschreibung */
  statusDescription: string;
  
  // === Rabatte ===
  /** Angewandte Rabatte */
  discounts: DiscountResult;
  
  // === Breakdown ===
  /** Detaillierte Aufschlüsselung */
  breakdown: MarginBreakdownItem[];
}

/**
 * Profitability-Status (Ampel)
 */
export type ProfitabilityStatus = "positive" | "warning" | "critical";

/**
 * Einzelposten der Margen-Aufschlüsselung
 */
export interface MarginBreakdownItem {
  /** Positionsname */
  label: string;
  /** Betrag (positiv = Einnahme, negativ = Ausgabe) */
  amount: number;
  /** Kategorie */
  category: "provision" | "discount" | "hardware" | "total";
  /** Zusätzliche Info */
  info?: string;
}

// ============================================
// Zusatz-Provisionen Konfiguration
// ============================================

const ADDITIONAL_PROVISIONS = {
  redPlus: 10,      // € pro Multi-SIM
  oneNumber: 15,    // € einmalig
  insurance: 5,     // € einmalig
};

// ============================================
// Main Waterfall Calculation
// ============================================

/**
 * Berechnet komplette Händler-Marge nach Wasserfalllogik
 */
export function calculateMarginWaterfall(
  input: MarginCalculationInput
): MarginCalculationOutput {
  const breakdown: MarginBreakdownItem[] = [];
  const distributor = input.distributor ?? "herweck";
  
  // === Schritt 1: Rabatte berechnen ===
  const discounts = input.discounts ?? calculateDiscounts({
    contractCount: input.quantity,
    hasFixedNetContract: input.hasFixedNetContract ?? false,
    isSOHO: input.isSOHO ?? false,
    distributor,
  });

  // === Schritt 2: Provision-Satz ermitteln ===
  const provisionConfig = getProvisionForDistributor(distributor, input.tariff.category);
  const airtimePercentage = provisionConfig?.airtimePercentage ?? 10;
  const activationFeePerContract = provisionConfig?.activationFee ?? 30;

  // === Schritt 3: Airtime-Provision berechnen ===
  // Basis: Tarif-Preis × Provision-Satz × Anzahl
  const airtimeProvisionMonthlyBase = 
    input.tariff.basePrice * (airtimePercentage / 100) * input.quantity;
  
  breakdown.push({
    label: `Airtime-Provision (${airtimePercentage}% von ${input.tariff.basePrice}€ × ${input.quantity})`,
    amount: airtimeProvisionMonthlyBase,
    category: "provision",
    info: "Pro Monat",
  });

  // === Schritt 4: Prozent-Rabatte abziehen (TeamDeal + SOHO) ===
  const airtimeProvisionAfterPercent = applyPercentageDiscount(
    airtimeProvisionMonthlyBase,
    discounts.totalPercentageDiscount
  );
  
  if (discounts.totalPercentageDiscount > 0) {
    const percentDiscount = airtimeProvisionMonthlyBase - airtimeProvisionAfterPercent;
    breakdown.push({
      label: `Rabatte (${discounts.totalPercentageDiscount}%)`,
      amount: -percentDiscount,
      category: "discount",
      info: "TeamDeal + SOHO auf Airtime",
    });
  }

  // === Schritt 5: GigaKombi-Rabatt abziehen (pauschal) ===
  // GigaKombi reduziert den Kundenpreis, nicht direkt die Provision
  // Aber wir subtrahieren anteilig von der Provision (vereinfacht)
  const gigaKombiImpact = discounts.gigaKombiDiscount * (airtimePercentage / 100);
  const airtimeProvisionAfterGK = airtimeProvisionAfterPercent - gigaKombiImpact;
  
  if (gigaKombiImpact > 0) {
    breakdown.push({
      label: `GigaKombi-Impact (${discounts.gigaKombiDiscount}€/Monat)`,
      amount: -gigaKombiImpact,
      category: "discount",
      info: "Anteilig auf Provision",
    });
  }

  // === Schritt 6: Über Laufzeit multiplizieren ===
  const airtimeProvisionTotal = airtimeProvisionAfterGK * input.termMonths;
  
  breakdown.push({
    label: `Airtime über ${input.termMonths} Monate`,
    amount: airtimeProvisionTotal,
    category: "provision",
  });

  // === Schritt 7: Einmal-Provisionen addieren ===
  const activationFeeTotal = activationFeePerContract * input.quantity;
  
  breakdown.push({
    label: `Aktivierungs-Provision (${activationFeePerContract}€ × ${input.quantity})`,
    amount: activationFeeTotal,
    category: "provision",
  });

  // === Schritt 8: Zusatz-Provisionen (Red+, OneNumber, etc.) ===
  let additionalProvisionsTotal = 0;
  
  if (input.additionalOptions?.redPlusCount) {
    const redPlusProvision = ADDITIONAL_PROVISIONS.redPlus * input.additionalOptions.redPlusCount;
    additionalProvisionsTotal += redPlusProvision;
    breakdown.push({
      label: `Red+ (${input.additionalOptions.redPlusCount}× ${ADDITIONAL_PROVISIONS.redPlus}€)`,
      amount: redPlusProvision,
      category: "provision",
    });
  }
  
  if (input.additionalOptions?.oneNumber) {
    additionalProvisionsTotal += ADDITIONAL_PROVISIONS.oneNumber;
    breakdown.push({
      label: "OneNumber Provision",
      amount: ADDITIONAL_PROVISIONS.oneNumber,
      category: "provision",
    });
  }
  
  if (input.additionalOptions?.insurance) {
    additionalProvisionsTotal += ADDITIONAL_PROVISIONS.insurance;
    breakdown.push({
      label: "Versicherung Provision",
      amount: ADDITIONAL_PROVISIONS.insurance,
      category: "provision",
    });
  }

  // === Schritt 9: Hardware-Provision berechnen ===
  const hwResult = calculateHardwareEconomics({
    hardwareEK: input.hardwareEK,
    subsidyLevel: input.tariff.subsidyLevel,
    termMonths: input.termMonths,
  });
  
  if (hwResult.subsidy > 0) {
    breakdown.push({
      label: `Hardware-Subvention (Sub-Stufe ${input.tariff.subsidyLevel})`,
      amount: hwResult.subsidy,
      category: "hardware",
    });
  }
  
  if (hwResult.provision > 0) {
    breakdown.push({
      label: `Hardware-Provision (${getHardwareSubsidy(input.tariff.subsidyLevel).provisionPercentage}%)`,
      amount: hwResult.provision,
      category: "hardware",
    });
  }

  // === Schritt 10: Hardware-EK subtrahieren ===
  if (input.hardwareEK > 0) {
    breakdown.push({
      label: "Hardware-Einkaufspreis",
      amount: -input.hardwareEK,
      category: "hardware",
    });
  }

  // === Schritt 11: Ergebnis berechnen ===
  const totalProvisions = 
    airtimeProvisionTotal + 
    activationFeeTotal + 
    additionalProvisionsTotal + 
    hwResult.provision;
    
  const totalCosts = input.hardwareEK;
  
  const netMarginTotal = totalProvisions - totalCosts;
  const netMarginPerContract = netMarginTotal / input.quantity;
  
  // Marge in % des Tarifpreises über Laufzeit
  const totalTariffRevenue = input.tariff.basePrice * input.termMonths * input.quantity;
  const marginPercentage = totalTariffRevenue > 0 
    ? (netMarginTotal / totalTariffRevenue) * 100 
    : 0;

  // === Schritt 12: Status bestimmen ===
  const profitabilityStatus = getProfitabilityStatus(netMarginPerContract);
  const statusDescription = getStatusDescription(profitabilityStatus, netMarginPerContract);
  
  breakdown.push({
    label: "Netto-Marge Gesamt",
    amount: netMarginTotal,
    category: "total",
  });

  return {
    airtimeProvisionMonthly: airtimeProvisionMonthlyBase,
    airtimeProvisionAfterDiscounts: airtimeProvisionAfterGK,
    airtimeProvisionTotal,
    activationFeeTotal,
    additionalProvisionsTotal,
    hardwareSubsidy: hwResult.subsidy,
    hardwareProvision: hwResult.provision,
    hardwareEK: input.hardwareEK,
    netMarginPerContract,
    netMarginTotal,
    marginPercentage,
    profitabilityStatus,
    statusDescription,
    discounts,
    breakdown,
  };
}

/**
 * Bestimmt Profitability-Status (Ampel)
 */
export function getProfitabilityStatus(marginPerContract: number): ProfitabilityStatus {
  if (marginPerContract > 50) return "positive";
  if (marginPerContract >= 0) return "warning";
  return "critical";
}

/**
 * Status-Beschreibung für UI
 */
export function getStatusDescription(
  status: ProfitabilityStatus,
  marginPerContract: number
): string {
  switch (status) {
    case "positive":
      return `Gute Marge: ${formatCurrency(marginPerContract)} pro Vertrag`;
    case "warning":
      return `Geringe Marge: ${formatCurrency(marginPerContract)} pro Vertrag`;
    case "critical":
      return `Verlust: ${formatCurrency(marginPerContract)} pro Vertrag – Hardware subventioniert`;
  }
}

/**
 * Formatiert Währung
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Status-Farbe für UI
 */
export function getStatusColor(status: ProfitabilityStatus): string {
  switch (status) {
    case "positive": return "text-green-600";
    case "warning": return "text-yellow-600";
    case "critical": return "text-red-600";
  }
}

/**
 * Status-Badge-Variante
 */
export function getStatusBadgeVariant(
  status: ProfitabilityStatus
): "default" | "secondary" | "destructive" {
  switch (status) {
    case "positive": return "default";
    case "warning": return "secondary";
    case "critical": return "destructive";
  }
}
