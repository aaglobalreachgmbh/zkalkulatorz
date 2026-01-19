// ============================================
// License System Tests - Phase 3C
// ============================================

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadLicense,
  saveLicense,
  getDefaultLicense,
  updateLicense,
  updateFeatureFlag,
  changePlan,
  isLicenseValid,
  isSeatLimitExceeded,
  isFeatureEnabled,
  clearLicense,
  type LicenseState,
} from "@/lib/license";
import {
  loadSeatAssignments,
  assignSeat,
  revokeSeat,
  isUserSeated,
  countUsedSeats,
  getSeatUsageInfo,
  clearSeatAssignments,
} from "@/lib/seatManagement";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, "localStorage", { value: localStorageMock });

describe("License System", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("License Storage", () => {
    it("returns default license when storage empty", () => {
      const license = loadLicense("tenant_test");
      expect(license.plan).toBe("internal");
      expect(license.seatLimit).toBe(999);
      expect(license.seatsUsed).toBe(0);
    });

    it("loads license from localStorage", () => {
      const testLicense: LicenseState = {
        tenantId: "tenant_test",
        plan: "pro",
        seatLimit: 10,
        seatsUsed: 3,
        features: {
          dataGovernance: true,
          compareOption2: true,
          fixedNetModule: false,
          exportPdf: false,
          auditLog: true,
          aiConsultant: true,
          advancedReporting: false,
          apiAccess: false,
          customBranding: false,
          adminFullVisibility: false,
          adminFeatureControl: false,
          adminSecurityAccess: false,
          adminBypassApproval: false,
          mobileAccess: false,
          offlineSync: false,
        },
        updatedAt: new Date().toISOString(),
      };
      saveLicense("tenant_test", testLicense);
      
      const loaded = loadLicense("tenant_test");
      expect(loaded.plan).toBe("pro");
      expect(loaded.seatLimit).toBe(10);
    });

    it("license is tenant-scoped", () => {
      saveLicense("tenant_a", { ...getDefaultLicense("tenant_a"), plan: "pro" });
      saveLicense("tenant_b", { ...getDefaultLicense("tenant_b"), plan: "enterprise" });
      
      expect(loadLicense("tenant_a").plan).toBe("pro");
      expect(loadLicense("tenant_b").plan).toBe("enterprise");
    });

    it("saves license correctly", () => {
      const license = getDefaultLicense("test");
      license.plan = "enterprise";
      saveLicense("test", license);
      
      const loaded = loadLicense("test");
      expect(loaded.plan).toBe("enterprise");
    });
  });

  describe("Feature Flags", () => {
    it("all features enabled by default for internal plan", () => {
      const license = getDefaultLicense("test");
      expect(isFeatureEnabled(license, "dataGovernance")).toBe(true);
      expect(isFeatureEnabled(license, "aiConsultant")).toBe(true);
      expect(isFeatureEnabled(license, "auditLog")).toBe(true);
    });

    it("updateFeatureFlag changes specific feature", () => {
      const updated = updateFeatureFlag("test", "aiConsultant", false);
      expect(updated.features.aiConsultant).toBe(false);
      expect(updated.features.dataGovernance).toBe(true);
    });

    it("changePlan updates features and seat limit", () => {
      const updated = changePlan("test", "enterprise");
      expect(updated.plan).toBe("enterprise");
      expect(updated.seatLimit).toBe(50);
    });
  });

  describe("License Validation", () => {
    it("license without validUntil is always valid", () => {
      const license = getDefaultLicense("test");
      expect(isLicenseValid(license)).toBe(true);
    });

    it("expired license is invalid", () => {
      const license: LicenseState = {
        ...getDefaultLicense("test"),
        validUntil: "2020-01-01T00:00:00.000Z",
      };
      expect(isLicenseValid(license)).toBe(false);
    });

    it("future validUntil is valid", () => {
      const license: LicenseState = {
        ...getDefaultLicense("test"),
        validUntil: "2099-01-01T00:00:00.000Z",
      };
      expect(isLicenseValid(license)).toBe(true);
    });
  });

  describe("Seat Enforcement", () => {
    it("detects seat limit exceeded", () => {
      const license: LicenseState = {
        ...getDefaultLicense("test"),
        seatLimit: 2,
        seatsUsed: 5,
      };
      expect(isSeatLimitExceeded(license)).toBe(true);
    });

    it("seat limit not exceeded when under limit", () => {
      const license: LicenseState = {
        ...getDefaultLicense("test"),
        seatLimit: 10,
        seatsUsed: 3,
      };
      expect(isSeatLimitExceeded(license)).toBe(false);
    });
  });
});

