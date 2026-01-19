/**
 * No-Leak Tests for ViewModeGuards
 * 
 * TEST CLAIMS:
 * - IF viewMode === "customer", THEN DealerOnly renders NULL/fallback
 * - IF viewMode === "dealer", THEN DealerOnly renders children
 * - NEVER render dealer content in customer mode
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DealerOnly, CustomerOnly } from "../ViewModeGuards";

describe("ViewModeGuards", () => {
    describe("DealerOnly", () => {
        it("should render children when viewMode is 'dealer'", () => {
            render(
                <DealerOnly viewMode="dealer">
                    <div data-testid="dealer-secret">EK: 500€</div>
                </DealerOnly>
            );

            expect(screen.getByTestId("dealer-secret")).toBeInTheDocument();
        });

        it("should NOT render children when viewMode is 'customer'", () => {
            render(
                <DealerOnly viewMode="customer">
                    <div data-testid="dealer-secret">EK: 500€</div>
                </DealerOnly>
            );

            expect(screen.queryByTestId("dealer-secret")).not.toBeInTheDocument();
        });

        it("should render fallback when viewMode is 'customer'", () => {
            render(
                <DealerOnly
                    viewMode="customer"
                    fallback={<div data-testid="safe-message">Kundenmodus</div>}
                >
                    <div data-testid="dealer-secret">EK: 500€</div>
                </DealerOnly>
            );

            expect(screen.queryByTestId("dealer-secret")).not.toBeInTheDocument();
            expect(screen.getByTestId("safe-message")).toBeInTheDocument();
        });

        it("should NOT leak sensitive keywords in customer mode", () => {
            const sensitiveKeywords = ["ek", "cost_price", "margin", "provision", "marge"];

            const { container } = render(
                <DealerOnly viewMode="customer">
                    <div>EK: 500€</div>
                    <div>Marge: 20%</div>
                    <div>Provision: 100€</div>
                </DealerOnly>
            );

            const html = container.innerHTML.toLowerCase();

            sensitiveKeywords.forEach(keyword => {
                expect(html).not.toContain(keyword);
            });
        });
    });

    describe("CustomerOnly", () => {
        it("should render children when viewMode is 'customer'", () => {
            render(
                <CustomerOnly viewMode="customer">
                    <div data-testid="customer-content">Kundenpreis: 100€</div>
                </CustomerOnly>
            );

            expect(screen.getByTestId("customer-content")).toBeInTheDocument();
        });

        it("should NOT render children when viewMode is 'dealer'", () => {
            render(
                <CustomerOnly viewMode="dealer">
                    <div data-testid="customer-content">Kundenpreis: 100€</div>
                </CustomerOnly>
            );

            expect(screen.queryByTestId("customer-content")).not.toBeInTheDocument();
        });
    });
});
