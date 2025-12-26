// ============================================
// Sensitive Fields Visibility Hook
// Phase 3A: Combines role, session, viewMode
// ============================================

import { useMemo } from "react";
import { useIdentity, type AppRole } from "@/contexts/IdentityContext";
import { useCustomerSession } from "@/contexts/CustomerSessionContext";
import type { ViewMode } from "@/margenkalkulator/engine/types";

export interface SensitiveFieldsVisibility {
  /** Can see margin, provision, deductions */
  showDealerEconomics: boolean;
  /** Can see hardware EK (purchase price) */
  showHardwareEk: boolean;
  /** Can see OMO rate selector */
  showOmoSelector: boolean;
  /** Can see FH-Partner toggle */
  showFhPartnerToggle: boolean;
  /** Can access admin/manager pages */
  canAccessAdmin: boolean;
  /** Is customer session active (safety lock) */
  isCustomerSessionActive: boolean;
  /** Current effective mode for display */
  effectiveMode: "customer" | "dealer";
}

/**
 * Determines visibility of sensitive dealer fields based on:
 * 1. User role (admin, manager, sales)
 * 2. Customer session state (safety lock)
 * 3. Current view mode (customer/dealer)
 * 
 * Priority:
 * - If customerSession.isActive → always hide sensitive fields (HIGHEST PRIORITY)
 * - If viewMode === "customer" → hide sensitive fields
 * - Otherwise → show based on role
 * 
 * This is the SINGLE SOURCE OF TRUTH for sensitive field visibility.
 * All components should use this hook instead of checking viewMode directly.
 */
export function useSensitiveFieldsVisible(viewMode: ViewMode): SensitiveFieldsVisibility {
  const { identity, canAccessAdmin } = useIdentity();
  const { session } = useCustomerSession();

  return useMemo(() => {
    const isCustomerSessionActive = session.isActive;
    const isCustomerView = viewMode === "customer";
    const role: AppRole = identity?.role ?? "sales";

    // Safety lock: Customer session overrides everything (HIGHEST PRIORITY)
    if (isCustomerSessionActive) {
      return {
        showDealerEconomics: false,
        showHardwareEk: false,
        showOmoSelector: false,
        showFhPartnerToggle: false,
        canAccessAdmin,
        isCustomerSessionActive: true,
        effectiveMode: "customer",
      };
    }

    // Customer view: hide sensitive fields
    if (isCustomerView) {
      return {
        showDealerEconomics: false,
        showHardwareEk: false,
        showOmoSelector: false,
        showFhPartnerToggle: false,
        canAccessAdmin,
        isCustomerSessionActive: false,
        effectiveMode: "customer",
      };
    }

    // Dealer view: show based on role
    // All roles can see dealer info in dealer mode (when not in customer session)
    const canSeeDealerInfo = role === "admin" || role === "manager" || role === "sales";

    return {
      showDealerEconomics: canSeeDealerInfo,
      showHardwareEk: canSeeDealerInfo,
      showOmoSelector: canSeeDealerInfo,
      showFhPartnerToggle: canSeeDealerInfo,
      canAccessAdmin,
      isCustomerSessionActive: false,
      effectiveMode: "dealer",
    };
  }, [identity?.role, session.isActive, viewMode, canAccessAdmin]);
}

/**
 * Standalone function for testing without React context
 * @internal Use useSensitiveFieldsVisible hook in components
 */
export function computeSensitiveFieldsVisibility(
  role: AppRole,
  isCustomerSessionActive: boolean,
  viewMode: ViewMode
): Omit<SensitiveFieldsVisibility, "canAccessAdmin"> {
  // Safety lock: Customer session overrides everything
  if (isCustomerSessionActive) {
    return {
      showDealerEconomics: false,
      showHardwareEk: false,
      showOmoSelector: false,
      showFhPartnerToggle: false,
      isCustomerSessionActive: true,
      effectiveMode: "customer",
    };
  }

  // Customer view: hide sensitive fields
  if (viewMode === "customer") {
    return {
      showDealerEconomics: false,
      showHardwareEk: false,
      showOmoSelector: false,
      showFhPartnerToggle: false,
      isCustomerSessionActive: false,
      effectiveMode: "customer",
    };
  }

  // Dealer view: all roles can see
  return {
    showDealerEconomics: true,
    showHardwareEk: true,
    showOmoSelector: true,
    showFhPartnerToggle: true,
    isCustomerSessionActive: false,
    effectiveMode: "dealer",
  };
}
