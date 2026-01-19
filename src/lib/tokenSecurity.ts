// ============================================
// SECURITY: Cryptographic Token Utilities
// Used for secure token generation and hashing
// ============================================

/**
 * Generates a cryptographically secure access token
 * @returns 64-character hex string (256 bits)
 */
export function generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Hashes a token using SHA-256
 * Used for secure storage - never store raw tokens!
 * @param token - The raw token to hash
 * @returns Promise<string> - Hex-encoded SHA-256 hash
 */
export async function hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies a token against its hash
 * @param token - The raw token to verify
 * @param storedHash - The stored hash to compare against
 * @returns Promise<boolean> - True if token matches hash
 */
export async function verifyTokenHash(token: string, storedHash: string): Promise<boolean> {
    const tokenHash = await hashToken(token);
    return tokenHash === storedHash;
}

/**
 * Rate limiter for token access attempts
 * Uses localStorage for client-side rate limiting (edge cases)
 * Primary rate limiting should be in edge function/RPC
 */
export class ClientRateLimiter {
    private readonly storageKey: string;
    private readonly maxAttempts: number;
    private readonly windowMs: number;

    constructor(key: string, maxAttempts: number = 5, windowMs: number = 60000) {
        this.storageKey = `rate_limit_${key}`;
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }

    private getAttempts(): { count: number; resetAt: number } {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return { count: 0, resetAt: Date.now() + this.windowMs };

            const data = JSON.parse(stored);
            if (Date.now() > data.resetAt) {
                return { count: 0, resetAt: Date.now() + this.windowMs };
            }
            return data;
        } catch {
            return { count: 0, resetAt: Date.now() + this.windowMs };
        }
    }

    private saveAttempts(attempts: { count: number; resetAt: number }): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(attempts));
        } catch {
            // localStorage might be full or disabled
        }
    }

    /**
     * Check if request is allowed
     * @returns { allowed: boolean; remaining: number; resetIn: number }
     */
    check(): { allowed: boolean; remaining: number; resetIn: number } {
        const attempts = this.getAttempts();
        const remaining = Math.max(0, this.maxAttempts - attempts.count);
        const resetIn = Math.max(0, attempts.resetAt - Date.now());

        return {
            allowed: attempts.count < this.maxAttempts,
            remaining,
            resetIn,
        };
    }

    /**
     * Record an attempt
     */
    hit(): void {
        const attempts = this.getAttempts();
        attempts.count++;
        this.saveAttempts(attempts);
    }

    /**
     * Reset the rate limiter
     */
    reset(): void {
        try {
            localStorage.removeItem(this.storageKey);
        } catch {
            // Ignore
        }
    }
}

// Singleton rate limiter for shared offer access
export const sharedOfferRateLimiter = new ClientRateLimiter('shared_offer_access', 10, 60000);
