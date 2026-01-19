import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
    // In dev/build phase, we might not have these yet, but we want to fail fast if running.
    console.warn("[lib/supabase] Missing Supabase Environment Variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
