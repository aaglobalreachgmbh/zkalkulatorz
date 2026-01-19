// supabase/functions/calculate-margin/test.ts

import { assertEquals, assertThrows } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { calculateEconomics } from "./logic.ts";

Deno.test("Economics: Standard Case", () => {
    const listPrice = 1000;
    const costPrice = 500;
    const volume = 2;

    const result = calculateEconomics(listPrice, costPrice, volume);

    // Revenue = 2000, Cost = 1000, Margin = 1000
    // Margin % = 50%
    assertEquals(result.margin, 1000);
    assertEquals(result.marginPercent, 50);
    assertEquals(result.recommendedPrice, 2000);
    assertEquals(result.currency, "EUR");
});

Deno.test("Economics: Zero Margin", () => {
    const listPrice = 500;
    const costPrice = 500;
    const volume = 1;

    const result = calculateEconomics(listPrice, costPrice, volume);

    assertEquals(result.margin, 0);
    assertEquals(result.marginPercent, 0);
});

Deno.test("Economics: Negative Margin", () => {
    const listPrice = 400;
    const costPrice = 500;
    const volume = 1;

    const result = calculateEconomics(listPrice, costPrice, volume);

    assertEquals(result.margin, -100);
    // Revenue = 400. Margin = -100. % = -100/400 = -25%
    assertEquals(result.marginPercent, -25);
});

Deno.test("Economics: Defensive - Invalid Inputs", () => {
    assertThrows(() => {
        calculateEconomics(-100, 500, 1);
    }, Error, "List Price cannot be negative");

    assertThrows(() => {
        calculateEconomics(100, -500, 1);
    }, Error, "Cost Price cannot be negative");

    assertThrows(() => {
        calculateEconomics(100, 500, 0);
    }, Error, "Volume must be positive");
});
