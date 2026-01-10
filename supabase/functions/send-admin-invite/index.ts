// ============================================
// Send Admin Invite Edge Function
// Sends invitation emails to new tenant administrators
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

    // Build invite link
    const appUrl = Deno.env.get("APP_URL") || "https://margenkalkulator.lovable.app";
    const inviteLink = `${appUrl}/auth?invite=${invite_token}`;

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
            from: `MargenKalkulator <${senderEmail}>`,
            to: [email],
            subject: `Einladung als Administrator für ${companyName}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #e60000; margin: 0; font-size: 28px;">MargenKalkulator</h1>
                  <p style="color: #666; margin-top: 8px;">Vodafone Business Partner Portal</p>
                </div>
                
                <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                  <h2 style="color: #333; margin-top: 0;">Sie wurden eingeladen!</h2>
                  <p style="color: #555; line-height: 1.6;">
                    Sie wurden als <strong>Administrator</strong> für <strong>${companyName}</strong> eingeladen.
                  </p>
                  <p style="color: #555; line-height: 1.6;">
                    Als Administrator können Sie:
                  </p>
                  <ul style="color: #555; line-height: 1.8;">
                    <li>Mitarbeiter einladen und verwalten</li>
                    <li>Provisionen und Tarife konfigurieren</li>
                    <li>Hardware-EK-Preise pflegen</li>
                    <li>Kalkulationen und Angebote einsehen</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${inviteLink}" 
                     style="display: inline-block; background: #e60000; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Konto erstellen
                  </a>
                </div>
                
                <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                  <p style="color: #999; font-size: 12px; text-align: center;">
                    Dieser Link ist 7 Tage gültig.<br>
                    Falls Sie diese E-Mail nicht erwartet haben, ignorieren Sie sie bitte.
                  </p>
                </div>
              </div>
            `,
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
