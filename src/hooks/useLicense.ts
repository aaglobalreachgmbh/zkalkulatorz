// ============================================
// useLicense Hook - Hybrid Cloud/localStorage
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { useCloudLicense } from "@/hooks/useCloudLicense";
import { useCloudSeats } from "@/hooks/useCloudSeats";
import {
  loadLicense,
  updateFeatureFlag,
  changePlan,
  isLicenseValid,
  isSeatLimitExceeded,
  isFeatureEnabled as isFeatureEnabledLocal,
  type LicenseState,
  type LicenseFeatures,
  type LicensePlan,
} from "@/lib/license";
import {
  getSeatUsageInfo,
  assignSeat as assignSeatLocal,
  revokeSeat as revokeSeatLocal,
  isUserSeated as isUserSeatedLocal,
  getSeatedUsers,
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
  /** Whether using cloud storage */
  isCloud: boolean;
}

/**
 * Hybrid hook - uses Cloud for authenticated users, localStorage for guests
 */
export function useLicense(): UseLicenseReturn {
  const { user } = useAuth();
  const { identity } = useIdentity();
  
  // Cloud hooks (only active when authenticated)
  const cloudLicense = useCloudLicense();
  const cloudSeats = useCloudSeats();
  
  // Local state for guest mode
  const [localLicense, setLocalLicense] = useState<LicenseState>(() => loadLicense(identity.tenantId));
  const [localSeatedUsers, setLocalSeatedUsers] = useState<Array<{
    userId: string;
    userName: string;
    assignedAt: string;
    assignedBy: string;
  }>>([]);
  
  // Reload local on tenant change (guest mode)
  useEffect(() => {
    if (!user) {
      const loaded = loadLicense(identity.tenantId);
      setLocalLicense(loaded);
      setLocalSeatedUsers(getSeatedUsers(identity.tenantId));
    }
  }, [user, identity.tenantId]);
  
  // If authenticated, use cloud
  if (user && cloudLicense.license) {
    const checkFeatureEnabled = (featureKey: keyof LicenseFeatures): boolean => {
      return (cloudLicense.license.features as unknown as Record<string, boolean>)[featureKey] ?? true;
    };
    
    const setFeatureEnabled = async (featureKey: keyof LicenseFeatures, enabled: boolean) => {
      const features = { ...(cloudLicense.license.features as unknown as Record<string, boolean>), [featureKey]: enabled };
      await cloudLicense.updateLicense({ features: features as any });
    };
    
    const setPlan = async (plan: LicensePlan) => {
      await cloudLicense.updateLicense({ plan: plan as any });
    };
    
    const assignUserSeat = (userId: string, userName: string): { success: boolean; error?: string } => {
      cloudSeats.assignSeat(userId, userName, userName);
      return { success: true };
    };
    
    const revokeUserSeat = (userId: string): boolean => {
      cloudSeats.revokeSeat(userId);
      return true;
    };
    
    // Map cloud seats to expected format
    const seatedUsers = (cloudSeats.seats || []).map(s => ({
      userId: s.userId,
      userName: s.userName || s.userEmail,
      assignedAt: s.assignedAt,
      assignedBy: s.assignedBy,
    }));
    
    return {
      license: {
        tenantId: cloudLicense.license.tenantId,
        plan: cloudLicense.license.plan as LicensePlan,
        features: cloudLicense.license.features as unknown as LicenseFeatures,
        seatLimit: cloudLicense.license.seatLimit,
        seatsUsed: cloudLicense.license.seatsUsed,
        validUntil: cloudLicense.license.validUntil || undefined,
      },
      isValid: cloudLicense.isValid,
      seatLimitExceeded: cloudSeats.seatUsage.exceeded,
      seatUsage: {
        used: cloudSeats.seatUsage.used,
        limit: cloudSeats.seatUsage.limit,
        available: cloudSeats.seatUsage.available,
      },
      seatedUsers,
      isFeatureEnabled: checkFeatureEnabled,
      currentUserHasSeat: cloudSeats.currentUserHasSeat,
      setFeatureEnabled,
      setPlan,
      assignUserSeat,
      revokeUserSeat,
      refresh: () => {},
      isCloud: true,
    };
  }
  
  // Guest mode: localStorage fallback
  const refresh = useCallback(() => {
    const loaded = loadLicense(identity.tenantId);
    setLocalLicense(loaded);
    setLocalSeatedUsers(getSeatedUsers(identity.tenantId));
  }, [identity.tenantId]);
  
  const checkFeatureEnabled = useCallback(
    (featureKey: keyof LicenseFeatures): boolean => {
      return isFeatureEnabledLocal(localLicense, featureKey);
    },
    [localLicense]
  );
  
  const setFeatureEnabled = useCallback(
    (featureKey: keyof LicenseFeatures, enabled: boolean) => {
      const updated = updateFeatureFlag(identity.tenantId, featureKey, enabled);
      setLocalLicense(updated);
    },
    [identity.tenantId]
  );
  
  const setPlan = useCallback(
    (plan: LicensePlan) => {
      const updated = changePlan(identity.tenantId, plan);
      setLocalLicense(updated);
    },
    [identity.tenantId]
  );
  
  const assignUserSeat = useCallback(
    (userId: string, userName: string): { success: boolean; error?: string } => {
      const result = assignSeatLocal(identity.tenantId, userId, userName, identity.userId);
      if (result.success) {
        refresh();
      }
      return result;
    },
    [identity.tenantId, identity.userId, refresh]
  );
  
  const revokeUserSeat = useCallback(
    (userId: string): boolean => {
      const result = revokeSeatLocal(identity.tenantId, userId);
      if (result) {
        refresh();
      }
      return result;
    },
    [identity.tenantId, refresh]
  );
  
  const seatUsage = getSeatUsageInfo(identity.tenantId);
  const currentUserHasSeat = isUserSeatedLocal(identity.tenantId, identity.userId);
  
  return {
    license: localLicense,
    isValid: isLicenseValid(localLicense),
    seatLimitExceeded: isSeatLimitExceeded(localLicense),
    seatUsage: {
      used: seatUsage.used,
      limit: seatUsage.limit,
      available: seatUsage.available,
    },
    seatedUsers: localSeatedUsers,
    isFeatureEnabled: checkFeatureEnabled,
    currentUserHasSeat,
    setFeatureEnabled,
    setPlan,
    assignUserSeat,
    revokeUserSeat,
    refresh,
    isCloud: false,
  };
}
