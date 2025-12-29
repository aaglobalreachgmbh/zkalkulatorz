// ============================================
// Tenant-Admin Hook
// Prüft ob der aktuelle Nutzer Tenant-Admin ist
// ============================================

import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";
import { useIdentity } from "@/contexts/IdentityContext";

interface UseTenantAdminResult {
  isTenantAdmin: boolean;
  isLoading: boolean;
}

/**
 * Hook to check if current user is a tenant admin
 * 
 * Supports both:
 * - Supabase authenticated users (via user_roles table)
 * - Mock identities (via identity.role === "admin")
 */
export function useTenantAdmin(): UseTenantAdminResult {
  const { user } = useAuth();
  const { role, isLoading } = useUserRole();
  const { identity, isSupabaseAuth } = useIdentity();

  // If using Supabase auth, check for tenant_admin or admin role
  if (isSupabaseAuth && user) {
    // role from useUserRole is string, check for tenant_admin or admin
    const isTenantAdminRole = role === "tenant_admin" || role === "admin";
    return {
      isTenantAdmin: isTenantAdminRole,
      isLoading,
    };
  }

  // For mock identity, treat "admin" or "tenant_admin" as tenant_admin
  return {
    isTenantAdmin: identity.role === "admin" || identity.role === "tenant_admin",
    isLoading: false,
  };
}
