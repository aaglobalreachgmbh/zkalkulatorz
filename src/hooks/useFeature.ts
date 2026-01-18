// ============================================
// useFeature Hook - Hybrid Cloud/localStorage
// ============================================

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { useCloudLicense } from "@/hooks/useCloudLicense";
import { useUserRole } from "@/hooks/useUserRole";
import { loadLicense, isFeatureEnabled as isFeatureEnabledLocal, type LicenseFeatures } from "@/lib/license";

export interface UseFeatureReturn {
  /** Whether the feature is enabled */
  enabled: boolean;
  /** Reason why feature is disabled (if applicable) */
  reason?: string;
  /** The plan that includes this feature */
  requiredPlan?: string;
}

/**
 * Feature display names for user-facing messages
 */
const FEATURE_NAMES: Record<keyof LicenseFeatures, string> = {
  dataGovernance: "Daten-Governance",
  compareOption2: "Option 2 Vergleich",
  fixedNetModule: "Festnetz-Modul",
  exportPdf: "PDF Export",
  auditLog: "Audit-Protokoll",
  aiConsultant: "AI Berater",
  advancedReporting: "Erweitertes Reporting",
  apiAccess: "API-Zugang",
  customBranding: "Eigenes Branding",
  // Admin-Only Features
  adminFullVisibility: "Admin: Vollständige Sichtbarkeit",
  adminFeatureControl: "Admin: Feature-Steuerung",
  adminSecurityAccess: "Admin: Security-Zugang",
  adminBypassApproval: "Admin: Approval überspringen",
  // Multi-Device Features
  mobileAccess: "Mobile/Tablet Zugang",
  offlineSync: "Offline-Synchronisation",
};

/**
 * Features that require specific plans
 */
const FEATURE_REQUIRED_PLANS: Partial<Record<keyof LicenseFeatures, string>> = {
  exportPdf: "enterprise",
  advancedReporting: "enterprise",
  apiAccess: "enterprise",
  customBranding: "enterprise",
};

/**
 * Hybrid hook - uses Cloud for authenticated users, localStorage for guests
 * Admins get ALL features enabled automatically
 */
export function useFeature(featureKey: keyof LicenseFeatures): UseFeatureReturn {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const cloudLicense = useCloudLicense();
  const { isAdmin, isTenantAdmin } = useUserRole();
  
  return useMemo(() => {
    // Admin-Bypass: Admins und Tenant-Admins bekommen ALLE Features
    if (isAdmin || isTenantAdmin) {
      return { enabled: true };
    }
    
    let enabled: boolean;
    
    if (user && cloudLicense.license) {
      // Cloud mode - check feature in cloud license
      enabled = (cloudLicense.license.features as unknown as Record<string, boolean>)[featureKey] ?? true;
    } else {
      // Guest mode - localStorage
      const license = loadLicense(identity.tenantId);
      enabled = isFeatureEnabledLocal(license, featureKey);
    }
    
    if (enabled) {
      return { enabled: true };
    }
    
    const featureName = FEATURE_NAMES[featureKey] || featureKey;
    const requiredPlan = FEATURE_REQUIRED_PLANS[featureKey];
    
    return {
      enabled: false,
      reason: requiredPlan
        ? `${featureName} ist nur im ${requiredPlan.toUpperCase()}-Plan verfügbar.`
        : `${featureName} ist in Ihrer Lizenz nicht aktiviert.`,
      requiredPlan,
    };
  }, [user, cloudLicense.license, identity.tenantId, featureKey, isAdmin, isTenantAdmin]);
}

/**
 * Hook to check multiple features at once
 * Admins get ALL features enabled automatically
 */
export function useFeatures(featureKeys: (keyof LicenseFeatures)[]): Record<keyof LicenseFeatures, UseFeatureReturn> {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const cloudLicense = useCloudLicense();
  const { isAdmin, isTenantAdmin } = useUserRole();
  
  return useMemo(() => {
    const result: Partial<Record<keyof LicenseFeatures, UseFeatureReturn>> = {};
    
    for (const key of featureKeys) {
      // Admin-Bypass: Admins und Tenant-Admins bekommen ALLE Features
      if (isAdmin || isTenantAdmin) {
        result[key] = { enabled: true };
        continue;
      }
      
      let enabled: boolean;
      
      if (user && cloudLicense.license) {
        enabled = (cloudLicense.license.features as unknown as Record<string, boolean>)[key] ?? true;
      } else {
        const license = loadLicense(identity.tenantId);
        enabled = isFeatureEnabledLocal(license, key);
      }
      
      const featureName = FEATURE_NAMES[key] || key;
      const requiredPlan = FEATURE_REQUIRED_PLANS[key];
      
      result[key] = enabled
        ? { enabled: true }
        : {
            enabled: false,
            reason: requiredPlan
              ? `${featureName} ist nur im ${requiredPlan.toUpperCase()}-Plan verfügbar.`
              : `${featureName} ist in Ihrer Lizenz nicht aktiviert.`,
            requiredPlan,
          };
    }
    
    return result as Record<keyof LicenseFeatures, UseFeatureReturn>;
  }, [user, cloudLicense.license, identity.tenantId, featureKeys, isAdmin, isTenantAdmin]);
}

/**
 * Simple boolean check for features (no reason)
 */
export function useIsFeatureEnabled(featureKey: keyof LicenseFeatures): boolean {
  const { enabled } = useFeature(featureKey);
  return enabled;
}
