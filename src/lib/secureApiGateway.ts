/**
 * Zero-Trust API Gateway
 * 
 * Zentraler Schutz für ALLE ausgehenden API-Verbindungen.
 * Jeder externe API-Call MUSS durch diese Schicht gehen.
 * 
 * Schützt vor:
 * - SSRF (Server-Side Request Forgery)
 * - Response Injection
 * - Unerlaubte externe Domains
 * - Timing Attacks
 * - Data Exfiltration
 */

import { checkAllThreats, sanitizeAll, hashForLogging } from "./securityPatterns";

// ============================================================================
// TYPES
// ============================================================================

export type ApiCategory = "ai" | "payment" | "communication" | "data" | "general";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface SecureApiConfig {
  url: string;
  method: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  category: ApiCategory;
  timeout?: number;
  retries?: number;
  validateResponse?: boolean;
}

export interface ApiSecurityResult {
  allowed: boolean;
  reason?: string;
  riskLevel: "none" | "low" | "medium" | "high" | "critical";
}

export interface GatewayStats {
  totalRequests: number;
  blockedRequests: number;
  lastReset: Date;
}

// ============================================================================
// ALLOWED DOMAINS - Whitelist-Ansatz
// ============================================================================

const ALLOWED_DOMAINS: Record<ApiCategory, RegExp[]> = {
  ai: [
    /^https:\/\/ai\.gateway\.lovable\.dev/,
    /^https:\/\/api\.openai\.com/,
    /^https:\/\/generativelanguage\.googleapis\.com/,
  ],
  payment: [
    /^https:\/\/api\.stripe\.com/,
    /^https:\/\/[a-z0-9-]+\.stripe\.com/,
  ],
  communication: [
    /^https:\/\/api\.twilio\.com/,
    /^https:\/\/api\.sendgrid\.com/,
  ],
  data: [
    /^https:\/\/[a-z0-9-]+\.supabase\.co/,
    /^wss:\/\/[a-z0-9-]+\.supabase\.co/,
  ],
  general: [
    /^https:\/\/[a-z0-9-]+\.supabase\.co/,
  ],
};

// ============================================================================
// BLOCKED PATTERNS - SSRF Protection
// ============================================================================

const BLOCKED_PATTERNS = {
  // Private IP Ranges (SSRF)
  privateIp: [
    /^https?:\/\/127\./,
    /^https?:\/\/10\./,
    /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^https?:\/\/192\.168\./,
    /^https?:\/\/169\.254\./,
    /^https?:\/\/0\./,
    /^https?:\/\/localhost/i,
    /^https?:\/\/\[::1\]/,
    /^https?:\/\/\[fd/i,
    /^https?:\/\/\[fe80:/i,
  ],
  // Dangerous Protocols
  dangerousProtocol: [
    /^file:/i,
    /^ftp:/i,
    /^data:/i,
    /^javascript:/i,
    /^vbscript:/i,
  ],
  // Cloud Metadata Endpoints (SSRF)
  cloudMetadata: [
    /169\.254\.169\.254/,
    /metadata\.google\.internal/,
    /metadata\.azure\.internal/,
  ],
};

// ============================================================================
// RATE LIMITING PER CATEGORY
// ============================================================================

const RATE_LIMITS: Record<ApiCategory, { max: number; windowMs: number }> = {
  ai: { max: 10, windowMs: 60000 },
  payment: { max: 30, windowMs: 60000 },
  communication: { max: 20, windowMs: 60000 },
  data: { max: 100, windowMs: 60000 },
  general: { max: 60, windowMs: 60000 },
};

const requestCounts: Map<ApiCategory, { count: number; resetAt: number }> = new Map();

// ============================================================================
// STATS TRACKING
// ============================================================================

let stats: GatewayStats = {
  totalRequests: 0,
  blockedRequests: 0,
  lastReset: new Date(),
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Prüft ob die URL erlaubt ist (Domain Whitelist)
 */
function validateDomain(url: string, category: ApiCategory): boolean {
  const patterns = ALLOWED_DOMAINS[category];
  return patterns.some(pattern => pattern.test(url));
}

/**
 * Prüft auf SSRF-Angriffe (Private IPs, Cloud Metadata, etc.)
 */
function checkSsrf(url: string): { safe: boolean; reason?: string } {
  // Private IPs
  for (const pattern of BLOCKED_PATTERNS.privateIp) {
    if (pattern.test(url)) {
      return { safe: false, reason: "SSRF: Private IP blocked" };
    }
  }
  
  // Dangerous Protocols
  for (const pattern of BLOCKED_PATTERNS.dangerousProtocol) {
    if (pattern.test(url)) {
      return { safe: false, reason: "SSRF: Dangerous protocol blocked" };
    }
  }
  
  // Cloud Metadata
  for (const pattern of BLOCKED_PATTERNS.cloudMetadata) {
    if (pattern.test(url)) {
      return { safe: false, reason: "SSRF: Cloud metadata endpoint blocked" };
    }
  }
  
  return { safe: true };
}

/**
 * Rate Limiting pro Kategorie
 */
function checkRateLimit(category: ApiCategory): boolean {
  const now = Date.now();
  const limit = RATE_LIMITS[category];
  let state = requestCounts.get(category);
  
  if (!state || now > state.resetAt) {
    state = { count: 0, resetAt: now + limit.windowMs };
    requestCounts.set(category, state);
  }
  
  if (state.count >= limit.max) {
    return false;
  }
  
  state.count++;
  return true;
}

/**
 * Sanitiert den Request Body
 */
function sanitizePayload(body: unknown): unknown {
  if (body === null || body === undefined) return body;
  
  if (typeof body === "string") {
    return sanitizeAll(body, 50000);
  }
  
  if (Array.isArray(body)) {
    return body.map(item => sanitizePayload(item));
  }
  
  if (typeof body === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      // Sanitize keys too
      const cleanKey = sanitizeAll(key, 100);
      result[cleanKey] = sanitizePayload(value);
    }
    return result;
  }
  
  return body;
}

/**
 * Prüft den Request Body auf Threats
 */
function checkPayloadThreats(body: unknown): ApiSecurityResult {
  const bodyStr = JSON.stringify(body);
  const threats = checkAllThreats(bodyStr);
  
  if (!threats.isSafe) {
    return {
      allowed: false,
      reason: `Threat detected in payload: ${threats.threats.join(", ")}`,
      riskLevel: threats.riskLevel,
    };
  }
  
  return { allowed: true, riskLevel: "none" };
}

/**
 * Validiert Response Headers
 */
function validateResponseHeaders(headers: Headers): boolean {
  // Check for suspicious headers
  const contentType = headers.get("content-type") || "";
  
  // Block HTML responses when expecting JSON (XSS via response)
  if (contentType.includes("text/html")) {
    console.warn("[SecureApiGateway] Unexpected HTML response blocked");
    return false;
  }
  
  return true;
}

/**
 * Sanitiert die Response
 */
function sanitizeResponse<T>(data: T): T {
  if (typeof data === "string") {
    return sanitizeAll(data, 100000) as T;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponse(item)) as T;
  }
  
  if (typeof data === "object" && data !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = sanitizeResponse(value);
    }
    return result as T;
  }
  
  return data;
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

function auditLog(
  config: SecureApiConfig,
  status: "allowed" | "blocked",
  reason?: string
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    url: hashForLogging(config.url),
    method: config.method,
    category: config.category,
    status,
    reason,
  };
  
  if (import.meta.env.DEV) {
    console.log("[SecureApiGateway]", logEntry);
  }
  
  // In production: Could send to security-log edge function
}

