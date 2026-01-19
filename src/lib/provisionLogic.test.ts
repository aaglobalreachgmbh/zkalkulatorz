import { describe, it, expect } from "vitest";
import {
    calculateOfferProvision,
    calculateMonthlyProvision,
    type OfferInput,
    type ProvisionRate,
    type EmployeeGoal,
    type EmployeeSettings,
} from "./provisionLogic";

describe("Provision Logic", () => {
    describe("calculateOfferProvision", () => {
        it("should calculate default provision for 'neu' contract", () => {
            const offer: OfferInput = {
                id: "1",
                name: "Test Offer",
                config: { contractType: "neu", tariffName: "Smart L" },
                preview: {},
                status: "won",
                created_at: "2024-01-01",
                user_id: "u1",
                customer: { company_name: "Acme" },
            };

            const rates: ProvisionRate[] = [];

            const result = calculateOfferProvision(offer, rates);
            expect(result.contractType).toBe("neu");
            expect(result.baseProvision).toBe(100); // Default
        });

        it("should use matching provision rate", () => {
            const offer: OfferInput = {
                id: "1",
                name: "Test Offer",
                config: { contractType: "neu", tariffName: "Smart XL" },
                preview: {},
                status: "won",
                created_at: "2024-01-01",
                user_id: "u1",
                customer: { company_name: "Acme" },
            };

            const rates: ProvisionRate[] = [
                { tariff_id: "Smart XL", contract_type: "neu", provision_amount: 150 }
            ];

            const result = calculateOfferProvision(offer, rates);
            expect(result.baseProvision).toBe(150);
        });

        it("should add bonus provision", () => {
            const offer: OfferInput = {
                id: "1",
                name: "Test Offer",
                config: { contractType: "neu", tariffName: "Smart L", bonusProvision: 50 },
                preview: {},
                status: "won",
                created_at: "2024-01-01",
                user_id: "u1",
                customer: { company_name: "Acme" },
            };

            const rates: ProvisionRate[] = [];

            const result = calculateOfferProvision(offer, rates);
            expect(result.baseProvision).toBe(100);
            expect(result.bonusProvision).toBe(50);
            expect(result.totalProvision).toBe(150);
        });
    });

    describe("calculateMonthlyProvision", () => {
        const mockOffer: OfferInput = {
            id: "1",
            name: "Test Offer",
            config: { contractType: "neu", tariffName: "Smart L" }, // 100 default
            preview: {},
            status: "won",
            created_at: "2024-01-01",
            user_id: "u1",
            customer: { company_name: "Acme" },
        };

        it("should sum up provisions", () => {
            const result = calculateMonthlyProvision(
                [mockOffer, { ...mockOffer, id: "2" }],
                [],
                [],
                null
            );

            expect(result.baseProvision).toBe(200);
            expect(result.contractCount).toBe(2);
            expect(result.netProvision).toBe(200);
        });

        it("should apply goal bonuses", () => {
            const goals: EmployeeGoal[] = [
                { target_value: 100, current_value: 150, bonus_amount: 50 }
            ];

            const result = calculateMonthlyProvision(
                [mockOffer],
                [],
                goals,
                null
            );

            // 100 base + 50 goal bonus
            expect(result.goalBonus).toBe(50);
            expect(result.netProvision).toBe(150);
        });

        it("should apply deductions (percent)", () => {
            const settings: EmployeeSettings = {
                provision_deduction: 10,
                provision_deduction_type: "percent"
            };

            const result = calculateMonthlyProvision(
                [mockOffer], // 100
                [],
                [],
                settings
            );

            // 100 * 10% = 10 deduction
            expect(result.deductions).toBe(10);
            expect(result.netProvision).toBe(90);
        });
    });
});
