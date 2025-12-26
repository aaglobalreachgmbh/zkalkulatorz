// ============================================
// useFeature Hook - Phase 3C.3
// Check feature availability
// ============================================

import { useMemo } from "react";
import { useIdentity } from "@/contexts/IdentityContext";
import { loadLicense, isFeatureEnabled, type LicenseFeatures } from "@/lib/license";

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
 * Hook to check if a feature is enabled
 * 
 * @example
 * const { enabled, reason } = useFeature("aiConsultant");
 * if (!enabled) {
 *   return <FeatureDisabledMessage reason={reason} />;
 * }
 */
export function useFeature(featureKey: keyof LicenseFeatures): UseFeatureReturn {
  const { identity } = useIdentity();
  
  return useMemo(() => {
    const license = loadLicense(identity.tenantId);
    const enabled = isFeatureEnabled(license, featureKey);
    
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
  }, [identity.tenantId, featureKey]);
}

/**
 * Hook to check multiple features at once
 */
export function useFeatures(featureKeys: (keyof LicenseFeatures)[]): Record<keyof LicenseFeatures, UseFeatureReturn> {
  const { identity } = useIdentity();
  
  return useMemo(() => {
    const license = loadLicense(identity.tenantId);
    const result: Partial<Record<keyof LicenseFeatures, UseFeatureReturn>> = {};
    
    for (const key of featureKeys) {
      const enabled = isFeatureEnabled(license, key);
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
  }, [identity.tenantId, featureKeys]);
}

/**
 * Simple boolean check for features (no reason)
 */
export function useIsFeatureEnabled(featureKey: keyof LicenseFeatures): boolean {
  const { enabled } = useFeature(featureKey);
  return enabled;
}
