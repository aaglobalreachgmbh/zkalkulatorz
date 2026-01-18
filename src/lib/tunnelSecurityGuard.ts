/**
 * Tunnel Security Guard
 * 
 * Sicherheitsschicht für persistente Verbindungen:
 * - WebSocket
 * - Server-Sent Events (SSE)
 * - Long Polling
 * 
 * Schützt vor:
 * - WebSocket Hijacking
 * - Message Flooding (DoS)
 * - Protocol Violation
 * - Data Injection
 * - Connection Manipulation
 */

import { checkAllThreats, sanitizeAll, hashForLogging } from "./securityPatterns";
import { logSecurityEvent } from "./securityLogger";

// ============================================================================
// TYPES
// ============================================================================

export type ConnectionType = "websocket" | "sse" | "polling";

export interface TunnelSecurityConfig {
  type: ConnectionType;
  url: string;
  maxMessageSize?: number;
  maxMessagesPerSecond?: number;
  heartbeatIntervalMs?: number;
  reconnectAttempts?: number;
}

export interface TunnelSecurityResult {
  safe: boolean;
  reason?: string;
  riskLevel: "none" | "low" | "medium" | "high" | "critical";
}

export interface TunnelStats {
  messagesReceived: number;
  messagesSent: number;
  messagesBlocked: number;
  connectionUptime: number;
  lastActivity: Date;
}

