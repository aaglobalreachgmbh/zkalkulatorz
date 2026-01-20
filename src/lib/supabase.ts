import { createClient } from '@supabase/supabase-js'

// Use a detectable sentinel value. If this is active, the App component will block UI and show a setup prompt.
// We DO NOT use a 'placeholder.supabase.co' domain because that causes browser DNS errors during OAuth redirects.
const FALLBACK_URL = "https://missing-env-vars.com";
const FALLBACK_KEY = "missing-env-vars";

// Check multiple common variable names (Lovable sometimes uses different conventions)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_ANON_KEY || FALLBACK_KEY;

if (supabaseUrl === FALLBACK_URL) {
    console.error("[lib/supabase] CRITICAL: Supabase URL is missing. App is running in degraded mode.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Export helper to check if configured
export const isSupabaseConfigured = () => supabaseUrl !== FALLBACK_URL && supabaseAnonKey !== FALLBACK_KEY;