// ============================================================================
// MAIN GATEWAY FUNCTION
// ============================================================================

/**
 * Zentraler API Gateway - ALLE externen Calls müssen hier durch
 */
export async function secureApiCall<T>(config: SecureApiConfig): Promise<T> {
  stats.totalRequests++;
  
  // 1. SSRF Check
  const ssrfResult = checkSsrf(config.url);
  if (!ssrfResult.safe) {
    stats.blockedRequests++;
    auditLog(config, "blocked", ssrfResult.reason);
    throw new Error(`Security: ${ssrfResult.reason}`);
  }
  
  // 2. Domain Whitelist (optional - kann für allgemeine APIs deaktiviert werden)
  if (config.category !== "general") {
    if (!validateDomain(config.url, config.category)) {
      stats.blockedRequests++;
      auditLog(config, "blocked", "Domain not in whitelist");
      throw new Error(`Security: Domain not allowed for category ${config.category}`);
    }
  }
  
  // 3. Rate Limiting
  if (!checkRateLimit(config.category)) {
    stats.blockedRequests++;
    auditLog(config, "blocked", "Rate limit exceeded");
    throw new Error(`Security: Rate limit exceeded for ${config.category}`);
  }
  
  // 4. Payload Threat Check
  if (config.body) {
    const payloadCheck = checkPayloadThreats(config.body);
    if (!payloadCheck.allowed) {
      stats.blockedRequests++;
      auditLog(config, "blocked", payloadCheck.reason);
      throw new Error(`Security: ${payloadCheck.reason}`);
    }
  }
  
  // 5. Sanitize Payload
  const sanitizedBody = config.body ? sanitizePayload(config.body) : undefined;
  
  // 6. Execute Request with Timeout
  const controller = new AbortController();
  const timeout = config.timeout || 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    auditLog(config, "allowed");
    
    const response = await fetch(config.url, {
      method: config.method,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      body: sanitizedBody ? JSON.stringify(sanitizedBody) : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // 7. Validate Response Headers
    if (config.validateResponse !== false) {
      if (!validateResponseHeaders(response.headers)) {
        throw new Error("Security: Invalid response headers");
      }
    }
    
    // 8. Parse and Sanitize Response
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return sanitizeResponse<T>(data);
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Security: Request timeout after ${timeout}ms`);
    }
    
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Quick validation ohne Request
 */
export function validateApiUrl(url: string, category: ApiCategory): ApiSecurityResult {
  const ssrfResult = checkSsrf(url);
  if (!ssrfResult.safe) {
    return { allowed: false, reason: ssrfResult.reason, riskLevel: "critical" };
  }
  
  if (category !== "general" && !validateDomain(url, category)) {
    return { allowed: false, reason: "Domain not in whitelist", riskLevel: "high" };
  }
  
  return { allowed: true, riskLevel: "none" };
}

/**
 * Gateway Stats abrufen
 */
export function getGatewayStats(): GatewayStats {
  return { ...stats };
}

/**
 * Gateway Stats zurücksetzen
 */
export function resetGatewayStats(): void {
  stats = {
    totalRequests: 0,
    blockedRequests: 0,
    lastReset: new Date(),
  };
}

/**
 * Rate Limit Status abrufen
 */
export function getRateLimitStatus(category: ApiCategory): { remaining: number; resetsIn: number } {
  const limit = RATE_LIMITS[category];
  const state = requestCounts.get(category);
  
  if (!state) {
    return { remaining: limit.max, resetsIn: 0 };
  }
  
  const now = Date.now();
  if (now > state.resetAt) {
    return { remaining: limit.max, resetsIn: 0 };
  }
  
  return {
    remaining: Math.max(0, limit.max - state.count),
    resetsIn: state.resetAt - now,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  secureApiCall,
  validateApiUrl,
  getGatewayStats,
  resetGatewayStats,
  getRateLimitStatus,
};