interface ConnectionState {
  messageCount: number;
  windowStart: number;
  totalMessages: number;
  blockedMessages: number;
  connectedAt: Date;
  lastActivity: Date;
  violations: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: Required<Omit<TunnelSecurityConfig, "type" | "url">> = {
  maxMessageSize: 65536, // 64KB
  maxMessagesPerSecond: 100,
  heartbeatIntervalMs: 30000, // 30s
  reconnectAttempts: 3,
};

const ALLOWED_ORIGINS: RegExp[] = [
  /^wss?:\/\/[a-z0-9-]+\.supabase\.co/,
  /^https?:\/\/[a-z0-9-]+\.supabase\.co/,
  /^wss?:\/\/localhost/,
  /^wss?:\/\/127\.0\.0\.1/,
];

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const connectionStates: Map<string, ConnectionState> = new Map();

function getConnectionId(url: string): string {
  return hashForLogging(url);
}

function getOrCreateState(url: string): ConnectionState {
  const id = getConnectionId(url);
  let state = connectionStates.get(id);
  
  if (!state) {
    state = {
      messageCount: 0,
      windowStart: Date.now(),
      totalMessages: 0,
      blockedMessages: 0,
      connectedAt: new Date(),
      lastActivity: new Date(),
      violations: 0,
    };
    connectionStates.set(id, state);
  }
  
  return state;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validiert die Tunnel-URL
 */
export function validateTunnelUrl(url: string): TunnelSecurityResult {
  // Check protocol
  const isSecure = url.startsWith("wss://") || url.startsWith("https://");
  if (!isSecure && !url.startsWith("ws://localhost") && !url.startsWith("ws://127.0.0.1")) {
    return {
      safe: false,
      reason: "Insecure protocol - use WSS or HTTPS",
      riskLevel: "critical",
    };
  }
  
  // Check origin whitelist
  const isAllowed = ALLOWED_ORIGINS.some(pattern => pattern.test(url));
  if (!isAllowed) {
    return {
      safe: false,
      reason: "Origin not in whitelist",
      riskLevel: "high",
    };
  }
  
  return { safe: true, riskLevel: "none" };
}

/**
 * Rate Limiting für Messages
 */
export function checkMessageRateLimit(url: string, config: Partial<TunnelSecurityConfig> = {}): TunnelSecurityResult {
  const state = getOrCreateState(url);
  const maxPerSecond = config.maxMessagesPerSecond || DEFAULT_CONFIG.maxMessagesPerSecond;
  const now = Date.now();
  
  // Reset window every second
  if (now - state.windowStart >= 1000) {
    state.windowStart = now;
    state.messageCount = 0;
  }
  
  state.messageCount++;
  state.totalMessages++;
  state.lastActivity = new Date();
  
  if (state.messageCount > maxPerSecond) {
    state.blockedMessages++;
    state.violations++;
    
    return {
      safe: false,
      reason: `Message rate limit exceeded (${maxPerSecond}/s)`,
      riskLevel: state.violations > 5 ? "critical" : "high",
    };
  }
  
  return { safe: true, riskLevel: "none" };
}

/**
 * Validiert Message Size
 */
export function checkMessageSize(message: string | ArrayBuffer, config: Partial<TunnelSecurityConfig> = {}): TunnelSecurityResult {
  const maxSize = config.maxMessageSize || DEFAULT_CONFIG.maxMessageSize;
  const size = typeof message === "string" ? message.length : message.byteLength;
  
  if (size > maxSize) {
    return {
      safe: false,
      reason: `Message too large: ${size} bytes (max: ${maxSize})`,
      riskLevel: "high",
    };
  }
  
  return { safe: true, riskLevel: "none" };
}

/**
 * Validiert Message Content
 */
export function checkMessageContent(message: string): TunnelSecurityResult {
  // Threat detection
  const threatResult = checkAllThreats(message);
  
  if (!threatResult.isSafe) {
    return {
      safe: false,
      reason: `Threat detected: ${threatResult.threats.join(", ")}`,
      riskLevel: threatResult.riskLevel,
    };
  }
  
  // Check for protocol violations
  const protocolViolations = [
    /\x00/, // Null bytes
    /[\x00-\x08\x0B\x0C\x0E-\x1F]/, // Control characters (except tab, newline, carriage return)
  ];
  
  for (const pattern of protocolViolations) {
    if (pattern.test(message)) {
      return {
        safe: false,
        reason: "Protocol violation: Invalid characters in message",
        riskLevel: "medium",
      };
    }
  }
  
  return { safe: true, riskLevel: "none" };
}

/**
 * Sanitiert eine Tunnel-Message
 */
export function sanitizeTunnelMessage(message: string, maxLength?: number): string {
  return sanitizeAll(message, maxLength || DEFAULT_CONFIG.maxMessageSize);
}

// ============================================================================
// SECURE WRAPPERS
// ============================================================================

/**
 * Erstellt einen gesicherten WebSocket
 */
export function createSecureWebSocket(
  url: string,
  config: Partial<TunnelSecurityConfig> = {}
): WebSocket | null {
  // Validate URL first
  const urlResult = validateTunnelUrl(url);
  if (!urlResult.safe) {
    console.error("[TunnelSecurityGuard] WebSocket blocked:", urlResult.reason);
    logTunnelEvent("connection_blocked", url, urlResult.reason);
    return null;
  }
  
  const ws = new WebSocket(url);
  const state = getOrCreateState(url);
  
  // Wrap message handler
  const originalOnMessage = ws.onmessage;
  ws.onmessage = (event) => {
    const message = typeof event.data === "string" ? event.data : "";
    
    // Rate limit check
    const rateResult = checkMessageRateLimit(url, config);
    if (!rateResult.safe) {
      console.warn("[TunnelSecurityGuard] Message rate limited:", rateResult.reason);
      logTunnelEvent("message_blocked", url, rateResult.reason);
      return;
    }
    
    // Size check
    const sizeResult = checkMessageSize(event.data, config);
    if (!sizeResult.safe) {
      console.warn("[TunnelSecurityGuard] Message blocked:", sizeResult.reason);
      logTunnelEvent("message_blocked", url, sizeResult.reason);
      return;
    }
    
    // Content check (for string messages)
    if (typeof event.data === "string") {
      const contentResult = checkMessageContent(event.data);
      if (!contentResult.safe) {
        console.warn("[TunnelSecurityGuard] Message content blocked:", contentResult.reason);
        logTunnelEvent("message_blocked", url, contentResult.reason);
        return;
      }
    }
    
    // Pass through to original handler
    if (originalOnMessage) {
      originalOnMessage.call(ws, event);
    }
  };
  
  // Track connection
  ws.onopen = () => {
    state.connectedAt = new Date();
    logTunnelEvent("connection_opened", url);
  };
  
  ws.onclose = () => {
    logTunnelEvent("connection_closed", url);
  };
  
  ws.onerror = () => {
    logTunnelEvent("connection_error", url);
  };
  
  return ws;
}

/**
 * Erstellt einen gesicherten EventSource (SSE)
 */
export function createSecureEventSource(
  url: string,
  config: Partial<TunnelSecurityConfig> = {}
): EventSource | null {
  // Validate URL first
  const urlResult = validateTunnelUrl(url);
  if (!urlResult.safe) {
    console.error("[TunnelSecurityGuard] SSE blocked:", urlResult.reason);
    logTunnelEvent("connection_blocked", url, urlResult.reason);
    return null;
  }
  
  const es = new EventSource(url);
  const state = getOrCreateState(url);
  
  // Wrap message handler
  const originalOnMessage = es.onmessage;
  es.onmessage = (event) => {
    // Rate limit check
    const rateResult = checkMessageRateLimit(url, config);
    if (!rateResult.safe) {
      console.warn("[TunnelSecurityGuard] SSE message rate limited");
      return;
    }
    
    // Size check
    const sizeResult = checkMessageSize(event.data, config);
    if (!sizeResult.safe) {
      console.warn("[TunnelSecurityGuard] SSE message blocked:", sizeResult.reason);
      return;
    }
    
    // Content check
    const contentResult = checkMessageContent(event.data);
    if (!contentResult.safe) {
      console.warn("[TunnelSecurityGuard] SSE content blocked:", contentResult.reason);
      return;
    }
    
    if (originalOnMessage) {
      originalOnMessage.call(es, event);
    }
  };
  
  es.onopen = () => {
    state.connectedAt = new Date();
    logTunnelEvent("sse_opened", url);
  };
  
  es.onerror = () => {
    logTunnelEvent("sse_error", url);
  };
  
  return es;
}

// ============================================================================
// MONITORING
// ============================================================================

/**
 * Gibt Statistics für eine Verbindung zurück
 */
export function getTunnelStats(url: string): TunnelStats | null {
  const state = connectionStates.get(getConnectionId(url));
  
  if (!state) {
    return null;
  }
  
  return {
    messagesReceived: state.totalMessages,
    messagesSent: 0, // Track separately if needed
    messagesBlocked: state.blockedMessages,
    connectionUptime: Date.now() - state.connectedAt.getTime(),
    lastActivity: state.lastActivity,
  };
}

/**
 * Prüft auf Anomalien in der Verbindung
 */
export function checkConnectionAnomaly(url: string): TunnelSecurityResult {
  const state = connectionStates.get(getConnectionId(url));
  
  if (!state) {
    return { safe: true, riskLevel: "none" };
  }
  
  // Too many violations
  if (state.violations > 10) {
    return {
      safe: false,
      reason: "Too many security violations",
      riskLevel: "critical",
    };
  }
  
  // High block rate
  const blockRate = state.blockedMessages / (state.totalMessages || 1);
  if (blockRate > 0.3 && state.totalMessages > 100) {
    return {
      safe: false,
      reason: `High block rate: ${(blockRate * 100).toFixed(1)}%`,
      riskLevel: "high",
    };
  }
  
  return { safe: true, riskLevel: "none" };
}

/**
 * Bereinigt Connection State
 */
export function cleanupConnectionState(url: string): void {
  connectionStates.delete(getConnectionId(url));
}

// ============================================================================
// AUDIT LOGGING WITH REMOTE LOGGING
// ============================================================================

function logTunnelEvent(
  event: string,
  url: string,
  reason?: string
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    urlHash: hashForLogging(url),
    reason,
  };
  
  if (import.meta.env.DEV) {
    console.log("[TunnelSecurityGuard]", logEntry);
  }
  
  // Remote logging for blocked events
  if (event.includes("blocked") || event.includes("error")) {
    const eventTypeMap: Record<string, "websocket_violation" | "tunnel_blocked" | "message_rate_limited" | "protocol_violation"> = {
      "connection_blocked": "tunnel_blocked",
      "message_blocked": "websocket_violation",
      "connection_error": "websocket_violation",
      "sse_error": "websocket_violation",
    };
    
    const riskLevel = event === "connection_blocked" ? "high" : "medium";
    
    logSecurityEvent({
      event_type: eventTypeMap[event] || "websocket_violation",
      risk_level: riskLevel,
      details: {
        tunnel_event: event,
        url_hash: hashForLogging(url),
        reason,
      },
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  validateTunnelUrl,
  checkMessageRateLimit,
  checkMessageSize,
  checkMessageContent,
  sanitizeTunnelMessage,
  createSecureWebSocket,
  createSecureEventSource,
  getTunnelStats,
  checkConnectionAnomaly,
  cleanupConnectionState,
};
