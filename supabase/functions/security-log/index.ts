import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const alertEmail = Deno.env.get("SECURITY_ALERT_EMAIL");

// =============================================================================
// SECURITY: CORS Configuration - Restrict to allowed origins only
// =============================================================================
const ALLOWED_ORIGINS = [
  "https://lovable.dev",
  "https://www.lovable.dev",
  /^https:\/\/.*\.lovable\.app$/,
  "http://localhost:5173",
  "http://localhost:8080",
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(allowed => {
    if (allowed instanceof RegExp) {
      return allowed.test(origin);
    }
    return allowed === origin;
  });
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = isOriginAllowed(origin) ? origin : "https://lovable.dev";
  return {
    "Access-Control-Allow-Origin": allowedOrigin!,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Bot detection patterns
const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
  /python-requests/i, /httpie/i, /postman/i, /insomnia/i,
  /headless/i, /phantom/i, /selenium/i, /puppeteer/i, /playwright/i
];

// Phishing detection patterns
const PHISHING_PATTERNS = [
  // Credential harvesting
  /password.*confirm/i, /verify.*account/i, /suspended.*account/i,
  /urgent.*action/i, /limited.*time/i, /click.*here.*now/i,
  // Fake domains
  /paypa[l1]\.com/i, /amaz[o0]n\.com/i, /g[o0][o0]gle\.com/i,
  /m[i1]crosoft\.com/i, /app[l1]e\.com/i,
  // Homograph attacks (unicode lookalikes)
  /[а-яА-Я]/, // Cyrillic characters
  /[\u0400-\u04FF]/, // Extended Cyrillic
  // Suspicious URL patterns
  /bit\.ly|tinyurl|t\.co|goo\.gl/i,
  /login.*\.php/i, /secure.*\.html/i,
  // Data exfiltration attempts
  /base64.*eval/i, /document\.cookie/i, /localStorage\.getItem/i
];

// Spam patterns
const SPAM_PATTERNS = [
  /viagra/i, /cialis/i, /casino/i, /lottery/i, /winner/i,
  /congratulations.*won/i, /million.*dollars/i, /nigerian.*prince/i,
  /crypto.*invest/i, /make.*money.*fast/i, /work.*from.*home/i
];

interface SecurityEvent {
  event_type: string;
  risk_level: "low" | "medium" | "high" | "critical";
  user_id?: string;
  ip_hash?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
}

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).substring(0, 12);
}

