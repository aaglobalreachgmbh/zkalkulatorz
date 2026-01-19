/**
 * Performance Utilities
 * Hydration timing and Core Web Vitals measurement
 */

// Hydration timing marker
const HYDRATION_START = performance.now();

/**
 * Mark hydration as complete and log timing
 * Call this after React has hydrated/mounted
 */
export function markHydrationComplete(): void {
    const hydrationTime = performance.now() - HYDRATION_START;

    // Log to console in development
    if (import.meta.env.DEV) {
        console.info(`[Perf] Hydration complete in ${hydrationTime.toFixed(2)}ms`);
    }

    // Store for CI/testing retrieval
    (window as any).__HYDRATION_TIME_MS__ = hydrationTime;

    // Report to performance API
    if ('performance' in window && 'mark' in performance) {
        performance.mark('hydration-complete');
        performance.measure('hydration', 'navigationStart', 'hydration-complete');
    }
}

/**
 * Get hydration time (for tests/CI)
 */
export function getHydrationTime(): number | null {
    return (window as any).__HYDRATION_TIME_MS__ ?? null;
}

/**
 * Performance thresholds for CI gates
 */
export const PERF_THRESHOLDS = {
    /** Maximum acceptable hydration time in ms */
    HYDRATION_MAX_MS: 3000,
    /** Warning threshold for hydration in ms */
    HYDRATION_WARN_MS: 1500,
} as const;

/**
 * Check if performance is acceptable (for CI)
 */
export function isPerformanceAcceptable(): { ok: boolean; hydrationMs: number | null; message: string } {
    const hydrationMs = getHydrationTime();

    if (hydrationMs === null) {
        return { ok: false, hydrationMs: null, message: 'Hydration time not measured' };
    }

    if (hydrationMs > PERF_THRESHOLDS.HYDRATION_MAX_MS) {
        return {
            ok: false,
            hydrationMs,
            message: `Hydration too slow: ${hydrationMs.toFixed(0)}ms > ${PERF_THRESHOLDS.HYDRATION_MAX_MS}ms`
        };
    }

    if (hydrationMs > PERF_THRESHOLDS.HYDRATION_WARN_MS) {
        return {
            ok: true,
            hydrationMs,
            message: `Hydration warning: ${hydrationMs.toFixed(0)}ms > ${PERF_THRESHOLDS.HYDRATION_WARN_MS}ms`
        };
    }

    return {
        ok: true,
        hydrationMs,
        message: `Hydration OK: ${hydrationMs.toFixed(0)}ms`
    };
}
