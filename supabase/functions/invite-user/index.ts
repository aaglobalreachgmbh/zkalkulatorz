// ============================================
// Invite User Edge Function
// Sends email invitations for tenant team members
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role: "user" | "tenant_admin";
  tenant_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from JWT
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

    // Verify user is tenant_admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "tenant_admin" && roleData?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Nur Tenant-Admins können Einladungen senden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: InviteRequest = await req.json();
    const { email, role, tenant_id } = body;

    if (!email || !role || !tenant_id) {
      return new Response(
        JSON.stringify({ error: "E-Mail, Rolle und Tenant-ID erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Ungültige E-Mail-Adresse" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (userExists) {
      return new Response(
        JSON.stringify({ error: "Ein Benutzer mit dieser E-Mail existiert bereits" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from("tenant_invitations")
      .select("id")
      .eq("email", email.toLowerCase())
      .eq("tenant_id", tenant_id)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (existingInvite) {
      return new Response(
        JSON.stringify({ error: "Eine Einladung für diese E-Mail ist bereits aktiv" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate secure invite token
    const inviteToken = crypto.randomUUID();

    // Create invitation record
    const { data: invitation, error: insertError } = await supabase
      .from("tenant_invitations")
      .insert({
        tenant_id,
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
        invite_token: inviteToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Einladung konnte nicht erstellt werden" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send invitation email via Resend (if configured)
    if (resendApiKey) {
      try {
        const appUrl = Deno.env.get("APP_URL") || "https://margenkalkulator.lovable.app";
        const inviteLink = `${appUrl}/auth?invite=${inviteToken}`;

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "MargenKalkulator <noreply@resend.dev>",
            to: [email],
            subject: "Einladung zum MargenKalkulator",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #e60000;">MargenKalkulator</h1>
                <p>Sie wurden eingeladen, dem Team beizutreten.</p>
                <p><strong>Rolle:</strong> ${role === "tenant_admin" ? "Administrator" : "Mitarbeiter"}</p>
                <p>Klicken Sie auf den folgenden Link, um Ihr Konto zu erstellen:</p>
                <a href="${inviteLink}" style="display: inline-block; background: #e60000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
                  Einladung annehmen
                </a>
                <p style="color: #666; font-size: 12px;">
                  Dieser Link ist 7 Tage gültig. Falls Sie diese E-Mail nicht angefordert haben, ignorieren Sie sie bitte.
                </p>
              </div>
            `,
          }),
        });

        if (emailResponse.ok) {
          console.log("Invitation email sent to:", email);
        } else {
          console.error("Email sending failed:", await emailResponse.text());
        }
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
    } else {
      console.log("RESEND_API_KEY not configured - skipping email");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation,
        message: resendApiKey ? "Einladung gesendet" : "Einladung erstellt (E-Mail nicht konfiguriert)" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Invite user error:", error);
    return new Response(
      JSON.stringify({ error: "Interner Serverfehler" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