function detectBot(userAgent: string | null): boolean {
  if (!userAgent) return true; // No user agent = suspicious
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

function detectPhishing(details: Record<string, unknown>): boolean {
  const detailsStr = JSON.stringify(details).toLowerCase();
  return PHISHING_PATTERNS.some(pattern => pattern.test(detailsStr));
}

function detectSpam(details: Record<string, unknown>): boolean {
  const detailsStr = JSON.stringify(details).toLowerCase();
  return SPAM_PATTERNS.some(pattern => pattern.test(detailsStr));
}

function shouldSendEmail(riskLevel: string, eventType: string): boolean {
  // Send email for high/critical events, or specific event types
  if (riskLevel === "high" || riskLevel === "critical") return true;
  if (eventType === "login_locked" || eventType === "phishing_detected") return true;
  return false;
}

async function sendSecurityAlert(event: SecurityEvent, isBot: boolean, isPhishing: boolean): Promise<boolean> {
  if (!alertEmail) {
    console.log("No alert email configured, skipping email notification");
    return false;
  }

  const riskColors: Record<string, string> = {
    low: "#22c55e",
    medium: "#f59e0b",
    high: "#ef4444",
    critical: "#dc2626"
  };

  const riskEmoji: Record<string, string> = {
    low: "ℹ️",
    medium: "⚠️",
    high: "🚨",
    critical: "🔴"
  };

  try {
    const response = await resend.emails.send({
      from: "Security Alert <onboarding@resend.dev>",
      to: [alertEmail],
      subject: `${riskEmoji[event.risk_level]} [SECURITY] ${event.event_type.toUpperCase()} - ${event.risk_level.toUpperCase()}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${riskColors[event.risk_level]} 0%, ${riskColors[event.risk_level]}99 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🔒 Security Alert</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">MargenKalkulator Security System</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; width: 140px;">Event Type:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${event.event_type}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Risk Level:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="background: ${riskColors[event.risk_level]}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                    ${event.risk_level.toUpperCase()}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Timestamp:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${new Date().toISOString()}</td>
              </tr>
              ${isBot ? `<tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Bot Detected:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><span style="color: #ef4444;">⚠️ Yes</span></td>
              </tr>` : ''}
              ${isPhishing ? `<tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Phishing Pattern:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><span style="color: #ef4444;">🎣 Detected</span></td>
              </tr>` : ''}
              ${event.ip_hash ? `<tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">IP Hash:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${event.ip_hash}</td>
              </tr>` : ''}
            </table>
            
            ${event.details ? `
            <div style="margin-top: 20px;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">Event Details</h3>
              <pre style="background: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 12px; line-height: 1.5;">${JSON.stringify(event.details, null, 2)}</pre>
            </div>
            ` : ''}
          </div>
          
          <div style="background: #f1f5f9; padding: 15px 20px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="margin: 0; color: #64748b; font-size: 12px;">
              This is an automated security notification from MargenKalkulator.
              Please investigate this event if the risk level is high or critical.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Security alert email sent:", response);
    return true;
  } catch (error) {
    console.error("Failed to send security alert email:", error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const event: SecurityEvent = await req.json();
    const userAgent = req.headers.get("user-agent");
    const forwardedFor = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    
    // Hash sensitive data for privacy
    const ipHash = hashString(forwardedFor);
    const userAgentHash = userAgent ? hashString(userAgent) : null;

    // Detect bots, phishing, and spam
    const isBot = detectBot(userAgent);
    const isPhishing = detectPhishing(event.details || {});
    const isSpam = detectSpam(event.details || {});

    // Upgrade risk level if bot/phishing/spam detected
    let adjustedRiskLevel = event.risk_level;
    if (isPhishing) {
      adjustedRiskLevel = "critical";
      event.event_type = "phishing_detected";
    } else if (isBot && event.risk_level === "medium") {
      adjustedRiskLevel = "high";
    } else if (isSpam && event.risk_level === "low") {
      adjustedRiskLevel = "medium";
    }

    console.log(`[SECURITY] Event: ${event.event_type}, Risk: ${adjustedRiskLevel}, Bot: ${isBot}, Phishing: ${isPhishing}`);

    // Log to database
    const { error: dbError } = await supabase
      .from("security_events")
      .insert({
        event_type: event.event_type,
        risk_level: adjustedRiskLevel,
        user_id: event.user_id || null,
        ip_hash: ipHash,
        user_agent_hash: userAgentHash,
        details: {
          ...event.details,
          original_risk_level: event.risk_level,
          bot_detected: isBot,
          phishing_detected: isPhishing,
          spam_detected: isSpam
        },
        is_bot: isBot,
        is_phishing: isPhishing,
        email_sent: false
      });

    if (dbError) {
      console.error("Failed to log security event:", dbError);
      throw dbError;
    }

    // Send email for high/critical events
    let emailSent = false;
    if (shouldSendEmail(adjustedRiskLevel, event.event_type)) {
      emailSent = await sendSecurityAlert(
        { ...event, risk_level: adjustedRiskLevel as SecurityEvent["risk_level"], ip_hash: ipHash },
        isBot,
        isPhishing
      );

      // Update email_sent status
      if (emailSent) {
        await supabase
          .from("security_events")
          .update({ email_sent: true })
          .eq("ip_hash", ipHash)
          .eq("event_type", event.event_type)
          .order("created_at", { ascending: false })
          .limit(1);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        logged: true,
        email_sent: emailSent,
        is_bot: isBot,
        is_phishing: isPhishing,
        adjusted_risk_level: adjustedRiskLevel
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Security log error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
