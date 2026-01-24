// supabase/functions/calculate-margin/logic.ts
import Decimal from "npm:decimal.js";

/**
 * Pure function to calculate economic margin.
 * Design by Contract:
 * - listPrice: must be >= 0
 * - costPrice: must be >= 0
 * - volume: must be > 0 (strictly positive number expected)
 */
export function calculateEconomics(
    listPrice: number,
    costPrice: number,
    volume: number
) {
    // Defensive Programming: Enforce Contract
    if (listPrice < 0) throw new Error("List Price cannot be negative");
    if (costPrice < 0) throw new Error("Cost Price cannot be negative");
    if (volume <= 0) throw new Error("Volume must be positive");

    const listPriceDec = new Decimal(listPrice);
    const costPriceDec = new Decimal(costPrice);
    const volumeDec = new Decimal(volume);

    const revenue = listPriceDec.mul(volumeDec);
    const cost = costPriceDec.mul(volumeDec);
    const margin = revenue.sub(cost);

    // Avoid division by zero
    const marginPercent = revenue.gt(0)
        ? margin.div(revenue).mul(100)
        : new Decimal(0);

    return {
        margin: Number(margin.toFixed(2)),
        marginPercent: Number(marginPercent.toFixed(2)),
        recommendedPrice: Number(revenue.toFixed(2)),
        currency: "EUR"
    };
}
