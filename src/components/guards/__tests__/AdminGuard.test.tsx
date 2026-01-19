/**
 * AdminGuard Integration Tests
 * 
 * TEST CLAIMS:
 * - IF user is not admin, THEN redirect to "/", NEVER render children
 * - IF role loading fails, THEN show error, NEVER grant access
 * - Server-side `requireAdmin()` MUST be primary protection
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminGuard } from "../AdminGuard";
import { useUserRole } from "../../../hooks/useUserRole";

// Mock dependencies
vi.mock("../../../hooks/useUserRole");
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
    }),
}));
vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
    },
}));

const mockUseUserRole = useUserRole as unknown as ReturnType<typeof vi.fn>;

describe("AdminGuard", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("Loading State", () => {
        it("should show loading indicator while checking role", () => {
            mockUseUserRole.mockReturnValue({
                isAdmin: false,
                isLoading: true,
                error: null,
            });

            render(
                <AdminGuard>
                    <div data-testid="admin-content">Admin Dashboard</div>
                </AdminGuard>
            );

            expect(screen.getByText("Überprüfe Berechtigungen...")).toBeInTheDocument();
            expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
        });
    });

    describe("Admin Access", () => {
        it("should render children when user is admin", () => {
            mockUseUserRole.mockReturnValue({
                isAdmin: true,
                isLoading: false,
                error: null,
            });

            render(
                <AdminGuard>
                    <div data-testid="admin-content">Admin Dashboard</div>
                </AdminGuard>
            );

            expect(screen.getByTestId("admin-content")).toBeInTheDocument();
        });
    });

    describe("Non-Admin Rejection", () => {
        it("should NOT render children when user is not admin", () => {
            mockUseUserRole.mockReturnValue({
                isAdmin: false,
                isLoading: false,
                error: null,
            });

            render(
                <AdminGuard>
                    <div data-testid="admin-content">Admin Dashboard</div>
                </AdminGuard>
            );

            // Children should NOT be visible
            expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
        });
    });

    describe("Error Handling", () => {
        it("should show error UI when role check fails", () => {
            mockUseUserRole.mockReturnValue({
                isAdmin: false,
                isLoading: false,
                error: new Error("Network error"),
            });

            render(
                <AdminGuard>
                    <div data-testid="admin-content">Admin Dashboard</div>
                </AdminGuard>
            );

            expect(screen.getByText("Authentifizierungsfehler")).toBeInTheDocument();
            expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
        });
    });

    describe("Security: No-Leak", () => {
        it("should NEVER render admin content while loading", () => {
            mockUseUserRole.mockReturnValue({
                isAdmin: true, // Even if admin flag true
                isLoading: true, // Still loading
                error: null,
            });

            render(
                <AdminGuard>
                    <div data-testid="admin-content">Secret Admin Data</div>
                </AdminGuard>
            );

            // Must not show content during loading
            expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
        });
    });
});
