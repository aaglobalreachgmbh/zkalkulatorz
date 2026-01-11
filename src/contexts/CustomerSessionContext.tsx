// ============================================
// Customer Session Context (Safety Lock)
// Phase 3A: Productization Foundation
// ============================================

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface CustomerSessionState {
  isActive: boolean;
  startedAt: string | null;
}

interface CustomerSessionContextType {
  session: CustomerSessionState;
  startSession: () => void;
  endSession: () => void;
  toggleSession: () => void;
}

const CustomerSessionContext = createContext<CustomerSessionContextType | null>(null);

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CustomerSessionState>({
    isActive: false,
    startedAt: null,
  });

  const startSession = useCallback(() => {
    setSession({
      isActive: true,
      startedAt: new Date().toISOString(),
    });
  }, []);

  const endSession = useCallback(() => {
    setSession({
      isActive: false,
      startedAt: null,
    });
  }, []);

  const toggleSession = useCallback(() => {
    setSession((prev) => ({
      isActive: !prev.isActive,
      startedAt: !prev.isActive ? new Date().toISOString() : null,
    }));
  }, []);

  return (
    <CustomerSessionContext.Provider
      value={{
        session,
        startSession,
        endSession,
        toggleSession,
      }}
    >
      {children}
    </CustomerSessionContext.Provider>
  );
}

// ============================================
// Safe Default - NIEMALS throw in Hooks!
// ============================================
const SAFE_DEFAULT_CUSTOMER_SESSION: CustomerSessionContextType = {
  session: {
    isActive: false,
    startedAt: null,
  },
  startSession: () => {
    console.warn("[useCustomerSession] Called outside provider - no-op");
  },
  endSession: () => {
    console.warn("[useCustomerSession] Called outside provider - no-op");
  },
  toggleSession: () => {
    console.warn("[useCustomerSession] Called outside provider - no-op");
  },
};

export function useCustomerSession(): CustomerSessionContextType {
  const context = useContext(CustomerSessionContext);
  if (!context) {
    console.warn("[useCustomerSession] Used outside CustomerSessionProvider, returning safe default");
    return SAFE_DEFAULT_CUSTOMER_SESSION;
  }
  return context;
}
