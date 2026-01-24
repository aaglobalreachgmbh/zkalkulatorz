import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

// Lovable Cloud Supabase Credentials
// Diese sind öffentliche/publishable Keys - sicher für Client-Side Code
const SUPABASE_URL = "https://mexrgeafzvcestcccmiy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leHJnZWFmenZjZXN0Y2NjbWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1OTE1OTgsImV4cCI6MjA4MjE2NzU5OH0.rbJXxaijSg0ga8KcxqPS-_mvTMZw_Vtd0ZuNSYXCbcg";

// Initialize Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Lovable Cloud manages configuration - always configured
export const isSupabaseConfigured = true;

console.info("[Supabase] Client initialized with Lovable Cloud");
