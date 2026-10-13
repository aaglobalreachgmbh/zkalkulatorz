import { supabase } from "@/integrations/supabase/client";

const TICKET_KEY = "public-demo-ticket";
const DEMO_KEY = "demo-mode:anon";
const EVENT = "demo-mode-changed";

type DemoAccessResponse = { ticket?: string; expiresIn?: number; valid?: boolean; error?: string };

function ticketExpiry(ticket: string): number {
  try {
    const payload = ticket.split(".")[0];
    if (!payload) return 0;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded)) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

export function getPublicDemoTicket(): string | null {
  try {
    const ticket = localStorage.getItem(TICKET_KEY);
    if (!ticket) return null;
    if (ticketExpiry(ticket) <= Date.now()) {
      disablePublicDemoMode();
      return null;
    }
    return ticket;
  } catch {
    return null;
  }
}

export function isPublicDemoActive(): boolean {
  return getPublicDemoTicket() !== null;
}

export async function startPublicDemo(password: string): Promise<{ error: string | null }> {
  const { data, error } = await supabase.functions.invoke<DemoAccessResponse>("public-demo-access", {
    body: { action: "login", password },
  });
  if (error || !data?.ticket) return { error: data?.error || "Demo-Zugang konnte nicht geöffnet werden" };
  try {
    localStorage.setItem(TICKET_KEY, data.ticket);
    localStorage.setItem(DEMO_KEY, "1");
    window.dispatchEvent(new Event(EVENT));
    return { error: null };
  } catch {
    return { error: "Der Demo-Zugang konnte im Browser nicht gespeichert werden" };
  }
}

export async function verifyPublicDemo(): Promise<boolean> {
  const ticket = getPublicDemoTicket();
  if (!ticket) return false;
  const { data, error } = await supabase.functions.invoke<DemoAccessResponse>("public-demo-access", {
    body: { action: "verify", ticket },
  });
  if (error || !data?.valid) {
    disablePublicDemoMode();
    return false;
  }
  return true;
}

export function disablePublicDemoMode(): void {
  try {
    localStorage.removeItem(TICKET_KEY);
    localStorage.removeItem(DEMO_KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Safe fallback: an unavailable storage already prevents persistence.
  }
}