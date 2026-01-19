// supabase/functions/calculate-margin/logic.ts

/**
 * Pure function to calculate economic margin.
 * Design by Contract:
 * - listPrice: must be >= 0
 * - costPrice: must be >= 0
 * - volume: must be > 0 (strictly positive integer expected)
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

    const revenue = listPrice * volume;
    const cost = costPrice * volume;
    const margin = revenue - cost;

    // Avoid division by zero
    const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;

    return {
        margin: Number(margin.toFixed(2)),
        marginPercent: Number(marginPercent.toFixed(2)),
        recommendedPrice: Number(revenue.toFixed(2)),
        currency: "EUR"
    };
}
