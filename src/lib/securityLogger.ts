// =============================================================================
// VAULT SECURITY: Centralized Security Logger (Frontend → Edge Function)
// =============================================================================

import { supabase } from "@/integrations/supabase/client";

// =============================================================================
// Types
// =============================================================================

export type SecurityEventType =
  | "threat_detected"
  | "rate_limited"
  | "login_failed"
  | "login_locked"
  | "bot_detected"
  | "honeypot_triggered"
  | "csrf_violation"
  | "anomaly_detected"
  | "file_rejected"
  | "sanitization_applied"
  | "phishing_detected"
  | "brute_force"
  | "component_lifecycle"
  // Extended Event Types (Security Layer Integration)
  | "ssrf_blocked"
  | "domain_blocked"
  | "payload_threat"
  | "api_gateway_block"
  | "prompt_injection_blocked"
  | "jailbreak_detected"
  | "output_filtered"
  | "llm_security_violation"
  | "session_quarantined"
  | "zero_day_detected"
  | "trust_score_degraded"
  | "websocket_violation"
  | "tunnel_blocked"
  | "message_rate_limited"
  | "protocol_violation";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface SecurityLogEvent {
  event_type: SecurityEventType;
  risk_level: RiskLevel;
  user_id?: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// Helper Functions
// =============================================================================

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).slice(0, 12);
}

function getClientFingerprint(): string {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ];
  return hashString(parts.join("|"));
}

// =============================================================================
// Rate Limiting for Logger (prevent log flooding)
// =============================================================================

const LOG_RATE_LIMIT = {
  maxLogs: 10,
  windowMs: 60 * 1000, // 1 minute
};

const recentLogs: number[] = [];

function canLog(): boolean {
  const now = Date.now();
  const cutoff = now - LOG_RATE_LIMIT.windowMs;
  
  // Remove old entries
  while (recentLogs.length > 0 && recentLogs[0] < cutoff) {
    recentLogs.shift();
  }
  
  if (recentLogs.length >= LOG_RATE_LIMIT.maxLogs) {
    return false;
  }
  
  recentLogs.push(now);
  return true;
}

// =============================================================================
// Main Logger Function
// =============================================================================

/**
 * Log a security event to the backend via Edge Function
 * This function is rate-limited to prevent log flooding attacks
 */
export async function logSecurityEvent(event: SecurityLogEvent): Promise<boolean> {
  // Rate limit check
  if (!canLog()) {
    console.warn("[SecurityLogger] Rate limited, skipping log");
    return false;
  }

  // Don't log in development for non-critical events
  if (import.meta.env.DEV && event.risk_level === "low") {
    console.log("[SecurityLogger] Dev mode, low-risk event:", event);
    return true;
  }

  try {
    const { data, error } = await supabase.functions.invoke("security-log", {
      body: {
        event_type: event.event_type,
        risk_level: event.risk_level,
        user_id: event.user_id,
        details: {
          ...event.details,
          client_fingerprint: getClientFingerprint(),
          timestamp: new Date().toISOString(),
          url: window.location.href,
        },
      },
    });

    if (error) {
      console.error("[SecurityLogger] Failed to log event:", error);
      return false;
    }

    if (import.meta.env.DEV) {
      console.log("[SecurityLogger] Event logged:", data);
    }

    return true;
  } catch (err) {
    console.error("[SecurityLogger] Error logging event:", err);
    return false;
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Log a threat detection event
 */
export function logThreat(
  threats: string[],
  riskLevel: RiskLevel,
  inputPreview?: string
): Promise<boolean> {
  return logSecurityEvent({
    event_type: "threat_detected",
    risk_level: riskLevel,
    details: {
      threats,
      input_preview: inputPreview?.slice(0, 50),
    },
  });
}

/**
 * Log a rate limit event
 */
export function logRateLimit(category: string): Promise<boolean> {
  return logSecurityEvent({
    event_type: "rate_limited",
    risk_level: "medium",
    details: { category },
  });
}

/**
 * Log a failed login attempt
 */
export function logLoginFailed(
  email?: string,
  reason?: string
): Promise<boolean> {
  return logSecurityEvent({
    event_type: "login_failed",
    risk_level: "medium",
    details: {
      email_hash: email ? hashString(email) : undefined,
      reason,
    },
  });
}

/**
 * Log an account lockout
 */
export function logLoginLocked(email?: string): Promise<boolean> {
  return logSecurityEvent({
    event_type: "login_locked",
    risk_level: "high",
    details: {
      email_hash: email ? hashString(email) : undefined,
    },
  });
}

/**
 * Log a bot detection
 */
export function logBotDetected(
  source: "honeypot" | "behavior" | "user_agent",
  details?: Record<string, unknown>
): Promise<boolean> {
  return logSecurityEvent({
    event_type: "bot_detected",
    risk_level: "high",
    details: {
      source,
      ...details,
    },
  });
}

/**
 * Log an anomaly detection
 */
export function logAnomaly(
  anomalyType: string,
  severity: RiskLevel,
  details?: Record<string, unknown>
): Promise<boolean> {
  return logSecurityEvent({
    event_type: "anomaly_detected",
    risk_level: severity,
    details: {
      anomaly_type: anomalyType,
      ...details,
    },
  });
}

/**
 * Log a CSRF violation
 */
export function logCsrfViolation(): Promise<boolean> {
  return logSecurityEvent({
    event_type: "csrf_violation",
    risk_level: "high",
    details: {
      url: window.location.href,
    },
  });
}

export default logSecurityEvent;
