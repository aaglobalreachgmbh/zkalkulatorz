import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Importing from outside src, alien to boundaries but necessary for shared logic test
import { calculateEconomics } from '../../supabase/functions/calculate-margin/logic';

describe('Calculation Logic Invariants (PBT)', () => {

    // LAW 1: Cost Monotonicity
    // "For a fixed Price and Volume, if Cost increases, Margin MUST decrease (or stay equal if volume is 0)."
    it('should satisfy Cost Monotonicity (Higher Cost = Lower Margin)', () => {
        fc.assert(
            fc.property(
                fc.float({ min: 0, max: 10000 }), // List Price
                fc.float({ min: 0, max: 5000 }),  // Cost Base
                fc.float({ min: 0, max: 5000 }),  // Cost Increment
                fc.integer({ min: 1, max: 1000 }), // Volume (strictly positive)
                (price, costBase, costIncrement, volume) => {
                    const costLow = costBase;
                    const costHigh = costBase + costIncrement; // costHigh >= costLow

                    const resultLow = calculateEconomics(price, costLow, volume);
                    const resultHigh = calculateEconomics(price, costHigh, volume);

                    // Assert: Margin at High Cost <= Margin at Low Cost
                    expect(resultHigh.margin).toBeLessThanOrEqual(resultLow.margin);
                }
            )
        );
    });

    // LAW 2: Non-Negativity of Revenue
    // "Revenue must always be non-negative given positive inputs."
    it('should never generate negative revenue for positive inputs', () => {
        fc.assert(
            fc.property(
                fc.float({ min: 0, max: 100000 }),
                fc.float({ min: 0, max: 100000 }),
                fc.integer({ min: 1, max: 1000 }),
                (price, cost, volume) => {
                    const result = calculateEconomics(price, cost, volume);
                    expect(result.recommendedPrice).toBeGreaterThanOrEqual(0);
                }
            )
        );
    });

    // LAW 3: Round-Trip Compatibility (Idempotence of Transport)
    // "The output values must be valid numbers (not NaN, Infinity)."
    it('should always return finite numbers', () => {
        fc.assert(
            fc.property(
                fc.float({ min: 0, max: 1e6 }),
                fc.float({ min: 0, max: 1e6 }),
                fc.integer({ min: 1, max: 1000 }),
                (price, cost, volume) => {
                    const result = calculateEconomics(price, cost, volume);
                    expect(Number.isFinite(result.margin)).toBe(true);
                    expect(Number.isFinite(result.marginPercent)).toBe(true);
                    expect(Number.isFinite(result.recommendedPrice)).toBe(true);
                }
            )
        );
    });
});
