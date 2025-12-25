// =============================================================================
// VAULT SECURITY: Anomaly Detection System
// =============================================================================

import { supabase } from "@/integrations/supabase/client";

// =============================================================================
// Types
// =============================================================================

export interface LoginAttempt {
  userId?: string;
  ipHash: string;
  timestamp: number;
  success: boolean;
  userAgent?: string;
}

export interface AnomalyResult {
  isAnomaly: boolean;
  type: AnomalyType | null;
  severity: "low" | "medium" | "high" | "critical";
  details: Record<string, unknown>;
}

export type AnomalyType =
  | "rapid_failures"
  | "unusual_time"
  | "new_location"
  | "credential_stuffing"
  | "account_takeover"
  | "brute_force";

// =============================================================================
// In-Memory Storage for Recent Attempts
// =============================================================================

const recentAttempts: LoginAttempt[] = [];
const MAX_STORED_ATTEMPTS = 1000;
const ATTEMPT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

// =============================================================================
// Thresholds
// =============================================================================

const THRESHOLDS = {
  RAPID_FAILURES_COUNT: 5,
  RAPID_FAILURES_WINDOW_MS: 5 * 60 * 1000, // 5 minutes
  BRUTE_FORCE_COUNT: 10,
  BRUTE_FORCE_WINDOW_MS: 10 * 60 * 1000, // 10 minutes
  UNUSUAL_HOUR_START: 2, // 2 AM
  UNUSUAL_HOUR_END: 5, // 5 AM
  CREDENTIAL_STUFFING_IPS: 3, // Same IP trying multiple users
};

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

function cleanOldAttempts(): void {
  const cutoff = Date.now() - ATTEMPT_WINDOW_MS;
  while (recentAttempts.length > 0 && recentAttempts[0].timestamp < cutoff) {
    recentAttempts.shift();
  }
  // Also limit total size
  while (recentAttempts.length > MAX_STORED_ATTEMPTS) {
    recentAttempts.shift();
  }
}

// =============================================================================
// Detection Functions
// =============================================================================

function detectRapidFailures(ipHash: string): AnomalyResult | null {
  const cutoff = Date.now() - THRESHOLDS.RAPID_FAILURES_WINDOW_MS;
  const failures = recentAttempts.filter(
    (a) => a.ipHash === ipHash && !a.success && a.timestamp > cutoff
  );

  if (failures.length >= THRESHOLDS.RAPID_FAILURES_COUNT) {
    return {
      isAnomaly: true,
      type: "rapid_failures",
      severity: "high",
      details: {
        failureCount: failures.length,
        windowMs: THRESHOLDS.RAPID_FAILURES_WINDOW_MS,
        ipHash,
      },
    };
  }

  return null;
}

function detectBruteForce(ipHash: string): AnomalyResult | null {
  const cutoff = Date.now() - THRESHOLDS.BRUTE_FORCE_WINDOW_MS;
  const attempts = recentAttempts.filter(
    (a) => a.ipHash === ipHash && a.timestamp > cutoff
  );

  if (attempts.length >= THRESHOLDS.BRUTE_FORCE_COUNT) {
    return {
      isAnomaly: true,
      type: "brute_force",
      severity: "critical",
      details: {
        attemptCount: attempts.length,
        windowMs: THRESHOLDS.BRUTE_FORCE_WINDOW_MS,
        ipHash,
      },
    };
  }

  return null;
}

function detectUnusualTime(): AnomalyResult | null {
  const hour = new Date().getHours();
  
  if (hour >= THRESHOLDS.UNUSUAL_HOUR_START && hour < THRESHOLDS.UNUSUAL_HOUR_END) {
    return {
      isAnomaly: true,
      type: "unusual_time",
      severity: "low",
      details: {
        hour,
        message: "Login attempt during unusual hours",
      },
    };
  }

  return null;
}

