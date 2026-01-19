import { z } from "zod";

export const CustomerTypeEnum = z.enum(["BUSINESS", "PREMIUM", "ENTERPRISE"]);
export type CustomerType = z.infer<typeof CustomerTypeEnum>;

export const CalculationInputSchema = z.object({
    productId: z.string().uuid("Invalid Product ID"),
    volume: z.coerce.number().min(1, "Volume must be at least 1"),
    customerType: CustomerTypeEnum,
});

export type CalculationInput = z.infer<typeof CalculationInputSchema>;

export const CalculationOutputSchema = z.object({
    margin: z.number(),
    marginPercent: z.number(),
    recommendedPrice: z.number(),
    currency: z.string().default("EUR"),
});

export type CalculationOutput = z.infer<typeof CalculationOutputSchema>;
