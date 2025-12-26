/**
 * Zero-Day Defense Layer
 * 
 * Heuristische Erkennung von unbekannten Angriffsmustern.
 * Schützt vor Bedrohungen, die noch nicht bekannt sind.
 * 
 * Techniken:
 * - Anomalie-Scoring
 * - Behavioral Analysis
 * - Entropy Detection
 * - Time-based Analysis
 * - Pattern Learning
 */

import { hashForLogging } from "./securityPatterns";
import { logSecurityEvent } from "./securityLogger";

// ============================================================================
// TYPES
// ============================================================================

export interface AnomalyResult {
  score: number; // 0-100
  level: "normal" | "suspicious" | "anomalous" | "critical";
  factors: AnomalyFactor[];
  recommendation: "allow" | "warn" | "soft_block" | "hard_block";
}

export interface AnomalyFactor {
  name: string;
  score: number;
  description: string;
}

export interface BehaviorProfile {
  avgRequestsPerMinute: number;
  avgInputLength: number;
  commonPatterns: string[];
  lastActivity: Date;
  sessionStart: Date;
  totalRequests: number;
  anomalyCount: number;
}

interface SessionState {
  actions: ActionRecord[];
  profile: BehaviorProfile;
  quarantined: boolean;
  quarantineReason?: string;
}

