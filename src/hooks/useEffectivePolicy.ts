// ============================================
// useEffectivePolicy Hook - Phase 3B.2
// Access resolved policy in components
// ============================================

import { useMemo } from "react";
import { useIdentity } from "@/contexts/IdentityContext";
import { getEffectivePolicy, DEFAULT_POLICY, type Policy } from "@/lib/policies";

/**
 * Hook to get the effective policy for the current user
 * Merges: DEFAULT_POLICY < Tenant Policy < Department Policy
 */
export function useEffectivePolicy(): Policy {
  const { identity } = useIdentity();
  
  const policy = useMemo(() => {
    return getEffectivePolicy(identity.tenantId, identity.departmentId);
  }, [identity.tenantId, identity.departmentId]);
  
  return policy;
}

/**
 * Hook to check if a specific field is sensitive
 */
export function useIsSensitiveField(fieldKey: string): boolean {
  const policy = useEffectivePolicy();
  return policy.sensitiveFieldKeys.includes(fieldKey);
}

/**
 * Hook to get all sensitive field keys
 */
export function useSensitiveFieldKeys(): string[] {
  const policy = useEffectivePolicy();
  return policy.sensitiveFieldKeys;
}

export { DEFAULT_POLICY };
