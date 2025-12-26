// ============================================
// Unified AppIdentity Context
// Phase 3A: Supabase-first with localStorage fallback
// ============================================

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * App-level roles (mapped from Supabase roles)
 * - admin: Full access, can manage everything
 * - manager: Can access admin panel, manage team
 * - sales: Standard employee role
 */
export type AppRole = "admin" | "manager" | "sales";

/**
 * Supabase DB roles → App roles mapping
 */
const SUPABASE_TO_APP_ROLE: Record<string, AppRole> = {
  admin: "admin",
  moderator: "manager",
  user: "sales",
};

export interface IdentityState {
  userId: string;
  displayName: string;
  role: AppRole;
  departmentId: string;
  tenantId: string;
}

interface IdentityContextType {
  identity: IdentityState;
  isAuthenticated: boolean;
  isSupabaseAuth: boolean;
  setMockIdentity: (identity: IdentityState) => void;
  clearMockIdentity: () => void;
  canAccessAdmin: boolean;
}

const MOCK_STORAGE_KEY = "margenkalkulator_mock_identity";

/**
 * Default identity for unauthenticated/offline users
 */
const DEFAULT_IDENTITY: IdentityState = {
  userId: "user_local",
  displayName: "Gast",
  role: "sales",
  departmentId: "dept_default",
  tenantId: "tenant_default",
};

/**
 * Default mock identities for development/testing
 */
export const MOCK_IDENTITIES: IdentityState[] = [
  {
    userId: "admin_001",
    displayName: "Max Admin",
    role: "admin",
    departmentId: "hq",
    tenantId: "demo_tenant",
  },
  {
    userId: "manager_001",
    displayName: "Lisa Manager",
    role: "manager",
    departmentId: "store_berlin",
    tenantId: "demo_tenant",
  },
  {
    userId: "sales_001",
    displayName: "Tom Verkäufer",
    role: "sales",
    departmentId: "store_berlin",
    tenantId: "demo_tenant",
  },
  {
    userId: "sales_002",
    displayName: "Anna Beraterin",
    role: "sales",
    departmentId: "store_munich",
    tenantId: "demo_tenant",
  },
];

const IdentityContext = createContext<IdentityContextType | null>(null);

function loadMockIdentity(): IdentityState | null {
  try {
    const json = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json) as IdentityState;
  } catch {
    return null;
  }
}

function saveMockIdentity(identity: IdentityState | null): void {
  if (identity) {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(identity));
  } else {
    localStorage.removeItem(MOCK_STORAGE_KEY);
  }
}

/**
 * Maps Supabase role to App role
 */
export function mapSupabaseToAppRole(supabaseRole: string | null): AppRole {
  if (!supabaseRole) return "sales";
  return SUPABASE_TO_APP_ROLE[supabaseRole] || "sales";
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { role: supabaseRole, isLoading: roleLoading } = useUserRole();
  const [mockIdentity, setMockIdentityState] = useState<IdentityState | null>(() => loadMockIdentity());

  // Persist mock identity to localStorage
  useEffect(() => {
    saveMockIdentity(mockIdentity);
  }, [mockIdentity]);

  /**
   * Computed identity with priority:
   * 1. Supabase authenticated user → use Supabase data
   * 2. Mock identity from localStorage → use mock
   * 3. Default identity → guest
   */
  const identity = useMemo((): IdentityState => {
    // Priority 1: Supabase authenticated user
    if (user && !authLoading && !roleLoading) {
      const appRole = mapSupabaseToAppRole(supabaseRole);
      return {
        userId: user.id,
        displayName: user.user_metadata?.display_name || user.email?.split("@")[0] || "User",
        role: appRole,
        departmentId: user.user_metadata?.department_id || "dept_default",
        tenantId: user.user_metadata?.tenant_id || "tenant_default",
      };
    }

    // Priority 2: Mock identity (for development/offline)
    if (mockIdentity) {
      return mockIdentity;
    }

    // Priority 3: Default identity
    return DEFAULT_IDENTITY;
  }, [user, authLoading, roleLoading, supabaseRole, mockIdentity]);

  const isSupabaseAuth = !!user && !authLoading;
  const isAuthenticated = isSupabaseAuth || !!mockIdentity;
  const canAccessAdmin = identity.role === "admin" || identity.role === "manager";

  const setMockIdentity = (newIdentity: IdentityState) => {
    // Only allow mock identity when not authenticated via Supabase
    if (!isSupabaseAuth) {
      setMockIdentityState(newIdentity);
    }
  };

  const clearMockIdentity = () => {
    setMockIdentityState(null);
  };

  return (
    <IdentityContext.Provider
      value={{
        identity,
        isAuthenticated,
        isSupabaseAuth,
        setMockIdentity,
        clearMockIdentity,
        canAccessAdmin,
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity(): IdentityContextType {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error("useIdentity must be used within IdentityProvider");
  }
  return context;
}

/**
 * Helper to get scoped storage key based on identity
 * Format: baseKey_tenantId_departmentId_userId
 */
export function getScopedStorageKey(baseKey: string, identity: IdentityState): string {
  return `${baseKey}_${identity.tenantId}_${identity.departmentId}_${identity.userId}`;
}
