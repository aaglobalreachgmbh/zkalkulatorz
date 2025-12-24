import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// =============================================================================
// SECURITY: CORS Configuration
// =============================================================================
const ALLOWED_ORIGINS = [
  "https://lovable.dev",
  "https://www.lovable.dev",
  /^https:\/\/.*\.lovable\.app$/,
  "http://localhost:5173",
  "http://localhost:8080",
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  
  return ALLOWED_ORIGINS.some(allowed => {
    if (allowed instanceof RegExp) {
      return allowed.test(origin);
    }
    return allowed === origin;
  });
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = isOriginAllowed(origin) ? origin : "https://lovable.dev";
  return {
    "Access-Control-Allow-Origin": allowedOrigin!,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

// =============================================================================
// SECURITY: JWT Authentication
// =============================================================================
async function authenticateRequest(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    console.warn("No Authorization header");
    return null;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase credentials not configured");
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.warn("Invalid JWT:", error?.message);
    return null;
  }

  return { userId: user.id };
}

// =============================================================================
// SECURITY: Rate Limiting (In-Memory, per IP)
// =============================================================================
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX = 10; // Max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP;
  return "unknown";
}

function hashIP(ip: string): string {
  // Simple hash for logging (not cryptographic)
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).slice(0, 8);
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // Cleanup old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (val.resetAt < now) rateLimitMap.delete(key);
    }
  }

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

// =============================================================================
// SECURITY: Input Validation with Zod
// =============================================================================
const MessageSchema = z.string()
  .min(1, "Nachricht darf nicht leer sein")
  .max(1000, "Nachricht zu lang (max. 1000 Zeichen)")
  .transform(s => s.trim());

const HardwareConfigSchema = z.object({
  selectedId: z.string().optional(),
  ekNet: z.number().optional(),
}).optional();

const MobileConfigSchema = z.object({
  tariffId: z.string().optional(),
  subVariantId: z.string().optional(),
  contractType: z.string().optional(),
  quantity: z.number().optional(),
  promoId: z.string().optional(),
}).optional();

const FixedNetConfigSchema = z.object({
  enabled: z.boolean().optional(),
  productId: z.string().optional(),
  accessType: z.string().optional(),
}).optional();

const ConfigSchema = z.object({
  hardware: HardwareConfigSchema,
  mobile: MobileConfigSchema,
  fixedNet: FixedNetConfigSchema,
}).optional();

const ResultSchema = z.object({
  totals: z.any().optional(),
  dealer: z.any().optional(),
  gkEligible: z.boolean().optional(),
}).optional();

const RequestSchema = z.object({
  message: MessageSchema,
  config: ConfigSchema,
  result: ResultSchema,
});

// =============================================================================
// SECURITY: Input Sanitization (Prompt Injection Prevention)
// =============================================================================
function sanitizeUserInput(input: string): string {
  return input
    // Remove control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Neutralize common injection patterns
    .replace(/```/g, "'''")
    .replace(/\bsystem\s*:/gi, "[system]:")
    .replace(/\bassistant\s*:/gi, "[assistant]:")
    .replace(/\buser\s*:/gi, "[user]:")
    // Limit consecutive whitespace
    .replace(/\s{10,}/g, "   ")
    .trim();
}

// =============================================================================
// SECURITY: Safe Error Response (No Stack Traces)
// =============================================================================
function createErrorResponse(
  message: string,
  status: number,
  corsHeaders: Record<string, string>,
  requestId: string
): Response {
  console.error(`[${requestId}] Error ${status}: ${message}`);
  
  // Generic messages for client
  const clientMessages: Record<number, string> = {
    400: "Ungültige Anfrage. Bitte überprüfe deine Eingabe.",
    429: "Zu viele Anfragen. Bitte warte einen Moment.",
    402: "AI-Guthaben aufgebraucht.",
    500: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
  };

  return new Response(
    JSON.stringify({ 
      error: clientMessages[status] || message,
      requestId 
    }),
    { 
      status, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}

// =============================================================================
// Main Handler
// =============================================================================
serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const clientIP = getClientIP(req);
  const hashedIP = hashIP(clientIP);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, corsHeaders, requestId);
  }

  try {
    // SECURITY: Authenticate user (JWT validation)
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      console.warn(`[${requestId}] Unauthorized request from IP: ${hashedIP}`);
      return new Response(
        JSON.stringify({ error: "Nicht autorisiert. Bitte melde dich an.", requestId }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Check rate limit (per user now, not IP)
    const rateCheck = checkRateLimit(authResult.userId);
    if (!rateCheck.allowed) {
      console.warn(`[${requestId}] Rate limit exceeded for user: ${authResult.userId.slice(0, 8)}`);
      return new Response(
        JSON.stringify({ 
          error: "Zu viele Anfragen. Bitte warte einen Moment.",
          requestId 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateCheck.retryAfter || 60)
          } 
        }
      );
    }

    // SECURITY: Check request size (max 10KB)
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 10240) {
      return createErrorResponse("Request too large", 400, corsHeaders, requestId);
    }

    // Parse and validate input
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Ungültige Eingabe";
      console.warn(`[${requestId}] Validation failed: ${errorMsg}`);
      return createErrorResponse(errorMsg, 400, corsHeaders, requestId);
    }

    const { message, config, result } = parseResult.data;

    // SECURITY: Sanitize user message
    const sanitizedMessage = sanitizeUserInput(message);
    if (sanitizedMessage.length === 0) {
      return createErrorResponse("Nachricht darf nicht leer sein", 400, corsHeaders, requestId);
    }

    // Check API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error(`[${requestId}] LOVABLE_API_KEY not configured`);
      return createErrorResponse("AI service not configured", 500, corsHeaders, requestId);
    }

    // Build context
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

    console.log(`[${requestId}] Calling AI Gateway (IP: ${hashedIP})`);

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
          { role: "user", content: sanitizedMessage },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error(`[${requestId}] AI Gateway error: ${status}`);
      
      if (status === 429) {
        return createErrorResponse("Rate limit exceeded", 429, corsHeaders, requestId);
      }
      if (status === 402) {
        return createErrorResponse("Payment required", 402, corsHeaders, requestId);
      }
      return createErrorResponse("AI service error", 500, corsHeaders, requestId);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Keine Antwort erhalten.";

    console.log(`[${requestId}] Success`);

    return new Response(
      JSON.stringify({ response: aiResponse, requestId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, error instanceof Error ? error.message : "Unknown");
    return createErrorResponse("Internal error", 500, corsHeaders, requestId);
  }
});

// =============================================================================
// Context Builder
// =============================================================================
function buildContext(config: any, result: any): string {
  const parts: string[] = [];

  if (config?.hardware) {
    const hw = config.hardware;
    if (hw.selectedId === "SIM_ONLY") {
      parts.push("Hardware: SIM-Only (kein Gerät)");
    } else if (hw.selectedId) {
      parts.push(`Hardware: ${hw.selectedId}, EK: ${hw.ekNet?.toFixed(2) || "0"}€`);
    }
  }

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

  if (config?.fixedNet?.enabled) {
    const fn = config.fixedNet;
    parts.push(`Festnetz: ${fn.productId || "aktiv"} (${fn.accessType || "Cable"})`);
  } else {
    parts.push("Festnetz: nicht aktiv");
  }

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
