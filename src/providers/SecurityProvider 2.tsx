import React, { useCallback, useEffect, useMemo, useState } from "react";
import { checkAllThreats, sanitizeAll, escapeHtml, RATE_LIMITS } from "@/lib/securityPatterns";
import { logSecurityEvent as logLocalSecurityEvent } from "@/lib/securityUtils";
import {
  logSecurityEvent as logRemoteSecurityEvent,
  logThreat,
  logRateLimit,
  type RiskLevel
} from "@/lib/securityLogger";
import { auditLocalStorage, formatAuditForLog } from "@/lib/localStoragePolicy";
import { isCryptoAvailable } from "@/lib/secureStorage";
import { SecurityContext, type SecurityContextType, type SecurityEvent } from "@/contexts/SecurityContext";

// ============================================================================
// RATE LIMITER IMPLEMENTATION
// ============================================================================

interface RateLimiterState {
  requests: number[];
  maxRequests: number;
  windowMs: number;
}

function createRateLimiterState(config: { maxRequests: number; windowMs: number }): RateLimiterState {
  return {
    requests: [],
    maxRequests: config.maxRequests,
    windowMs: config.windowMs,
  };
}

function canMakeRequestWithState(state: RateLimiterState): boolean {
  const now = Date.now();
  state.requests = state.requests.filter((t) => t > now - state.windowMs);

  if (state.requests.length >= state.maxRequests) {
    return false;
  }

  state.requests.push(now);
  return true;
}

function getRemainingWithState(state: RateLimiterState): number {
  const now = Date.now();
  const validRequests = state.requests.filter((t) => t > now - state.windowMs);
  return Math.max(0, state.maxRequests - validRequests.length);
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  // Rate Limiters für verschiedene Kategorien
  const [rateLimiters] = useState(() => ({
    api: createRateLimiterState(RATE_LIMITS.api),
    ai: createRateLimiterState(RATE_LIMITS.ai),
    login: createRateLimiterState({ maxRequests: RATE_LIMITS.login.maxAttempts, windowMs: RATE_LIMITS.login.lockoutMs }),
    upload: createRateLimiterState(RATE_LIMITS.upload),
  }));

  // Event Log (nur letzte 100 Events speichern)
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);

  // Input Sanitization
  const sanitize = useCallback((input: string, maxLength?: number): string => {
    const result = sanitizeAll(input, maxLength);

    // Log wenn Änderungen vorgenommen wurden
    if (result !== input) {
      logLocalSecurityEvent("sanitization_applied", {
        originalLength: input.length,
        sanitizedLength: result.length,
        diff: input.length - result.length,
      });

      // Remote logging für signifikante Änderungen (>10% des Inputs)
      const diffPercent = (input.length - result.length) / input.length;
      if (diffPercent > 0.1) {
        logRemoteSecurityEvent({
          event_type: "sanitization_applied",
          risk_level: diffPercent > 0.3 ? "medium" : "low",
          details: {
            originalLength: input.length,
            sanitizedLength: result.length,
          },
        });
      }
    }

    return result;
  }, []);

  // HTML Escaping
  const escape = useCallback((input: string): string => {
    return escapeHtml(input);
  }, []);

  // Threat Detection
  const checkThreatsCallback = useCallback((input: string) => {
    const result = checkAllThreats(input);

    if (!result.isSafe) {
      // Local logging
      logLocalSecurityEvent("threat_detected", {
        threats: result.threats,
        riskLevel: result.riskLevel,
        inputPreview: input.slice(0, 50),
      });

      // Remote logging to Edge Function
      logThreat(
        result.threats,
        result.riskLevel as RiskLevel,
        input.slice(0, 50)
      );

      setRecentEvents((prev) => [
        {
          type: "threat_detected",
          timestamp: Date.now(),
          details: { threats: result.threats, riskLevel: result.riskLevel },
        },
        ...prev.slice(0, 99),
      ]);
    }

    return result;
  }, []);

  // Rate Limiting
  const canMakeRequest = useCallback((category: keyof typeof RATE_LIMITS): boolean => {
    const limiter = rateLimiters[category];
    if (!limiter) return true;

    const allowed = canMakeRequestWithState(limiter);

    if (!allowed) {
      logLocalSecurityEvent("rate_limited", { category });

      // Remote logging
      logRateLimit(category);

      setRecentEvents((prev) => [
        {
          type: "rate_limited",
          timestamp: Date.now(),
          details: { category },
        },
        ...prev.slice(0, 99),
      ]);
    }

    return allowed;
  }, [rateLimiters]);

  const getRemainingRequests = useCallback((category: keyof typeof RATE_LIMITS): number => {
    const limiter = rateLimiters[category];
    if (!limiter) return Infinity;
    return getRemainingWithState(limiter);
  }, [rateLimiters]);

  // Event Logging
  const logEvent = useCallback((event: Omit<SecurityEvent, "timestamp">) => {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
    };

    setRecentEvents((prev) => [fullEvent, ...prev.slice(0, 99)]);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log("[Security Event]", fullEvent);
    }
  }, []);

  // Prevent common attacks
  useEffect(() => {
    // Prevent drag-and-drop of external files
    const preventDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) {
        const target = e.target as HTMLElement;
        if (!target.closest("[data-allow-drop]")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    const sanitizePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        const html = e.clipboardData?.getData("text/html");
        if (html && /<script|javascript:|on\w+=/i.test(html)) {
          e.preventDefault();
          const plainText = e.clipboardData?.getData("text/plain") || "";
          document.execCommand("insertText", false, sanitize(plainText));
        }
      }
    };

    document.addEventListener("dragover", preventDrop);
    document.addEventListener("drop", preventDrop);
    document.addEventListener("paste", sanitizePaste);

    return () => {
      document.removeEventListener("dragover", preventDrop);
      document.removeEventListener("drop", preventDrop);
      document.removeEventListener("paste", sanitizePaste);
    };
  }, [sanitize]);

  // Block devtools in production
  useEffect(() => {
    if (import.meta.env.PROD) {
      const handleContextMenu = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest("[data-sensitive]")) {
          e.preventDefault();
        }
      };

      document.addEventListener("contextmenu", handleContextMenu);

      return () => {
        document.removeEventListener("contextmenu", handleContextMenu);
      };
    }
  }, []);

  // localStorage Security Audit
  useEffect(() => {
    const audit = auditLocalStorage();

    if (import.meta.env.DEV) {
      console.log(formatAuditForLog(audit));
    }

    if (audit.sensitive.length > 0) {
      console.warn(
        "[Security] Potentiell sensible Daten in localStorage gefunden:",
        audit.sensitive
      );

      logRemoteSecurityEvent({
        event_type: "anomaly_detected",
        risk_level: "medium",
        details: {
          audit_type: "localStorage_sensitive_keys",
          sensitive_keys_count: audit.sensitive.length,
        },
      });
    }
  }, []);

  const isEncryptionAvailable = useMemo(() => isCryptoAvailable(), []);

  const value = useMemo<SecurityContextType>(
    () => ({
      sanitize,
      escape,
      checkThreats: checkThreatsCallback,
      canMakeRequest,
      getRemainingRequests,
      logEvent,
      isSecurityActive: true,
      recentEvents,
      isEncryptionAvailable,
    }),
    [sanitize, escape, checkThreatsCallback, canMakeRequest, getRemainingRequests, logEvent, recentEvents, isEncryptionAvailable]
  );

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export default SecurityProvider;

// eslint-disable-next-line react-refresh/only-export-components
export { useSecurity, useSecurityOptional } from "@/contexts/SecurityContext";
