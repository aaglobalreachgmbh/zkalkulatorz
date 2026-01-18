// ============================================
// Server-Side Rate Limiting Hook
// Phase C1: Supabase-based Rate Limiting
// ============================================

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

// ============================================================================
// TYPES
// ============================================================================

export type RateLimitCategory = "api" | "ai" | "login" | "upload" | "pdf" | "calculation";

interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  category: RateLimitCategory;
  fromServer: boolean;
}

interface UseServerRateLimitOptions {
  /** Cache duration in ms (default: 5000) */
  cacheDuration?: number;
  /** Fallback to client-side limiting when offline */
  fallbackToClient?: boolean;
}

interface UseServerRateLimitReturn {
  /** Check if request is allowed (increments counter) */
  checkLimit: (category: RateLimitCategory) => Promise<RateLimitStatus>;
  /** Get current status without incrementing */
  getStatus: (category: RateLimitCategory) => Promise<RateLimitStatus>;
  /** Whether a check is in progress */
  isChecking: boolean;
  /** Last error (if any) */
  error: Error | null;
  /** Clear cached status */
  clearCache: () => void;
}

// ============================================================================
// CLIENT-SIDE FALLBACK
// ============================================================================

const CLIENT_LIMITS: Record<RateLimitCategory, { max: number; windowMs: number }> = {
  api: { max: 100, windowMs: 60000 },
  ai: { max: 10, windowMs: 60000 },
  login: { max: 5, windowMs: 300000 },
  upload: { max: 20, windowMs: 60000 },
  pdf: { max: 30, windowMs: 60000 },
  calculation: { max: 200, windowMs: 60000 },
};

interface ClientRateLimiter {
  requests: number[];
  max: number;
  windowMs: number;
}

function createClientLimiter(category: RateLimitCategory): ClientRateLimiter {
  const config = CLIENT_LIMITS[category];
  return {
    requests: [],
    max: config.max,
    windowMs: config.windowMs,
  };
}

