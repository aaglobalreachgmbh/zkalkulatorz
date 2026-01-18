import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { headers, sampleRows, totalRows } = await req.json();

    if (!headers || !Array.isArray(headers)) {
      throw new Error("Missing or invalid headers");
    }

    if (!LOVABLE_API_KEY) {
      console.log("LOVABLE_API_KEY not configured, using heuristic analysis");
      // Fallback to heuristic analysis
      const result = heuristicAnalysis(headers, sampleRows || []);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt for AI
    const systemPrompt = `Du bist ein Datenanalyse-Assistent für einen Mobilfunk-Kalkulator.
Analysiere die Spaltenüberschriften und Beispieldaten und bestimme:
1. dataType: "hardware" (Gerätepreise), "provision" (Tarif-Provisionen), "promo" (Aktionen/Rabatte), oder "unknown"
2. confidence: Wie sicher bist du (0.0-1.0)?
3. columnMapping: Ordne die Quell-Spalten den Ziel-Feldern zu

Für Hardware (Geräte EK-Preise):
- hardware_id: Artikel-ID, SKU
- brand: Marke, Hersteller
- model: Modell, Gerätename
- ek_net: EK-Preis, Einkaufspreis
- category: Kategorie (smartphone, tablet, etc.)

Für Provisionen (Tarif-Vergütungen):
- tariff_id: Tarif-ID
- tariff_name: Tarifname
- provision_amount: Provision, Vergütung
- contract_type: Vertragsart (new/extension)
- sub_variant_id: Variante

Für Aktionen (Rabatte):
- promo_id: Aktions-ID
- promo_name: Aktionsname
- discount_type: Rabattart
- discount_value: Rabattwert

Antworte NUR mit einem JSON-Objekt, keine Erklärungen.`;

    const userPrompt = `Spaltenüberschriften: ${JSON.stringify(headers)}

Beispieldaten (erste 3 Zeilen):
${JSON.stringify(sampleRows?.slice(0, 3), null, 2)}

Gesamtzeilen: ${totalRows}

Analysiere diese Daten und gib ein JSON zurück mit:
{
  "dataType": "hardware" | "provision" | "promo" | "unknown",
  "confidence": 0.0-1.0,
  "columnMapping": { "Quell-Spalte": "ziel_feld", ... },
  "warnings": ["Warnung 1", ...],
  "suggestions": ["Vorschlag 1", ...]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      // Fallback to heuristic
      const result = heuristicAnalysis(headers, sampleRows || []);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    let parsed;
    try {
      // Extract JSON from markdown code block if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1] || content);
    } catch {
      console.error("Failed to parse AI response:", content);
      const result = heuristicAnalysis(headers, sampleRows || []);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in ai-data-import:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        dataType: "unknown",
        confidence: 0,
        columnMapping: {},
        warnings: ["Analyse fehlgeschlagen"],
        suggestions: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

// Fallback heuristic analysis
function heuristicAnalysis(headers: string[], sampleRows: unknown[]): {
  dataType: string;
  confidence: number;
  columnMapping: Record<string, string>;
  warnings: string[];
  suggestions: string[];
} {
  const normalizedHeaders = headers.map(h => String(h).toLowerCase().trim());
  
  // Hardware indicators
  const hardwareIndicators = ["ek", "einkauf", "brand", "marke", "model", "modell", "hardware", "gerät", "hersteller"];
  const hardwareScore = hardwareIndicators.filter(ind => 
    normalizedHeaders.some(h => h.includes(ind))
  ).length;
  
  // Provision indicators
  const provisionIndicators = ["provision", "tarif", "provi", "vergütung", "commission", "prov"];
  const provisionScore = provisionIndicators.filter(ind => 
    normalizedHeaders.some(h => h.includes(ind))
  ).length;
  
  // Promo indicators
  const promoIndicators = ["aktion", "rabatt", "promo", "discount", "kampagne"];
  const promoScore = promoIndicators.filter(ind => 
    normalizedHeaders.some(h => h.includes(ind))
  ).length;
  
  let dataType = "unknown";
  let confidence = 0.5;
  const columnMapping: Record<string, string> = {};
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  if (hardwareScore >= provisionScore && hardwareScore >= promoScore && hardwareScore > 0) {
    dataType = "hardware";
    confidence = Math.min(0.9, 0.5 + hardwareScore * 0.1);
    
    headers.forEach(h => {
      const lower = h.toLowerCase();
      if (lower.includes("brand") || lower.includes("marke") || lower.includes("hersteller")) {
        columnMapping[h] = "brand";
      } else if (lower.includes("model") || lower.includes("gerät") || lower.includes("bezeichnung")) {
        columnMapping[h] = "model";
      } else if (lower.includes("ek") || lower.includes("einkauf") || lower.includes("preis")) {
        columnMapping[h] = "ek_net";
      } else if (lower.includes("id") || lower.includes("artikel") || lower.includes("sku")) {
        columnMapping[h] = "hardware_id";
      } else if (lower.includes("kategorie") || lower.includes("category") || lower.includes("typ")) {
        columnMapping[h] = "category";
      }
    });
  } else if (provisionScore >= promoScore && provisionScore > 0) {
    dataType = "provision";
    confidence = Math.min(0.9, 0.5 + provisionScore * 0.1);
    
    headers.forEach(h => {
      const lower = h.toLowerCase();
      if (lower.includes("tarif") && !lower.includes("id")) {
        columnMapping[h] = "tariff_name";
      } else if (lower.includes("tarif") && lower.includes("id")) {
        columnMapping[h] = "tariff_id";
      } else if (lower.includes("provision") || lower.includes("provi") || lower.includes("vergütung")) {
        columnMapping[h] = "provision_amount";
      } else if (lower.includes("typ") || lower.includes("vertrags")) {
        columnMapping[h] = "contract_type";
      }
    });
  } else if (promoScore > 0) {
    dataType = "promo";
    confidence = Math.min(0.9, 0.5 + promoScore * 0.1);
  }
  
  if (dataType === "unknown") {
    warnings.push("Dateityp konnte nicht automatisch erkannt werden.");
    suggestions.push("Bitte prüfe, ob die Spaltenüberschriften eindeutig sind (z.B. 'Marke', 'EK-Preis').");
  }
  
  if (Object.keys(columnMapping).length === 0 && dataType !== "unknown") {
    warnings.push("Spalten-Zuordnung konnte nicht vollständig ermittelt werden.");
  }
  
  return {
    dataType,
    confidence,
    columnMapping,
    warnings,
    suggestions,
  };
}
