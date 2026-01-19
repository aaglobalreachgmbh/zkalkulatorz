import type { Json } from "@/integrations/supabase/types";

// ============================================
// Interfaces
// ============================================

export interface OfferInput {
    id: string;
    name: string;
    config: Json;
    preview: Json;
    status: string;
    created_at: string;
    user_id: string;
    customer?: { company_name: string } | null;
}

export interface ProvisionDetail {
    offerId: string;
    offerName: string;
    customerName?: string;
    tariffName?: string;
    contractType: string; // 'neu' | 'vvl' | 'hw_only'
    baseProvision: number;
    bonusProvision: number;
    totalProvision: number;
    createdAt: string;
}

export interface ProvisionSummary {
    baseProvision: number;
    bonusAmount: number;
    goalBonus: number;
    deductions: number;
    netProvision: number;
    contractCount: number;
    details: ProvisionDetail[];
    status: "draft" | "calculated" | "approved" | "paid";
}

export interface ProvisionRate {
    tariff_id?: string;
    contract_type?: string;
    provision_amount?: number;
}

export interface EmployeeGoal {
    target_value?: number;
    current_value?: number;
    bonus_amount?: number;
}

export interface EmployeeSettings {
    provision_deduction?: number;
    provision_deduction_type?: string; // 'fixed' | 'percent'
}

// ============================================
// Pure Functions
// ============================================

/**
 * Calculates provision for a single offer based on rates and config.
 */
export function calculateOfferProvision(
    offer: OfferInput,
    provisionRates: ProvisionRate[]
): ProvisionDetail {
    const config = (offer.config as Record<string, unknown>) || {};
    const preview = (offer.preview as Record<string, unknown>) || {};

    // Extract tariff info
    const tariffName =
        (config.tariffName as string) || (preview.tariff as string) || "Unbekannt";
    const contractType =
        (config.contractType as string) || (config.vertragsart as string) || "neu";
    const customerName =
        offer.customer?.company_name || "Unbekannt";

    // Find matching provision rate
    const matchingRate = provisionRates.find((rate) => {
        const rateTariff = rate.tariff_id || "";
        const rateType = rate.contract_type || "";
        return (
            tariffName.toLowerCase().includes(rateTariff.toLowerCase()) &&
            (rateType === contractType || rateType === "all")
        );
    });

    // Calculate base provision
    let baseProvision = 0;
    if (matchingRate) {
        baseProvision = matchingRate.provision_amount || 0;
    } else {
        // Default provision based on contract type
        baseProvision =
            contractType === "neu" ? 100 : contractType === "vvl" ? 50 : 30;
    }

    // Extract any bonus from the offer config
    const bonusProvision = (config.bonusProvision as number) || 0;

    return {
        offerId: offer.id,
        offerName: offer.name,
        customerName,
        tariffName,
        contractType,
        baseProvision,
        bonusProvision,
        totalProvision: baseProvision + bonusProvision,
        createdAt: offer.created_at,
    };
}

/**
 * Calculates the monthly summary including goals and deductions.
 */
export function calculateMonthlyProvision(
    offers: OfferInput[],
    provisionRates: ProvisionRate[],
    goals: EmployeeGoal[],
    employeeSettings: EmployeeSettings | null,
    currentStatus: ProvisionSummary["status"] = "draft"
): ProvisionSummary {

    // Calculate details for each offer
    const details = offers.map((offer) =>
        calculateOfferProvision(offer, provisionRates)
    );

    const baseProvision = details.reduce((sum, d) => sum + d.baseProvision, 0);
    const bonusAmount = details.reduce((sum, d) => sum + d.bonusProvision, 0);

    // Goal bonus calculation
    let goalBonus = 0;
    goals.forEach((goal) => {
        const targetValue = goal.target_value || 0;
        const currentValue = goal.current_value || 0;
        const bonusAmt = goal.bonus_amount || 0;

        if (targetValue > 0 && currentValue >= targetValue && bonusAmt > 0) {
            goalBonus += bonusAmt;
        }
    });

    // Calculate deductions
    let deductions = 0;
    if (employeeSettings) {
        const deductionValue = employeeSettings.provision_deduction || 0;
        const deductionType = employeeSettings.provision_deduction_type || "fixed";

        if (deductionType === "percent") {
            deductions =
                (baseProvision + bonusAmount + goalBonus) * (deductionValue / 100);
        } else {
            deductions = deductionValue;
        }
    }

    const netProvision = baseProvision + bonusAmount + goalBonus - deductions;

    return {
        baseProvision,
        bonusAmount,
        goalBonus,
        deductions,
        netProvision,
        contractCount: details.length,
        details,
        status: currentStatus,
    };
}
