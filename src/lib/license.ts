// ============================================
// License System - Phase 3C.1
// Tenant-scoped license management
// ============================================

/**
 * License plan types
 * - internal: Full access, unlimited seats (dev/test)
 * - pro: Standard paid plan
 * - enterprise: Premium plan with all features
 */
export type LicensePlan = "internal" | "pro" | "enterprise";

/**
 * Feature flags available in the license
 */
export interface LicenseFeatures {
  /** Data Governance workflow (import/export with approval) */
  dataGovernance: boolean;
  /** Compare Option 2 in wizard */
  compareOption2: boolean;
  /** Fixed Net module */
  fixedNetModule: boolean;
  /** PDF export functionality */
  exportPdf: boolean;
  /** Audit log access */
  auditLog: boolean;
  /** AI Consultant feature */
  aiConsultant: boolean;
  /** Advanced Reporting & Analytics (Enterprise) */
  advancedReporting: boolean;
  /** REST API access for external systems (Enterprise) */
  apiAccess: boolean;
  /** Custom logo, colors, branding (Enterprise) */
  customBranding: boolean;
}

/**
 * Complete license state for a tenant
 */
export interface LicenseState {
  /** Tenant ID this license belongs to */
  tenantId: string;
  /** License plan type */
  plan: LicensePlan;
  /** Maximum number of seats allowed */
  seatLimit: number;
  /** Current number of seats in use */
  seatsUsed: number;
  /** Feature flags */
  features: LicenseFeatures;
  /** Optional expiration date (ISO string) */
  validUntil?: string;
  /** Last updated timestamp */
  updatedAt: string;
}

/**
 * Default features for each plan
 */
export const PLAN_FEATURES: Record<LicensePlan, LicenseFeatures> = {
  internal: {
    dataGovernance: true,
    compareOption2: true,
    fixedNetModule: true,
    exportPdf: false, // Not built yet
    auditLog: true,
    aiConsultant: true,
    advancedReporting: false,
    apiAccess: false,
    customBranding: false,
  },
  pro: {
    dataGovernance: true,
    compareOption2: true,
    fixedNetModule: true,
    exportPdf: false,
    auditLog: true,
    aiConsultant: true,
    advancedReporting: false,
    apiAccess: false,
    customBranding: false,
  },
  enterprise: {
    dataGovernance: true,
    compareOption2: true,
    fixedNetModule: true,
    exportPdf: true,
    auditLog: true,
    aiConsultant: true,
    advancedReporting: true,
    apiAccess: true,
    customBranding: true,
  },
};

/**
 * Default seat limits for each plan
 */
export const PLAN_SEAT_LIMITS: Record<LicensePlan, number> = {
  internal: 999,
  pro: 5,
  enterprise: 50,
};

// ============================================
// Storage Keys
// ============================================

const LICENSE_STORAGE_PREFIX = "license_";

function getLicenseStorageKey(tenantId: string): string {
  return `${LICENSE_STORAGE_PREFIX}${tenantId}`;
}

// ============================================
// CRUD Functions
// ============================================

/**
 * Get the default license for a tenant
 */
export function getDefaultLicense(tenantId: string): LicenseState {
  return {
    tenantId,
    plan: "internal",
    seatLimit: PLAN_SEAT_LIMITS.internal,
    seatsUsed: 0,
    features: { ...PLAN_FEATURES.internal },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Load license from localStorage
 * Returns default license if none exists
 */
export function loadLicense(tenantId: string): LicenseState {
  try {
    const key = getLicenseStorageKey(tenantId);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return getDefaultLicense(tenantId);
    }
    
    const parsed = JSON.parse(stored) as LicenseState;
    
    // Validate and ensure all feature keys exist (forward compatibility)
    const defaultFeatures = PLAN_FEATURES[parsed.plan] || PLAN_FEATURES.internal;
    const mergedFeatures: LicenseFeatures = {
      ...defaultFeatures,
      ...parsed.features,
    };
    
    return {
      ...parsed,
      tenantId, // Ensure correct tenant
      features: mergedFeatures,
    };
  } catch (error) {
    console.warn("[License] Failed to load license, using default:", error);
    return getDefaultLicense(tenantId);
  }
}

/**
 * Save license to localStorage
 */
export function saveLicense(tenantId: string, license: LicenseState): void {
  try {
    const key = getLicenseStorageKey(tenantId);
    const toSave: LicenseState = {
      ...license,
      tenantId,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch (error) {
    console.error("[License] Failed to save license:", error);
  }
}

/**
 * Update specific license fields
 */
export function updateLicense(
  tenantId: string, 
  updates: Partial<Omit<LicenseState, "tenantId" | "updatedAt">>
): LicenseState {
  const current = loadLicense(tenantId);
  const updated: LicenseState = {
    ...current,
    ...updates,
    features: updates.features 
      ? { ...current.features, ...updates.features }
      : current.features,
    tenantId,
    updatedAt: new Date().toISOString(),
  };
  saveLicense(tenantId, updated);
  return updated;
}

/**
 * Update a specific feature flag
 */
export function updateFeatureFlag(
  tenantId: string,
  featureKey: keyof LicenseFeatures,
  enabled: boolean
): LicenseState {
  const current = loadLicense(tenantId);
  const updated: LicenseState = {
    ...current,
    features: {
      ...current.features,
      [featureKey]: enabled,
    },
    updatedAt: new Date().toISOString(),
  };
  saveLicense(tenantId, updated);
  return updated;
}

/**
 * Update the seat count
 */
export function updateSeatsUsed(tenantId: string, seatsUsed: number): LicenseState {
  return updateLicense(tenantId, { seatsUsed });
}

/**
 * Change the license plan (updates features and seat limit accordingly)
 */
export function changePlan(tenantId: string, newPlan: LicensePlan): LicenseState {
  const current = loadLicense(tenantId);
  const updated: LicenseState = {
    ...current,
    plan: newPlan,
    seatLimit: PLAN_SEAT_LIMITS[newPlan],
    features: { ...PLAN_FEATURES[newPlan] },
    updatedAt: new Date().toISOString(),
  };
  saveLicense(tenantId, updated);
  return updated;
}

/**
 * Check if license is valid (not expired)
 */
export function isLicenseValid(license: LicenseState): boolean {
  if (!license.validUntil) {
    return true; // No expiration = always valid
  }
  
  const expirationDate = new Date(license.validUntil);
  return expirationDate > new Date();
}

/**
 * Check if seat limit is exceeded
 */
export function isSeatLimitExceeded(license: LicenseState): boolean {
  return license.seatsUsed > license.seatLimit;
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(
  license: LicenseState, 
  featureKey: keyof LicenseFeatures
): boolean {
  return license.features[featureKey] === true;
}

/**
 * Clear license (reset to default) - for testing
 */
export function clearLicense(tenantId: string): void {
  const key = getLicenseStorageKey(tenantId);
  localStorage.removeItem(key);
}
