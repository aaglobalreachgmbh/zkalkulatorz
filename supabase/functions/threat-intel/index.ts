import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple hash function for IP addresses
function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(12, "0");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json().catch(() => ({ action: "sync" }));

    console.log(`Threat Intel action: ${action}`);

    if (action === "sync") {
      // Get enabled feeds
      const { data: feeds } = await supabase
        .from("threat_feeds")
        .select("*")
        .eq("enabled", true);

      if (!feeds || feeds.length === 0) {
        return new Response(
          JSON.stringify({ message: "No enabled feeds found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let totalSynced = 0;

      // Sync each feed with simulated threat data
      for (const feed of feeds) {
        await supabase
          .from("threat_feeds")
          .update({ sync_status: "syncing" })
          .eq("id", feed.id);

        // Simulated IPs for demo
        const simulatedIps = [
          "192.0.2.1", "192.0.2.2", "198.51.100.1", "203.0.113.1"
        ];

        const entries = simulatedIps.map((ip) => ({
          feed_id: feed.id,
          ip_hash: hashIP(ip),
          threat_type: feed.feed_name.toLowerCase().replace(/\s+/g, "_"),
          confidence_score: 75,
          last_seen_at: new Date().toISOString(),
        }));

        await supabase
          .from("threat_feed_entries")
          .upsert(entries, { onConflict: "feed_id,ip_hash" });

        await supabase
          .from("threat_feeds")
          .update({
            sync_status: "success",
            last_sync_at: new Date().toISOString(),
            total_entries: entries.length,
          })
          .eq("id", feed.id);

        totalSynced += entries.length;
      }

      // Auto-block high-confidence threats
      const { data: threats } = await supabase
        .from("threat_feed_entries")
        .select("ip_hash")
        .gte("confidence_score", 80)
        .eq("auto_blocked", false)
        .limit(50);

      let autoBlocked = 0;
      if (threats) {
        for (const threat of threats) {
          const ipHash = threat.ip_hash as string;
          const { data: existing } = await supabase
            .from("blocked_ips")
            .select("id")
            .eq("ip_hash", ipHash)
            .maybeSingle();

          if (!existing) {
            await supabase.from("blocked_ips").insert({
              ip_hash: ipHash,
              reason: "Auto-blocked by Threat Intelligence",
            });
            await supabase
              .from("threat_feed_entries")
              .update({ auto_blocked: true })
              .eq("ip_hash", ipHash);
            autoBlocked++;
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          feeds_synced: feeds.length,
          entries_synced: totalSynced,
          auto_blocked: autoBlocked,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Threat Intel error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
