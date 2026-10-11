import { createClient } from "npm:@supabase/supabase-js@2";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

const encoder = new TextEncoder();

export function clientOrigin(request: Request): string {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

export async function privateHash(value: string, purpose: string): Promise<string> {
  const secret = Deno.env.get("PUBLIC_DEMO_SIGNING_SECRET");
  if (!secret) throw new Error("request-security-secret-missing");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`${purpose}:${value}`)));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function enforceRateLimit(
  key: string,
  category: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("request-security-backend-missing");

  const client = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await client.rpc("check_rate_limit", {
    _key_hash: key,
    _category: category,
    _max_requests: maxRequests,
    _window_seconds: windowSeconds,
  });
  if (error || typeof data !== "number") throw new Error("request-security-check-failed");
  return {
    allowed: data >= 0,
    remaining: Math.max(0, data),
    retryAfter: windowSeconds,
  };
}

export function requestTooLarge(request: Request, maxBytes: number): boolean {
  const value = request.headers.get("content-length");
  if (!value) return false;
  const length = Number(value);
  return !Number.isFinite(length) || length > maxBytes;
}