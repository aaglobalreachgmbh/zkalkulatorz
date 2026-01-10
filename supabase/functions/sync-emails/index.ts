// ============================================
// Email Sync Edge Function
// Syncs emails from Gmail and IONOS accounts
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

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: { name: string; value: string }[];
    mimeType: string;
    body?: { data?: string };
    parts?: { mimeType: string; body?: { data?: string } }[];
  };
  internalDate: string;
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
    const { accountId, maxResults = 50 } = body;

    // Get accounts to sync
    let accountsQuery = supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("sync_enabled", true);

    if (accountId) {
      accountsQuery = accountsQuery.eq("id", accountId);
    }

    const { data: accounts, error: accountsError } = await accountsQuery;

    if (accountsError || !accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No email accounts found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const account of accounts) {
      try {
        if (account.provider === "gmail") {
          // Sync Gmail
          const syncResult = await syncGmailAccount(supabase, account, maxResults);
          results.push({
            accountId: account.id,
            provider: "gmail",
            email: account.email_address,
            ...syncResult,
          });
        } else if (account.provider === "ionos") {
          // IONOS sync would require IMAP implementation
          // For now, return a placeholder
          results.push({
            accountId: account.id,
            provider: "ionos",
            email: account.email_address,
            synced: 0,
            message: "IONOS sync not yet implemented (requires IMAP library)",
          });
        }

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

async function syncGmailAccount(supabase: any, account: any, maxResults: number) {
  const accessToken = account.access_token_encrypted; // TODO: Decrypt

  // Check if token is expired
  if (account.token_expiry && new Date(account.token_expiry) < new Date()) {
    throw new Error("Access token expired - refresh required");
  }

  // Fetch messages from Gmail
  const listResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!listResponse.ok) {
    const errorData = await listResponse.json();
    throw new Error(`Gmail API error: ${errorData.error?.message || "Unknown error"}`);
  }

  const listData = await listResponse.json();
  const messages = listData.messages || [];

  let synced = 0;
  let skipped = 0;

  for (const msg of messages) {
    // Check if already synced
    const { data: existing } = await supabase
      .from("synced_emails")
      .select("id")
      .eq("account_id", account.id)
      .eq("message_id", msg.id)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    // Fetch full message
    const msgResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!msgResponse.ok) continue;

    const msgData: GmailMessage = await msgResponse.json();

    // Extract headers
    const headers = msgData.payload.headers;
    const getHeader = (name: string) => 
      headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || null;

    const fromHeader = getHeader("From") || "";
    const toHeader = getHeader("To") || "";
    const subject = getHeader("Subject") || "(Kein Betreff)";

    // Parse sender
    const senderMatch = fromHeader.match(/(?:"?([^"<]*)"?\s*)?<?([^>]+)>?/);
    const senderName = senderMatch?.[1]?.trim() || null;
    const senderEmail = senderMatch?.[2]?.trim() || fromHeader;

    // Parse recipients
    const recipients = toHeader.split(",").map(r => {
      const match = r.match(/(?:"?([^"<]*)"?\s*)?<?([^>]+)>?/);
      return {
        name: match?.[1]?.trim() || null,
        email: match?.[2]?.trim() || r.trim(),
        type: "to",
      };
    });

    // Get body preview
    const bodyPreview = msgData.snippet || "";

    // Insert into synced_emails
    const { error: insertError } = await supabase
      .from("synced_emails")
      .insert({
        tenant_id: account.tenant_id,
        user_id: account.user_id,
        account_id: account.id,
        message_id: msg.id,
        thread_id: msgData.threadId,
        subject,
        sender_email: senderEmail,
        sender_name: senderName,
        recipients,
        body_preview: bodyPreview.substring(0, 500),
        received_at: new Date(parseInt(msgData.internalDate)).toISOString(),
        is_read: !msgData.labelIds?.includes("UNREAD"),
        is_starred: msgData.labelIds?.includes("STARRED"),
        labels: msgData.labelIds,
        folder: msgData.labelIds?.includes("INBOX") ? "inbox" : 
                msgData.labelIds?.includes("SENT") ? "sent" : "other",
        visibility: "private",
      });

    if (!insertError) {
      synced++;
    }
  }

  return { synced, skipped, total: messages.length };
}
