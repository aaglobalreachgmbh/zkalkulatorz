// ============================================
// Rate Limiter Edge Function
// Phase C1: Supabase-based Rate Limiting
// ============================================

import { clientOrigin, enforceRateLimit, privateHash, requestTooLarge } from "./requestSecurity.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit configurations per category
const RATE_LIMITS: Record<string, { maxRequests: number; windowSeconds: number }> = {
  api: { maxRequests: 100, windowSeconds: 60 },
  ai: { maxRequests: 10, windowSeconds: 60 },
  login: { maxRequests: 5, windowSeconds: 300 },
  upload: { maxRequests: 20, windowSeconds: 60 },
  pdf: { maxRequests: 30, windowSeconds: 60 },
  calculation: { maxRequests: 200, windowSeconds: 60 },
};

interface RateLimitRequest { category: string; action: "check"; }

interface RateLimitResponse {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  category: string;
  error?: string;
}

/**
 * Hash an identifier (IP address) for privacy
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return new Response(JSON.stringify({ allowed: false, error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (requestTooLarge(req, 2048)) return new Response(JSON.stringify({ allowed: false, error: "Payload too large" }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    // Parse request
    const body: RateLimitRequest = await req.json().catch(() => ({}));
    const { category = "api", action = "check" } = body;
    if (action !== "check") return new Response(JSON.stringify({ allowed: false, error: "Action not available" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Validate category
    const limits = RATE_LIMITS[category];
    if (!limits) {
      console.warn(`[RateLimiter] Unknown category: ${category}`);
      return new Response(
        JSON.stringify({ 
          allowed: false,
          remaining: 0,
          resetAt: new Date().toISOString(),
          category,
          error: "Unknown category"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get client identifier
    const keyHash = await privateHash(clientOrigin(req), `rate:${category}`);

    console.log(`[RateLimiter] ${action} for ${category}, key: ${keyHash.slice(0, 8)}...`);

    const rate = await enforceRateLimit(keyHash, category, limits.maxRequests, limits.windowSeconds);
    const remaining = rate.remaining;

    const allowed = rate.allowed;
    const resetAt = new Date(Date.now() + limits.windowSeconds * 1000).toISOString();

    const response: RateLimitResponse = {
      allowed,
      remaining: Math.max(0, remaining),
      resetAt,
      category,
    };

    // Log rate limit hits
    if (!allowed) {
      console.warn(`[RateLimiter] Rate limit exceeded for ${category}, key: ${keyHash.slice(0, 8)}...`);
      
      // Log to security_events
      await supabase.from("security_events").insert({
        event_type: "rate_limited",
        risk_level: "medium",
        ip_hash: keyHash,
        details: { category, remaining },
      });
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: allowed ? 200 : 429, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": String(Math.max(0, remaining)),
          "X-RateLimit-Reset": resetAt,
        } 
      }
    );

  } catch (error) {
    console.error("[RateLimiter] Error:", error);
    
    // Fail closed: an unavailable limiter must not silently disable protection.
    return new Response(
      JSON.stringify({ 
        allowed: false,
        remaining: 0,
        resetAt: new Date().toISOString(),
        category: "unknown",
        error: "Rate limit unavailable"
      }),
      { 
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
