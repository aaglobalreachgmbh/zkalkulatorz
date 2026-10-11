// ============================================
// PDF Generation Service (Stub)
// ============================================
//
// This function is intended to handle server-side PDF generation using Puppeteer/Chromium.
// It accepts the offer payload and returns a PDF buffer.
//
// STRATEGY:
// 1. Client sends JSON data
// 2. Function hydrates a React template (same as client)
// 3. Renders HTML string
// 4. Puppeteer prints to PDF (A4)
//
// NOTE: This requires Deno-compatible Puppeteer or Browserless.io service key.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { enforceRateLimit, privateHash, requestTooLarge } from "./requestSecurity.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!req.headers.get("content-type")?.includes("application/json")) {
        return new Response(JSON.stringify({ error: "JSON required" }), { status: 415, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (requestTooLarge(req, 256 * 1024)) {
        return new Response(JSON.stringify({ error: "Payload too large" }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    try {
        const authHeader = req.headers.get("authorization") ?? "";
        const url = Deno.env.get("SUPABASE_URL");
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
        if (!authHeader.startsWith("Bearer ") || !url || !anonKey) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const supabase = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const key = await privateHash(user.id, "pdf");
        const limit = await enforceRateLimit(key, "pdf", 30, 60);
        if (!limit.allowed) return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(limit.retryAfter) } });

        const body = await req.json();
        if (!body || typeof body !== "object" || !("offerData" in body)) {
            return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // TODO: Implement Puppeteer rendering here
        // For now, we return a 501 Not Implemented regarding the *actual* PDF binary,
        // but the endpoint structure is ready.

        // Pseudo-code:
        // const browser = await puppeteer.launch();
        // const page = await browser.newPage();
        // await page.setContent(renderOfferHtml(offerData, branding));
        // const pdf = await page.pdf({ format: 'A4' });

        return new Response(
            JSON.stringify({
                message: "PDF Generation Endpoint Ready (Needs Puppeteer Integration)",
                status: "success"
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
