import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    const { message, config, result } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context from current configuration
    const context = buildContext(config, result);

    const systemPrompt = `Du bist ein Experte für Vodafone Business Tarife und Margenkalkulation. 
Du hilfst Vertriebsmitarbeitern, ihre Angebote zu optimieren und die Marge zu verbessern.

Aktuelle Konfiguration des Nutzers:
${context}

Wichtige Regeln:
- Antworte immer auf Deutsch
- Sei präzise und praxisorientiert
- Wenn die Marge negativ ist, schlage konkrete Alternativen vor (z.B. andere Tarife, SIM-Only statt Hardware)
- Erkläre die Auswirkungen von Promos auf die Provision
- Berücksichtige GigaKombi-Vorteile wenn Festnetz aktiv ist
- Halte deine Antworten kurz und übersichtlich (max. 3-4 Sätze)
- Verwende Zahlen und konkrete Beispiele wenn möglich`;

    console.log("Calling Lovable AI Gateway...");

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
          { role: "user", content: message },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Keine Antwort erhalten.";

    console.log("AI response received successfully");

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-consultant function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildContext(config: any, result: any): string {
  const parts: string[] = [];

  // Hardware
  if (config?.hardware) {
    const hw = config.hardware;
    if (hw.selectedId === "SIM_ONLY") {
      parts.push("Hardware: SIM-Only (kein Gerät)");
    } else if (hw.selectedId) {
      parts.push(`Hardware: ${hw.selectedId}, EK: ${hw.ekNet?.toFixed(2) || "0"}€`);
    }
  }

  // Mobile
  if (config?.mobile) {
    const m = config.mobile;
    parts.push(`Tarif: ${m.tariffId || "nicht gewählt"}`);
    parts.push(`SUB-Variante: ${m.subVariantId || "nicht gewählt"}`);
    parts.push(`Vertragsart: ${m.contractType || "Neuvertrag"}`);
    parts.push(`Anzahl Verträge: ${m.quantity || 1}`);
    if (m.promoId && m.promoId !== "NONE") {
      parts.push(`Aktion: ${m.promoId}`);
    }
  }

  // FixedNet
  if (config?.fixedNet?.enabled) {
    const fn = config.fixedNet;
    parts.push(`Festnetz: ${fn.productId || "aktiv"} (${fn.accessType || "Cable"})`);
  } else {
    parts.push("Festnetz: nicht aktiv");
  }

  // Results
  if (result) {
    parts.push("");
    parts.push("--- Berechnungsergebnis ---");
    if (result.totals) {
      parts.push(`Ø Monatspreis (Kunde, netto): ${result.totals.avgTermNet?.toFixed(2) || "0"}€`);
      parts.push(`Gesamt 24 Monate (brutto): ${result.totals.totalTermGross?.toFixed(2) || "0"}€`);
    }
    if (result.dealer) {
      parts.push(`Provision gesamt: ${result.dealer.provisionTotal?.toFixed(2) || "0"}€`);
      parts.push(`Marge: ${result.dealer.marginTotal?.toFixed(2) || "0"}€`);
    }
    if (result.gkEligible !== undefined) {
      parts.push(`GigaKombi berechtigt: ${result.gkEligible ? "Ja" : "Nein"}`);
    }
  }

  return parts.join("\n");
}
