import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// =============================================================================
// AI Offer Check - Proaktive Angebotsanalyse
// Analysiert Angebote und gibt Optimierungsvorschläge
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store",
};

// Input validation
const OfferDataSchema = z.object({
  hardware: z.object({
    selectedId: z.string().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    ekNet: z.number().optional(),
  }).optional(),
  mobile: z.object({
    tariffId: z.string().optional(),
    tariffName: z.string().optional(),
    subVariantId: z.string().optional(),
    contractType: z.string().optional(),
    quantity: z.number().optional(),
    promoId: z.string().optional(),
  }).optional(),
  fixedNet: z.object({
    enabled: z.boolean().optional(),
    productId: z.string().optional(),
    accessType: z.string().optional(),
  }).optional(),
  result: z.object({
    totals: z.any().optional(),
    dealer: z.any().optional(),
    gkEligible: z.boolean().optional(),
  }).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!authHeader || !supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, ...SECURITY_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, ...SECURITY_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Parse input
    const body = await req.json();
    const parseResult = OfferDataSchema.safeParse(body);
    
    if (!parseResult.success) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, ...SECURITY_HEADERS, "Content-Type": "application/json" },
      });
    }

    const offerData = parseResult.data;
    
    // Build analysis prompt
    const context = buildOfferContext(offerData);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, ...SECURITY_HEADERS, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Du bist ein KI-Analyst für Vodafone Business Angebote. 
Analysiere das folgende Angebot und gib strukturierte Optimierungsvorschläge.

**Aktuelles Angebot:**
${context}

**Analysiere diese Aspekte:**

1. **Marge-Check**: Ist die Marge positiv? Warnung bei negativer oder niedriger Marge (<50€).

2. **Upsell-Potenzial**: Könnte ein höherer Tarif (z.B. Prime M → Prime L) die Marge verbessern?

3. **GigaKombi-Check**: Ist Festnetz aktiv? Wenn nicht, könnte GigaKombi 5€/Monat sparen.

4. **TeamDeal-Optimierung**: Bei 1 Vertrag → 2+ Verträge bringen Staffelrabatte.

5. **Hardware-Analyse**: Bei negativer Marge → SIM-Only als Alternative empfehlen.

**Antwortformat (JSON):**
{
  "overallScore": "good" | "warning" | "critical",
  "marginStatus": { "status": "positive" | "negative" | "low", "amount": number, "message": string },
  "suggestions": [
    { "type": "upsell" | "gigakombi" | "teamdeal" | "hardware" | "promo", "title": string, "description": string, "potentialGain": number }
  ],
  "summary": "Kurze Zusammenfassung in 1-2 Sätzen"
}

Antworte NUR mit dem JSON, keine Erklärungen davor oder danach.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analysiere dieses Angebot und gib strukturierte Vorschläge." },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error(`AI Gateway error: ${status}`);
      
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, ...SECURITY_HEADERS, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, ...SECURITY_HEADERS, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, ...SECURITY_HEADERS, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    try {
      // Extract JSON from response (may have markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysisResult = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify({ analysis: analysisResult }), {
          headers: { ...corsHeaders, ...SECURITY_HEADERS, "Content-Type": "application/json" },
        });
      }
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", e);
    }

    // Fallback if JSON parsing fails
    return new Response(JSON.stringify({ 
      analysis: {
        overallScore: "good",
        marginStatus: { status: "positive", amount: 0, message: "Analyse nicht verfügbar" },
        suggestions: [],
        summary: aiResponse.slice(0, 200)
      }
    }), {
      headers: { ...corsHeaders, ...SECURITY_HEADERS, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in ai-offer-check:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, ...SECURITY_HEADERS, "Content-Type": "application/json" },
    });
  }
});

function buildOfferContext(data: z.infer<typeof OfferDataSchema>): string {
  const parts: string[] = [];

  if (data.hardware) {
    const hw = data.hardware;
    if (hw.selectedId === "SIM_ONLY") {
      parts.push("Hardware: SIM-Only (kein Gerät)");
    } else if (hw.selectedId) {
      parts.push(`Hardware: ${hw.brand || ""} ${hw.model || hw.selectedId}`);
      parts.push(`Hardware-EK: ${hw.ekNet?.toFixed(2) || "0"}€`);
    }
  }

  if (data.mobile) {
    const m = data.mobile;
    parts.push(`Tarif: ${m.tariffName || m.tariffId || "nicht gewählt"}`);
    parts.push(`SUB-Variante: ${m.subVariantId || "Standard"}`);
    parts.push(`Vertragsart: ${m.contractType || "Neuvertrag"}`);
    parts.push(`Anzahl Verträge: ${m.quantity || 1}`);
    if (m.promoId && m.promoId !== "NONE") {
      parts.push(`Aktive Aktion: ${m.promoId}`);
    }
  }

  if (data.fixedNet?.enabled) {
    const fn = data.fixedNet;
    parts.push(`Festnetz: Aktiv (${fn.productId || fn.accessType || "Cable"})`);
  } else {
    parts.push("Festnetz: Nicht aktiv");
  }

  if (data.result) {
    parts.push("");
    parts.push("--- Berechnungsergebnis ---");
    if (data.result.totals) {
      const t = data.result.totals;
      parts.push(`Ø Monatspreis (Kunde): ${t.avgTermNet?.toFixed(2) || "0"}€`);
    }
    if (data.result.dealer) {
      const d = data.result.dealer;
      parts.push(`Provision: ${d.provisionTotal?.toFixed(2) || "0"}€`);
      parts.push(`Marge: ${d.marginTotal?.toFixed(2) || "0"}€`);
    }
    if (data.result.gkEligible !== undefined) {
      parts.push(`GigaKombi berechtigt: ${data.result.gkEligible ? "Ja" : "Nein"}`);
    }
  }

  return parts.join("\n");
}
