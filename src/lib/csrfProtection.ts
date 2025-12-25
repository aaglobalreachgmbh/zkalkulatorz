// =============================================================================
// VAULT SECURITY: CSRF Protection
// =============================================================================

const CSRF_TOKEN_KEY = "csrf_token";
const CSRF_TOKEN_EXPIRY_KEY = "csrf_token_expiry";
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  
  // Store token with expiry
  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  sessionStorage.setItem(CSRF_TOKEN_EXPIRY_KEY, String(Date.now() + TOKEN_EXPIRY_MS));
  
  return token;
}

/**
 * Get current CSRF token, generate new one if expired or missing
 */
export function getCsrfToken(): string {
  const token = sessionStorage.getItem(CSRF_TOKEN_KEY);
  const expiry = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
  
  if (!token || !expiry || Date.now() > parseInt(expiry, 10)) {
    return generateCsrfToken();
  }
  
  return token;
}

/**
 * Validate a CSRF token against the stored one
 */
export function validateCsrfToken(token: string): boolean {
  const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
  const expiry = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
  
  if (!storedToken || !expiry) {
    return false;
  }
  
  // Check expiry
  if (Date.now() > parseInt(expiry, 10)) {
    clearCsrfToken();
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  if (token.length !== storedToken.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Clear CSRF token (e.g., on logout)
 */
export function clearCsrfToken(): void {
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
  sessionStorage.removeItem(CSRF_TOKEN_EXPIRY_KEY);
}

/**
 * Rotate CSRF token (generate new one and invalidate old)
 */
export function rotateCsrfToken(): string {
  clearCsrfToken();
  return generateCsrfToken();
}

/**
 * Get CSRF headers for fetch requests
 */
export function getCsrfHeaders(): Record<string, string> {
  return {
    "X-CSRF-Token": getCsrfToken(),
  };
}

/**
 * Hook for React components to use CSRF protection
 */
export function useCsrfToken(): {
  token: string;
  headers: Record<string, string>;
  validate: (token: string) => boolean;
  rotate: () => string;
} {
  const token = getCsrfToken();
  
  return {
    token,
    headers: getCsrfHeaders(),
    validate: validateCsrfToken,
    rotate: rotateCsrfToken,
  };
}
