// ============================================
// Gmail OAuth2 Edge Function
// Handles OAuth flow for Gmail integration
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface OAuthRequest {
  action: "get_auth_url" | "exchange_code" | "refresh_token";
  code?: string;
  redirectUri?: string;
  accountId?: string;
  scopes?: string[];
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

    const body: OAuthRequest = await req.json();
    const { action, code, redirectUri, accountId, scopes } = body;

    // Check if Google credentials are configured
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ 
          error: "Google OAuth not configured",
          message: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set"
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case "get_auth_url": {
        // Build OAuth URL
        const defaultScopes = [
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/calendar.readonly",
          "https://www.googleapis.com/auth/calendar.events",
          "https://www.googleapis.com/auth/userinfo.email",
        ];
        
        const requestedScopes = scopes || defaultScopes;
        
        const params = new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          redirect_uri: redirectUri || `${req.headers.get("origin")}/inbox/callback`,
          response_type: "code",
          scope: requestedScopes.join(" "),
          access_type: "offline",
          prompt: "consent",
          state: user.id, // Include user ID in state for callback
        });

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

        return new Response(
          JSON.stringify({ authUrl }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "exchange_code": {
        if (!code || !redirectUri) {
          return new Response(
            JSON.stringify({ error: "Missing code or redirectUri" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Exchange code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            code,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          console.error("Token exchange failed:", errorData);
          return new Response(
            JSON.stringify({ error: "Token exchange failed", details: errorData }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const tokens = await tokenResponse.json();

        // Get user info to get email
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userInfoResponse.ok) {
          return new Response(
            JSON.stringify({ error: "Failed to get user info" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const userInfo = await userInfoResponse.json();

        // Get user's tenant_id from user_roles
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        // Get tenant_id from another source if needed
        const { data: settingsData } = await supabase
          .from("employee_settings")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();

        const tenantId = settingsData?.tenant_id || "default";

        // Store in email_accounts
        const { data: account, error: insertError } = await supabase
          .from("email_accounts")
          .upsert({
            user_id: user.id,
            tenant_id: tenantId,
            provider: "gmail",
            email_address: userInfo.email,
            display_name: userInfo.name || userInfo.email,
            access_token_encrypted: tokens.access_token, // TODO: Encrypt with EMAIL_ENCRYPTION_KEY
            refresh_token_encrypted: tokens.refresh_token,
            token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            sync_enabled: true,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id,email_address",
          })
          .select()
          .single();

        if (insertError) {
          console.error("Failed to save account:", insertError);
          return new Response(
            JSON.stringify({ error: "Failed to save account", details: insertError }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            account: {
              id: account.id,
              email: userInfo.email,
              displayName: userInfo.name,
            }
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "refresh_token": {
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "Missing accountId" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get account
        const { data: account, error: accountError } = await supabase
          .from("email_accounts")
          .select("*")
          .eq("id", accountId)
          .eq("user_id", user.id)
          .single();

        if (accountError || !account) {
          return new Response(
            JSON.stringify({ error: "Account not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!account.refresh_token_encrypted) {
          return new Response(
            JSON.stringify({ error: "No refresh token available" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Refresh token
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: account.refresh_token_encrypted, // TODO: Decrypt
            grant_type: "refresh_token",
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          console.error("Token refresh failed:", errorData);
          return new Response(
            JSON.stringify({ error: "Token refresh failed", details: errorData }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const tokens = await tokenResponse.json();

        // Update account
        await supabase
          .from("email_accounts")
          .update({
            access_token_encrypted: tokens.access_token,
            token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", accountId);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Gmail OAuth error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
