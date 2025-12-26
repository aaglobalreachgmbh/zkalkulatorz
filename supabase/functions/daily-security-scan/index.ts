import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  highEvents: number;
  blockedIps: number;
  newBlockedIps: number;
  topThreats: { type: string; count: number }[];
  topAttackers: { ip_hash: string; count: number }[];
  securityScore: number;
}

function calculateSecurityScore(stats: SecurityStats): number {
  // Start with 100 and deduct points based on issues
  let score = 100;

  // Deduct for critical events (5 points each, max 30)
  score -= Math.min(stats.criticalEvents * 5, 30);

  // Deduct for high events (2 points each, max 20)
  score -= Math.min(stats.highEvents * 2, 20);

  // Deduct for total events over threshold
  if (stats.totalEvents > 100) score -= 10;
  if (stats.totalEvents > 500) score -= 10;

  // Bonus for active blocking
  if (stats.blockedIps > 0) score = Math.min(score + 5, 100);

  return Math.max(0, Math.min(100, score));
}

function generateEmailHtml(stats: SecurityStats, reportDate: string): string {
  const scoreColor = stats.securityScore >= 80 ? "#22c55e" : stats.securityScore >= 60 ? "#eab308" : "#ef4444";
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .score-box { text-align: center; padding: 30px; border-bottom: 1px solid #e5e7eb; }
    .score { font-size: 64px; font-weight: bold; color: ${scoreColor}; }
    .score-label { color: #6b7280; margin-top: 5px; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: #e5e7eb; }
    .stat { background: white; padding: 20px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; color: #1f2937; }
    .stat-label { color: #6b7280; font-size: 14px; margin-top: 5px; }
    .stat-critical .stat-value { color: #ef4444; }
    .stat-high .stat-value { color: #f97316; }
    .section { padding: 20px 30px; }
    .section-title { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
    .threat-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .threat-name { color: #4b5563; }
    .threat-count { font-weight: 600; color: #1f2937; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 12px; }
    .footer a { color: #3b82f6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ Daily Security Report</h1>
      <p>${reportDate}</p>
    </div>
    
    <div class="score-box">
      <div class="score">${stats.securityScore}</div>
      <div class="score-label">Security Score</div>
    </div>
    
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${stats.totalEvents}</div>
        <div class="stat-label">Gesamt Events</div>
      </div>
      <div class="stat stat-critical">
        <div class="stat-value">${stats.criticalEvents}</div>
        <div class="stat-label">Kritische Events</div>
      </div>
      <div class="stat stat-high">
        <div class="stat-value">${stats.highEvents}</div>
        <div class="stat-label">High-Risk Events</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.blockedIps}</div>
        <div class="stat-label">Blockierte IPs</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Top Bedrohungen</div>
      ${stats.topThreats.slice(0, 5).map(t => `
        <div class="threat-item">
          <span class="threat-name">${t.type.replace(/_/g, ' ')}</span>
          <span class="threat-count">${t.count}x</span>
        </div>
      `).join('')}
      ${stats.topThreats.length === 0 ? '<p style="color: #22c55e;">✓ Keine Bedrohungen erkannt</p>' : ''}
    </div>
    
    <div class="section">
      <div class="section-title">Top Angreifer (IP Hash)</div>
      ${stats.topAttackers.slice(0, 5).map(a => `
        <div class="threat-item">
          <span class="threat-name" style="font-family: monospace;">${a.ip_hash.substring(0, 12)}...</span>
          <span class="threat-count">${a.count} Events</span>
        </div>
      `).join('')}
      ${stats.topAttackers.length === 0 ? '<p style="color: #22c55e;">✓ Keine wiederkehrenden Angreifer</p>' : ''}
    </div>
    
    <div class="footer">
      <p>Dieser Report wurde automatisch generiert.</p>
      <p><a href="#">Security Dashboard öffnen</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const alertEmail = Deno.env.get("SECURITY_ALERT_EMAIL");

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting daily security scan...");

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const today = new Date().toISOString().split("T")[0];

    // Get total events
    const { count: totalEvents } = await supabase
      .from("security_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneDayAgo);

    // Get critical events
    const { count: criticalEvents } = await supabase
      .from("security_events")
      .select("*", { count: "exact", head: true })
      .eq("risk_level", "critical")
      .gte("created_at", oneDayAgo);

    // Get high events
    const { count: highEvents } = await supabase
      .from("security_events")
      .select("*", { count: "exact", head: true })
      .eq("risk_level", "high")
      .gte("created_at", oneDayAgo);

    // Get blocked IPs count
    const { count: blockedIps } = await supabase
      .from("blocked_ips")
      .select("*", { count: "exact", head: true });

    // Get new blocked IPs in last 24h
    const { count: newBlockedIps } = await supabase
      .from("blocked_ips")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneDayAgo);

    // Get top threats by event type
    const { data: eventsData } = await supabase
      .from("security_events")
      .select("event_type")
      .gte("created_at", oneDayAgo);

    const threatCounts = new Map<string, number>();
    eventsData?.forEach((e) => {
      threatCounts.set(e.event_type, (threatCounts.get(e.event_type) || 0) + 1);
    });

    const topThreats = Array.from(threatCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get top attackers by IP
    const { data: ipData } = await supabase
      .from("security_events")
      .select("ip_hash")
      .not("ip_hash", "is", null)
      .gte("created_at", oneDayAgo);

    const ipCounts = new Map<string, number>();
    ipData?.forEach((e) => {
      if (e.ip_hash) {
        ipCounts.set(e.ip_hash, (ipCounts.get(e.ip_hash) || 0) + 1);
      }
    });

    const topAttackers = Array.from(ipCounts.entries())
      .map(([ip_hash, count]) => ({ ip_hash, count }))
      .filter((a) => a.count >= 3) // Only show IPs with 3+ events
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const stats: SecurityStats = {
      totalEvents: totalEvents || 0,
      criticalEvents: criticalEvents || 0,
      highEvents: highEvents || 0,
      blockedIps: blockedIps || 0,
      newBlockedIps: newBlockedIps || 0,
      topThreats,
      topAttackers,
      securityScore: 0,
    };

    stats.securityScore = calculateSecurityScore(stats);

    console.log("Security stats:", stats);

    // Save report to database
    const { error: reportError } = await supabase
      .from("daily_security_reports")
      .upsert({
        report_date: today,
        total_events: stats.totalEvents,
        critical_events: stats.criticalEvents,
        blocked_ips: stats.blockedIps,
        top_threats: stats.topThreats,
        top_attackers: stats.topAttackers,
        security_score: stats.securityScore,
        report_data: stats,
        email_sent: false,
      }, { onConflict: "report_date" });

    if (reportError) {
      console.error("Report save error:", reportError);
    }

    // Send email if configured
    let emailSent = false;
    if (resendApiKey && alertEmail) {
      try {
        const resend = new Resend(resendApiKey);
        const reportDate = new Date().toLocaleDateString("de-DE", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const { error: emailError } = await resend.emails.send({
          from: "Security <security@resend.dev>",
          to: [alertEmail],
          subject: `🛡️ Daily Security Report - Score: ${stats.securityScore}/100`,
          html: generateEmailHtml(stats, reportDate),
        });

        if (emailError) {
          console.error("Email error:", emailError);
        } else {
          emailSent = true;
          console.log("Security report email sent successfully");

          // Update report as sent
          await supabase
            .from("daily_security_reports")
            .update({ email_sent: true })
            .eq("report_date", today);
        }
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr);
      }
    } else {
      console.log("Email not configured - skipping email send");
    }

    return new Response(
      JSON.stringify({
        success: true,
        report_date: today,
        stats,
        email_sent: emailSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Daily security scan error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
