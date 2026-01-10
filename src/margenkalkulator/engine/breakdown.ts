// ============================================
// Breakdown Generation Module
// Generates detailed cost breakdowns for offers
// ============================================

import type {
  OfferOptionState,
  BreakdownItem,
  DealerEconomics,
  MobileTariff,
  Promo,
  SubVariant,
  FixedNetProduct,
} from "./types";
import { calculateGross } from "./periods";
import { isPromoValid, isFixedPromoValid, calculateHardwareAmortization } from "./calculators";
import { FIXED_NET_FEES, TEAMDEAL_FALLBACK } from "../config";

// ============================================
// Breakdown Generation
// ============================================

/**
 * Generate breakdown items for explainability
 * Slice B: Added promo_expired handling
 */
export function generateBreakdown(
  state: OfferOptionState,
  tariff: MobileTariff | undefined,
  subVariant: SubVariant | undefined,
  promo: Promo | undefined,
  fixedProduct: FixedNetProduct | undefined,
  dealer: DealerEconomics,
  gkEligible: boolean
): BreakdownItem[] {
  const breakdown: BreakdownItem[] = [];
  const { vatRate, asOfISO } = state.meta;
  
  // Mobile base
  if (tariff) {
    breakdown.push({
      key: "mobile_base",
      label: `${tariff.name} Grundpreis`,
      appliesTo: "monthly",
      net: tariff.baseNet * state.mobile.quantity,
      gross: calculateGross(tariff.baseNet * state.mobile.quantity, vatRate),
      ruleId: "base",
    });
    
    // SUB add-on
    if (subVariant && subVariant.monthlyAddNet > 0) {
      breakdown.push({
        key: "mobile_sub",
        label: `${subVariant.label} Aufpreis`,
        appliesTo: "monthly",
        net: subVariant.monthlyAddNet * state.mobile.quantity,
        gross: calculateGross(subVariant.monthlyAddNet * state.mobile.quantity, vatRate),
        ruleId: "sub_add",
      });
    }
    
    // Promo handling (Slice B: check validity)
    if (promo && promo.type !== "NONE") {
      const promoValid = isPromoValid(promo, asOfISO);
      
      if (!promoValid) {
        // Slice B: Expired promo warning
        breakdown.push({
          key: "mobile_promo_expired",
          label: `${promo.label} – Promo abgelaufen, nicht angewendet`,
          appliesTo: "monthly",
          net: 0,
          ruleId: "promo_expired",
        });
      } else {
        // Active promo
        const promoLabel = promo.type === "INTRO_PRICE" 
          ? `Intro-Preis (${promo.durationMonths} Monate)`
          : promo.type === "ABS_OFF_BASE"
            ? `${promo.label} (${promo.durationMonths} Monate)`
            : promo.id === "OMO25"
              ? "OMO 25% Dauerrabatt"
              : `${promo.value * 100}% Rabatt auf Base (${promo.durationMonths} Monate)`;
        
        const ruleId = promo.type === "ABS_OFF_BASE" 
          ? "promo_abs_off_base"
          : promo.id === "OMO25" 
            ? "promo_omo25" 
            : promo.type === "INTRO_PRICE" 
              ? "promo_intro" 
              : "promo_pct_off_base";
        
        breakdown.push({
          key: "mobile_promo",
          label: promoLabel,
          appliesTo: "monthly",
          periodRef: `1-${promo.durationMonths}`,
          net: 0, // Calculated in periods
          ruleId,
        });
      }
    }
    
    // GK Eligibility Badge (Phase 2)
    if (gkEligible) {
      breakdown.push({
        key: "gk_benefit",
        label: "GK Konvergenz: Unlimited möglich",
        appliesTo: "monthly",
        net: 0,
        ruleId: "gk_eligible",
      });
    }
    
    // Slice C: TeamDeal fallback warning
    if (tariff.family === "teamdeal" && !state.mobile.primeOnAccount) {
      breakdown.push({
        key: "teamdeal_fallback",
        label: `TeamDeal Fallback: Ohne Prime → Smart Business Plus (${TEAMDEAL_FALLBACK.DATA_GB} GB / ${TEAMDEAL_FALLBACK.PRICE_NET}€)`,
        appliesTo: "monthly",
        net: TEAMDEAL_FALLBACK.PRICE_NET * state.mobile.quantity,
        ruleId: "teamdeal_fallback_no_prime",
      });
    }
  }
  
  // Fixed net
  if (state.fixedNet.enabled && fixedProduct) {
    breakdown.push({
      key: "fixed_monthly",
      label: `${fixedProduct.name} monatlich`,
      appliesTo: "monthly",
      net: fixedProduct.monthlyNet,
      gross: calculateGross(fixedProduct.monthlyNet, vatRate),
      ruleId: "fixed_base",
    });
    
    // Fixed one-time (Phase 2: split into Bereitstellung + Versand)
    if (fixedProduct.setupWaived) {
      breakdown.push({
        key: "fixed_onetime_waived",
        label: "Bereitstellung erlassen",
        appliesTo: "oneTime",
        net: 0,
        gross: 0,
        ruleId: "fixed_setup_waived",
      });
    } else if (fixedProduct.oneTimeNet > 0) {
      // Split into Bereitstellung + Versand
      breakdown.push({
        key: "fixed_setup",
        label: "Bereitstellung",
        appliesTo: "oneTime",
        net: FIXED_NET_FEES.SETUP_NET,
        gross: calculateGross(FIXED_NET_FEES.SETUP_NET, vatRate),
        ruleId: "fixed_setup",
      });
      breakdown.push({
        key: "fixed_shipping",
        label: "Versand Hardware",
        appliesTo: "oneTime",
        net: FIXED_NET_FEES.SHIPPING_NET,
        gross: calculateGross(FIXED_NET_FEES.SHIPPING_NET, vatRate),
        ruleId: "fixed_shipping",
      });
    }

    // Expert Setup add-on (Cable only)
    if (state.fixedNet.expertSetupEnabled) {
      breakdown.push({
        key: "fixed_expert_setup",
        label: "Experten-Service Einrichtung",
        appliesTo: "oneTime",
        net: FIXED_NET_FEES.EXPERT_SETUP_NET,
        gross: calculateGross(FIXED_NET_FEES.EXPERT_SETUP_NET, vatRate),
        ruleId: "fixed_expert_setup",
      });
    }
    
    // Fixed IP add-on
    if (state.fixedNet.fixedIpEnabled && fixedProduct.fixedIpAddonNet) {
      breakdown.push({
        key: "fixed_ip_addon",
        label: "Feste IP-Adresse",
        appliesTo: "monthly",
        net: fixedProduct.fixedIpAddonNet,
        gross: calculateGross(fixedProduct.fixedIpAddonNet, vatRate),
        ruleId: "fixed_ip_addon",
      });
    }
    
    // Router inclusion (Phase 2)
    if (fixedProduct.routerType) {
      const routerLabel = fixedProduct.routerType === "FRITZBOX" 
        ? "FRITZ!Box inklusive" 
        : "Vodafone Station inklusive";
      breakdown.push({
        key: "fixed_router",
        label: routerLabel,
        appliesTo: "monthly",
        net: 0,
        ruleId: "router_included",
      });
    }
    
    // Fixed promo (Slice B: check validity)
    if (fixedProduct.promo && fixedProduct.promo.type !== "NONE") {
      const fixedPromoValid = isFixedPromoValid(fixedProduct.promo, asOfISO);
      
      if (!fixedPromoValid) {
        breakdown.push({
          key: "fixed_promo_expired",
          label: "Festnetz Aktion – abgelaufen, nicht angewendet",
          appliesTo: "monthly",
          net: 0,
          ruleId: "promo_expired",
        });
      } else {
        breakdown.push({
          key: "fixed_promo",
          label: `Festnetz Aktion (${fixedProduct.promo.durationMonths} Monate)`,
          appliesTo: "monthly",
          periodRef: `1-${fixedProduct.promo.durationMonths}`,
          net: 0,
          ruleId: "fixed_promo",
        });
      }
    }
  }
  
  // Hardware amortization
  if (state.hardware.amortize && state.hardware.ekNet > 0) {
    const amortPerMonth = calculateHardwareAmortization(
      state.hardware.ekNet,
      true,
      state.hardware.amortMonths
    );
    breakdown.push({
      key: "hardware_amort",
      label: `Hardware im Monatspreis (${state.hardware.amortMonths} Mo.)`,
      appliesTo: "monthly",
      net: amortPerMonth,
      gross: calculateGross(amortPerMonth, vatRate),
      ruleId: "hardware_amort",
    });
  }
  
  // Dealer breakdown
  breakdown.push({
    key: "dealer_provision_base",
    label: state.mobile.contractType === "renewal" ? "Provision (Verlängerung)" : "Provision (Neuvertrag)",
    appliesTo: "dealer",
    net: dealer.provisionBase,
    ruleId: "provision_base",
  });
  
  breakdown.push({
    key: "dealer_deductions",
    label: state.mobile.promoId === "OMO25" ? "Abzüge (inkl. OMO)" : "Abzüge",
    appliesTo: "dealer",
    net: -dealer.deductions,
    ruleId: "deductions",
  });
  
  breakdown.push({
    key: "dealer_provision_after",
    label: "Provision (nach Abzügen)",
    appliesTo: "dealer",
    net: dealer.provisionAfter,
    ruleId: "provision_after",
  });
  
  // Fixed Net Provision (separate line for clarity)
  if (dealer.fixedNetProvision && dealer.fixedNetProvision > 0) {
    breakdown.push({
      key: "dealer_fixednet_provision",
      label: "Festnetz-Provision",
      appliesTo: "dealer",
      net: dealer.fixedNetProvision,
      ruleId: "fixednet_provision",
    });
  }
  
  if (state.hardware.ekNet > 0) {
    breakdown.push({
      key: "dealer_hardware_ek",
      label: "Hardware EK",
      appliesTo: "dealer",
      net: -dealer.hardwareEkNet,
      ruleId: "hardware_ek",
    });
  }
  
  breakdown.push({
    key: "dealer_margin",
    label: "Marge",
    appliesTo: "dealer",
    net: dealer.margin,
    ruleId: "margin",
  });
  
  return breakdown;
}
