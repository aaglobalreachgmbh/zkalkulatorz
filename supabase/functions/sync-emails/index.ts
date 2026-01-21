// ============================================
// Email Sync Edge Function
// Syncs emails from IONOS accounts (Gmail OAuth removed)
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SyncRequest {
  accountId?: string;
  maxResults?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: SyncRequest = await req.json();
    const { accountId } = body;

    // Get accounts to sync (only IONOS supported)
    let accountsQuery = supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("sync_enabled", true)
      .eq("provider", "ionos"); // Only IONOS accounts

    if (accountId) {
      accountsQuery = accountsQuery.eq("id", accountId);
    }

    const { data: accounts, error: accountsError } = await accountsQuery;

    if (accountsError || !accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No IONOS email accounts found",
          message: "Gmail sync has been removed. Only IONOS accounts are supported."
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const account of accounts) {
      try {
        // IONOS sync requires IMAP implementation
        // Placeholder for future IMAP integration
        results.push({
          accountId: account.id,
          provider: "ionos",
          email: account.email_address,
          synced: 0,
          message: "IONOS IMAP sync - Integration pending",
        });

        // Update last_sync_at
        await supabase
          .from("email_accounts")
          .update({ 
            last_sync_at: new Date().toISOString(),
            sync_error: null,
          })
          .eq("id", account.id);

      } catch (error: unknown) {
        console.error(`Sync failed for account ${account.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        
        // Update sync error
        await supabase
          .from("email_accounts")
          .update({ 
            sync_error: errorMessage,
          })
          .eq("id", account.id);

        results.push({
          accountId: account.id,
          provider: account.provider,
          email: account.email_address,
          error: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Email sync error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
