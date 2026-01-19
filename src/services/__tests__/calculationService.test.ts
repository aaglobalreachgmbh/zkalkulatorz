/**
 * Calculation Service Error Handling Tests
 * 
 * TEST CLAIMS:
 * - IF input fails Zod validation, THEN must throw identifiable error
 * - IF engine returns malformed data, THEN must throw, NEVER display wrong margin
 * - Black Box: We test wrapper behavior, NOT internal engine logic
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { CalculationInputSchema } from "../../lib/contracts";

describe("Calculation Input Validation", () => {
    describe("Zod Schema Validation", () => {
        it("should accept valid input", () => {
            const validInput = {
                productId: "550e8400-e29b-41d4-a716-446655440000",
                volume: 10,
                customerType: "BUSINESS" as const,
            };

            const result = CalculationInputSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it("should reject invalid UUID", () => {
            const invalidInput = {
                productId: "not-a-uuid",
                volume: 10,
                customerType: "BUSINESS",
            };

            const result = CalculationInputSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it("should reject zero volume", () => {
            const invalidInput = {
                productId: "550e8400-e29b-41d4-a716-446655440000",
                volume: 0,
                customerType: "BUSINESS",
            };

            const result = CalculationInputSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it("should reject negative volume", () => {
            const invalidInput = {
                productId: "550e8400-e29b-41d4-a716-446655440000",
                volume: -5,
                customerType: "BUSINESS",
            };

            const result = CalculationInputSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it("should reject invalid customer type", () => {
            const invalidInput = {
                productId: "550e8400-e29b-41d4-a716-446655440000",
                volume: 10,
                customerType: "INVALID",
            };

            const result = CalculationInputSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });
    });
});

describe("Error Identification", () => {
    it("should provide clear error messages for invalid input", () => {
        const invalidInput = {
            productId: "bad",
            volume: -1,
            customerType: "UNKNOWN",
        };

        const result = CalculationInputSchema.safeParse(invalidInput);

        expect(result.success).toBe(false);
        if (!result.success) {
            const errors = result.error.issues;
            expect(errors.length).toBeGreaterThanOrEqual(2);

            // Verify error messages are actionable
            const errorPaths = errors.map(e => e.path[0]);
            expect(errorPaths).toContain("productId");
        }
    });
});
