/**
 * Edge Function: import-tariffs
 * Purpose: Securely import Vodafone tariff data from JSON payload into both
 *          tariffs_public and tariffs_commercial tables.
 * Security: Requires Admin Token (validated via header). Uses Service Role Key.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CORS Headers ---
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
};

// --- Main Handler ---
serve(async (req) => {
    // Handle CORS Preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Validate Admin Token (Simple check - in production, use JWT or API Key)
        const adminToken = req.headers.get("x-admin-token");
        const expectedToken = Deno.env.get("ADMIN_IMPORT_TOKEN");

        if (!adminToken || adminToken !== expectedToken) {
            return new Response(
                JSON.stringify({ error: "Unauthorized: Invalid admin token" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 2. Initialize Supabase Client with Service Role Key (Bypass RLS)
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Server Misconfiguration: Supabase credentials missing");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 3. Parse JSON Body (Array of Tariff Objects)
        const body = await req.json();
        const tariffs = body.tariffs;

        if (!Array.isArray(tariffs) || tariffs.length === 0) {
            return new Response(
                JSON.stringify({ error: "Invalid payload: 'tariffs' array required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 4. Process Each Tariff (Upsert Logic)
        let inserted = 0;
        const updated = 0;
        const errors: { row: number; message: string }[] = [];

        for (let i = 0; i < tariffs.length; i++) {
            const tariff = tariffs[i];

            try {
                // Prepare Public Data
                const publicData = {
                    id: tariff.tariff_id,
                    name: tariff.name,
                    category: tariff.category,
                    list_price_netto: tariff.list_price_netto,
                    duration_months: tariff.duration_months || null,
                };

                // Prepare Commercial Data
                const commercialData = {
                    tariff_id: tariff.tariff_id,
                    cost_price_netto: tariff.cost_price_netto,
                    promo_id: tariff.promo_id || null,
                    sub_level: tariff.sub_level || null,
                };

                // Upsert into tariffs_public
                const { error: publicError } = await supabase
                    .from("tariffs_public")
                    .upsert(publicData, { onConflict: "id" });

                if (publicError) throw publicError;

                // Upsert into tariffs_commercial
                const { error: commercialError } = await supabase
                    .from("tariffs_commercial")
                    .upsert(commercialData, { onConflict: "tariff_id" });

                if (commercialError) throw commercialError;

                // Track Success (Check if it was insert or update - simplified)
                inserted++;

            } catch (rowError) {
                errors.push({ row: i + 1, message: String(rowError) });
            }
        }

        // 5. Return Result
        const result = {
            success: errors.length === 0,
            inserted,
            updated,
            errors,
        };

        console.log(`[import-tariffs] Completed: ${inserted} rows, ${errors.length} errors`);

        return new Response(JSON.stringify(result), {
            status: errors.length === 0 ? 200 : 207, // 207 = Multi-Status (partial success)
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("[import-tariffs] Fatal Error:", error);
        return new Response(
            JSON.stringify({ error: "Internal Server Error", details: String(error) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
