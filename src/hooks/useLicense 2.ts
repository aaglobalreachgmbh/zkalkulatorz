// @ts-nocheck
// ============================================
// useLicense Hook - Hybrid Cloud/localStorage
// ============================================

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useIdentity } from "../contexts/IdentityContext";
import { useCloudLicense } from "./useCloudLicense";
import { useCloudSeats } from "./useCloudSeats";
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
} from "../lib/license";
import {
  getSeatUsageInfo,
  assignSeat as assignSeatLocal,
  revokeSeat as revokeSeatLocal,
  isUserSeated as isUserSeatedLocal,
  getSeatedUsers,
} from "../lib/seatManagement";

export interface UseLicenseReturn {
  license: LicenseState;
  isValid: boolean;
  seatLimitExceeded: boolean;
  seatUsage: {
    used: number;
    limit: number;
    available: number;
  };
  seatedUsers: Array<{
    userId: string;
    userName: string;
    assignedAt: string;
    assignedBy: string;
  }>;
  isFeatureEnabled: (featureKey: keyof LicenseFeatures) => boolean;
  currentUserHasSeat: boolean;
  setFeatureEnabled: (featureKey: keyof LicenseFeatures, enabled: boolean) => void;
  setPlan: (plan: LicensePlan) => void;
  assignUserSeat: (userId: string, userName: string) => { success: boolean; error?: string };
  revokeUserSeat: (userId: string) => boolean;
  refresh: () => void;
  isCloud: boolean;
}

/**
 * Hybrid hook - uses Cloud for authenticated users, localStorage for guests
 */
export function useLicense(): UseLicenseReturn {
  const { user } = useAuth();
  const { identity } = useIdentity();

  // Cloud hooks (always called, but only active when authenticated)
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

  // ALL useCallback hooks MUST be called unconditionally (React rules)
  const refresh = useCallback(() => {
    if (!user) {
      const loaded = loadLicense(identity.tenantId);
      setLocalLicense(loaded);
      setLocalSeatedUsers(getSeatedUsers(identity.tenantId));
    }
  }, [user, identity.tenantId]);

  const checkFeatureEnabledLocal = useCallback(
    (featureKey: keyof LicenseFeatures): boolean => {
      return isFeatureEnabledLocal(localLicense, featureKey);
    },
    [localLicense]
  );

  const setFeatureEnabledLocal = useCallback(
    (featureKey: keyof LicenseFeatures, enabled: boolean) => {
      const updated = updateFeatureFlag(identity.tenantId, featureKey, enabled);
      setLocalLicense(updated);
    },
    [identity.tenantId]
  );

  const setPlanLocal = useCallback(
    (plan: LicensePlan) => {
      const updated = changePlan(identity.tenantId, plan);
      setLocalLicense(updated);
    },
    [identity.tenantId]
  );

  const assignUserSeatLocal = useCallback(
    (userId: string, userName: string): { success: boolean; error?: string } => {
      const result = assignSeatLocal(identity.tenantId, userId, userName, identity.userId);
      if (result.success) {
        refresh();
      }
      return result;
    },
    [identity.tenantId, identity.userId, refresh]
  );

  const revokeUserSeatLocal = useCallback(
    (userId: string): boolean => {
      const result = revokeSeatLocal(identity.tenantId, userId);
      if (result) {
        refresh();
      }
      return result;
    },
    [identity.tenantId, refresh]
  );

  // Cloud mode: authenticated user with license
  if (user && cloudLicense.license) {
    const checkFeatureEnabled = (featureKey: keyof LicenseFeatures): boolean => {
      return ((cloudLicense.license.features as unknown as Record<string, boolean>)[featureKey] ?? true) as boolean;
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
        validUntil: cloudLicense.license?.valid_until || undefined,
        updatedAt: cloudLicense.license.updatedAt,
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
      refresh: () => { }, // No-op for cloud mode
      isCloud: true,
    };
  }

  // Guest mode: localStorage fallback
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
    isFeatureEnabled: checkFeatureEnabledLocal,
    currentUserHasSeat,
    setFeatureEnabled: setFeatureEnabledLocal,
    setPlan: setPlanLocal,
    assignUserSeat: assignUserSeatLocal,
    revokeUserSeat: revokeUserSeatLocal,
    refresh,
    isCloud: false,
  };
}
