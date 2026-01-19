// ============================================
// ENVIRONMENT GUARD
// Prevents app crash from missing environment variables
// Provides clear error messages for developers
// ============================================

interface EnvValidationResult {
    isValid: boolean;
    missing: string[];
    warnings: string[];
}

// Required for app to function
const REQUIRED_VARS = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
] as const;

// Optional but recommended
const RECOMMENDED_VARS = [
    'VITE_SUPABASE_ANON_KEY', // Alias for publishable key
] as const;

/**
 * Validates that all required environment variables are set.
 * Returns validation result with missing variables.
 */
export function validateEnvironment(): EnvValidationResult {
    const missing: string[] = [];
    const warnings: string[] = [];

    // Check required URL
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url || url === 'undefined' || url === '') {
        missing.push('VITE_SUPABASE_URL');
    }

    // Check for either PUBLISHABLE_KEY or ANON_KEY (Lovable Cloud uses ANON_KEY usually)
    const pubKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const hasKey = (pubKey && pubKey !== 'undefined' && pubKey !== '') ||
        (anonKey && anonKey !== 'undefined' && anonKey !== '');

    if (!hasKey) {
        missing.push('VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY');
    }

    return {
        isValid: missing.length === 0,
        missing,
        warnings,
    };
}

/**
 * Logs environment status to console.
 * Called once at app startup.
 */
export function logEnvironmentStatus(): void {
    const result = validateEnvironment();

    if (!result.isValid) {
        console.error(
            `[EnvGuard] ❌ CRITICAL: Missing required environment variables:\n` +
            result.missing.map(v => `  - ${v}`).join('\n') +
            `\n\nThe app will run in DEMO MODE with limited functionality.\n` +
            `To fix: Add these variables in your .env file or deployment settings.`
        );
    } else {
        console.info('[EnvGuard] ✅ All required environment variables are set.');
    }

    if (result.warnings.length > 0) {
        console.warn(
            `[EnvGuard] ⚠️ Warnings:\n` +
            result.warnings.map(w => `  - ${w}`).join('\n')
        );
    }
}

/**
 * Check if the app is running in demo mode (missing Supabase config)
 */
export function isDemoMode(): boolean {
    return !validateEnvironment().isValid;
}

// Export for use in components
export const ENV_VALIDATION = validateEnvironment();
