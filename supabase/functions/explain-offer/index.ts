// ============================================
// explain-offer – KI-Angebotserklärung für Kunden
// Erhält NUR kundenseitige Angebotsdaten (keine Marge/EK/Provision),
// streamt eine verständliche Erklärung über das Lovable AI Gateway.
// ============================================
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";


// --- Lovable AI Gateway run-ID helpers (inline) ---
const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";
function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    fetch: async (input: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(RUN_ID_HEADER)) headers.set(RUN_ID_HEADER, runId);
      const response = await fetch(input, { ...init, headers });
      runId ??= response.headers.get(RUN_ID_HEADER)?.trim() || undefined;
      return response;
    },
  };
}
function getLovableAiGatewayRunId(request: Request) {
  return request.headers.get(RUN_ID_HEADER)?.trim() || undefined;
}
function getLovableAiGatewayResponseHeaders(providerHeaders: Headers, init: Record<string, string>) {
  const headers = new Headers(init);
  const exposed = new Set((headers.get("Access-Control-Expose-Headers") ?? "").split(",").map((h) => h.trim()).filter(Boolean));
  providerHeaders.forEach((value, name) => {
    if (name.toLowerCase().startsWith("x-lovable-aig-")) { headers.set(name, value); exposed.add(name); }
  });
  if (exposed.size) headers.set("Access-Control-Expose-Headers", Array.from(exposed).join(", "));
  return headers;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};

const Line = z.object({ label: z.string().max(200), net: z.number() });
const BodySchema = z.object({
  customerName: z.string().max(120).optional(),
  customerType: z.string().max(60),
  tone: z.enum(["einfach", "ausfuehrlich"]),
  focus: z.array(z.enum(["kosten", "ersparnis", "vorteile"])).max(3),
  termMonths: z.number().int().min(1).max(60),
  avgMonthlyNet: z.number(),
  avgMonthlyGross: z.number(),
  totalTermNet: z.number(),
  totalTermGross: z.number(),
  oneTimeNet: z.number(),
  periods: z.array(z.object({ fromMonth: z.number(), toMonth: z.number(), monthlyNet: z.number() })).max(12),
  monthlyItems: z.array(Line).max(40),
  oneTimeItems: z.array(Line).max(20),
  products: z.object({
    hardware: z.string().max(120).optional(),
    mobileLines: z.number().int().min(0).max(500).optional(),
    fixedNet: z.boolean().optional(),
  }),
});

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const eur = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Bitte anmelden" }, 401);
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) return json({ error: "Bitte anmelden" }, 401);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Ungültige Anfrage" }, 400);
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return json({ error: "Ungültige Angebotsdaten", details: parsed.error.flatten().fieldErrors }, 400);
  const d = parsed.data;

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "KI ist nicht konfiguriert" }, 500);

  const facts = [
    d.customerName ? `Kunde: ${d.customerName}` : null,
    `Branche/Kundentyp: ${d.customerType}`,
    `Laufzeit: ${d.termMonths} Monate`,
    d.products.hardware ? `Gerät: ${d.products.hardware}` : null,
    d.products.mobileLines ? `Mobilfunkverträge: ${d.products.mobileLines}` : null,
    `Festnetz/Internet enthalten: ${d.products.fixedNet ? "ja" : "nein"}`,
    `Durchschnitt monatlich: ${eur(d.avgMonthlyNet)} netto / ${eur(d.avgMonthlyGross)} brutto`,
    `Einmalkosten: ${eur(d.oneTimeNet)} netto`,
    `Gesamt über Laufzeit: ${eur(d.totalTermNet)} netto / ${eur(d.totalTermGross)} brutto`,
    "Preisphasen:",
    ...d.periods.map((p) => `- Monat ${p.fromMonth}–${p.toMonth}: ${eur(p.monthlyNet)} netto/Monat`),
    "Monatliche Posten:",
    ...d.monthlyItems.map((i) => `- ${i.label}: ${eur(i.net)}`),
    "Einmalige Posten:",
    ...d.oneTimeItems.map((i) => `- ${i.label}: ${eur(i.net)}`),
  ].filter(Boolean).join("\n");

  const system = `Du bist ein freundlicher Telekommunikationsberater und erklärst einem Geschäftskunden sein Angebot auf Deutsch (Sie-Form).
Regeln:
- Verwende AUSSCHLIESSLICH die gelieferten Zahlen. Erfinde keine Preise, Rabatte, Tarifmerkmale, Datenvolumen oder Vergleichswerte.
- Erwähne niemals Händlermarge, Einkaufspreise oder Provisionen.
- Stil: ${d.tone === "einfach" ? "kurz, sehr einfache Sprache, max. ca. 150 Wörter" : "ausführlich aber verständlich, max. ca. 350 Wörter"}.
- Schwerpunkte: ${d.focus.length ? d.focus.join(", ") : "kosten, vorteile"}.
- Bezug zum Kundentyp herstellen (typischer Alltag), ohne Fakten zu erfinden.
- Gliederung in Markdown: kurze Einleitung, "Was Sie monatlich zahlen", "Einmalige Kosten", "Ihre Vorteile", Abschlusssatz.
- Hinweis am Ende: "Alle Preise netto zzgl. MwSt., sofern nicht anders angegeben."`;

  const gateway = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));
  try {
    const upstream = await gateway.fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      signal: req.signal,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: [
          { role: "system", content: system },
          { role: "user", content: `Angebotsdaten:\n${facts}\n\nBitte erstelle die Kundenerklärung.` },
        ],
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
      }),
    });

    if (!upstream.ok) {
      let message = "KI-Anfrage fehlgeschlagen";
      try {
        const err = await upstream.json();
        message = err?.error?.message ?? err?.message ?? message;
      } catch { /* ignore */ }
      if (upstream.status === 402) message = "KI-Guthaben aufgebraucht. Bitte unter Einstellungen → Pläne & Guthaben aufladen.";
      if (upstream.status === 429) message = "Zu viele Anfragen – bitte in einer Minute erneut versuchen.";
      console.warn("[explain-offer] upstream", upstream.status, message);
      return json({ error: message }, upstream.status);
    }

    const headers = getLovableAiGatewayResponseHeaders(upstream.headers, corsHeaders);
    headers.set("Content-Type", "text/event-stream");
    headers.set("Cache-Control", "no-store");
    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    if (req.signal.aborted) return new Response(null, { status: 499, headers: corsHeaders });
    console.error("[explain-offer] error", error instanceof Error ? error.message : error);
    return json({ error: "KI-Anfrage fehlgeschlagen" }, 500);
  }
});
