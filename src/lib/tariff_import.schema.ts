/**
 * Tariff Import Schema (Phase 8)
 * Defines the expected CSV format and validation rules for Vodafone tariff data.
 */

import { z } from "zod";

// The CSV Row Schema (What the CSV file must contain)
export const TariffImportRowSchema = z.object({
    // Primary Key (UUID or string identifier)
    tariff_id: z.string().uuid("tariff_id must be a valid UUID"),

    // Product Info
    name: z.string().min(1, "Name is required"),
    category: z.enum(["MOBILE", "DSL", "CABLE", "IOT"]).default("MOBILE"),

    // Public Pricing (Goes to tariffs_public)
    list_price_netto: z.coerce.number().nonnegative("List price must be >= 0"),

    // Commercial Pricing (Goes to tariffs_commercial - PROTECTED)
    cost_price_netto: z.coerce.number().nonnegative("Cost price must be >= 0"),

    // Optional Metadata
    duration_months: z.coerce.number().int().positive().optional(),
    promo_id: z.string().optional(),
    sub_level: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM"]).optional(),
});

// Type Export
export type TariffImportRow = z.infer<typeof TariffImportRowSchema>;

// Batch Schema (Array of Rows)
export const TariffImportBatchSchema = z.array(TariffImportRowSchema);

// Import Result Schema
export const ImportResultSchema = z.object({
    success: z.boolean(),
    inserted: z.number(),
    updated: z.number(),
    errors: z.array(z.object({
        row: z.number(),
        message: z.string(),
    })),
});

export type ImportResult = z.infer<typeof ImportResultSchema>;
