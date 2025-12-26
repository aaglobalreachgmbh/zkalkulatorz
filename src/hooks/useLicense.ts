// ============================================
// useLicense Hook - Phase 3C
// Access license state in components
// ============================================

import { useState, useEffect, useCallback } from "react";
import { useIdentity } from "@/contexts/IdentityContext";
import {
  loadLicense,
  saveLicense,
  updateLicense,
  updateFeatureFlag,
  changePlan,
  isLicenseValid,
  isSeatLimitExceeded,
  isFeatureEnabled,
  type LicenseState,
  type LicenseFeatures,
  type LicensePlan,
} from "@/lib/license";
import {
  getSeatUsageInfo,
  assignSeat,
  revokeSeat,
  isUserSeated,
  getSeatedUsers,
  type SeatAssignment,
} from "@/lib/seatManagement";

export interface UseLicenseReturn {
  /** Current license state */
  license: LicenseState;
  /** Whether the license is valid (not expired) */
  isValid: boolean;
  /** Whether seat limit is exceeded */
  seatLimitExceeded: boolean;
  /** Seat usage information */
  seatUsage: {
    used: number;
    limit: number;
    available: number;
  };
  /** List of users with seats */
  seatedUsers: Array<{
    userId: string;
    userName: string;
    assignedAt: string;
    assignedBy: string;
  }>;
  /** Check if a feature is enabled */
  isFeatureEnabled: (featureKey: keyof LicenseFeatures) => boolean;
  /** Check if current user has a seat */
  currentUserHasSeat: boolean;
  /** Update a feature flag */
  setFeatureEnabled: (featureKey: keyof LicenseFeatures, enabled: boolean) => void;
  /** Change the plan */
  setPlan: (plan: LicensePlan) => void;
  /** Assign a seat to a user */
  assignUserSeat: (userId: string, userName: string) => { success: boolean; error?: string };
  /** Revoke a seat from a user */
  revokeUserSeat: (userId: string) => boolean;
  /** Refresh license from storage */
  refresh: () => void;
}

/**
 * Hook to access and manage license state
 */
export function useLicense(): UseLicenseReturn {
  const { identity } = useIdentity();
  const [license, setLicense] = useState<LicenseState>(() => loadLicense(identity.tenantId));
  const [seatedUsers, setSeatedUsers] = useState<Array<{
    userId: string;
    userName: string;
    assignedAt: string;
    assignedBy: string;
  }>>([]);
  
  // Reload on tenant change
  useEffect(() => {
    const loaded = loadLicense(identity.tenantId);
    setLicense(loaded);
    setSeatedUsers(getSeatedUsers(identity.tenantId));
  }, [identity.tenantId]);
  
  const refresh = useCallback(() => {
    const loaded = loadLicense(identity.tenantId);
    setLicense(loaded);
    setSeatedUsers(getSeatedUsers(identity.tenantId));
  }, [identity.tenantId]);
  
  const checkFeatureEnabled = useCallback(
    (featureKey: keyof LicenseFeatures): boolean => {
      return isFeatureEnabled(license, featureKey);
    },
    [license]
  );
  
  const setFeatureEnabled = useCallback(
    (featureKey: keyof LicenseFeatures, enabled: boolean) => {
      const updated = updateFeatureFlag(identity.tenantId, featureKey, enabled);
      setLicense(updated);
    },
    [identity.tenantId]
  );
  
  const setPlan = useCallback(
    (plan: LicensePlan) => {
      const updated = changePlan(identity.tenantId, plan);
      setLicense(updated);
    },
    [identity.tenantId]
  );
  
  const assignUserSeat = useCallback(
    (userId: string, userName: string): { success: boolean; error?: string } => {
      const result = assignSeat(identity.tenantId, userId, userName, identity.userId);
      if (result.success) {
        refresh();
      }
      return result;
    },
    [identity.tenantId, identity.userId, refresh]
  );
  
  const revokeUserSeat = useCallback(
    (userId: string): boolean => {
      const result = revokeSeat(identity.tenantId, userId);
      if (result) {
        refresh();
      }
      return result;
    },
    [identity.tenantId, refresh]
  );
  
  const seatUsage = getSeatUsageInfo(identity.tenantId);
  const currentUserHasSeat = isUserSeated(identity.tenantId, identity.userId);
  
  return {
    license,
    isValid: isLicenseValid(license),
    seatLimitExceeded: isSeatLimitExceeded(license),
    seatUsage: {
      used: seatUsage.used,
      limit: seatUsage.limit,
      available: seatUsage.available,
    },
    seatedUsers,
    isFeatureEnabled: checkFeatureEnabled,
    currentUserHasSeat,
    setFeatureEnabled,
    setPlan,
    assignUserSeat,
    revokeUserSeat,
    refresh,
  };
}
