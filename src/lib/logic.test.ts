import { describe, it, expect } from 'vitest';
import { calculateEconomics } from '../../supabase/functions/calculate-margin/logic';

describe('Backend Logic: Economics (Pure Function)', () => {
    it('should calculate standard margin correctly', () => {
        const listPrice = 1000;
        const costPrice = 500;
        const volume = 2;

        const result = calculateEconomics(listPrice, costPrice, volume);

        // Revenue = 2000, Cost = 1000, Margin = 1000
        // Margin % = 50%
        expect(result.margin).toBe(1000);
        expect(result.marginPercent).toBe(50);
        expect(result.recommendedPrice).toBe(2000);
        expect(result.currency).toBe("EUR");
    });

    it('should handle zero margin', () => {
        const listPrice = 500;
        const costPrice = 500;
        const volume = 1;

        const result = calculateEconomics(listPrice, costPrice, volume);

        expect(result.margin).toBe(0);
        expect(result.marginPercent).toBe(0);
    });

    it('should handle negative margin', () => {
        const listPrice = 400;
        const costPrice = 500;
        const volume = 1;

        const result = calculateEconomics(listPrice, costPrice, volume);

        expect(result.margin).toBe(-100);
        // Revenue = 400. Margin = -100. % = -100/400 = -25%
        expect(result.marginPercent).toBe(-25);
    });

    it('should throw on invalid inputs', () => {
        expect(() => calculateEconomics(-100, 500, 1)).toThrow("List Price cannot be negative");
        expect(() => calculateEconomics(100, -500, 1)).toThrow("Cost Price cannot be negative");
        expect(() => calculateEconomics(100, 500, 0)).toThrow("Volume must be positive");
    });
});
