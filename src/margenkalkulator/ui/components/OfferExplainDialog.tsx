// ============================================
// OfferExplainDialog – KI-Erklärung des Angebots für den Kunden
// Sendet nur kundenseitige Werte (keine Marge/EK/Provision).
// ============================================
import { useRef, useState } from "react";
import { Sparkles, Copy, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { CalculationResult, OfferOptionState } from "../../engine/types";

const CUSTOMER_TYPES = ["Handwerk", "Arztpraxis", "Büro / Kanzlei", "Einzelhandel", "Gastronomie", "Selbstständig / SOHO", "Mittelstand"];
const FOCUS = [
  { id: "kosten", label: "Kosten" },
  { id: "ersparnis", label: "Ersparnis" },
  { id: "vorteile", label: "Vorteile" },
] as const;

interface Props {
  config: OfferOptionState;
  result: CalculationResult;
}

function buildPayload(config: OfferOptionState, result: CalculationResult, extra: { customerName: string; customerType: string; tone: string; focus: string[] }) {
  const items = result.breakdown ?? [];
  const oneTimeNet = (result.oneTime ?? []).reduce((s, m) => s + (m?.net ?? 0), 0);
  return {
    customerName: extra.customerName || undefined,
    customerType: extra.customerType,
    tone: extra.tone,
    focus: extra.focus,
    termMonths: config.meta?.termMonths ?? 24,
    avgMonthlyNet: result.totals?.avgTermNet ?? 0,
    avgMonthlyGross: result.totals?.avgTermGross ?? 0,
    totalTermNet: result.totals?.sumTermNet ?? 0,
    totalTermGross: result.totals?.sumTermGross ?? 0,
    oneTimeNet,
    periods: (result.periods ?? []).slice(0, 12).map((p) => ({ fromMonth: p.fromMonth, toMonth: p.toMonth, monthlyNet: p.monthly?.net ?? 0 })),
    // Nur Kundenposten – "dealer" wird bewusst nie gesendet
    monthlyItems: items.filter((i) => i.appliesTo === "monthly").slice(0, 40).map((i) => ({ label: i.label, net: i.net })),
    oneTimeItems: items.filter((i) => i.appliesTo === "oneTime").slice(0, 20).map((i) => ({ label: i.label, net: i.net })),
    products: {
      hardware: config.hardware?.name && config.hardware.ekNet > 0 ? config.hardware.name : undefined,
      mobileLines: config.mobile?.quantity ?? undefined,
      fixedNet: !!config.fixedNet?.enabled,
    },
  };
}

export function OfferExplainDialog({ config, result }: Props) {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerType, setCustomerType] = useState(CUSTOMER_TYPES[0]);
  const [tone, setTone] = useState<"einfach" | "ausfuehrlich">("einfach");
  const [focus, setFocus] = useState<string[]>(["kosten", "vorteile"]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = async () => {
    setText("");
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) {
      setError("Für die KI-Erklärung bitte anmelden (im Testmodus nicht verfügbar).");
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const res = await fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/explain-offer`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(buildPayload(config, result, { customerName, customerType, tone, focus })),
      });
      if (!res.ok || !res.body) {
        let msg = "KI-Erklärung fehlgeschlagen";
        try { msg = (await res.json())?.error ?? msg; } catch { /* ignore */ }
        setError(typeof msg === "string" ? msg : "KI-Erklärung fehlgeschlagen");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
              acc += evt.delta;
              setText(acc);
            } else if (evt.type === "error" || evt.type === "response.failed") {
              setError(evt.error?.message ?? evt.response?.error?.message ?? "KI-Erklärung fehlgeschlagen");
            }
          } catch { /* partial line */ }
        }
      }
      if (!acc) setError((e) => e ?? "Die KI hat keine Erklärung geliefert.");
    } catch (err) {
      if (controller.signal.aborted) return;
      console.warn("[OfferExplainDialog]", err);
      setError("Verbindung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Erklärung kopiert");
    } catch {
      toast.error("Kopieren nicht möglich");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) stop(); setOpen(o); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" /> Für Kunden erklären
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Angebot für den Kunden erklären</DialogTitle>
          <DialogDescription>
            Die KI formuliert eine verständliche Erklärung aus den berechneten Zahlen. Marge, EK und Provision werden nicht übertragen.
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="explain-name">Kundenname (optional)</Label>
            <Input id="explain-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="z. B. Bäckerei Schmidt" />
          </div>
          <div className="space-y-1.5">
            <Label>Kundentyp</Label>
            <Select value={customerType} onValueChange={setCustomerType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CUSTOMER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Stil</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as "einfach" | "ausfuehrlich")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="einfach">Kurz & einfach</SelectItem>
                <SelectItem value="ausfuehrlich">Ausführlich</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Schwerpunkte</Label>
            <div className="flex gap-4 pt-2">
              {FOCUS.map((f) => (
                <label key={f.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={focus.includes(f.id)}
                    onCheckedChange={(c) => setFocus((prev) => (c ? [...prev, f.id] : prev.filter((x) => x !== f.id)))}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {loading ? (
            <Button variant="outline" onClick={stop} className="gap-2"><Square className="h-4 w-4" /> Stopp</Button>
          ) : (
            <Button onClick={generate} className="gap-2"><Sparkles className="h-4 w-4" /> Erklärung erstellen</Button>
          )}
          {text && !loading && <Button variant="ghost" onClick={copy} className="gap-2"><Copy className="h-4 w-4" /> Kopieren</Button>}
        </div>

        {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {(text || loading) && (
          <div className="rounded-md border border-border bg-muted/30 p-4 text-sm whitespace-pre-wrap leading-relaxed min-h-[120px]">
            {text || <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Erklärung wird erstellt …</span>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
