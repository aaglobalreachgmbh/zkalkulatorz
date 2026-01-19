import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLicense } from "../useLicense";
import { useAuth } from "../useAuth";
import { useIdentity } from "../../contexts/IdentityContext";
import { useCloudLicense } from "../useCloudLicense";
import { useCloudSeats } from "../useCloudSeats";
import * as LicenseLib from "../../lib/license";

// Mock dependencies
vi.mock("../useAuth");
vi.mock("../../contexts/IdentityContext");
vi.mock("../useCloudLicense");
vi.mock("../useCloudSeats");
vi.mock("../../lib/license", () => ({
    loadLicense: vi.fn(),
    isLicenseValid: vi.fn(),
    isSeatLimitExceeded: vi.fn(),
    isFeatureEnabled: vi.fn(),
    updateFeatureFlag: vi.fn(),
    changePlan: vi.fn(),
    getSeatUsageInfo: vi.fn(),
}));
vi.mock("../../lib/seatManagement", () => ({
    getSeatUsageInfo: vi.fn(() => ({ used: 1, limit: 5, available: 4 })),
    assignSeat: vi.fn(),
    revokeSeat: vi.fn(),
    isUserSeated: vi.fn(),
    getSeatedUsers: vi.fn(() => []),
}));

// Mock implementations
const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;
const mockUseIdentity = useIdentity as unknown as ReturnType<typeof vi.fn>;
const mockUseCloudLicense = useCloudLicense as unknown as ReturnType<typeof vi.fn>;
const mockUseCloudSeats = useCloudSeats as unknown as ReturnType<typeof vi.fn>;
const mockLoadLicense = LicenseLib.loadLicense as unknown as ReturnType<typeof vi.fn>;
const mockIsLicenseValid = LicenseLib.isLicenseValid as unknown as ReturnType<typeof vi.fn>;

describe("useLicense", () => {
    beforeEach(() => {
        vi.resetAllMocks();

        mockUseIdentity.mockReturnValue({
            identity: { tenantId: "tenant-123", userId: "user-123" },
        });
    });

    describe("Guest Mode (Not Authenticated)", () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({ user: null });
            mockUseCloudLicense.mockReturnValue({}); // Not used in guest mode
            mockUseCloudSeats.mockReturnValue({});

            mockLoadLicense.mockReturnValue({ plan: "free", features: {} });
            mockIsLicenseValid.mockReturnValue(true);
        });

        it("should return local license state", () => {
            const { result } = renderHook(() => useLicense());

            expect(result.current.isCloud).toBe(false);
            expect(result.current.isValid).toBe(true);
            expect(result.current.license.plan).toBe("free");
        });
    });

    describe("Cloud Mode (Authenticated)", () => {
        const mockCloudLicenseData = {
            tenantId: "tenant-123",
            plan: "pro",
            features: { featureA: true },
            seatLimit: 10,
            seatsUsed: 2,
            updatedAt: "2024-01-01",
        };

        beforeEach(() => {
            mockUseAuth.mockReturnValue({ user: { id: "user-123" } });

            mockUseCloudLicense.mockReturnValue({
                license: mockCloudLicenseData,
                isValid: true,
                updateLicense: vi.fn(),
            });

            mockUseCloudSeats.mockReturnValue({
                seatUsage: { used: 2, limit: 10, available: 8 },
                seats: [],
                assignSeat: vi.fn(),
                revokeSeat: vi.fn(),
                currentUserHasSeat: true,
            });
        });

        it("should return cloud license state", () => {
            const { result } = renderHook(() => useLicense());

            expect(result.current.isCloud).toBe(true);
            expect(result.current.isValid).toBe(true);
            expect(result.current.license.plan).toBe("pro");
            expect(result.current.seatUsage.limit).toBe(10);
        });

        it("should call updateLicense when changing plan", async () => {
            const updateLicenseMock = vi.fn();
            mockUseCloudLicense.mockReturnValue({
                license: mockCloudLicenseData,
                isValid: true,
                updateLicense: updateLicenseMock,
            });

            const { result } = renderHook(() => useLicense());

            await act(async () => {
                result.current.setPlan("enterprise");
            });

            expect(updateLicenseMock).toHaveBeenCalledWith({ plan: "enterprise" });
        });
    });
});