function checkClientLimit(limiter: ClientRateLimiter): RateLimitStatus {
  const now = Date.now();
  
  // Clean old requests
  limiter.requests = limiter.requests.filter((t) => t > now - limiter.windowMs);
  
  const allowed = limiter.requests.length < limiter.max;
  
  if (allowed) {
    limiter.requests.push(now);
  }
  
  return {
    allowed,
    remaining: Math.max(0, limiter.max - limiter.requests.length),
    resetAt: new Date(now + limiter.windowMs),
    category: "api" as RateLimitCategory, // Will be overwritten
    fromServer: false,
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useServerRateLimit(
  options: UseServerRateLimitOptions = {}
): UseServerRateLimitReturn {
  const { cacheDuration = 5000, fallbackToClient = true } = options;
  
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline } = useNetworkStatus();
  
  // Cache for status responses
  const statusCache = useRef<Map<RateLimitCategory, { status: RateLimitStatus; timestamp: number }>>(
    new Map()
  );
  
  // Client-side fallback limiters
  const clientLimiters = useRef<Map<RateLimitCategory, ClientRateLimiter>>(new Map());
  
  // Get or create client limiter
  const getClientLimiter = useCallback((category: RateLimitCategory): ClientRateLimiter => {
    let limiter = clientLimiters.current.get(category);
    if (!limiter) {
      limiter = createClientLimiter(category);
      clientLimiters.current.set(category, limiter);
    }
    return limiter;
  }, []);
  
  // Check rate limit (increments counter)
  const checkLimit = useCallback(
    async (category: RateLimitCategory): Promise<RateLimitStatus> => {
      // If offline, use client-side limiting
      if (!isOnline && fallbackToClient) {
        const limiter = getClientLimiter(category);
        const result = checkClientLimit(limiter);
        return { ...result, category };
      }
      
      setIsChecking(true);
      setError(null);
      
      try {
        const { data, error: invokeError } = await supabase.functions.invoke("rate-limiter", {
          body: { category, action: "check" },
        });
        
        if (invokeError) {
          throw invokeError;
        }
        
        const status: RateLimitStatus = {
          allowed: data.allowed,
          remaining: data.remaining,
          resetAt: new Date(data.resetAt),
          category: data.category,
          fromServer: true,
        };
        
        // Update cache
        statusCache.current.set(category, {
          status,
          timestamp: Date.now(),
        });
        
        return status;
      } catch (err) {
        console.error(`[useServerRateLimit] Check failed for ${category}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
        
        // Fallback to client-side on error
        if (fallbackToClient) {
          const limiter = getClientLimiter(category);
          const result = checkClientLimit(limiter);
          return { ...result, category };
        }
        
        // If no fallback, allow the request (fail open)
        return {
          allowed: true,
          remaining: 999,
          resetAt: new Date(Date.now() + 60000),
          category,
          fromServer: false,
        };
      } finally {
        setIsChecking(false);
      }
    },
    [isOnline, fallbackToClient, getClientLimiter]
  );
  
  // Get status without incrementing
  const getStatus = useCallback(
    async (category: RateLimitCategory): Promise<RateLimitStatus> => {
      // Check cache first
      const cached = statusCache.current.get(category);
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        return cached.status;
      }
      
      // If offline, estimate from client limiter
      if (!isOnline) {
        const limiter = getClientLimiter(category);
        const now = Date.now();
        const validRequests = limiter.requests.filter((t) => t > now - limiter.windowMs);
        
        return {
          allowed: validRequests.length < limiter.max,
          remaining: Math.max(0, limiter.max - validRequests.length),
          resetAt: new Date(now + limiter.windowMs),
          category,
          fromServer: false,
        };
      }
      
      setIsChecking(true);
      setError(null);
      
      try {
        const { data, error: invokeError } = await supabase.functions.invoke("rate-limiter", {
          body: { category, action: "status" },
        });
        
        if (invokeError) {
          throw invokeError;
        }
        
        const status: RateLimitStatus = {
          allowed: data.allowed,
          remaining: data.remaining,
          resetAt: new Date(data.resetAt),
          category: data.category,
          fromServer: true,
        };
        
        // Update cache
        statusCache.current.set(category, {
          status,
          timestamp: Date.now(),
        });
        
        return status;
      } catch (err) {
        console.error(`[useServerRateLimit] Status failed for ${category}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
        
        // Return permissive status on error
        return {
          allowed: true,
          remaining: 999,
          resetAt: new Date(Date.now() + 60000),
          category,
          fromServer: false,
        };
      } finally {
        setIsChecking(false);
      }
    },
    [isOnline, cacheDuration, getClientLimiter]
  );
  
  // Clear cache
  const clearCache = useCallback(() => {
    statusCache.current.clear();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      statusCache.current.clear();
    };
  }, []);
  
  return {
    checkLimit,
    getStatus,
    isChecking,
    error,
    clearCache,
  };
}

// ============================================================================
// UTILITY HOOK
// ============================================================================

/**
 * Hook to check if an action is rate limited before executing
 */
export function useRateLimitedAction(category: RateLimitCategory) {
  const { checkLimit, isChecking } = useServerRateLimit();
  const [lastCheck, setLastCheck] = useState<RateLimitStatus | null>(null);
  
  const executeIfAllowed = useCallback(
    async <T>(action: () => Promise<T>): Promise<{ result?: T; rateLimited: boolean }> => {
      const status = await checkLimit(category);
      setLastCheck(status);
      
      if (!status.allowed) {
        console.warn(`[RateLimit] Action blocked for ${category}, resets at ${status.resetAt}`);
        return { rateLimited: true };
      }
      
      const result = await action();
      return { result, rateLimited: false };
    },
    [category, checkLimit]
  );
  
  return {
    executeIfAllowed,
    isChecking,
    lastCheck,
    isBlocked: lastCheck?.allowed === false,
    remaining: lastCheck?.remaining ?? null,
    resetAt: lastCheck?.resetAt ?? null,
  };
}
