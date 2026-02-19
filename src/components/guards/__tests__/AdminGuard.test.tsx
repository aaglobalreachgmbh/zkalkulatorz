/**
 * AdminGuard Integration Tests
 */

import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AdminGuard } from "../AdminGuard";
import { useUserRole } from "../../../hooks/useUserRole";

vi.mock("../../../hooks/useUserRole");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const mockUseUserRole = useUserRole as unknown as ReturnType<typeof vi.fn>;

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>{children}</MemoryRouter>
);

describe("AdminGuard", () => {
    beforeEach(() => { vi.resetAllMocks(); });

    it("should show loading indicator while checking role", () => {
        mockUseUserRole.mockReturnValue({ isAdmin: false, isLoading: true, error: null });
        const { getByText, queryByTestId } = render(
            <AdminGuard><div data-testid="admin-content">Admin Dashboard</div></AdminGuard>,
            { wrapper: TestWrapper }
        );
        expect(getByText("Überprüfe Berechtigungen...")).toBeTruthy();
        expect(queryByTestId("admin-content")).toBeNull();
    });

    it("should render children when user is admin", () => {
        mockUseUserRole.mockReturnValue({ isAdmin: true, isLoading: false, error: null });
        const { getByTestId } = render(
            <AdminGuard><div data-testid="admin-content">Admin Dashboard</div></AdminGuard>,
            { wrapper: TestWrapper }
        );
        expect(getByTestId("admin-content")).toBeTruthy();
    });

    it("should NOT render children when user is not admin", () => {
        mockUseUserRole.mockReturnValue({ isAdmin: false, isLoading: false, error: null });
        const { queryByTestId } = render(
            <AdminGuard><div data-testid="admin-content">Admin Dashboard</div></AdminGuard>,
            { wrapper: TestWrapper }
        );
        expect(queryByTestId("admin-content")).toBeNull();
    });

    it("should show error UI when role check fails", () => {
        mockUseUserRole.mockReturnValue({ isAdmin: false, isLoading: false, error: new Error("Network error") });
        const { getByText, queryByTestId } = render(
            <AdminGuard><div data-testid="admin-content">Admin Dashboard</div></AdminGuard>,
            { wrapper: TestWrapper }
        );
        expect(getByText("Authentifizierungsfehler")).toBeTruthy();
        expect(queryByTestId("admin-content")).toBeNull();
    });

    it("should NEVER render admin content while loading", () => {
        mockUseUserRole.mockReturnValue({ isAdmin: true, isLoading: true, error: null });
        const { queryByTestId } = render(
            <AdminGuard><div data-testid="admin-content">Secret Admin Data</div></AdminGuard>,
            { wrapper: TestWrapper }
        );
        expect(queryByTestId("admin-content")).toBeNull();
    });
});
