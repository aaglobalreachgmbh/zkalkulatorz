import { describe, it, expect } from 'vitest';
import { CalculationInputSchema } from './contracts';

describe('Contracts: API Schema', () => {
    it('should validate correct API payload', () => {
        const validInput = {
            productId: "123e4567-e89b-12d3-a456-426614174000",
            volume: 1,
            customerType: "BUSINESS"
        };

        // safeParse should exist if Schema is imported correctly
        const result = CalculationInputSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it('should reject invalid volume', () => {
        const invalidInput = {
            productId: "123e4567-e89b-12d3-a456-426614174000",
            volume: 0, // must be positive
            customerType: "BUSINESS"
        };

        const result = CalculationInputSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
    });

    it('should reject invalid UUID', () => {
        const invalidInput = {
            productId: "invalid-uuid",
            volume: 5,
            customerType: "BUSINESS"
        };
        const result = CalculationInputSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
    });
});
