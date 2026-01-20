import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

// Lovable Cloud usually sets VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// We use a sentinel value to prevent the client from crashing on empty URL, allowing the UI to show a helpful error instead.
const FALLBACK_URL = "https://missing-env-vars.com";
const FALLBACK_KEY = "missing-env-vars";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_KEY;

// Initialize Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Metadata about the Supabase configuration status.
 * Used by Auth components to show appropriate warnings.
 */
export const isSupabaseConfigured = supabaseUrl !== FALLBACK_URL && supabaseAnonKey !== FALLBACK_KEY;

console.info(`[Supabase] Client initialized with URL: ${supabaseUrl ? 'SET' : 'MISSING'}`);
