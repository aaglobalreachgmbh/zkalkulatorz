// ============================================
// Customer Safety Rendering Tests
// CORRECTED: POS mode is no longer a safety feature
// Only Customer Session triggers safe mode
// ============================================

import { describe, it, expect } from "vitest";
import { computeSensitiveFieldsVisibility } from "@/hooks/useSensitiveFieldsVisible";
import type { AppRole } from "@/contexts/IdentityContext";

describe("Customer Safety Rendering Tests", () => {
  
  describe("Customer Safe Mode Detection", () => {
    it("should activate customer-safe mode when customer session is active", () => {
      const result = computeSensitiveFieldsVisibility(
        "sales",
        true, // customerSessionActive
        "dealer",
        false
      );
      
      expect(result.isCustomerSafeMode).toBe(true);
      expect(result.showDealerEconomics).toBe(false);
      expect(result.showHardwareEk).toBe(false);
    });

    it("should NOT activate customer-safe mode when ONLY view mode is customer (no session)", () => {
      const result = computeSensitiveFieldsVisibility(
        "sales",
        false, // customerSessionActive
        "customer",
        false
      );
      
      // isCustomerSafeMode is false because session is not active
      expect(result.isCustomerSafeMode).toBe(false);
      // But fields are still hidden because viewMode is "customer"
      expect(result.showDealerEconomics).toBe(false);
      expect(result.effectiveMode).toBe("customer");
    });
  });

  describe("Zero Dealer Data Leaks When Customer Present", () => {
    const roles: AppRole[] = ["admin", "manager", "sales"];
    const viewModes = ["customer", "dealer"] as const;

    roles.forEach(role => {
      viewModes.forEach(viewMode => {
        it(`should hide ALL dealer fields for ${role} in ${viewMode} mode when customer session active`, () => {
          const result = computeSensitiveFieldsVisibility(
            role,
            true, // customer session active
            viewMode,
            true // even with admin override enabled
          );

          // CRITICAL: These must ALL be false when customer is present
          expect(result.showDealerEconomics).toBe(false);
          expect(result.showHardwareEk).toBe(false);
          expect(result.showOmoSelector).toBe(false);
          expect(result.showFhPartnerToggle).toBe(false);
          expect(result.isCustomerSafeMode).toBe(true);
          expect(result.effectiveMode).toBe("customer");
        });
      });
    });
  });

  describe("Admin Override Respects Customer Session", () => {
    it("should NOT allow admin override when customer session is active", () => {
      const result = computeSensitiveFieldsVisibility(
        "admin",
        true, // customer session active - should block admin override
        "customer",
        true // admin full visibility enabled
      );

      expect(result.hasAdminFullVisibility).toBe(false);
      expect(result.showDealerEconomics).toBe(false);
      expect(result.isCustomerSafeMode).toBe(true);
    });

    it("should allow admin override when NOT in customer session", () => {
      const result = computeSensitiveFieldsVisibility(
        "admin",
        false, // no customer session
        "customer", // customer view mode but no session
        true // admin full visibility enabled
      );

      expect(result.hasAdminFullVisibility).toBe(true);
      expect(result.showDealerEconomics).toBe(true);
      expect(result.isCustomerSafeMode).toBe(false);
    });
  });

  describe("Dealer Mode Without Customer", () => {
    it("should show all dealer fields in dealer mode without customer", () => {
      const result = computeSensitiveFieldsVisibility(
        "sales",
        false,
        "dealer",
        false
      );

      expect(result.showDealerEconomics).toBe(true);
      expect(result.showHardwareEk).toBe(true);
      expect(result.showOmoSelector).toBe(true);
      expect(result.showFhPartnerToggle).toBe(true);
      expect(result.isCustomerSafeMode).toBe(false);
      expect(result.effectiveMode).toBe("dealer");
    });
  });

  describe("Customer View Mode (without session)", () => {
    it("should hide dealer fields in customer view mode even without session", () => {
      const result = computeSensitiveFieldsVisibility(
        "sales",
        false,
        "customer",
        false
      );

      expect(result.showDealerEconomics).toBe(false);
      expect(result.showHardwareEk).toBe(false);
      expect(result.isCustomerSafeMode).toBe(false);
      expect(result.effectiveMode).toBe("customer");
    });
  });

  describe("LiveCalculationBar Rendering Requirements", () => {
    it("should return visibility that hides Provision, EK, Marge when customer present", () => {
      const result = computeSensitiveFieldsVisibility(
        "sales",
        true, // customer session active
        "dealer",
        false
      );

      // LiveCalculationBar checks showDealerEconomics to decide what to render
      expect(result.showDealerEconomics).toBe(false);
    });
    
    it("should show dealer data in dealer mode without customer", () => {
      const result = computeSensitiveFieldsVisibility(
        "sales",
        false, // no customer
        "dealer",
        false
      );

      expect(result.showDealerEconomics).toBe(true);
    });
  });

  describe("HardwareStep EK Label Requirements", () => {
    it("should hide EK in hardware dropdown when customer present", () => {
      const result = computeSensitiveFieldsVisibility(
        "sales",
        true, // customer present
        "dealer",
        false
      );

      expect(result.showHardwareEk).toBe(false);
    });
    
    it("should show EK in hardware dropdown without customer", () => {
      const result = computeSensitiveFieldsVisibility(
        "sales",
        false, // no customer
        "dealer",
        false
      );

      expect(result.showHardwareEk).toBe(true);
    });
  });
});
