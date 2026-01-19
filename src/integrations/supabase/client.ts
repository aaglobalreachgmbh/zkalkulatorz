import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

// Lovable Cloud usually sets VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

// Initialize Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Metadata about the Supabase configuration status.
 * Used by Auth components to show appropriate warnings.
 */
export const isSupabaseConfigured = !!supabaseUrl && (!!import.meta.env.VITE_SUPABASE_ANON_KEY || !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

console.info(`[Supabase] Client initialized with URL: ${supabaseUrl ? 'SET' : 'MISSING'}`);
