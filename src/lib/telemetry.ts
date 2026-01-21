/**
 * Telemetry Library (Phase 9)
 * Purpose: Log user actions and errors to Supabase for analytics.
 * 
 * IMPORTANT: Never log sensitive fields (EK, Marge, Provision, cost_price).
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================
interface UserEventContext {
    [key: string]: string | number | boolean | undefined;
}

interface ApiLogPayload {
    function_name: string;
    status_code: number;
    duration_ms: number;
    request_id?: string;
    error_message?: string;
}

interface ErrorLogPayload {
    source: 'frontend' | 'edge_function' | 'database';
    error_code?: string;
    error_message: string;
    stack_trace?: string;
    context?: Record<string, unknown>;
}

// ============================================
// User Event Logging
// ============================================
export async function logUserAction(
    event: string,
    context: UserEventContext = {}
): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        await (supabase.from as any)('user_events').insert({
            user_id: user?.id,
            event,
            context,
            page_url: typeof window !== 'undefined' ? window.location.pathname : undefined,
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        });
    } catch (error) {
        // Silent fail - telemetry should never break the app
        console.warn('[Telemetry] Failed to log user action:', error);
    }
}

// ============================================
// API Call Logging (For Edge Functions)
// ============================================
export async function logApiCall(payload: ApiLogPayload): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        await (supabase.from as any)('api_logs').insert({
            ...payload,
            user_id: user?.id,
        });
    } catch (error) {
        console.warn('[Telemetry] Failed to log API call:', error);
    }
}

// ============================================
// Error Logging
// ============================================
export async function logError(payload: ErrorLogPayload): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        await (supabase.from as any)('error_logs').insert({
            ...payload,
            user_id: user?.id,
        });
    } catch (error) {
        console.warn('[Telemetry] Failed to log error:', error);
    }
}

// ============================================
// Convenience: Track Page View
// ============================================
export async function trackPageView(pageName: string): Promise<void> {
    await logUserAction('page_view', { page: pageName });
}

// ============================================
// Convenience: Track Wizard Step
// ============================================
export async function trackWizardStep(step: string, action: 'started' | 'completed' | 'skipped'): Promise<void> {
    await logUserAction(`wizard_step_${action}`, { step });
}

// ============================================
// Convenience: Track PDF Export
// ============================================
export async function trackPdfExport(type: 'customer' | 'dealer'): Promise<void> {
    await logUserAction('pdf_export', { type });
}
