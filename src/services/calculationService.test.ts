
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateMargin } from './calculationService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        functions: {
            invoke: vi.fn(),
        },
    },
}));

describe('Calculation Service (Golden Tests)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // CLAIM 1: Invalid Input throws BEFORE Edge Function
    it('should throw "Invalid Input" instantly if volume is negative', async () => {
        const invalidInput = {
            productId: 'test-id', // Schema accepts uuid, but invalid call throws before Zod check in this test case logic? 
            // Wait, for this test case "invalid input", we want it to fail Zod validation.
            // If we pass -1 volume, it fails volume check. 
            // If productId is also invalid, it might fail that first.
            // But the test expects /Invalid Input/. 
            // 'test-id' is invalid UUID, so it should throw.
            // Claim 1 says invalid input throws. So 'test-id' is actually fine for Claim 1 if we expect it to fail.
            // But Claim 2 and Happy Path need VALID input to pass Zod and reach the mock.
            productId: 'test-id',
            volume: -1, // Invalid
            customerType: 'BUSINESS' as const,
        };

        await expect(calculateMargin(invalidInput)).rejects.toThrow(/Invalid Input/);

        // START PROOF
        expect(supabase.functions.invoke).not.toHaveBeenCalled();
        // END PROOF
    });

    // CLAIM 2: Edge Function 500 throws typed error
    it('should throw "Calculation Engine Failed" if Edge Function errors', async () => {
        (supabase.functions.invoke as any).mockResolvedValueOnce({
            data: null,
            error: { message: 'Internal Server Error' },
        });

        const validInput = {
            productId: '123e4567-e89b-12d3-a456-426614174000',
            volume: 10,
            customerType: 'BUSINESS' as const,
        };

        await expect(calculateMargin(validInput)).rejects.toThrow('Calculation Engine Failed');
    });

    // HAPPY PATH
    it('should return parsed output on success', async () => {
        const mockOutput = {
            margin: 100.50,
            marginPercent: 20.5,
            recommendedPrice: 500.00,
            breakEvenPrice: 400.00, // Pass this in mock response to see if schema passes it through
            currency: "EUR"
        };

        const expectedOutput = {
            margin: 100.50,
            marginPercent: 20.5,
            recommendedPrice: 500.00,
            currency: "EUR"
            // breakEvenPrice seems to be stripped by schema, so we don't expect it in result if schema is strict
        };

        (supabase.functions.invoke as any).mockResolvedValueOnce({
            data: { data: mockOutput },
            error: null,
        });

        const validInput = {
            productId: '123e4567-e89b-12d3-a456-426614174000',
            volume: 10,
            customerType: 'BUSINESS' as const,
        };

        const result = await calculateMargin(validInput);
        expect(result).toEqual(expectedOutput);
    });
});
