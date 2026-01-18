import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditResult {
  table_name: string;
  rls_enabled: boolean;
  has_select_policy: boolean;
  select_requires_auth: boolean;
  risk_level: string;
}

/**
 * Verify that the caller is an admin user or a cron job
 */
async function verifyAdminAccess(
  req: Request,
  supabase: any
): Promise<{ authorized: boolean; error?: string; userId?: string; isCron?: boolean }> {
  // Check for cron secret header (for scheduled jobs)
  const cronSecret = req.headers.get("X-Cron-Secret");
  const expectedCronSecret = Deno.env.get("CRON_SECRET");
  
  if (cronSecret && expectedCronSecret && cronSecret === expectedCronSecret) {
    console.log("[daily-security-audit] Authorized via cron secret");
    return { authorized: true, isCron: true };
  }

  // Otherwise require admin authentication
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader) {
    return { authorized: false, error: "Missing Authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return { authorized: false, error: "Invalid or expired token" };
  }

  // Check for admin role
  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin", "tenant_admin"]);

  if (roleError || !roleData || roleData.length === 0) {
    console.log(`[daily-security-audit] Access denied for user ${user.id} - no admin role`);
    return { authorized: false, error: "Admin access required" };
  }

  console.log(`[daily-security-audit] Admin access granted for user ${user.id}`);
  return { authorized: true, userId: user.id };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[daily-security-audit] Starting security audit...");

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============================================
    // SECURITY: Verify admin access before proceeding
    // ============================================
    const authResult = await verifyAdminAccess(req, supabase);
    
    if (!authResult.authorized) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { 
          status: authResult.error === "Missing Authorization header" ? 401 : 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const callerInfo = authResult.isCron ? "cron" : `user:${authResult.userId}`;
    console.log(`[daily-security-audit] Authorized caller: ${callerInfo}`);

    // 1. Run the security audit function
    console.log("[daily-security-audit] Running audit_rls_security()...");
    const { data: auditResults, error: auditError } = await supabase
      .rpc('audit_rls_security');

    if (auditError) {
      console.error("[daily-security-audit] Audit error:", auditError);
      throw new Error(`Audit failed: ${auditError.message}`);
    }

    const results = auditResults as AuditResult[];
    console.log(`[daily-security-audit] Audited ${results.length} tables`);

    // 2. Analyze results
    const criticalTables = results.filter(r => r.risk_level === 'CRITICAL');
    const highRiskTables = results.filter(r => r.risk_level === 'HIGH');
    const mediumRiskTables = results.filter(r => r.risk_level === 'MEDIUM');
    const lowRiskTables = results.filter(r => r.risk_level === 'LOW');

    // 3. Calculate security score (0-100)
    const totalTables = results.length;
    const securityScore = Math.round(
      ((lowRiskTables.length * 100) + 
       (mediumRiskTables.length * 70) + 
       (highRiskTables.length * 30) + 
       (criticalTables.length * 0)) / totalTables
    );

    // 4. Prepare report data
    const reportData = {
      audit_timestamp: new Date().toISOString(),
      total_tables: totalTables,
      risk_breakdown: {
        critical: criticalTables.length,
        high: highRiskTables.length,
        medium: mediumRiskTables.length,
        low: lowRiskTables.length
      },
      critical_tables: criticalTables.map(t => t.table_name),
      high_risk_tables: highRiskTables.map(t => t.table_name),
      medium_risk_tables: mediumRiskTables.map(t => t.table_name),
      full_audit: results,
      triggered_by: callerInfo
    };

    console.log("[daily-security-audit] Report data:", JSON.stringify(reportData.risk_breakdown));

    // 5. Save report to daily_security_reports
    const today = new Date().toISOString().split('T')[0];
    
    const { error: insertError } = await supabase
      .from('daily_security_reports')
      .upsert({
        report_date: today,
        total_events: totalTables,
        critical_events: criticalTables.length + highRiskTables.length,
        security_score: securityScore,
        top_threats: criticalTables.concat(highRiskTables).slice(0, 10).map(t => ({
          table: t.table_name,
          risk: t.risk_level,
          rls_enabled: t.rls_enabled
        })),
        report_data: reportData,
        email_sent: false
      }, {
        onConflict: 'report_date'
      });

    if (insertError) {
      console.error("[daily-security-audit] Insert error:", insertError);
      // Don't throw, continue with response
    }

    // 6. Send email alert if critical issues found
    if (criticalTables.length > 0 || highRiskTables.length > 0) {
      const alertEmail = Deno.env.get('SECURITY_ALERT_EMAIL');
      
      if (alertEmail) {
        console.log("[daily-security-audit] Critical issues found, would send email to:", alertEmail);
        
        // Use Resend if available
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (resendApiKey) {
          try {
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: 'Security Audit <security@resend.dev>',
                to: alertEmail,
                subject: `🔴 SECURITY ALERT: ${criticalTables.length} Critical + ${highRiskTables.length} High Risk Tables`,
                html: `
                  <h1>Daily Security Audit Report</h1>
                  <p><strong>Date:</strong> ${today}</p>
                  <p><strong>Security Score:</strong> ${securityScore}/100</p>
                  <p><strong>Triggered by:</strong> ${callerInfo}</p>
                  
                  <h2>Risk Summary</h2>
                  <ul>
                    <li>🔴 Critical: ${criticalTables.length}</li>
                    <li>🟠 High: ${highRiskTables.length}</li>
                    <li>🟡 Medium: ${mediumRiskTables.length}</li>
                    <li>🟢 Low: ${lowRiskTables.length}</li>
                  </ul>
                  
                  ${criticalTables.length > 0 ? `
                    <h2>🔴 Critical Tables (RLS DISABLED!)</h2>
                    <ul>${criticalTables.map(t => `<li>${t.table_name}</li>`).join('')}</ul>
                  ` : ''}
                  
                  ${highRiskTables.length > 0 ? `
                    <h2>🟠 High Risk Tables (No SELECT Policy)</h2>
                    <ul>${highRiskTables.map(t => `<li>${t.table_name}</li>`).join('')}</ul>
                  ` : ''}
                  
                  <p><em>This is an automated security audit from MargenKalkulator.</em></p>
                `
              })
            });
            
            if (emailResponse.ok) {
              console.log("[daily-security-audit] Alert email sent successfully");
              
              // Update report to mark email as sent
              await supabase
                .from('daily_security_reports')
                .update({ email_sent: true })
                .eq('report_date', today);
            }
          } catch (emailError) {
            console.error("[daily-security-audit] Email error:", emailError);
          }
        }
      }
    }

    // 7. Return response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      security_score: securityScore,
      triggered_by: callerInfo,
      summary: {
        total_tables: totalTables,
        critical: criticalTables.length,
        high: highRiskTables.length,
        medium: mediumRiskTables.length,
        low: lowRiskTables.length
      },
      critical_tables: criticalTables.map(t => t.table_name),
      high_risk_tables: highRiskTables.map(t => t.table_name),
      message: criticalTables.length === 0 && highRiskTables.length === 0
        ? '✅ All tables have proper RLS protection'
        : `⚠️ ${criticalTables.length + highRiskTables.length} tables need attention`
    };

    console.log("[daily-security-audit] Audit complete:", response.message);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[daily-security-audit] Error:", errorMessage);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
