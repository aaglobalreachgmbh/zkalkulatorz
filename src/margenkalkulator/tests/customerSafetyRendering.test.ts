// ============================================
// Customer Safety Rendering Tests
// HOTFIX: Verify no dealer data leaks in customer-safe mode
// ============================================

import { describe, it, expect } from "vitest";
import { computeSensitiveFieldsVisibility } from "@/hooks/useSensitiveFieldsVisible";
import type { AppRole } from "@/contexts/IdentityContext";

describe("Customer Safety Rendering - HOTFIX Security Tests", () => {
  
  describe("Customer Safe Mode Detection", () => {
    it("should activate customer-safe mode when customer session is active", () => {
      const result = computeSensitiveFieldsVisibility(
        "sales",
        true, // customerSessionActive
        "dealer",
        false,
        false // isPOSMode
      );
      
      expect(result.isCustomerSafeMode).toBe(true);
      expect(result.showDealerEconomics).toBe(false);
      expect(result.showHardwareEk).toBe(false);
    });

    it("should activate customer-safe mode when POS mode is active", () => {
      const result = computeSensitiveFieldsVisibility(
        "sales",
        false, // customerSessionActive
        "dealer",
        false,
        true // isPOSMode
      );
      
      expect(result.isCustomerSafeMode).toBe(true);
      expect(result.showDealerEconomics).toBe(false);
      expect(result.showHardwareEk).toBe(false);
    });

    it("should activate customer-safe mode when BOTH session and POS mode are active", () => {
      const result = computeSensitiveFieldsVisibility(
        "admin",
        true, // customerSessionActive
        "dealer",
        true, // adminFullVisibility
        true // isPOSMode
      );
      
      expect(result.isCustomerSafeMode).toBe(true);
      expect(result.showDealerEconomics).toBe(false);
      expect(result.showHardwareEk).toBe(false);
      expect(result.hasAdminFullVisibility).toBe(false); // Safety overrides admin
    });
  });

  describe("Zero Dealer Data Leaks in Customer-Safe Mode", () => {
    const roles: AppRole[] = ["admin", "manager", "sales"];
    const viewModes = ["customer", "dealer"] as const;

    roles.forEach(role => {
      viewModes.forEach(viewMode => {
        it(`should hide ALL dealer fields for ${role} in ${viewMode} mode when POS active`, () => {
          const result = computeSensitiveFieldsVisibility(
            role,
            false,
            viewMode,
            true, // even with admin override enabled
            true  // POS mode active
          );

          // CRITICAL: These must ALL be false in customer-safe mode
          expect(result.showDealerEconomics).toBe(false);
          expect(result.showHardwareEk).toBe(false);
          expect(result.showOmoSelector).toBe(false);
          expect(result.showFhPartnerToggle).toBe(false);
          expect(result.isCustomerSafeMode).toBe(true);
          expect(result.effectiveMode).toBe("customer");
        });

        it(`should hide ALL dealer fields for ${role} in ${viewMode} mode when session active`, () => {
          const result = computeSensitiveFieldsVisibility(
            role,
            true, // customer session active
            viewMode,
            true, // even with admin override enabled
            false
          );

          // CRITICAL: These must ALL be false in customer-safe mode
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

  describe("Admin Override Respects Customer Safety", () => {
    it("should NOT allow admin override when customer session is active", () => {
      const result = computeSensitiveFieldsVisibility(
        "admin",
        true, // customer session active - should block admin override
        "customer",
        true, // admin full visibility enabled
        false
      );

      expect(result.hasAdminFullVisibility).toBe(false);
      expect(result.showDealerEconomics).toBe(false);
      expect(result.isCustomerSafeMode).toBe(true);
    });

    it("should NOT allow admin override when POS mode is active", () => {
      const result = computeSensitiveFieldsVisibility(
        "admin",
        false,
        "dealer", // even in dealer mode
        true, // admin full visibility enabled
        true  // POS mode active - should block admin override
      );

      expect(result.hasAdminFullVisibility).toBe(false);
      expect(result.showDealerEconomics).toBe(false);
      expect(result.isCustomerSafeMode).toBe(true);
    });

    it("should allow admin override when NOT in customer-safe mode", () => {
      const result = computeSensitiveFieldsVisibility(
        "admin",
        false,
        "customer", // customer view mode but no session
        true, // admin full visibility enabled
        false // POS mode off
      );

      expect(result.hasAdminFullVisibility).toBe(true);
      expect(result.showDealerEconomics).toBe(true);
      expect(result.isCustomerSafeMode).toBe(false);
    });
  });

  describe("Dealer Mode Without Safety Lock", () => {
    it("should show all dealer fields in dealer mode without safety lock", () => {
      const result = computeSensitiveFieldsVisibility(
        "sales",
        false,
        "dealer",
        false,
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

  describe("Customer View Mode (without safety lock)", () => {
    it("should hide dealer fields in customer view mode even without session", () => {
      const result = computeSensitiveFieldsVisibility(
        "sales",
        false,
        "customer",
        false,
        false
      );

      expect(result.showDealerEconomics).toBe(false);
      expect(result.showHardwareEk).toBe(false);
      expect(result.isCustomerSafeMode).toBe(false);
      expect(result.effectiveMode).toBe("customer");
    });
  });

  describe("LiveCalculationBar Rendering Requirements", () => {
    // These tests document the expected behavior for LiveCalculationBar
    
    it("should return visibility that hides Provision, EK, Marge in customer-safe mode", () => {
      const result = computeSensitiveFieldsVisibility(
        "sales",
        false,
        "dealer",
        false,
        true // POS mode
      );

      // LiveCalculationBar checks showDealerEconomics to decide what to render
      expect(result.showDealerEconomics).toBe(false);
      // This means BottomBar will NOT render: Provision, HW-EK, Marge
      // Instead it renders: Ø Monat, Verträge, 24 Mon. Gesamt
    });
  });

  describe("HardwareStep EK Label Requirements", () => {
    // These tests document the expected behavior for HardwareStep
    
    it("should return visibility that hides EK in hardware dropdown in customer-safe mode", () => {
      const result = computeSensitiveFieldsVisibility(
        "sales",
        false,
        "dealer",
        false,
        true // POS mode
      );

      // HardwareStep checks showHardwareEk to decide if EK is shown
      expect(result.showHardwareEk).toBe(false);
      // This means hardware cards will NOT show: "ab XXX € EK" or "EK: XXX €"
    });
  });
});
