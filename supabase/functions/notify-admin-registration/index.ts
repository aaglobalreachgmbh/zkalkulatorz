import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const adminEmail = Deno.env.get("SECURITY_ALERT_EMAIL");

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

    if (!adminEmail) {
      console.error("[notify-admin-registration] SECURITY_ALERT_EMAIL not configured");
      return new Response(JSON.stringify({ error: "Admin email not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current user count for context
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const registrationTime = new Date().toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
      dateStyle: "full",
      timeStyle: "medium",
    });

    // Send email notification using fetch
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "MargenKalkulator <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `Neue Registrierung: ${displayName || email}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#e60000 0%,#990000 100%);color:white;padding:30px;border-radius:10px 10px 0 0;text-align:center}.content{background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px}.info-box{background:white;border-left:4px solid #e60000;padding:15px;margin:15px 0;border-radius:0 5px 5px 0}.label{color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px}.value{font-size:16px;font-weight:600;color:#333;margin-top:5px}.stats{display:flex;justify-content:space-around;margin-top:20px;text-align:center}.stat{padding:15px}.stat-number{font-size:24px;font-weight:bold;color:#e60000}.footer{text-align:center;margin-top:20px;color:#666;font-size:12px}</style></head><body><div class="container"><div class="header"><h1 style="margin:0">Neue Registrierung</h1><p style="margin:10px 0 0 0;opacity:0.9">MargenKalkulator</p></div><div class="content"><p>Ein neuer Benutzer hat sich erfolgreich registriert:</p><div class="info-box"><div class="label">Anzeigename</div><div class="value">${displayName || "Nicht angegeben"}</div></div><div class="info-box"><div class="label">E-Mail-Adresse</div><div class="value">${email}</div></div><div class="info-box"><div class="label">Benutzer-ID</div><div class="value" style="font-family:monospace;font-size:14px">${userId}</div></div><div class="info-box"><div class="label">Registrierungszeitpunkt</div><div class="value">${registrationTime}</div></div><div class="stats"><div class="stat"><div class="stat-number">${(userCount || 0) + 1}</div><div class="label">Gesamt Benutzer</div></div></div><div class="footer"><p>Diese E-Mail wurde automatisch vom MargenKalkulator Security System gesendet.</p><p>Um dem neuen Benutzer eine Lizenz zuzuweisen, besuchen Sie das Security Status Dashboard.</p></div></div></div></body></html>`,
      }),
    });

    const emailData = await emailRes.json();
    console.log("[notify-admin-registration] Email sent:", emailData);

    // Log the registration event
    await supabase.from("security_events").insert({
      event_type: "user_registration",
      risk_level: "info",
      user_id: userId,
      details: {
        email,
        displayName,
        notificationSent: true,
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
