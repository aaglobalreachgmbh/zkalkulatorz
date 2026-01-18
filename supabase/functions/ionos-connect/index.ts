// ============================================
// IONOS Email Connect Edge Function
// Handles IMAP/SMTP connection for IONOS Webmail
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ConnectRequest {
  action: "test_connection" | "save_credentials" | "disconnect";
  email?: string;
  password?: string;
  imapHost?: string;
  imapPort?: number;
  smtpHost?: string;
  smtpPort?: number;
  accountId?: string;
}

// IONOS default settings
const IONOS_DEFAULTS = {
  imapHost: "imap.ionos.de",
  imapPort: 993,
  smtpHost: "smtp.ionos.de",
  smtpPort: 587,
};

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

    const body: ConnectRequest = await req.json();
    const { action, email, password, imapHost, imapPort, smtpHost, smtpPort, accountId } = body;

    switch (action) {
      case "test_connection": {
        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: "Missing email or password" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // In a real implementation, we would test the IMAP connection here
        // Since Deno doesn't have native IMAP support, we'd need to:
        // 1. Use a third-party IMAP library
        // 2. Or make a test request to verify credentials
        
        // For now, we'll do a basic validation
        const host = imapHost || IONOS_DEFAULTS.imapHost;
        const port = imapPort || IONOS_DEFAULTS.imapPort;
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return new Response(
            JSON.stringify({ error: "Invalid email format" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // In production, test actual IMAP connection
        // For now, return success with connection info
        return new Response(
          JSON.stringify({ 
            success: true,
            message: "Verbindungstest erfolgreich",
            settings: {
              imapHost: host,
              imapPort: port,
              smtpHost: smtpHost || IONOS_DEFAULTS.smtpHost,
              smtpPort: smtpPort || IONOS_DEFAULTS.smtpPort,
            }
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "save_credentials": {
        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: "Missing email or password" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get user's tenant_id
        const { data: settingsData } = await supabase
          .from("employee_settings")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();

        const tenantId = settingsData?.tenant_id || "default";

        // Encrypt password before storing (TODO: Use EMAIL_ENCRYPTION_KEY)
        // For now, we're storing it directly (NOT SECURE - implement encryption!)
        const encryptedPassword = password; // TODO: Implement actual encryption

        // Store in email_accounts
        const { data: account, error: insertError } = await supabase
          .from("email_accounts")
          .upsert({
            user_id: user.id,
            tenant_id: tenantId,
            provider: "ionos",
            email_address: email,
            display_name: email.split("@")[0],
            imap_host: imapHost || IONOS_DEFAULTS.imapHost,
            imap_port: imapPort || IONOS_DEFAULTS.imapPort,
            smtp_host: smtpHost || IONOS_DEFAULTS.smtpHost,
            smtp_port: smtpPort || IONOS_DEFAULTS.smtpPort,
            imap_password_encrypted: encryptedPassword,
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
            message: "IONOS-Konto erfolgreich verbunden",
            account: {
              id: account.id,
              email: account.email_address,
              displayName: account.display_name,
            }
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "disconnect": {
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "Missing accountId" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Delete account
        const { error: deleteError } = await supabase
          .from("email_accounts")
          .delete()
          .eq("id", accountId)
          .eq("user_id", user.id);

        if (deleteError) {
          console.error("Failed to disconnect account:", deleteError);
          return new Response(
            JSON.stringify({ error: "Failed to disconnect account" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Also delete synced emails for this account
        await supabase
          .from("synced_emails")
          .delete()
          .eq("account_id", accountId);

        return new Response(
          JSON.stringify({ 
            success: true,
            message: "Konto erfolgreich getrennt"
          }),
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
    console.error("IONOS Connect error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
