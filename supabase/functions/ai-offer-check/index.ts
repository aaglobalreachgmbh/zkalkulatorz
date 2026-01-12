import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// =============================================================================
// AI Offer Check - Intelligente Verkaufsargumente (Modul 3: KI-Experte)
// Analysiert Angebote und gibt hochspezifische, datengestützte Empfehlungen
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store",
};

// Extended Input validation with margin data
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
    isSOHO: z.boolean().optional(),
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
  // New: Margin waterfall data
  marginData: z.object({
    netMarginTotal: z.number().optional(),
    marginPerContract: z.number().optional(),
    profitabilityStatus: z.string().optional(),
    airtimeProvisionTotal: z.number().optional(),
    oneTimeProvisionTotal: z.number().optional(),
    hardwareProvisionTotal: z.number().optional(),
    hardwareEKTotal: z.number().optional(),
  }).optional(),
  // New: Upsell recommendations from local engine
  localRecommendations: z.array(z.object({
    type: z.string(),
    title: z.string(),
    description: z.string(),
    potentialMarginGain: z.number(),
  })).optional(),
});

// ============================================
// VODAFONE BUSINESS KNOWLEDGE BASE
// ============================================

const VODAFONE_KNOWLEDGE = `
Du bist ein Vodafone Business Sales Expert. Deine Aufgabe ist es, Angebote zu analysieren 
und dem Vertriebsmitarbeiter hochwertige, konkrete Verkaufsargumente zu geben.

═══════════════════════════════════════════════════════════════
VODAFONE TARIF-MATRIX (Business)
═══════════════════════════════════════════════════════════════

PRIME BUSINESS (Haupttarife):
┌─────────┬─────────┬─────────┬───────────┬───────────────────┐
│ Tarif   │ Preis   │ Daten   │ Sub-Stufe │ Prov. (Neuvertrag)│
├─────────┼─────────┼─────────┼───────────┼───────────────────┤
│ Prime S │ 29€/Mon │ 2 GB    │ 1         │ ~250€             │
│ Prime M │ 39€/Mon │ 5 GB    │ 2         │ ~350€             │
│ Prime L │ 49€/Mon │ 10 GB   │ 3         │ ~450€             │
│ Prime XL│ 59€/Mon │ 20 GB   │ 4         │ ~550€             │
└─────────┴─────────┴─────────┴───────────┴───────────────────┘

GIGAMOBIL BUSINESS:
┌─────────────┬─────────┬─────────┬───────────┬───────────────────┐
│ Tarif       │ Preis   │ Daten   │ Sub-Stufe │ Prov. (Neuvertrag)│
├─────────────┼─────────┼─────────┼───────────┼───────────────────┤
│ GigaMobil S │ 35€/Mon │ 10 GB   │ 2         │ ~300€             │
│ GigaMobil M │ 45€/Mon │ 20 GB   │ 3         │ ~400€             │
│ GigaMobil L │ 55€/Mon │ 50 GB   │ 4         │ ~500€             │
│ GigaMobil XL│ 65€/Mon │ Unl.    │ 5         │ ~600€             │
└─────────────┴─────────┴─────────┴───────────┴───────────────────┘

═══════════════════════════════════════════════════════════════
HARDWARE-SUBVENTIONEN nach Sub-Stufe
═══════════════════════════════════════════════════════════════

┌───────────┬────────────────┬───────────────┬─────────────────────┐
│ Sub-Stufe │ Subvention 24M │ Subvention 36M│ Provision (25%)     │
├───────────┼────────────────┼───────────────┼─────────────────────┤
│ 1         │ 25€            │ 50€           │ 6,25€ / 12,50€      │
│ 2         │ 50€            │ 100€          │ 12,50€ / 25€        │
│ 3         │ 100€           │ 200€          │ 25€ / 50€           │
│ 4         │ 150€           │ 300€          │ 37,50€ / 75€        │
│ 5         │ 200€           │ 400€          │ 50€ / 100€          │
└───────────┴────────────────┴───────────────┴─────────────────────┘

═══════════════════════════════════════════════════════════════
TEAMDEAL-STAFFELN (Rabatt auf Monatspreis)
═══════════════════════════════════════════════════════════════

┌──────────────────┬─────────┬─────────────────────────────────┐
│ Anzahl Verträge  │ Rabatt  │ Verkaufsargument                │
├──────────────────┼─────────┼─────────────────────────────────┤
│ 1 Vertrag        │ 0%      │ -                               │
│ 2-4 Verträge     │ 5%      │ "Bereits ab 2 Verträgen sparen" │
│ 5-9 Verträge     │ 10%     │ "10% für kleine Teams"          │
│ 10-19 Verträge   │ 15%     │ "15% für mittlere Unternehmen"  │
│ 20+ Verträge     │ 20%     │ "Maximaler Mengenrabatt"        │
└──────────────────┴─────────┴─────────────────────────────────┘

═══════════════════════════════════════════════════════════════
GIGAKOMBI BUSINESS (Festnetz + Mobilfunk)
═══════════════════════════════════════════════════════════════

┌──────────────────┬─────────┬─────────────────────────────────┐
│ Anzahl Verträge  │ Rabatt  │ Verkaufsargument                │
├──────────────────┼─────────┼─────────────────────────────────┤
│ 1-4 Verträge     │ 5€/Mon  │ "120€ sparen über 24 Monate"    │
│ 5+ Verträge      │ 10€/Mon │ "240€ sparen über 24 Monate"    │
└──────────────────┴─────────┴─────────────────────────────────┘

SOHO-VORTEIL (Small Office / Home Office):
- Für Einzelunternehmer/Freiberufler: 10% Extra-Rabatt auf Airtime
- Nachweis: Gewerbeanmeldung oder Steuernummer

═══════════════════════════════════════════════════════════════
PROVISIONS-STRUKTUR (Airtime)
═══════════════════════════════════════════════════════════════

Die Airtime-Provision ist der wichtigste Margen-Hebel:
- Rate: Ca. 10% des Tarifpreises × Laufzeit
- Beispiel Prime M: 39€ × 10% × 24 Monate = 93,60€ pro Vertrag
- Bei 3 Verträgen: 280,80€ Airtime-Provision

Neuvertrag vs. Verlängerung:
- Neuvertrag: 100% Provision
- Verlängerung: 50% Provision

═══════════════════════════════════════════════════════════════
ANALYSE-KRITERIEN (Priorisiert nach Wichtigkeit)
═══════════════════════════════════════════════════════════════

1. MARGE-CHECK (KRITISCH):
   - Positiv (> 50€/Vertrag): ✅ Verkaufen
   - Gering (0-50€/Vertrag): ⚠️ Optimieren
   - Negativ (< 0€): ❌ Nicht verkaufen ohne Änderung

2. HARDWARE-OPTIMIERUNG (SCHNELLSTER HEBEL):
   - iPhone 15 Pro (EK ~800€) → Samsung S24 (EK ~600€) = +200€ Marge
   - SIM-Only = 0€ Hardware-Kosten = Maximum Marge

3. TARIF-UPGRADE (MITTELFRISTIG):
   - Prime M → Prime L: +100€ Provision, +10€ Kundenpreis
   - Höhere Sub-Stufe = höhere Hardware-Subvention

4. TEAMDEAL-POTENZIAL (LANGFRISTIG):
   - 3 → 5 Verträge: +5% Rabatt für Kunden, mehr Provision für Händler
   - Frage: "Haben Sie noch Mitarbeiter, die einen Vertrag brauchen?"

5. GIGAKOMBI (KUNDENBINDUNG):
   - Mit Festnetz: 5-10€/Monat Ersparnis für Kunden
   - Höhere Kundenbindung = geringere Abwanderung

6. SOHO-CHECK (NISCHEN-VORTEIL):
   - Nur für Einzelunternehmer/Freiberufler
   - 10% Extra = ca. 4€/Monat bei Prime M = 96€ über 24 Monate

═══════════════════════════════════════════════════════════════
ANTWORTFORMAT (STRIKT JSON)
═══════════════════════════════════════════════════════════════

{
  "overallScore": "good" | "warning" | "critical",
  "marginStatus": {
    "status": "positive" | "negative" | "low",
    "amount": number (Gesamt-Marge in €),
    "perContract": number (Marge pro Vertrag in €),
    "message": "Konkrete, kurze Aussage zur Marge"
  },
  "suggestions": [
    {
      "type": "hardware" | "tariff_upgrade" | "gigakombi" | "teamdeal" | "soho" | "sim_only",
      "priority": "high" | "medium" | "low",
      "title": "Konkrete, aktionsorientierte Überschrift",
      "description": "Begründung MIT ZAHLEN (z.B. '+120€ Marge')",
      "potentialGain": number (geschätzter Margen-Gewinn in €),
      "estimatedTime": "< 1 Minute" | "1-5 Minuten" | "> 5 Minuten",
      "actionSteps": ["Schritt 1", "Schritt 2", "Schritt 3"]
    }
  ],
  "summary": "1-2 Sätze mit der WICHTIGSTEN Empfehlung und konkreten Zahlen"
}

═══════════════════════════════════════════════════════════════
BEISPIEL-EMPFEHLUNGEN (als Vorlage)
═══════════════════════════════════════════════════════════════

HARDWARE (Schnellster Hebel):
{
  "type": "hardware",
  "priority": "high",
  "title": "Samsung Galaxy S24 statt iPhone 15 Pro",
  "description": "EK-Ersparnis: 200€ direkt auf die Marge. Beide Geräte sind Premium-Qualität.",
  "potentialGain": 200,
  "estimatedTime": "< 1 Minute",
  "actionSteps": [
    "Kunde nach Gerätepräferenz fragen",
    "Samsung S24 als gleichwertige Alternative präsentieren",
    "Auf vergleichbare Features hinweisen (Kamera, Display)"
  ]
}

SIM-ONLY (Bei kritischer Marge):
{
  "type": "sim_only",
  "priority": "high",
  "title": "SIM-Only anbieten",
  "description": "Ohne Hardware beträgt die Marge +350€ statt -120€. Kunde kann eigenes Gerät nutzen.",
  "potentialGain": 470,
  "estimatedTime": "< 1 Minute",
  "actionSteps": [
    "Fragen ob Kunde bereits ein geeignetes Smartphone hat",
    "Auf Bring-Your-Own-Device (BYOD) hinweisen",
    "Alternative: Ratenkauf über Drittanbieter anbieten"
  ]
}

GIGAKOMBI (Kundenbindung):
{
  "type": "gigakombi",
  "priority": "medium",
  "title": "GigaKombi aktivieren - 120€ Ersparnis für Kunden",
  "description": "Mit Festnetz spart der Kunde 5€/Monat = 120€ über 24 Monate. Stärkt Kundenbeziehung.",
  "potentialGain": 30,
  "estimatedTime": "1-5 Minuten",
  "actionSteps": [
    "Festnetz-Situation des Kunden erfragen",
    "Vodafone Business-Festnetz-Produkte vorstellen",
    "GigaKombi-Rabatt als Bonus hervorheben"
  ]
}

TEAMDEAL (Mehr Verträge):
{
  "type": "teamdeal",
  "priority": "medium",
  "title": "2 weitere Verträge = 10% TeamDeal",
  "description": "Bei 5 statt 3 Verträgen: 10% statt 5% Rabatt. Kunde spart, Sie verdienen mehr.",
  "potentialGain": 60,
  "estimatedTime": "> 5 Minuten",
  "actionSteps": [
    "Fragen: 'Haben Sie noch Mitarbeiter, die einen Vertrag brauchen?'",
    "TeamDeal-Vorteile erklären (Rabattstaffel)",
    "Angebot für erweiterte Vertragsanzahl erstellen"
  ]
}

═══════════════════════════════════════════════════════════════
WICHTIGE REGELN
═══════════════════════════════════════════════════════════════

1. IMMER konkrete Zahlen nennen ("+120€", "200€ sparen")
2. NIEMALS unrealistische Empfehlungen (z.B. "Tarif kündigen")
3. PRIORISIERE nach Umsetzungsgeschwindigkeit (Quick Wins zuerst)
4. MAXIMAL 4 Empfehlungen, sortiert nach Potenzial
5. Antworte NUR mit dem JSON, keine Erklärungen davor oder danach
`;

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
      console.error("Validation error:", parseResult.error);
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, ...SECURITY_HEADERS, "Content-Type": "application/json" },
      });
    }

    const offerData = parseResult.data;
    
    // Build detailed analysis context
    const context = buildOfferContext(offerData);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, ...SECURITY_HEADERS, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `${VODAFONE_KNOWLEDGE}

═══════════════════════════════════════════════════════════════
AKTUELLES ANGEBOT ZUR ANALYSE
═══════════════════════════════════════════════════════════════

${context}

Analysiere dieses Angebot und gib strukturierte, zahlenbasierte Optimierungsvorschläge.`;

    console.log("Calling AI with context:", context.slice(0, 500) + "...");

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
          { role: "user", content: "Analysiere dieses Angebot und gib konkrete, zahlenbasierte Optimierungsvorschläge im JSON-Format." },
        ],
        max_tokens: 1500,
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
    const aiResponse = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response received:", aiResponse.slice(0, 300) + "...");
    
    // Parse JSON from response
    try {
      // Extract JSON from response (may have markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysisResult = JSON.parse(jsonMatch[0]);
        
        // Validate and enhance the result
        const enhancedResult = {
          overallScore: analysisResult.overallScore || "warning",
          marginStatus: {
            status: analysisResult.marginStatus?.status || "low",
            amount: analysisResult.marginStatus?.amount || 0,
            perContract: analysisResult.marginStatus?.perContract || 0,
            message: analysisResult.marginStatus?.message || "Analyse abgeschlossen",
          },
          suggestions: (analysisResult.suggestions || []).map((s: any, i: number) => ({
            type: s.type || "hardware",
            priority: s.priority || (i === 0 ? "high" : i === 1 ? "medium" : "low"),
            title: s.title || "Optimierung möglich",
            description: s.description || "",
            potentialGain: typeof s.potentialGain === "number" ? s.potentialGain : 0,
            estimatedTime: s.estimatedTime || "1-5 Minuten",
            actionSteps: s.actionSteps || [],
          })),
          summary: analysisResult.summary || "Angebot wurde analysiert.",
        };
        
        return new Response(JSON.stringify({ analysis: enhancedResult }), {
          headers: { ...corsHeaders, ...SECURITY_HEADERS, "Content-Type": "application/json" },
        });
      }
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", e, "Response:", aiResponse);
    }

    // Fallback if JSON parsing fails
    return new Response(JSON.stringify({ 
      analysis: {
        overallScore: "warning",
        marginStatus: { 
          status: "low", 
          amount: 0, 
          perContract: 0,
          message: "KI-Analyse konnte nicht vollständig ausgeführt werden" 
        },
        suggestions: [],
        summary: "Bitte versuchen Sie es erneut."
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

  // Hardware Section
  parts.push("HARDWARE:");
  if (data.hardware) {
    const hw = data.hardware;
    if (hw.selectedId === "SIM_ONLY") {
      parts.push("  • Typ: SIM-Only (kein Gerät)");
      parts.push("  • Hardware-EK: 0€");
    } else if (hw.selectedId) {
      parts.push(`  • Gerät: ${hw.brand || ""} ${hw.model || hw.selectedId}`);
      parts.push(`  • Hardware-EK: ${hw.ekNet?.toFixed(2) || "0"}€`);
    }
  } else {
    parts.push("  • Nicht gewählt");
  }

  // Mobile Section
  parts.push("");
  parts.push("MOBILFUNK:");
  if (data.mobile) {
    const m = data.mobile;
    parts.push(`  • Tarif: ${m.tariffName || m.tariffId || "nicht gewählt"}`);
    parts.push(`  • SUB-Variante: ${m.subVariantId || "Standard"}`);
    parts.push(`  • Vertragsart: ${m.contractType === "renewal" ? "Verlängerung" : "Neuvertrag"}`);
    parts.push(`  • Anzahl Verträge: ${m.quantity || 1}`);
    parts.push(`  • SOHO: ${m.isSOHO ? "Ja" : "Nein"}`);
    if (m.promoId && m.promoId !== "NONE") {
      parts.push(`  • Aktive Aktion: ${m.promoId}`);
    }
  }

  // Fixed Net Section
  parts.push("");
  parts.push("FESTNETZ:");
  if (data.fixedNet?.enabled) {
    const fn = data.fixedNet;
    parts.push(`  • Status: Aktiv`);
    parts.push(`  • Produkt: ${fn.productId || fn.accessType || "Cable"}`);
    parts.push(`  • GigaKombi: Berechtigt ✓`);
  } else {
    parts.push("  • Status: Nicht aktiv");
    parts.push("  • GigaKombi: Nicht berechtigt ✗");
  }

  // Calculation Results
  if (data.result || data.marginData) {
    parts.push("");
    parts.push("═══════════════════════════════════════════════════════════════");
    parts.push("BERECHNUNGSERGEBNIS:");
    parts.push("═══════════════════════════════════════════════════════════════");
    
    if (data.result?.totals) {
      const t = data.result.totals;
      parts.push(`  • Ø Monatspreis (Kunde): ${t.avgTermNet?.toFixed(2) || "0"}€`);
    }
    
    if (data.marginData) {
      const md = data.marginData;
      parts.push("");
      parts.push("MARGEN-ANALYSE:");
      parts.push(`  • Netto-Marge gesamt: ${md.netMarginTotal?.toFixed(2) || "0"}€`);
      parts.push(`  • Marge pro Vertrag: ${md.marginPerContract?.toFixed(2) || "0"}€`);
      parts.push(`  • Status: ${md.profitabilityStatus === "positive" ? "✅ POSITIV" : md.profitabilityStatus === "warning" ? "⚠️ GERING" : "❌ KRITISCH"}`);
      parts.push("");
      parts.push("MARGEN-AUFSCHLÜSSELUNG:");
      parts.push(`  • Airtime-Provision: +${md.airtimeProvisionTotal?.toFixed(2) || "0"}€`);
      parts.push(`  • Einmal-Provision: +${md.oneTimeProvisionTotal?.toFixed(2) || "0"}€`);
      parts.push(`  • Hardware-Provision: +${md.hardwareProvisionTotal?.toFixed(2) || "0"}€`);
      parts.push(`  • Hardware-EK: -${md.hardwareEKTotal?.toFixed(2) || "0"}€`);
    } else if (data.result?.dealer) {
      const d = data.result.dealer;
      parts.push(`  • Provision: ${d.provisionTotal?.toFixed(2) || "0"}€`);
      parts.push(`  • Marge: ${d.marginTotal?.toFixed(2) || "0"}€`);
    }
  }

  // Local Recommendations (from upsell engine)
  if (data.localRecommendations && data.localRecommendations.length > 0) {
    parts.push("");
    parts.push("LOKALE ENGINE-EMPFEHLUNGEN (zur Referenz):");
    data.localRecommendations.slice(0, 3).forEach((rec, i) => {
      parts.push(`  ${i + 1}. ${rec.title} (+${rec.potentialMarginGain.toFixed(0)}€)`);
    });
  }

  return parts.join("\n");
}
