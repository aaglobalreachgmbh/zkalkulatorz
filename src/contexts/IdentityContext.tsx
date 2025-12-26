// ============================================
// Frontend Identity Context (Mock-Login for Dev)
// Phase 3A: Productization Foundation
// ============================================

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type AppRole = "admin" | "manager" | "sales";

export interface IdentityState {
  userId: string;
  displayName: string;
  role: AppRole;
  departmentId: string;
  tenantId: string;
}

interface IdentityContextType {
  identity: IdentityState | null;
  isAuthenticated: boolean;
  setMockIdentity: (identity: IdentityState) => void;
  clearIdentity: () => void;
  canAccessAdmin: boolean;
}

const STORAGE_KEY = "margenkalkulator_identity";

const IdentityContext = createContext<IdentityContextType | null>(null);

/**
 * Default mock identities for development
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

function loadStoredIdentity(): IdentityState | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json) as IdentityState;
  } catch {
    return null;
  }
}

function saveIdentity(identity: IdentityState | null): void {
  if (identity) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<IdentityState | null>(() => loadStoredIdentity());

  // Persist to localStorage
  useEffect(() => {
    saveIdentity(identity);
  }, [identity]);

  const setMockIdentity = (newIdentity: IdentityState) => {
    setIdentity(newIdentity);
  };

  const clearIdentity = () => {
    setIdentity(null);
  };

  const isAuthenticated = identity !== null;
  const canAccessAdmin = identity?.role === "admin" || identity?.role === "manager";

  return (
    <IdentityContext.Provider
      value={{
        identity,
        isAuthenticated,
        setMockIdentity,
        clearIdentity,
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
 */
export function getScopedStorageKey(baseKey: string, identity: IdentityState | null): string {
  if (!identity) {
    return `${baseKey}_guest`;
  }
  return `${baseKey}_${identity.tenantId}_${identity.departmentId}_${identity.userId}`;
}
