// ============================================
// React Hooks for Secure LocalStorage
// Phase C3: Encrypted Storage Integration
// ============================================

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getSecureItem,
  setSecureItem,
  removeSecureItem,
  hasSecureItem,
  migrateToSecure,
  needsMigration,
  isCryptoAvailable,
  clearSessionKey,
} from "@/lib/secureStorage";

// ============================================================================
// TYPES
// ============================================================================

interface UseSecureStorageOptions<T> {
  /** Default value if nothing stored */
  defaultValue: T;
  /** Key prefix for namespacing */
  prefix?: string;
  /** Allow fallback to unencrypted storage */
  fallbackToPlain?: boolean;
  /** Old key to migrate from (if any) */
  migrateFromKey?: string;
}

interface UseSecureStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => Promise<void>;
  remove: () => void;
  isLoading: boolean;
  error: Error | null;
  isEncrypted: boolean;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * React hook for encrypted localStorage access
 * 
 * @example
 * const { value, setValue, isLoading } = useSecureStorage<UserPrefs>("prefs", {
 *   defaultValue: { theme: "dark" }
 * });
 */
export function useSecureStorage<T>(
  key: string,
  options: UseSecureStorageOptions<T>
): UseSecureStorageReturn<T> {
  const { defaultValue, prefix, fallbackToPlain = false, migrateFromKey } = options;
  
  const [value, setValueState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isEncrypted = isCryptoAvailable();
  
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Initial load with optional migration
  useEffect(() => {
    async function loadValue() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check for migration needs
        if (migrateFromKey && needsMigration(migrateFromKey, key, { prefix })) {
          await migrateToSecure<T>(migrateFromKey, key, { prefix, fallbackToPlain });
        }
        
        // Load encrypted value
        const stored = await getSecureItem<T>(key, { prefix, fallbackToPlain });
        
        if (isMounted.current) {
          setValueState(stored ?? defaultValue);
        }
      } catch (err) {
        console.error(`[useSecureStorage] Error loading ${key}:`, err);
        if (isMounted.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setValueState(defaultValue);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    }
    
    loadValue();
  }, [key, prefix, fallbackToPlain, migrateFromKey]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Setter with encryption
  const setValue = useCallback(
    async (newValue: T | ((prev: T) => T)) => {
      try {
        setError(null);
        
        const resolvedValue = typeof newValue === "function"
          ? (newValue as (prev: T) => T)(value)
          : newValue;
        
        await setSecureItem(key, resolvedValue, { prefix, fallbackToPlain });
        
        if (isMounted.current) {
          setValueState(resolvedValue);
        }
      } catch (err) {
        console.error(`[useSecureStorage] Error saving ${key}:`, err);
        if (isMounted.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
        throw err;
      }
    },
    [key, prefix, fallbackToPlain, value]
  );
  
  // Remove from storage
  const remove = useCallback(() => {
    removeSecureItem(key, { prefix });
    if (isMounted.current) {
      setValueState(defaultValue);
    }
  }, [key, prefix, defaultValue]);
  
  return {
    value,
    setValue,
    remove,
    isLoading,
    error,
    isEncrypted,
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for secure user preferences
 */
export interface UserSecurePreferences {
  viewMode?: "customer" | "dealer";
  lastTariffFamily?: string;
  lastSubVariant?: string;
  sidebarCollapsed?: boolean;
  recentSearches?: string[];
}

export function useSecurePreferences() {
  return useSecureStorage<UserSecurePreferences>("user_prefs", {
    defaultValue: {},
    migrateFromKey: "margenkalkulator_prefs",
    fallbackToPlain: true,
  });
}

/**
 * Hook for secure draft state (sensitive calculation data)
 */
export interface SecureDraftState {
  hardwareId?: string;
  tariffId?: string;
  customerId?: string;
  notes?: string;
  lastModified?: number;
}

export function useSecureDraftState(draftId: string) {
  return useSecureStorage<SecureDraftState>(`draft_${draftId}`, {
    defaultValue: {},
    fallbackToPlain: false, // Drafts should always be encrypted
  });
}

/**
 * Hook for secure session tokens
 */
export function useSecureSession() {
  return useSecureStorage<{ csrf?: string; fingerprint?: string }>("session", {
    defaultValue: {},
    fallbackToPlain: false,
  });
}

// ============================================================================
// MIGRATION HOOK
// ============================================================================

interface MigrationStatus {
  inProgress: boolean;
  completed: string[];
  failed: string[];
  total: number;
}

/**
 * Hook to migrate legacy localStorage data to secure storage
 */
export function useSecureStorageMigration(
  migrations: Array<{ oldKey: string; newKey: string }>
) {
  const [status, setStatus] = useState<MigrationStatus>({
    inProgress: false,
    completed: [],
    failed: [],
    total: migrations.length,
  });
  
  const runMigrations = useCallback(async () => {
    if (!isCryptoAvailable()) {
      console.warn("[Migration] Crypto not available, skipping migrations");
      return;
    }
    
    setStatus((prev) => ({ ...prev, inProgress: true }));
    
    const completed: string[] = [];
    const failed: string[] = [];
    
    for (const { oldKey, newKey } of migrations) {
      if (needsMigration(oldKey, newKey)) {
        try {
          const success = await migrateToSecure(oldKey, newKey);
          if (success) {
            completed.push(oldKey);
          } else {
            failed.push(oldKey);
          }
        } catch (err) {
          console.error(`[Migration] Failed for ${oldKey}:`, err);
          failed.push(oldKey);
        }
      }
    }
    
    setStatus({
      inProgress: false,
      completed,
      failed,
      total: migrations.length,
    });
    
    if (completed.length > 0) {
      console.log(`[Migration] Successfully migrated ${completed.length} items`);
    }
    if (failed.length > 0) {
      console.warn(`[Migration] Failed to migrate ${failed.length} items`);
    }
  }, [migrations]);
  
  return { status, runMigrations };
}

// ============================================================================
// LOGOUT UTILITY
// ============================================================================

/**
 * Clear all secure storage on logout
 * Should be called when user signs out
 */
export function useSecureStorageLogout() {
  return useCallback(() => {
    clearSessionKey();
    console.log("[SecureStorage] Session cleared on logout");
  }, []);
}

// ============================================================================
// UTILITY HOOK
// ============================================================================

/**
 * Hook to check secure storage status
 */
export function useSecureStorageStatus() {
  const [status, setStatus] = useState({
    isAvailable: false,
    hasSessionKey: false,
  });
  
  useEffect(() => {
    setStatus({
      isAvailable: isCryptoAvailable(),
      hasSessionKey: typeof sessionStorage !== "undefined" && 
                     sessionStorage.getItem("mk_session_key") !== null,
    });
  }, []);
  
  return status;
}
