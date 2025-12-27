// ============================================
// Rate Limiter Edge Function
// Phase C1: Supabase-based Rate Limiting
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

interface RateLimitRequest {
  category: string;
  action: "check" | "status" | "cleanup";
  identifier?: string; // Optional: custom identifier (default: IP hash)
}

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
async function hashIdentifier(identifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(identifier + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.slice(0, 16));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(req: Request): string {
  // Try various headers for client IP
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfIp = req.headers.get("cf-connecting-ip");
  
  return forwarded?.split(",")[0]?.trim() || realIp || cfIp || "unknown";
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Parse request
    const body: RateLimitRequest = await req.json().catch(() => ({}));
    const { category = "api", action = "check", identifier } = body;

    // Validate category
    const limits = RATE_LIMITS[category];
    if (!limits) {
      console.warn(`[RateLimiter] Unknown category: ${category}`);
      return new Response(
        JSON.stringify({ 
          allowed: true, 
          remaining: 999, 
          resetAt: new Date().toISOString(),
          category,
          error: "Unknown category, allowing request" 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get client identifier
    const clientId = identifier || getClientIdentifier(req);
    const keyHash = await hashIdentifier(clientId);

    console.log(`[RateLimiter] ${action} for ${category}, key: ${keyHash.slice(0, 8)}...`);

    // Handle different actions
    if (action === "cleanup") {
      // Cleanup old entries (should be called periodically)
      const { data, error } = await supabase.rpc("cleanup_rate_limits");
      
      if (error) {
        console.error("[RateLimiter] Cleanup error:", error);
        throw error;
      }

      console.log(`[RateLimiter] Cleaned up ${data} old entries`);
      
      return new Response(
        JSON.stringify({ cleaned: data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (action === "status") {
      // Get current status without incrementing
      const { data, error } = await supabase.rpc("get_rate_limit_status", {
        _key_hash: keyHash,
        _category: category,
        _window_seconds: limits.windowSeconds,
      });

      if (error) {
        console.error("[RateLimiter] Status error:", error);
        throw error;
      }

      const row = data?.[0];
      const currentCount = row?.current_count || 0;
      const remaining = limits.maxRequests - currentCount;
      const resetAt = row?.window_end || new Date(Date.now() + limits.windowSeconds * 1000).toISOString();

      const response: RateLimitResponse = {
        allowed: remaining > 0,
        remaining: Math.max(0, remaining),
        resetAt,
        category,
      };

      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Default: check action (increment counter)
    const { data: remaining, error } = await supabase.rpc("check_rate_limit", {
      _key_hash: keyHash,
      _category: category,
      _max_requests: limits.maxRequests,
      _window_seconds: limits.windowSeconds,
    });

    if (error) {
      console.error("[RateLimiter] Check error:", error);
      // On error, allow the request (fail open)
      return new Response(
        JSON.stringify({ 
          allowed: true, 
          remaining: 999, 
          resetAt: new Date().toISOString(),
          category,
          error: "Rate limit check failed, allowing request" 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const allowed = remaining >= 0;
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
    
    // Fail open on errors
    return new Response(
      JSON.stringify({ 
        allowed: true, 
        remaining: 999, 
        resetAt: new Date().toISOString(),
        category: "unknown",
        error: "Internal error, allowing request" 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
