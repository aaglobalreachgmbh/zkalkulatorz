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
// Note: Lovable Cloud injects VITE_SUPABASE_ANON_KEY automatically
const REQUIRED_VARS = [
    'VITE_SUPABASE_URL',
] as const;

/**
 * Validates that all required environment variables are set.
 * Returns validation result with missing variables.
 */
export function validateEnvironment(): EnvValidationResult {
    const missing: string[] = [];
    const warnings: string[] = [];

    // Check required URL - Lovable Cloud injects this automatically
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url || url === 'undefined' || url === '') {
        missing.push('VITE_SUPABASE_URL');
    }

    // Check for ANON_KEY (Lovable Cloud standard) or PUBLISHABLE_KEY (legacy)
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const pubKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const hasKey = (anonKey && anonKey !== 'undefined' && anonKey !== '') ||
        (pubKey && pubKey !== 'undefined' && pubKey !== '');

    if (!hasKey) {
        missing.push('VITE_SUPABASE_ANON_KEY');
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
