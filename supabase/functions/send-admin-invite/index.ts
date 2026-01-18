// ============================================
// Send Admin Invite Edge Function
// Sends invitation emails to new tenant administrators
// With professional HTML template and tenant branding
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteAdminRequest {
  email: string;
  invite_token: string;
  tenant_id: string;
}

interface TenantBranding {
  logoUrl?: string | null;
  primaryColor?: string;
  companyName?: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const senderEmail = Deno.env.get("SENDER_EMAIL_ADDRESS") || "noreply@resend.dev";
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Nicht autorisiert" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Ungültiges Token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for admin role (Super-Admin)
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Nur Super-Admins dürfen Tenant-Admins einladen" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const body: InviteAdminRequest = await req.json();
    const { email, invite_token, tenant_id } = body;

    if (!email || !invite_token || !tenant_id) {
      return new Response(
        JSON.stringify({ error: "E-Mail, Token und Tenant-ID erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tenant info for email
    const { data: tenant } = await supabase
      .from("tenants")
      .select("company_name")
      .eq("id", tenant_id)
      .single();

    const companyName = tenant?.company_name || "MargenKalkulator";

    // Get tenant branding from tenant_settings
    const { data: tenantSettings } = await supabase
      .from("tenant_settings")
      .select("branding")
      .eq("tenant_id", tenant_id)
      .maybeSingle();

    const branding = (tenantSettings?.branding as TenantBranding) || {};
    const logoUrl = branding.logoUrl || null;
    const primaryColor = branding.primaryColor || "#e60000";

    // Build invite link
    const appUrl = Deno.env.get("APP_URL") || "https://margenkalkulator.lovable.app";
    const inviteLink = `${appUrl}/auth?invite=${invite_token}`;

    // Professional HTML Email Template with Branding
    const emailHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: ${primaryColor}; padding: 32px 40px; text-align: center;">
              ${logoUrl 
                ? `<img src="${logoUrl}" alt="${companyName}" style="max-height: 80px; max-width: 280px; object-fit: contain; margin-bottom: 8px;" />`
                : `<h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">${companyName}</h1>`
              }
              ${logoUrl ? `<p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">${companyName}</p>` : ''}
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 48px 40px 32px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 28px; font-weight: 700;">
                🎉 Sie wurden eingeladen!
              </h2>
              <p style="color: #52525b; margin: 0 0 24px; font-size: 17px; line-height: 1.7;">
                Sie wurden als <strong style="color: ${primaryColor};">Administrator</strong> für 
                <strong>${companyName}</strong> eingeladen.
              </p>
              
              <!-- Benefits Box -->
              <div style="background: linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}04 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid ${primaryColor};">
                <p style="margin: 0 0 16px; font-weight: 600; color: #18181b; font-size: 16px;">
                  Als Administrator können Sie:
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 8px 0; color: #3f3f46; font-size: 15px;">
                      <span style="color: ${primaryColor}; margin-right: 12px;">✓</span>
                      Mitarbeiter einladen und verwalten
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #3f3f46; font-size: 15px;">
                      <span style="color: ${primaryColor}; margin-right: 12px;">✓</span>
                      Provisionen und Tarife konfigurieren
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #3f3f46; font-size: 15px;">
                      <span style="color: ${primaryColor}; margin-right: 12px;">✓</span>
                      Hardware-EK-Preise pflegen
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #3f3f46; font-size: 15px;">
                      <span style="color: ${primaryColor}; margin-right: 12px;">✓</span>
                      Kalkulationen und Angebote einsehen
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 48px; text-align: center;">
              <a href="${inviteLink}" 
                 style="display: inline-block; background: ${primaryColor}; color: #ffffff; 
                        padding: 18px 48px; text-decoration: none; border-radius: 12px; 
                        font-weight: 700; font-size: 18px; 
                        box-shadow: 0 4px 16px ${primaryColor}40;
                        transition: all 0.2s ease;">
                Jetzt Konto erstellen →
              </a>
              <p style="color: #a1a1aa; margin: 20px 0 0; font-size: 13px;">
                Oder kopieren Sie diesen Link: <br>
                <span style="color: #71717a; word-break: break-all;">${inviteLink}</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #18181b; padding: 32px 40px; text-align: center;">
              ${logoUrl 
                ? `<img src="${logoUrl}" alt="${companyName}" style="max-height: 40px; max-width: 160px; opacity: 0.8; margin-bottom: 16px;" />`
                : `<p style="color: #a1a1aa; margin: 0 0 16px; font-size: 16px; font-weight: 600;">${companyName}</p>`
              }
              <p style="color: #71717a; margin: 0; font-size: 13px; line-height: 1.6;">
                Dieser Link ist <strong>7 Tage</strong> gültig.<br>
                Falls Sie diese E-Mail nicht erwartet haben, ignorieren Sie sie bitte.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // Send email via Resend
    if (resendApiKey) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${companyName} <${senderEmail}>`,
            to: [email],
            subject: `🎉 Einladung als Administrator für ${companyName}`,
            html: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          console.log("Admin invite email sent to:", email);
        } else {
          const errorText = await emailResponse.text();
          console.error("Email sending failed:", errorText);
        }
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
    } else {
      console.log("RESEND_API_KEY not configured - invite link:", inviteLink);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: resendApiKey ? "Einladung gesendet" : "Einladung erstellt (E-Mail nicht konfiguriert)",
        inviteLink: resendApiKey ? undefined : inviteLink,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Send admin invite error:", error);
    return new Response(
      JSON.stringify({ error: "Interner Serverfehler" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