interface ActionRecord {
  type: string;
  timestamp: number;
  inputLength: number;
  entropy: number;
  riskScore: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const ANOMALY_THRESHOLDS = {
  normal: 20,
  suspicious: 40,
  anomalous: 60,
  critical: 80,
};

const ENTROPY_THRESHOLD = 4.5; // High entropy = suspicious
const RAPID_ACTION_THRESHOLD_MS = 100; // Actions faster than 100ms = suspicious
const MAX_ACTIONS_PER_MINUTE = 120;
const SESSION_HISTORY_SIZE = 100;

// ============================================================================
// STATE
// ============================================================================

const sessionStates: Map<string, SessionState> = new Map();

function getSessionId(): string {
  // In real app, use actual session ID
  return "session_" + (typeof window !== "undefined" ? window.location.hostname : "server");
}

function getOrCreateSession(): SessionState {
  const id = getSessionId();
  let session = sessionStates.get(id);
  
  if (!session) {
    session = {
      actions: [],
      profile: {
        avgRequestsPerMinute: 0,
        avgInputLength: 0,
        commonPatterns: [],
        lastActivity: new Date(),
        sessionStart: new Date(),
        totalRequests: 0,
        anomalyCount: 0,
      },
      quarantined: false,
    };
    sessionStates.set(id, session);
  }
  
  return session;
}

// ============================================================================
// ENTROPY CALCULATION
// ============================================================================

/**
 * Berechnet die Shannon-Entropy eines Strings
 * Hohe Entropy = verdächtig (zufällige/encodierte Daten)
 */
export function calculateEntropy(input: string): number {
  if (!input || input.length === 0) return 0;
  
  const charCounts: Record<string, number> = {};
  for (const char of input) {
    charCounts[char] = (charCounts[char] || 0) + 1;
  }
  
  let entropy = 0;
  const len = input.length;
  
  for (const count of Object.values(charCounts)) {
    const probability = count / len;
    entropy -= probability * Math.log2(probability);
  }
  
  return entropy;
}

// ============================================================================
// ANOMALY DETECTION FUNCTIONS
// ============================================================================

/**
 * Prüft auf verdächtig schnelle Aktionen
 */
function checkRapidActions(session: SessionState): AnomalyFactor | null {
  if (session.actions.length < 2) return null;
  
  const recentActions = session.actions.slice(-10);
  let rapidCount = 0;
  
  for (let i = 1; i < recentActions.length; i++) {
    const timeDiff = recentActions[i].timestamp - recentActions[i-1].timestamp;
    if (timeDiff < RAPID_ACTION_THRESHOLD_MS) {
      rapidCount++;
    }
  }
  
  if (rapidCount >= 3) {
    return {
      name: "rapid_actions",
      score: Math.min(30, rapidCount * 5),
      description: `${rapidCount} actions faster than ${RAPID_ACTION_THRESHOLD_MS}ms`,
    };
  }
  
  return null;
}

/**
 * Prüft auf ungewöhnliche Request-Rate
 */
function checkRequestRate(session: SessionState): AnomalyFactor | null {
  const oneMinuteAgo = Date.now() - 60000;
  const recentActions = session.actions.filter(a => a.timestamp > oneMinuteAgo);
  const rate = recentActions.length;
  
  if (rate > MAX_ACTIONS_PER_MINUTE) {
    return {
      name: "high_request_rate",
      score: Math.min(40, (rate - MAX_ACTIONS_PER_MINUTE) * 2),
      description: `${rate} requests/minute (max: ${MAX_ACTIONS_PER_MINUTE})`,
    };
  }
  
  // Check against baseline
  if (session.profile.avgRequestsPerMinute > 0) {
    const deviation = rate / session.profile.avgRequestsPerMinute;
    if (deviation > 3) {
      return {
        name: "request_rate_spike",
        score: Math.min(25, (deviation - 3) * 10),
        description: `Request rate ${deviation.toFixed(1)}x above average`,
      };
    }
  }
  
  return null;
}

/**
 * Prüft auf hohe Entropy in Eingaben
 */
function checkInputEntropy(input: string): AnomalyFactor | null {
  const entropy = calculateEntropy(input);
  
  if (entropy > ENTROPY_THRESHOLD) {
    return {
      name: "high_entropy",
      score: Math.min(35, (entropy - ENTROPY_THRESHOLD) * 15),
      description: `High entropy input: ${entropy.toFixed(2)} bits`,
    };
  }
  
  return null;
}

/**
 * Prüft auf ungewöhnliche Input-Länge
 */
function checkInputLength(input: string, session: SessionState): AnomalyFactor | null {
  const avgLength = session.profile.avgInputLength || 100;
  const deviation = input.length / Math.max(avgLength, 1);
  
  if (deviation > 10 && input.length > 1000) {
    return {
      name: "unusual_input_length",
      score: Math.min(20, (deviation - 10) * 2),
      description: `Input ${deviation.toFixed(1)}x longer than average`,
    };
  }
  
  return null;
}

/**
 * Prüft auf verdächtige Muster
 */
function checkSuspiciousPatterns(input: string): AnomalyFactor | null {
  const suspiciousIndicators = [
    // Repeated special characters
    /(.)\1{10,}/,
    // Long hex strings
    /[0-9a-f]{50,}/i,
    // Base64-like patterns (but not actual base64)
    /[A-Za-z0-9+/=]{100,}/,
    // Unicode escape sequences
    /\\u[0-9a-f]{4}/gi,
    // Null bytes
    /\x00/,
  ];
  
  let matches = 0;
  for (const pattern of suspiciousIndicators) {
    if (pattern.test(input)) {
      matches++;
    }
  }
  
  if (matches > 0) {
    return {
      name: "suspicious_patterns",
      score: matches * 15,
      description: `${matches} suspicious pattern(s) detected`,
    };
  }
  
  return null;
}

/**
 * Prüft auf zeitbasierte Anomalien
 */
function checkTimeAnomaly(session: SessionState): AnomalyFactor | null {
  const now = new Date();
  const hour = now.getHours();
  
  // Activity outside business hours could be suspicious
  // (Only flag if it's a dramatic change from normal)
  const isOffHours = hour < 6 || hour > 22;
  const sessionDuration = now.getTime() - session.profile.sessionStart.getTime();
  
  // Very long sessions
  if (sessionDuration > 8 * 60 * 60 * 1000) { // 8 hours
    return {
      name: "extended_session",
      score: 10,
      description: "Session active for over 8 hours",
    };
  }
  
  return null;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analysiert eine Aktion auf Anomalien
 */
export function analyzeAction(
  actionType: string,
  input: string = ""
): AnomalyResult {
  const session = getOrCreateSession();
  const factors: AnomalyFactor[] = [];
  
  // Record action
  const entropy = calculateEntropy(input);
  const actionRecord: ActionRecord = {
    type: actionType,
    timestamp: Date.now(),
    inputLength: input.length,
    entropy,
    riskScore: 0,
  };
  
  // Add to history (limit size)
  session.actions.push(actionRecord);
  if (session.actions.length > SESSION_HISTORY_SIZE) {
    session.actions.shift();
  }
  
  // Update profile
  session.profile.totalRequests++;
  session.profile.lastActivity = new Date();
  session.profile.avgInputLength = 
    (session.profile.avgInputLength * (session.profile.totalRequests - 1) + input.length) 
    / session.profile.totalRequests;
  
  // Run all checks
  const rapidCheck = checkRapidActions(session);
  if (rapidCheck) factors.push(rapidCheck);
  
  const rateCheck = checkRequestRate(session);
  if (rateCheck) factors.push(rateCheck);
  
  if (input) {
    const entropyCheck = checkInputEntropy(input);
    if (entropyCheck) factors.push(entropyCheck);
    
    const lengthCheck = checkInputLength(input, session);
    if (lengthCheck) factors.push(lengthCheck);
    
    const patternCheck = checkSuspiciousPatterns(input);
    if (patternCheck) factors.push(patternCheck);
  }
  
  const timeCheck = checkTimeAnomaly(session);
  if (timeCheck) factors.push(timeCheck);
  
  // Calculate total score
  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
  const cappedScore = Math.min(100, totalScore);
  
  // Determine level and recommendation
  let level: AnomalyResult["level"];
  let recommendation: AnomalyResult["recommendation"];
  
  if (cappedScore >= ANOMALY_THRESHOLDS.critical) {
    level = "critical";
    recommendation = "hard_block";
    session.profile.anomalyCount++;
  } else if (cappedScore >= ANOMALY_THRESHOLDS.anomalous) {
    level = "anomalous";
    recommendation = "soft_block";
    session.profile.anomalyCount++;
  } else if (cappedScore >= ANOMALY_THRESHOLDS.suspicious) {
    level = "suspicious";
    recommendation = "warn";
  } else {
    level = "normal";
    recommendation = "allow";
  }
  
  // Update action risk score
  actionRecord.riskScore = cappedScore;
  
  // Log if suspicious
  if (level !== "normal") {
    logAnomalyEvent(level, cappedScore, factors);
  }
  
  return {
    score: cappedScore,
    level,
    factors,
    recommendation,
  };
}

// ============================================================================
// SESSION QUARANTINE
// ============================================================================

/**
 * Setzt eine Session in Quarantäne
 */
export function quarantineSession(reason: string): void {
  const session = getOrCreateSession();
  session.quarantined = true;
  session.quarantineReason = reason;
  
  logAnomalyEvent("critical", 100, [{
    name: "session_quarantined",
    score: 100,
    description: reason,
  }]);
}

/**
 * Prüft ob die Session in Quarantäne ist
 */
export function isSessionQuarantined(): { quarantined: boolean; reason?: string } {
  const session = getOrCreateSession();
  return {
    quarantined: session.quarantined,
    reason: session.quarantineReason,
  };
}

/**
 * Hebt Quarantäne auf (z.B. nach Admin-Review)
 */
export function releaseQuarantine(): void {
  const session = getOrCreateSession();
  session.quarantined = false;
  session.quarantineReason = undefined;
}

// ============================================================================
// BEHAVIORAL BASELINE
// ============================================================================

/**
 * Gibt das Verhaltensprofil der aktuellen Session zurück
 */
export function getSessionProfile(): BehaviorProfile {
  const session = getOrCreateSession();
  
  // Calculate avg requests per minute
  const sessionDurationMinutes = 
    (Date.now() - session.profile.sessionStart.getTime()) / 60000;
  session.profile.avgRequestsPerMinute = 
    session.profile.totalRequests / Math.max(sessionDurationMinutes, 1);
  
  return { ...session.profile };
}

/**
 * Berechnet einen Trust Score für die Session
 */
export function calculateTrustScore(): number {
  const session = getOrCreateSession();
  
  // Start at 100, subtract for issues
  let score = 100;
  
  // Deduct for anomalies
  score -= session.profile.anomalyCount * 5;
  
  // Add for session longevity (established sessions are more trusted)
  const sessionHours = 
    (Date.now() - session.profile.sessionStart.getTime()) / (1000 * 60 * 60);
  score += Math.min(10, sessionHours);
  
  // Add for consistent behavior
  if (session.profile.totalRequests > 10 && session.profile.anomalyCount === 0) {
    score += 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// AUDIT LOGGING WITH REMOTE LOGGING
// ============================================================================

function logAnomalyEvent(
  level: AnomalyResult["level"],
  score: number,
  factors: AnomalyFactor[]
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    score,
    factors: factors.map(f => f.name),
    sessionHash: hashForLogging(getSessionId()),
  };
  
  if (import.meta.env.DEV) {
    console.log("[ZeroDefenseLayer]", logEntry);
  }
  
  // Remote logging for suspicious and higher levels
  if (level !== "normal") {
    const riskLevelMap: Record<AnomalyResult["level"], "low" | "medium" | "high" | "critical"> = {
      "normal": "low",
      "suspicious": "medium",
      "anomalous": "high",
      "critical": "critical",
    };
    
    const eventType = level === "critical" ? "zero_day_detected" 
      : level === "anomalous" ? "anomaly_detected"
      : "trust_score_degraded";
    
    logSecurityEvent({
      event_type: eventType,
      risk_level: riskLevelMap[level],
      details: {
        anomaly_level: level,
        score,
        factors: factors.map(f => f.name),
        session_hash: hashForLogging(getSessionId()),
      },
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  calculateEntropy,
  analyzeAction,
  quarantineSession,
  isSessionQuarantined,
  releaseQuarantine,
  getSessionProfile,
  calculateTrustScore,
};
