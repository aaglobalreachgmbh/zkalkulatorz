import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const Resend = (await import("https://esm.sh/resend@2.0.0")).Resend;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl: string;
}

interface TenantBranding {
  logoUrl: string | null;
  primaryColor: string;
  companyName: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, redirectUrl }: PasswordResetRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Don't reveal if user exists - return success anyway for security
      console.log(`[send-password-reset] No user found for email: ${email.substring(0, 3)}***`);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's tenant and branding
    const branding: TenantBranding = {
      logoUrl: null,
      primaryColor: "#E60000", // Vodafone Red default
      companyName: "MargenKalkulator"
    };

    // Try to get tenant branding from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.tenant_id) {
      // Get tenant info
      const { data: tenant } = await supabase
        .from("tenants")
        .select("company_name")
        .eq("id", profile.tenant_id)
        .maybeSingle();

      // Get tenant settings with branding
      const { data: settings } = await supabase
        .from("tenant_settings")
        .select("branding")
        .eq("tenant_id", profile.tenant_id)
        .maybeSingle();

      if (tenant?.company_name) {
        branding.companyName = tenant.company_name;
      }

      if (settings?.branding) {
        const brandingData = settings.branding as Record<string, unknown>;
        if (brandingData.logoUrl) branding.logoUrl = brandingData.logoUrl as string;
        if (brandingData.primaryColor) branding.primaryColor = brandingData.primaryColor as string;
      }
    }

    // Generate reset link using Supabase Auth
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: redirectUrl || `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/auth/reset-password`,
      }
    });

    if (resetError) {
      console.error("[send-password-reset] Error generating reset link:", resetError);
      throw new Error("Failed to generate reset link");
    }

    const resetLink = resetData?.properties?.action_link;

    if (!resetLink) {
      throw new Error("No reset link generated");
    }

    // Professional HTML email template
    const htmlEmail = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Passwort zurücksetzen</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header with Logo/Branding -->
          <tr>
            <td style="background: ${branding.primaryColor}; background: linear-gradient(135deg, ${branding.primaryColor} 0%, ${adjustColor(branding.primaryColor, -20)} 100%); padding: 40px; text-align: center;">
              ${branding.logoUrl 
                ? `<img src="${branding.logoUrl}" alt="${branding.companyName}" style="max-height: 80px; max-width: 280px; display: inline-block;"/>`
                : `<h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">${branding.companyName}</h1>`
              }
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 48px 40px 32px;">
              <!-- Icon -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 64px; height: 64px; background: ${branding.primaryColor}15; border-radius: 16px; line-height: 64px;">
                  <span style="font-size: 32px;">🔐</span>
                </div>
              </div>
              
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 24px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">
                Passwort zurücksetzen
              </h2>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.7; margin: 0 0 24px; text-align: center;">
                Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts für <strong style="color: #18181b;">${branding.companyName}</strong> gestellt.
              </p>
              
              <!-- Security Notice Box -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border-radius: 12px; padding: 16px 20px; margin: 24px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  ⚠️ <strong>Sicherheitshinweis:</strong> Dieser Link ist aus Sicherheitsgründen nur <strong>1 Stunde</strong> gültig und kann nur einmal verwendet werden.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 12px; background: ${branding.primaryColor}; box-shadow: 0 4px 14px ${branding.primaryColor}40;">
                    <a href="${resetLink}" 
                       target="_blank"
                       style="display: inline-block; padding: 18px 48px; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; letter-spacing: 0.3px;">
                      Neues Passwort festlegen →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Fallback Link -->
              <p style="color: #a1a1aa; margin: 24px 0 0; font-size: 13px; line-height: 1.6;">
                Falls der Button nicht funktioniert, kopieren Sie diesen Link:<br>
                <a href="${resetLink}" style="color: #71717a; word-break: break-all; text-decoration: underline;">${resetLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent, #e4e4e7, transparent);"></div>
            </td>
          </tr>
          
          <!-- Security Footer -->
          <tr>
            <td style="background: #18181b; padding: 32px 40px; text-align: center;">
              <p style="color: #d4d4d8; margin: 0 0 12px; font-size: 14px; font-weight: 600;">
                Sie haben diese E-Mail nicht angefordert?
              </p>
              <p style="color: #a1a1aa; margin: 0; font-size: 13px; line-height: 1.7;">
                Ignorieren Sie diese E-Mail einfach – Ihr Passwort bleibt unverändert.<br>
                Falls Sie besorgt sind, kontaktieren Sie uns bitte.
              </p>
              
              <!-- Footer Branding -->
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #27272a;">
                <p style="color: #71717a; margin: 0; font-size: 12px;">
                  © ${new Date().getFullYear()} ${branding.companyName}. Alle Rechte vorbehalten.
                </p>
              </div>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    // Send email via Resend if configured
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      const emailResult = await resend.emails.send({
        from: `${branding.companyName} <noreply@resend.dev>`,
        to: [email],
        subject: `🔐 Passwort zurücksetzen – ${branding.companyName}`,
        html: htmlEmail,
      });

      console.log("[send-password-reset] Email sent via Resend:", emailResult);
    } else {
      // Log the link if Resend is not configured
      console.log("[send-password-reset] RESEND_API_KEY not configured. Reset link:", resetLink);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[send-password-reset] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to darken/lighten a hex color
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
