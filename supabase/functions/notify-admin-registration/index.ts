import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const adminEmail = Deno.env.get("SECURITY_ALERT_EMAIL");
// Configurable sender email - set via secrets for own domain
const senderEmailAddress = Deno.env.get("SENDER_EMAIL_ADDRESS") || "onboarding@resend.dev";

// Allowed origins for CORS - restrict to production domains
const ALLOWED_ORIGINS = [
  "https://margenkalkulator.lovable.app",
  "https://lovable.dev",
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.lovable\.app$/,
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.some((allowed) =>
      typeof allowed === "string" ? allowed === origin : allowed.test(origin)
    );
    if (isAllowed) {
      headers["Access-Control-Allow-Origin"] = origin;
    }
  }

  return headers;
}

interface RegistrationNotification {
  userId: string;
  email: string;
  displayName?: string;
}

const ADMIN_EMAILS = ["akar@allenetze.de", "info@aandaglobal.de"];

const handler = async (req: Request): Promise<Response> => {
  console.log("[notify-admin-registration] Request received");

  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("[notify-admin-registration] No authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { userId, email, displayName }: RegistrationNotification = await req.json();
    console.log(`[notify-admin-registration] New user: ${email}`);

    // Get current user count for context
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const registrationTime = new Date().toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
      dateStyle: "full",
      timeStyle: "medium",
    });

    // Generate Approval Link (Direct to Admin Users Page)
    // Assuming the app is hosted at the origin or we can use a known base URL
    // For now, we'll try to use the request origin or fallback to lovable URL
    const appUrl = origin || "https://margenkalkulator.lovable.app";
    const approvalLink = `${appUrl}/admin/users?highlight=${userId}`;

    // Send email notification to ALL admins
    const emailPromises = ADMIN_EMAILS.map(adminEmail => {
      return fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `MargenKalkulator Security <${senderEmailAddress}>`,
          to: [adminEmail],
          subject: `🔴 APPROVAL NEEDED: ${displayName || email}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #032362; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e5e5; }
                .alert-box { background: #fffbe6; border: 1px solid #ffe58f; padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
                .info-row { margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 12px; }
                .label { font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 1px; }
                .value { font-size: 16px; font-weight: 600; color: #333; }
                .btn { display: inline-block; background: #FEA928; color: #032362; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin:0">Neue Registrierung</h1>
                  <p style="margin:5px 0 0 0; opacity:0.8">Gatekeeper Security System</p>
                </div>
                <div class="content">
                  <div class="alert-box">
                    <strong>⚠️ Zugriff gesperrt</strong>
                    <br/>
                    Dieser Benutzer wartet auf Ihre Freigabe.
                  </div>
                  
                  <div class="info-row">
                    <div class="label">Name</div>
                    <div class="value">${displayName || "Nicht angegeben"}</div>
                  </div>
                  <div class="info-row">
                    <div class="label">E-Mail</div>
                    <div class="value">${email}</div>
                  </div>
                  <div class="info-row">
                    <div class="label">Zeitpunkt</div>
                    <div class="value">${registrationTime}</div>
                  </div>
                  
                  <div style="text-align: center;">
                    <a href="${approvalLink}" class="btn">Benutzer jetzt prüfen & freigeben</a>
                  </div>
                </div>
                <div class="footer">
                  <p>Diese Nachricht wurde an Sie als Super-Admin gesendet.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        }),
      });
    });

    await Promise.all(emailPromises);
    console.log(`[notify-admin-registration] Emails sent to ${ADMIN_EMAILS.length} admins`);

    // Log the registration event
    await supabase.from("security_events").insert({
      event_type: "user_registration_pending",
      risk_level: "info",
      user_id: userId,
      details: {
        email,
        displayName,
        notificationSent: true,
        adminsNotified: ADMIN_EMAILS
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[notify-admin-registration] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
