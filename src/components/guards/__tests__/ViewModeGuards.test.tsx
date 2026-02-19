/**
 * ViewModeGuards Tests
 */

import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DealerOnly, CustomerOnly } from "../ViewModeGuards";

describe("ViewModeGuards", () => {
    describe("DealerOnly", () => {
        it("should render children when viewMode is 'dealer'", () => {
            const { getByTestId } = render(
                <DealerOnly viewMode="dealer"><div data-testid="dealer-secret">EK: 500€</div></DealerOnly>
            );
            expect(getByTestId("dealer-secret")).toBeTruthy();
        });

        it("should NOT render children when viewMode is 'customer'", () => {
            const { queryByTestId } = render(
                <DealerOnly viewMode="customer"><div data-testid="dealer-secret">EK: 500€</div></DealerOnly>
            );
            expect(queryByTestId("dealer-secret")).toBeNull();
        });

        it("should render fallback when viewMode is 'customer'", () => {
            const { queryByTestId, getByTestId } = render(
                <DealerOnly viewMode="customer" fallback={<div data-testid="safe-message">Kundenmodus</div>}>
                    <div data-testid="dealer-secret">EK: 500€</div>
                </DealerOnly>
            );
            expect(queryByTestId("dealer-secret")).toBeNull();
            expect(getByTestId("safe-message")).toBeTruthy();
        });

        it("should NOT leak sensitive keywords in customer mode", () => {
            const { container } = render(
                <DealerOnly viewMode="customer">
                    <div>EK: 500€</div>
                    <div>Marge: 20%</div>
                    <div>Provision: 100€</div>
                </DealerOnly>
            );
            const html = container.innerHTML.toLowerCase();
            ["ek", "cost_price", "margin", "provision", "marge"].forEach(keyword => {
                expect(html).not.toContain(keyword);
            });
        });
    });

    describe("CustomerOnly", () => {
        it("should render children when viewMode is 'customer'", () => {
            const { getByTestId } = render(
                <CustomerOnly viewMode="customer"><div data-testid="customer-content">Kundenpreis: 100€</div></CustomerOnly>
            );
            expect(getByTestId("customer-content")).toBeTruthy();
        });

        it("should NOT render children when viewMode is 'dealer'", () => {
            const { queryByTestId } = render(
                <CustomerOnly viewMode="dealer"><div data-testid="customer-content">Kundenpreis: 100€</div></CustomerOnly>
            );
            expect(queryByTestId("customer-content")).toBeNull();
        });
    });
});
