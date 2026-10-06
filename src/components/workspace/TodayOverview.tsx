// ============================================
// TodayOverview – "Heute" auf der Startseite (Demo-Firma)
// ============================================
import { useNavigate } from "react-router-dom";
import { CalendarDays, RefreshCcw, FileText, Sparkles, Target, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDemoMode } from "@/hooks/useDemoMode";
import {
  DEMO_COMPANY_EVENTS, DEMO_DUE_VVL, DEMO_COMPANY_OFFERS, DEMO_CROSS_CHANCES, DEMO_MONTH_GOALS,
} from "@/margenkalkulator/workspace/demoDataset";

export function TodayOverview() {
  const navigate = useNavigate();
  const { tourSeen, markTourSeen, setDemo } = useDemoMode();
  const todays = DEMO_COMPANY_EVENTS.slice(0, 4);
  const openOffers = DEMO_COMPANY_OFFERS.filter((o) => o.status === "Gesendet").slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Heute</h2>
          <Badge variant="outline" className="border-warning text-warning">Demo-Firma – Beispieldaten</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate("/demo-betrieb")}>Demo-Betrieb öffnen</Button>
          <Button size="sm" variant="ghost" onClick={() => setDemo(false)}>Beispieldaten ausblenden</Button>
        </div>
      </div>

      {!tourSeen && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm flex gap-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="font-medium">So nutzen Sie die App im Tagesgeschäft</div>
            <ol className="list-decimal pl-4 text-muted-foreground space-y-0.5">
              <li>Morgens hier: Termine, fällige Vertragsverlängerungen und offene Angebote auf einen Blick.</li>
              <li>Chancen anklicken → Kalkulator öffnet sich, Angebot in 2–3 Minuten.</li>
              <li>Im Ergebnis: „Für Kunden erklären" und „Strom & Gas ergänzen" für die Gesamtübersicht.</li>
              <li>Im Demo-Betrieb sehen Sie Kunden, Verträge, Provisionen und Auswertungen im laufenden Betrieb.</li>
            </ol>
          </div>
          <Button size="icon" variant="ghost" onClick={markTourSeen} aria-label="Hinweis schließen"><X className="h-4 w-4" /></Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> Termine</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {todays.map((e) => (
              <div key={e.id} className="flex justify-between gap-2">
                <span><span className="font-medium tabular-nums">{e.time}</span> · {e.customer}</span>
                <span className="text-muted-foreground text-xs">{e.topic}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><RefreshCcw className="h-4 w-4 text-primary" /> Fällige Verlängerungen (≤ 90 Tage)</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {DEMO_DUE_VVL.slice(0, 4).map((c) => (
              <div key={c.id} className="flex justify-between gap-2">
                <span>{c.name} · {c.mobileLines} Karten</span>
                <Badge variant={c.vvlInDays <= 14 ? "destructive" : "secondary"}>{c.vvlInDays < 0 ? "überfällig" : `in ${c.vvlInDays} T.`}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Offene Angebote</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {openOffers.map((o) => (
              <div key={o.id} className="flex justify-between gap-2">
                <span className="truncate">{o.customer} · {o.title}</span>
                <span className="tabular-nums text-muted-foreground">{o.monthlyNet.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Kreuzgeschäft-Chancen</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {DEMO_CROSS_CHANCES.slice(0, 4).map(({ c, chances }) => (
              <button key={c.id} type="button" onClick={() => navigate("/calculator")} className="w-full text-left flex justify-between gap-2 hover:text-primary">
                <span>{c.name}</span>
                <span className="text-xs text-muted-foreground">{chances.join(" · ")}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Monatsziel</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEMO_MONTH_GOALS.map((g) => (
            <div key={g.label} className="space-y-1">
              <div className="flex justify-between text-xs"><span>{g.label}</span><span className="tabular-nums">{g.current}/{g.target}</span></div>
              <Progress value={Math.min(100, (g.current / g.target) * 100)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function DemoModeToggleCard() {
  const { enabled, setDemo } = useDemoMode();
  if (enabled) return null;
  return (
    <div className="rounded-lg border border-dashed border-border p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div>
        <div className="font-medium text-foreground">Wie sieht die App im laufenden Betrieb aus?</div>
        <div className="text-muted-foreground">Blendet eine erfundene Demo-Firma mit Kunden, Angeboten, Verträgen und Terminen ein – nur in Ihrem Browser.</div>
      </div>
      <Button onClick={() => setDemo(true)}>Beispieldaten anzeigen</Button>
    </div>
  );
}