function detectCredentialStuffing(ipHash: string): AnomalyResult | null {
  const cutoff = Date.now() - THRESHOLDS.RAPID_FAILURES_WINDOW_MS;
  const attempts = recentAttempts.filter(
    (a) => a.ipHash === ipHash && !a.success && a.timestamp > cutoff
  );

  // Check if same IP tried multiple different users
  const uniqueUsers = new Set(attempts.filter((a) => a.userId).map((a) => a.userId));
  
  if (uniqueUsers.size >= THRESHOLDS.CREDENTIAL_STUFFING_IPS) {
    return {
      isAnomaly: true,
      type: "credential_stuffing",
      severity: "critical",
      details: {
        uniqueUsersAttempted: uniqueUsers.size,
        totalAttempts: attempts.length,
        ipHash,
      },
    };
  }

  return null;
}

// =============================================================================
// Main API
// =============================================================================

/**
 * Record a login attempt and check for anomalies
 */
export function recordLoginAttempt(attempt: LoginAttempt): AnomalyResult {
  cleanOldAttempts();
  recentAttempts.push(attempt);

  // Run all detectors
  const detectors = [
    () => detectBruteForce(attempt.ipHash),
    () => detectCredentialStuffing(attempt.ipHash),
    () => detectRapidFailures(attempt.ipHash),
    () => detectUnusualTime(),
  ];

  for (const detector of detectors) {
    const result = detector();
    if (result?.isAnomaly) {
      return result;
    }
  }

  return {
    isAnomaly: false,
    type: null,
    severity: "low",
    details: {},
  };
}

/**
 * Log anomaly to database
 */
export async function logAnomaly(
  anomaly: AnomalyResult,
  userId?: string,
  ipHash?: string
): Promise<void> {
  if (!anomaly.isAnomaly) return;

  try {
    const insertData = {
      user_id: userId || null,
      ip_hash: ipHash || "unknown",
      anomaly_type: anomaly.type || "unknown",
      severity: anomaly.severity,
      details: JSON.parse(JSON.stringify(anomaly.details)),
    };
    
    const { error } = await supabase.from("login_anomalies").insert([insertData]);

    if (error) {
      console.error("[Anomaly] Failed to log anomaly:", error);
    }
  } catch (err) {
    console.error("[Anomaly] Error logging anomaly:", err);
  }
}

/**
 * Check if an IP should be blocked based on recent anomalies
 */
export async function shouldBlockIP(ipHash: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("blocked_ips")
      .select("blocked_until")
      .eq("ip_hash", ipHash)
      .maybeSingle();

    if (error) {
      console.error("[Anomaly] Error checking blocked IP:", error);
      return false;
    }

    if (!data) return false;

    // Check if still blocked
    if (data.blocked_until) {
      const blockedUntil = new Date(data.blocked_until);
      return blockedUntil > new Date();
    }

    // Permanent block (no expiry)
    return true;
  } catch (err) {
    console.error("[Anomaly] Error checking blocked IP:", err);
    return false;
  }
}

/**
 * Block an IP address
 */
export async function blockIP(
  ipHash: string,
  reason: string,
  durationMs?: number
): Promise<void> {
  try {
    const blockedUntil = durationMs
      ? new Date(Date.now() + durationMs).toISOString()
      : null;

    const { error } = await supabase.from("blocked_ips").upsert(
      {
        ip_hash: ipHash,
        reason,
        blocked_until: blockedUntil,
        block_count: 1,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "ip_hash",
      }
    );

    if (error) {
      console.error("[Anomaly] Failed to block IP:", error);
    }
  } catch (err) {
    console.error("[Anomaly] Error blocking IP:", err);
  }
}

/**
 * Get client IP hash (for use in frontend)
 */
export function getClientIPHash(): string {
  // In a real scenario, this would come from the server
  // For now, we use a combination of available data
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ].join("|");

  return hashString(fingerprint);
}

/**
 * Clear stored attempts (for testing)
 */
export function clearAttempts(): void {
  recentAttempts.length = 0;
}
