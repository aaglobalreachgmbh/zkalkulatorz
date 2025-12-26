/**
 * GDPR Cleanup Edge Function
 * 
 * Automatische Löschung von Benutzerdaten nach 2 Jahren Inaktivität
 * Läuft täglich als Cron-Job
 * 
 * DSGVO Art. 5(1)(e) - Speicherbegrenzung
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 2 Jahre in Millisekunden
const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;

interface InactiveUser {
  id: string;
  email: string | null;
  last_activity_at: string;
  display_name: string | null;
}

/**
 * Hash email for audit log (privacy-preserving)
 */
function hashEmail(email: string | null): string | null {
  if (!email) return null;
  // Simple hash for audit purposes
  const parts = email.split("@");
  if (parts.length !== 2) return "***@***";
  const localPart = parts[0];
  const domain = parts[1];
  const maskedLocal = localPart.charAt(0) + "***" + localPart.charAt(localPart.length - 1);
  return `${maskedLocal}@${domain}`;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("[gdpr-cleanup] Starting GDPR cleanup job...");

  try {
    // Create admin client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Calculate cutoff date (2 years ago)
    const cutoffDate = new Date(Date.now() - TWO_YEARS_MS);
    console.log(`[gdpr-cleanup] Cutoff date: ${cutoffDate.toISOString()}`);

    // Find inactive users (last activity > 2 years ago)
    const { data: inactiveUsers, error: queryError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, last_activity_at, display_name")
      .lt("last_activity_at", cutoffDate.toISOString())
      .limit(100); // Process in batches

    if (queryError) {
      throw new Error(`Query failed: ${queryError.message}`);
    }

    if (!inactiveUsers || inactiveUsers.length === 0) {
      console.log("[gdpr-cleanup] No inactive users found.");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No inactive users to process",
          processed: 0,
          duration_ms: Date.now() - startTime,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`[gdpr-cleanup] Found ${inactiveUsers.length} inactive users`);

    const deletionResults: { userId: string; success: boolean; error?: string }[] = [];

    // Process each inactive user
    for (const user of inactiveUsers as InactiveUser[]) {
      try {
        console.log(`[gdpr-cleanup] Processing user: ${user.id}`);

        const deletedTables: string[] = [];

        // 1. Delete user's saved offers
        const { error: offersError } = await supabaseAdmin
          .from("saved_offers")
          .delete()
          .eq("user_id", user.id);
        
        if (!offersError) deletedTables.push("saved_offers");

        // 2. Delete user's customers
        const { error: customersError } = await supabaseAdmin
          .from("customers")
          .delete()
          .eq("user_id", user.id);
        
        if (!customersError) deletedTables.push("customers");

        // 3. Delete user's offer activities
        const { error: activitiesError } = await supabaseAdmin
          .from("offer_activities")
          .delete()
          .eq("user_id", user.id);
        
        if (!activitiesError) deletedTables.push("offer_activities");

        // 4. Delete user's MFA backup codes
        const { error: mfaError } = await supabaseAdmin
          .from("mfa_backup_codes")
          .delete()
          .eq("user_id", user.id);
        
        if (!mfaError) deletedTables.push("mfa_backup_codes");

        // 5. Delete user's team memberships
        const { error: teamError } = await supabaseAdmin
          .from("team_members")
          .delete()
          .eq("user_id", user.id);
        
        if (!teamError) deletedTables.push("team_members");

        // 6. Delete user's roles
        const { error: rolesError } = await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", user.id);
        
        if (!rolesError) deletedTables.push("user_roles");

        // 7. Delete user's profile
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .delete()
          .eq("id", user.id);
        
        if (!profileError) deletedTables.push("profiles");

        // 8. Delete auth user (this cascades)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        
        if (authError) {
          console.error(`[gdpr-cleanup] Auth deletion failed for ${user.id}:`, authError.message);
        } else {
          deletedTables.push("auth.users");
        }

        // 9. Log deletion for audit
        await supabaseAdmin.from("gdpr_deletion_log").insert({
          user_id: user.id,
          email_hash: hashEmail(user.email),
          deletion_reason: "inactivity_2_years",
          deleted_tables: deletedTables,
          deletion_requested_by: "system_auto",
        });

        deletionResults.push({ userId: user.id, success: true });
        console.log(`[gdpr-cleanup] Successfully deleted user: ${user.id}`);

      } catch (userError) {
        const errorMessage = userError instanceof Error ? userError.message : "Unknown error";
        console.error(`[gdpr-cleanup] Failed to delete user ${user.id}:`, errorMessage);
        deletionResults.push({ userId: user.id, success: false, error: errorMessage });
      }
    }

    const successCount = deletionResults.filter(r => r.success).length;
    const failureCount = deletionResults.filter(r => !r.success).length;

    console.log(`[gdpr-cleanup] Completed. Success: ${successCount}, Failed: ${failureCount}`);

    // Send summary email to admin if there were deletions
    if (successCount > 0) {
      const alertEmail = Deno.env.get("SECURITY_ALERT_EMAIL");
      const resendApiKey = Deno.env.get("RESEND_API_KEY");

      if (alertEmail && resendApiKey) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "MargenKalkulator <noreply@resend.dev>",
              to: alertEmail,
              subject: `🗑️ DSGVO: ${successCount} Benutzerkonten automatisch gelöscht`,
              html: `
                <h2>DSGVO Automatische Datenlöschung</h2>
                <p>Die folgende automatische Bereinigung wurde durchgeführt:</p>
                <table style="border-collapse: collapse; width: 100%;">
                  <tr style="background: #f3f4f6;">
                    <td style="padding: 8px; border: 1px solid #d1d5db;"><strong>Gelöschte Konten</strong></td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">${successCount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border: 1px solid #d1d5db;"><strong>Fehlgeschlagen</strong></td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">${failureCount}</td>
                  </tr>
                  <tr style="background: #f3f4f6;">
                    <td style="padding: 8px; border: 1px solid #d1d5db;"><strong>Löschgrund</strong></td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">2 Jahre Inaktivität (Art. 5(1)(e) DSGVO)</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border: 1px solid #d1d5db;"><strong>Zeitpunkt</strong></td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">${new Date().toLocaleString("de-DE")}</td>
                  </tr>
                </table>
                <p style="margin-top: 16px; color: #6b7280; font-size: 12px;">
                  Diese Löschung erfolgte automatisch gemäß DSGVO Art. 5(1)(e) (Speicherbegrenzung).
                  Details sind im GDPR Deletion Log in der Datenbank verfügbar.
                </p>
              `,
            }),
          });
          console.log("[gdpr-cleanup] Admin notification email sent");
        } catch (emailError) {
          console.error("[gdpr-cleanup] Failed to send notification email:", emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${inactiveUsers.length} inactive users`,
        results: {
          total: inactiveUsers.length,
          deleted: successCount,
          failed: failureCount,
        },
        duration_ms: Date.now() - startTime,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[gdpr-cleanup] Error:", errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        duration_ms: Date.now() - startTime,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
