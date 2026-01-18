import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    // In dev/build phase, we might not have these yet, but we want to fail fast if running.
    console.warn("Missing Supabase Environment Variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
