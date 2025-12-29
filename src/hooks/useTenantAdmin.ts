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
  // FIX: Use isTenantAdmin directly from useUserRole instead of checking role string
  const { isTenantAdmin: roleIsTenantAdmin, isLoading } = useUserRole();
  const { identity, isSupabaseAuth } = useIdentity();

  // Debug logging
  console.log("[useTenantAdmin] isSupabaseAuth:", isSupabaseAuth, 
              "user:", !!user, 
              "roleIsTenantAdmin:", roleIsTenantAdmin,
              "isLoading:", isLoading);

  // If using Supabase auth, use the pre-calculated isTenantAdmin from useUserRole
  if (isSupabaseAuth && user) {
    return {
      isTenantAdmin: roleIsTenantAdmin,
      isLoading,
    };
  }

  // For mock identity, treat "admin" or "tenant_admin" as tenant_admin
  const mockIsTenantAdmin = identity.role === "admin" || identity.role === "tenant_admin";
  console.log("[useTenantAdmin] Mock identity role:", identity.role, "isTenantAdmin:", mockIsTenantAdmin);
  
  return {
    isTenantAdmin: mockIsTenantAdmin,
    isLoading: false,
  };
}
