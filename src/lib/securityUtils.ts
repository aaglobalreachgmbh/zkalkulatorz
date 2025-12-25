// =============================================================================
// Security Utilities - Threat Detection, Sanitization, Rate Limiting
// =============================================================================

export interface ThreatDetectionResult {
  isSafe: boolean;
  threats: string[];
  riskLevel: "low" | "medium" | "high";
}

// =============================================================================
// Threat Detection - Erkennt verdächtige Muster
// =============================================================================
export function detectThreatPatterns(input: string): ThreatDetectionResult {
  const threats: string[] = [];

  // SQL-Injection Patterns
  if (/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b.*\b(FROM|INTO|WHERE|TABLE|DATABASE)\b)/i.test(input)) {
    threats.push("sql_injection");
  }

  // XSS Patterns
  if (/<script|javascript:|on\w+\s*=|<iframe|<object|<embed/i.test(input)) {
    threats.push("xss_attempt");
  }

  // Prompt Injection Patterns (für AI)
  if (/ignore\s+(previous|all|above|prior)\s+(instructions?|prompts?|rules?)|system\s*:|assistant\s*:|you\s+are\s+(now|a)/i.test(input)) {
    threats.push("prompt_injection");
  }

  // Path Traversal
  if (/\.\.\/|\.\.\\|%2e%2e%2f|%252e%252e%252f/gi.test(input)) {
    threats.push("path_traversal");
  }

  // Command Injection Patterns
  if (/[;&|`$]|\$\(|`.*`|>\s*\/|<\s*\/|eval\s*\(|exec\s*\(/i.test(input)) {
    threats.push("command_injection");
  }

  // LDAP Injection
  if (/[)(|*\\].*[)(|*\\]/i.test(input) && input.includes("=")) {
    threats.push("ldap_injection");
  }

  return {
    isSafe: threats.length === 0,
    threats,
    riskLevel: threats.length >= 3 ? "high" : threats.length >= 1 ? "medium" : "low",
  };
}

// =============================================================================
// Input Sanitization - Bereinigt gefährliche Inhalte
// =============================================================================
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  return input
    // Remove control characters (except newline, tab, carriage return)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove JavaScript protocol
    .replace(/javascript:/gi, "")
    // Remove data URLs
    .replace(/data:/gi, "")
    // Neutralize SQL-like patterns (for display, not execution)
    .replace(/(\b)(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)(\b)/gi, "[$2]")
    // Limit consecutive whitespace
    .replace(/\s{5,}/g, "    ")
    // Trim and limit length
    .trim()
    .slice(0, maxLength);
}

// =============================================================================
// Rate Limiter - Verhindert Spam (Client-Side)
// =============================================================================
interface RateLimiterState {
  requests: number[];
}

export function createRateLimiter(maxRequests: number, windowMs: number) {
  const state: RateLimiterState = { requests: [] };

  return {
    /**
     * Check if a request can be made. Returns true and records the request if allowed.
     */
    canMakeRequest(): boolean {
      const now = Date.now();
      
      // Remove old entries outside the window
      state.requests = state.requests.filter(t => t > now - windowMs);

      if (state.requests.length >= maxRequests) {
        return false;
      }

      state.requests.push(now);
      return true;
    },

    /**
     * Get remaining requests in current window
     */
    getRemainingRequests(): number {
      const now = Date.now();
      const validRequests = state.requests.filter(t => t > now - windowMs);
      return Math.max(0, maxRequests - validRequests.length);
    },

    /**
     * Get time until next request is allowed (in ms)
     */
    getRetryAfterMs(): number {
      if (state.requests.length === 0) return 0;
      
      const now = Date.now();
      const oldestInWindow = state.requests.filter(t => t > now - windowMs)[0];
      
      if (!oldestInWindow) return 0;
      
      return Math.max(0, oldestInWindow + windowMs - now);
    },

    /**
     * Reset the rate limiter (e.g., after successful auth)
     */
    reset(): void {
      state.requests = [];
    },
  };
}

// =============================================================================
// Login Attempt Tracker - Brute-Force Prevention
// =============================================================================
interface LoginAttemptState {
  attempts: number;
  lockoutUntil: number | null;
  lastAttemptAt: number;
}

const LOGIN_ATTEMPTS_KEY = "mk_login_attempts";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const ATTEMPT_RESET_MS = 30 * 60 * 1000; // Reset after 30 min of no attempts

export function getLoginAttemptState(): LoginAttemptState {
  try {
    const stored = sessionStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (!stored) {
      return { attempts: 0, lockoutUntil: null, lastAttemptAt: 0 };
    }
    
    const state = JSON.parse(stored) as LoginAttemptState;
    const now = Date.now();
    
    // Auto-reset if last attempt was too long ago
    if (state.lastAttemptAt && now - state.lastAttemptAt > ATTEMPT_RESET_MS) {
      return { attempts: 0, lockoutUntil: null, lastAttemptAt: 0 };
    }
    
    // Clear lockout if expired
    if (state.lockoutUntil && now > state.lockoutUntil) {
      return { attempts: 0, lockoutUntil: null, lastAttemptAt: now };
    }
    
    return state;
  } catch {
    return { attempts: 0, lockoutUntil: null, lastAttemptAt: 0 };
  }
}

export function recordFailedLoginAttempt(): { 
  isLocked: boolean; 
  attemptsRemaining: number;
  lockoutSeconds?: number;
} {
  const state = getLoginAttemptState();
  const now = Date.now();
  
  // Check if currently locked
  if (state.lockoutUntil && now < state.lockoutUntil) {
    const lockoutSeconds = Math.ceil((state.lockoutUntil - now) / 1000);
    return { isLocked: true, attemptsRemaining: 0, lockoutSeconds };
  }
  
  const newAttempts = state.attempts + 1;
  
  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    // Trigger lockout
    const newState: LoginAttemptState = {
      attempts: newAttempts,
      lockoutUntil: now + LOCKOUT_DURATION_MS,
      lastAttemptAt: now,
    };
    sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(newState));
    
    return { 
      isLocked: true, 
      attemptsRemaining: 0, 
      lockoutSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) 
    };
  }
  
  // Record attempt
  const newState: LoginAttemptState = {
    attempts: newAttempts,
    lockoutUntil: null,
    lastAttemptAt: now,
  };
  sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(newState));
  
  return { 
    isLocked: false, 
    attemptsRemaining: MAX_LOGIN_ATTEMPTS - newAttempts 
  };
}

export function clearLoginAttempts(): void {
  sessionStorage.removeItem(LOGIN_ATTEMPTS_KEY);
}

export function isLoginLocked(): { locked: boolean; secondsRemaining?: number } {
  const state = getLoginAttemptState();
  const now = Date.now();
  
  if (state.lockoutUntil && now < state.lockoutUntil) {
    return { 
      locked: true, 
      secondsRemaining: Math.ceil((state.lockoutUntil - now) / 1000) 
    };
  }
  
  return { locked: false };
}

// =============================================================================
// File Upload Validation
// =============================================================================
export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

const ALLOWED_FILE_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel", // xls
  "text/csv",
  "application/csv",
];

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export function validateUploadedFile(file: File): FileValidationResult {
  const errors: string[] = [];

  // Size check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    errors.push(`Datei zu groß (max. ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB)`);
  }

  if (file.size === 0) {
    errors.push("Datei ist leer");
  }

  // Type check (MIME type)
  if (!ALLOWED_FILE_TYPES.includes(file.type) && file.type !== "") {
    errors.push(`Ungültiger Dateityp: ${file.type}. Nur XLSX, XLS und CSV erlaubt.`);
  }

  // Extension check
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    errors.push("Ungültige Dateiendung. Nur .xlsx, .xls und .csv erlaubt.");
  }

  // Filename sanitization check
  if (/[<>:"/\\|?*\x00-\x1F]/.test(file.name)) {
    errors.push("Dateiname enthält ungültige Zeichen");
  }

  // Check for double extensions (potential bypass attempt)
  const parts = file.name.split(".");
  if (parts.length > 2) {
    const suspiciousExtensions = [".exe", ".bat", ".cmd", ".scr", ".js", ".vbs"];
    for (const ext of suspiciousExtensions) {
      if (file.name.toLowerCase().includes(ext)) {
        errors.push("Verdächtige Dateiendung erkannt");
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// Security Event Logger (für Debugging, ohne sensible Daten)
// =============================================================================
export function logSecurityEvent(
  event: "threat_detected" | "rate_limited" | "login_locked" | "file_rejected" | "sanitization_applied",
  details: Record<string, unknown>
): void {
  // In production, nur minimale Infos loggen
  const safeDetails = {
    event,
    timestamp: new Date().toISOString(),
    // Keine sensiblen Daten wie IPs, User-IDs, oder Input-Inhalte
    category: details.category || "security",
    severity: details.severity || "info",
  };
  
  // Log für Debugging (wird in Production entfernt durch Build-Optimierung)
  if (import.meta.env.DEV) {
    console.warn("[Security]", safeDetails, details);
  }
}
