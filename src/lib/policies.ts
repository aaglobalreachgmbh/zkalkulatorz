// ============================================
// Policies Layer - Phase 3B.2
// Tenant-level defaults + Department overrides
// ============================================

/**
 * Policy configuration that controls app behavior
 */
export interface Policy {
  // View defaults
  defaultViewMode: "dealer" | "customer";
  showCustomerSessionToggle: boolean;
  requireCustomerSessionWhenCustomerMode: boolean;
  requireConfirmOnDealerSwitch: boolean;
  allowCustomerMode: boolean;
  
  // Sensitive fields (central source of truth)
  sensitiveFieldKeys: string[];
  
  // Margin warnings
  marginWarningThreshold: number;
}

/**
 * Default policy values
 */
export const DEFAULT_POLICY: Policy = {
  defaultViewMode: "dealer",
  showCustomerSessionToggle: true,
  requireCustomerSessionWhenCustomerMode: false,
  requireConfirmOnDealerSwitch: false,
  allowCustomerMode: true,
  sensitiveFieldKeys: [
    "hardwareEk",
    "dealerProvision",
    "dealerMargin",
    "omoRate",
    "fhPartnerStatus",
    "breakdownDealer",
    "marginIndicator",
  ],
  marginWarningThreshold: 0,
};

// ============================================
// Storage Keys
// ============================================

function getTenantPolicyKey(tenantId: string): string {
  return `policy_tenant_${tenantId}`;
}

function getDeptPolicyKey(tenantId: string, departmentId: string): string {
  return `policy_dept_${tenantId}_${departmentId}`;
}

// ============================================
// Policy CRUD
// ============================================

/**
 * Load tenant-level policy
 */
export function loadTenantPolicy(tenantId: string): Partial<Policy> {
  try {
    const key = getTenantPolicyKey(tenantId);
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

/**
 * Save tenant-level policy
 */
export function saveTenantPolicy(tenantId: string, policy: Partial<Policy>): void {
  const key = getTenantPolicyKey(tenantId);
  localStorage.setItem(key, JSON.stringify(policy));
}

/**
 * Load department-level policy override
 */
export function loadDeptPolicy(tenantId: string, departmentId: string): Partial<Policy> {
  try {
    const key = getDeptPolicyKey(tenantId, departmentId);
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

/**
 * Save department-level policy override
 */
export function saveDeptPolicy(tenantId: string, departmentId: string, policy: Partial<Policy>): void {
  const key = getDeptPolicyKey(tenantId, departmentId);
  localStorage.setItem(key, JSON.stringify(policy));
}

/**
 * Clear department-level policy override
 */
export function clearDeptPolicy(tenantId: string, departmentId: string): void {
  const key = getDeptPolicyKey(tenantId, departmentId);
  localStorage.removeItem(key);
}

// ============================================
// Policy Resolution
// ============================================

/**
 * Get effective policy by merging:
 * 1. DEFAULT_POLICY (base)
 * 2. Tenant policy (override)
 * 3. Department policy (override)
 * 
 * Department > Tenant > Default
 */
export function getEffectivePolicy(tenantId: string, departmentId: string): Policy {
  const tenantPolicy = loadTenantPolicy(tenantId);
  const deptPolicy = loadDeptPolicy(tenantId, departmentId);
  
  return {
    ...DEFAULT_POLICY,
    ...tenantPolicy,
    ...deptPolicy,
  };
}

/**
 * Update a single policy field at tenant level
 */
export function updateTenantPolicyField<K extends keyof Policy>(
  tenantId: string,
  key: K,
  value: Policy[K]
): void {
  const current = loadTenantPolicy(tenantId);
  saveTenantPolicy(tenantId, { ...current, [key]: value });
}

/**
 * Update a single policy field at department level
 */
export function updateDeptPolicyField<K extends keyof Policy>(
  tenantId: string,
  departmentId: string,
  key: K,
  value: Policy[K]
): void {
  const current = loadDeptPolicy(tenantId, departmentId);
  saveDeptPolicy(tenantId, departmentId, { ...current, [key]: value });
}

// ============================================
// Policy Validation
// ============================================

/**
 * Check if a field key is in the sensitive list
 */
export function isSensitiveField(policy: Policy, fieldKey: string): boolean {
  return policy.sensitiveFieldKeys.includes(fieldKey);
}

/**
 * Get all sensitive field keys from policy
 */
export function getSensitiveFieldKeys(policy: Policy): string[] {
  return [...policy.sensitiveFieldKeys];
}
