// ============================================
// Sensitive Fields Visibility Hook
// Phase 3A: Combines role, session, viewMode
// Phase 3C: Added adminFullVisibility support
// CORRECTED: POS mode removed from customer-safe logic
// ============================================

import { useMemo } from "react";
import { useIdentity, type AppRole } from "@/contexts/IdentityContext";
import { useCustomerSession } from "@/contexts/CustomerSessionContext";
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
  /** Is customer-safe mode active (ONLY customer session now) */
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
 * WICHTIG: POS-Modus ist KEIN Sicherheits-Feature!
 * POS-Modus = Arbeitsplatz im Shop (UI-Optimierung)
 * Customer-Session = Kunde physisch anwesend (Sicherheits-Lock)
 * 
 * Priority:
 * - If customerSession.isActive → always hide sensitive fields (HIGHEST PRIORITY)
 * - If adminFullVisibility enabled → admins can see everything
 * - If viewMode === "customer" → hide sensitive fields (unless admin override)
 * - Otherwise → show based on role
 * 
 * This is the SINGLE SOURCE OF TRUTH for sensitive field visibility.
 * All components should use this hook instead of checking viewMode directly.
 */
export function useSensitiveFieldsVisible(viewMode: ViewMode): SensitiveFieldsVisibility {
  const { identity, canAccessAdmin } = useIdentity();
  const { session } = useCustomerSession();
  const { enabled: adminFullVisibility } = useFeature("adminFullVisibility");

  return useMemo(() => {
    const isCustomerSessionActive = session.isActive;
    // KORRIGIERT: NUR Customer-Session aktiviert Safe-Mode
    // POS-Modus ist davon unabhängig (nur UI-Modus)
    const isCustomerSafeMode = isCustomerSessionActive;
    const isCustomerView = viewMode === "customer";
    const role: AppRole = identity?.role ?? "sales";
    const isAdmin = role === "admin";

    // Admin Full Visibility: Admins can see everything even in customer view
    // BUT still respect customer-safe mode for safety (customer is physically present)
    const hasAdminOverride = adminFullVisibility && isAdmin && !isCustomerSafeMode;

    // Customer-safe mode (session only) overrides everything (HIGHEST PRIORITY)
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
  }, [identity?.role, session.isActive, viewMode, canAccessAdmin, adminFullVisibility]);
}

/**
 * Standalone function for testing without React context
 * @internal Use useSensitiveFieldsVisible hook in components
 */
/**
 * Standalone function for testing without React context
 * @internal Use useSensitiveFieldsVisible hook in components
 * 
 * KORRIGIERT: isPOSMode Parameter entfernt, da POS kein Sicherheits-Feature ist
 */
export function computeSensitiveFieldsVisibility(
  role: AppRole,
  isCustomerSessionActive: boolean,
  viewMode: ViewMode,
  adminFullVisibility: boolean = false
): Omit<SensitiveFieldsVisibility, "canAccessAdmin"> {
  const isAdmin = role === "admin";
  // NUR Customer-Session aktiviert Safe-Mode
  const isCustomerSafeMode = isCustomerSessionActive;
  const hasAdminOverride = adminFullVisibility && isAdmin && !isCustomerSafeMode;

  // Safety lock: Customer session overrides everything
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
