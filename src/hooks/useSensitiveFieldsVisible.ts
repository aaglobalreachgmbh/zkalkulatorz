// ============================================
// Sensitive Fields Visibility Hook
// Phase 3A: Combines role, session, viewMode
// Phase 3C: Added adminFullVisibility support
// ============================================

import { useMemo } from "react";
import { useIdentity, type AppRole } from "@/contexts/IdentityContext";
import { useCustomerSession } from "@/contexts/CustomerSessionContext";
import { usePOSMode } from "@/contexts/POSModeContext";
import { useFeature } from "@/hooks/useFeature";
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
  /** Is customer-safe mode active (session OR POS mode) */
  isCustomerSafeMode: boolean;
  /** Current effective mode for display */
  effectiveMode: "customer" | "dealer";
  /** Is admin full visibility enabled (overrides customer view for admins) */
  hasAdminFullVisibility: boolean;
}

/**
 * Determines visibility of sensitive dealer fields based on:
 * 1. User role (admin, manager, sales)
 * 2. Customer session state (safety lock)
 * 3. Current view mode (customer/dealer)
 * 4. adminFullVisibility feature flag (ADMIN OVERRIDE)
 * 
 * Priority:
 * - If adminFullVisibility enabled → admins ALWAYS see everything (except in customer session)
 * - If customerSession.isActive → always hide sensitive fields (HIGHEST PRIORITY for customer safety)
 * - If viewMode === "customer" → hide sensitive fields (unless admin override)
 * - Otherwise → show based on role
 * 
 * This is the SINGLE SOURCE OF TRUTH for sensitive field visibility.
 * All components should use this hook instead of checking viewMode directly.
 */
export function useSensitiveFieldsVisible(viewMode: ViewMode): SensitiveFieldsVisibility {
  const { identity, canAccessAdmin } = useIdentity();
  const { session } = useCustomerSession();
  const { isPOSMode } = usePOSMode();
  const { enabled: adminFullVisibility } = useFeature("adminFullVisibility");

  return useMemo(() => {
    const isCustomerSessionActive = session.isActive;
    // HOTFIX: POS mode also triggers customer-safe mode
    const isCustomerSafeMode = isCustomerSessionActive || isPOSMode;
    const isCustomerView = viewMode === "customer";
    const role: AppRole = identity?.role ?? "sales";
    const isAdmin = role === "admin";

    // Admin Full Visibility: Admins can see everything even in customer view
    // BUT still respect customer-safe mode for safety (customer is physically present)
    const hasAdminOverride = adminFullVisibility && isAdmin && !isCustomerSafeMode;

    // HOTFIX: Customer-safe mode (session OR POS) overrides everything (HIGHEST PRIORITY)
    // This is the "customer is physically present" scenario
    if (isCustomerSafeMode) {
      return {
        showDealerEconomics: false,
        showHardwareEk: false,
        showOmoSelector: false,
        showFhPartnerToggle: false,
        canAccessAdmin,
        isCustomerSessionActive,
        isCustomerSafeMode: true,
        effectiveMode: "customer",
        hasAdminFullVisibility: false, // Disabled during customer-safe mode
      };
    }

    // Admin override: Can see everything even in customer view mode
    if (hasAdminOverride) {
      return {
        showDealerEconomics: true,
        showHardwareEk: true,
        showOmoSelector: true,
        showFhPartnerToggle: true,
        canAccessAdmin,
        isCustomerSessionActive: false,
        isCustomerSafeMode: false,
        effectiveMode: isCustomerView ? "customer" : "dealer",
        hasAdminFullVisibility: true,
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
        isCustomerSafeMode: false,
        effectiveMode: "customer",
        hasAdminFullVisibility: false,
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
      isCustomerSafeMode: false,
      effectiveMode: "dealer",
      hasAdminFullVisibility: adminFullVisibility && isAdmin,
    };
  }, [identity?.role, session.isActive, isPOSMode, viewMode, canAccessAdmin, adminFullVisibility]);
}

/**
 * Standalone function for testing without React context
 * @internal Use useSensitiveFieldsVisible hook in components
 */
export function computeSensitiveFieldsVisibility(
  role: AppRole,
  isCustomerSessionActive: boolean,
  viewMode: ViewMode,
  adminFullVisibility: boolean = false,
  isPOSMode: boolean = false
): Omit<SensitiveFieldsVisibility, "canAccessAdmin"> {
  const isAdmin = role === "admin";
  const isCustomerSafeMode = isCustomerSessionActive || isPOSMode;
  const hasAdminOverride = adminFullVisibility && isAdmin && !isCustomerSafeMode;

  // Safety lock: Customer-safe mode (session OR POS) overrides everything
  if (isCustomerSafeMode) {
    return {
      showDealerEconomics: false,
      showHardwareEk: false,
      showOmoSelector: false,
      showFhPartnerToggle: false,
      isCustomerSessionActive,
      isCustomerSafeMode: true,
      effectiveMode: "customer",
      hasAdminFullVisibility: false,
    };
  }

  // Admin override: Can see everything
  if (hasAdminOverride) {
    return {
      showDealerEconomics: true,
      showHardwareEk: true,
      showOmoSelector: true,
      showFhPartnerToggle: true,
      isCustomerSessionActive: false,
      isCustomerSafeMode: false,
      effectiveMode: viewMode === "customer" ? "customer" : "dealer",
      hasAdminFullVisibility: true,
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
      isCustomerSafeMode: false,
      effectiveMode: "customer",
      hasAdminFullVisibility: false,
    };
  }

  // Dealer view: all roles can see
  return {
    showDealerEconomics: true,
    showHardwareEk: true,
    showOmoSelector: true,
    showFhPartnerToggle: true,
    isCustomerSessionActive: false,
    isCustomerSafeMode: false,
    effectiveMode: "dealer",
    hasAdminFullVisibility: adminFullVisibility && isAdmin,
  };
}