describe("Enterprise Features", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("advancedReporting is false for internal plan", () => {
    const license = getDefaultLicense("test");
    expect(license.plan).toBe("internal");
    expect(isFeatureEnabled(license, "advancedReporting")).toBe(false);
  });

  it("advancedReporting is false for pro plan", () => {
    const license = changePlan("test", "pro");
    expect(isFeatureEnabled(license, "advancedReporting")).toBe(false);
  });

  it("advancedReporting is true for enterprise plan", () => {
    const license = changePlan("test", "enterprise");
    expect(isFeatureEnabled(license, "advancedReporting")).toBe(true);
  });

  it("apiAccess requires enterprise plan", () => {
    expect(isFeatureEnabled(getDefaultLicense("t"), "apiAccess")).toBe(false);
    expect(isFeatureEnabled(changePlan("t", "pro"), "apiAccess")).toBe(false);
    clearLicense("t");
    expect(isFeatureEnabled(changePlan("t", "enterprise"), "apiAccess")).toBe(true);
  });

  it("customBranding requires enterprise plan", () => {
    expect(isFeatureEnabled(getDefaultLicense("t2"), "customBranding")).toBe(false);
    expect(isFeatureEnabled(changePlan("t2", "pro"), "customBranding")).toBe(false);
    clearLicense("t2");
    expect(isFeatureEnabled(changePlan("t2", "enterprise"), "customBranding")).toBe(true);
  });

  it("exportPdf is only available in enterprise", () => {
    expect(isFeatureEnabled(getDefaultLicense("t3"), "exportPdf")).toBe(false);
    expect(isFeatureEnabled(changePlan("t3", "enterprise"), "exportPdf")).toBe(true);
  });
});

describe("Seat Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Seat Assignment", () => {
    it("assigns seat to user", () => {
      const result = assignSeat("tenant_test", "user_1", "Test User", "admin_1");
      expect(result.success).toBe(true);
      expect(isUserSeated("tenant_test", "user_1")).toBe(true);
    });

    it("revokes seat from user", () => {
      assignSeat("tenant_test", "user_1", "Test User", "admin_1");
      const result = revokeSeat("tenant_test", "user_1");
      expect(result).toBe(true);
      expect(isUserSeated("tenant_test", "user_1")).toBe(false);
    });

    it("countUsedSeats returns correct count", () => {
      assignSeat("tenant_test", "user_1", "User 1", "admin");
      assignSeat("tenant_test", "user_2", "User 2", "admin");
      expect(countUsedSeats("tenant_test")).toBe(2);
    });

    it("seat assignments are tenant-scoped", () => {
      assignSeat("tenant_a", "user_1", "User 1", "admin");
      assignSeat("tenant_b", "user_2", "User 2", "admin");
      
      expect(countUsedSeats("tenant_a")).toBe(1);
      expect(countUsedSeats("tenant_b")).toBe(1);
      expect(isUserSeated("tenant_a", "user_1")).toBe(true);
      expect(isUserSeated("tenant_a", "user_2")).toBe(false);
    });

    it("blocks seat assignment when limit reached", () => {
      // Set up license with limit of 1
      saveLicense("tenant_test", {
        ...getDefaultLicense("tenant_test"),
        seatLimit: 1,
      });
      
      assignSeat("tenant_test", "user_1", "User 1", "admin");
      const result = assignSeat("tenant_test", "user_2", "User 2", "admin");
      
      expect(result.success).toBe(false);
      expect(result.error).toContain("Seat-Limit erreicht");
    });
  });

  describe("Seat Usage Info", () => {
    it("returns correct usage info", () => {
      saveLicense("tenant_test", {
        ...getDefaultLicense("tenant_test"),
        seatLimit: 5,
      });
      assignSeat("tenant_test", "user_1", "User 1", "admin");
      assignSeat("tenant_test", "user_2", "User 2", "admin");
      
      const info = getSeatUsageInfo("tenant_test");
      expect(info.used).toBe(2);
      expect(info.limit).toBe(5);
      expect(info.available).toBe(3);
      expect(info.exceeded).toBe(false);
    });
  });
});
