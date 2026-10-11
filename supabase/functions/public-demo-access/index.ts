import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const LoginSchema = z.object({
  action: z.literal("login"),
  password: z.string().min(1).max(200),
});

const VerifySchema = z.object({
  action: z.literal("verify"),
  ticket: z.string().min(20).max(4000),
});

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const TICKET_TTL_SECONDS = 8 * 60 * 60;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return encodeBase64Url(new Uint8Array(signature));
}

function timingSafeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let mismatch = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    mismatch |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return mismatch === 0;
}

async function issueTicket(secret: string): Promise<string> {
  const payload = encodeBase64Url(new TextEncoder().encode(JSON.stringify({
    purpose: "public-demo",
    exp: Math.floor(Date.now() / 1000) + TICKET_TTL_SECONDS,
    nonce: crypto.randomUUID(),
  })));
  return `${payload}.${await hmac(payload, secret)}`;
}

async function verifyTicket(ticket: string, secret: string): Promise<boolean> {
  const [payload, signature, extra] = ticket.split(".");
  if (!payload || !signature || extra) return false;
  const expected = await hmac(payload, secret);
  if (!timingSafeEqual(signature, expected)) return false;
  try {
    const decoded = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload))) as { purpose?: string; exp?: number };
    return decoded.purpose === "public-demo" && typeof decoded.exp === "number" && decoded.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Nur POST erlaubt" }, 405);

  const password = Deno.env.get("PUBLIC_DEMO_PASSWORD");
  const signingSecret = Deno.env.get("PUBLIC_DEMO_SIGNING_SECRET");
  if (!password || !signingSecret) return json({ error: "Demo-Zugang ist nicht konfiguriert" }, 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Ungültige Anfrage" }, 400);
  }

  const login = LoginSchema.safeParse(body);
  if (login.success) {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientKey = forwarded || "unknown";
    const now = Date.now();
    const current = attempts.get(clientKey);
    const state = !current || current.resetAt <= now ? { count: 0, resetAt: now + WINDOW_MS } : current;
    if (state.count >= MAX_ATTEMPTS) return json({ error: "Zu viele Versuche. Bitte später erneut versuchen." }, 429);

    if (!timingSafeEqual(login.data.password, password)) {
      attempts.set(clientKey, { ...state, count: state.count + 1 });
      return json({ error: "Demo-Passwort ist nicht korrekt" }, 401);
    }

    attempts.delete(clientKey);
    return json({ ticket: await issueTicket(signingSecret), expiresIn: TICKET_TTL_SECONDS });
  }

  const verify = VerifySchema.safeParse(body);
  if (verify.success) {
    const valid = await verifyTicket(verify.data.ticket, signingSecret);
    return json({ valid }, valid ? 200 : 401);
  }

  return json({ error: "Ungültige Anfrage" }, 400);
});