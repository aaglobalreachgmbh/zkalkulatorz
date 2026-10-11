// ============================================
// TodayOverview – "Heute" auf der Startseite (Demo-Firma)
// ============================================
import { useNavigate } from "react-router-dom";
import { CalendarDays, RefreshCcw, FileText, Sparkles, Target, X, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDemoMode } from "@/hooks/useDemoMode";
import {
  DEMO_COMPANY_EVENTS, DEMO_DUE_VVL, DEMO_COMPANY_OFFERS, DEMO_CROSS_CHANCES, DEMO_MONTH_GOALS,
} from "@/margenkalkulator/workspace/demoDataset";

export function TodayOverview({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const { tourSeen, markTourSeen, setDemo } = useDemoMode();
  const todays = DEMO_COMPANY_EVENTS.slice(0, 4);
  const openOffers = DEMO_COMPANY_OFFERS.filter((o) => o.status === "Gesendet").slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Heute</h2>
          <Badge variant="secondary">Demo-Firma – Beispieldaten</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate("/customers")}>Kunden öffnen</Button>
          <Button size="sm" variant="ghost" onClick={() => setDemo(false)}>Demo beenden</Button>
        </div>
      </div>

      {!compact && !tourSeen && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm flex gap-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="font-medium">So nutzen Sie die App im Tagesgeschäft</div>
            <ol className="list-decimal pl-4 text-muted-foreground space-y-0.5">
              <li>Morgens hier: Termine, fällige Vertragsverlängerungen und offene Angebote auf einen Blick.</li>
              <li>Chancen anklicken → Kalkulator öffnet sich, Angebot in 2–3 Minuten.</li>
              <li>Im Ergebnis: „Für Kunden erklären" und „Strom & Gas ergänzen" für die Gesamtübersicht.</li>
              <li>Kunden, Angebote und Verträge nutzen dieselben Ansichten wie im echten Betrieb.</li>
            </ol>
          </div>
          <Button size="icon" variant="ghost" onClick={markTourSeen} aria-label="Hinweis schließen"><X className="h-4 w-4" /></Button>
        </div>
      )}

      <div className={compact ? "grid gap-3 md:grid-cols-2 2xl:grid-cols-4" : "grid gap-4 md:grid-cols-2"}>
        <Card className="min-w-0 shadow-none">
          <CardHeader className="p-4 pb-2"><CardTitle className="flex items-start gap-2 text-sm leading-5"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Termine</CardTitle></CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 text-sm">
            {todays.map((e) => (
              <div key={e.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(5.5rem,auto)] items-start gap-3">
                <span className="min-w-0 leading-5"><span className="font-medium tabular-nums">{e.time}</span> · {e.customer}</span>
                <span className="break-words text-right text-xs leading-4 text-muted-foreground">{e.topic}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="min-w-0 shadow-none">
          <CardHeader className="p-4 pb-2"><CardTitle className="flex items-start gap-2 text-sm leading-5"><RefreshCcw className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> <span>Fällige Verlängerungen <span className="whitespace-nowrap">(≤ 90 Tage)</span></span></CardTitle></CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 text-sm">
            {DEMO_DUE_VVL.slice(0, 4).map((c) => (
              <div key={c.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <span className="min-w-0 break-words leading-5">{c.name} · {c.mobileLines} Karten</span>
                <Badge className="shrink-0 whitespace-nowrap" variant={c.vvlInDays <= 14 ? "destructive" : "secondary"}>{c.vvlInDays < 0 ? "überfällig" : `in ${c.vvlInDays} T.`}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="min-w-0 shadow-none">
          <CardHeader className="p-4 pb-2"><CardTitle className="flex items-start gap-2 text-sm leading-5"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Offene Angebote</CardTitle></CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 text-sm">
            {openOffers.map((o) => (
              <div key={o.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <span className="min-w-0 truncate leading-5" title={`${o.customer} · ${o.title}`}>{o.customer} · {o.title}</span>
                <span className="shrink-0 whitespace-nowrap text-right tabular-nums text-muted-foreground">{o.monthlyNet.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="min-w-0 shadow-none">
          <CardHeader className="p-4 pb-2"><CardTitle className="flex items-start gap-2 text-sm leading-5"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Kreuzgeschäft-Chancen</CardTitle></CardHeader>
          <CardContent className="space-y-1 p-4 pt-0 text-sm">
            {DEMO_CROSS_CHANCES.slice(0, 4).map(({ c, chances }) => (
              <Button key={c.id} type="button" variant="ghost" onClick={() => navigate("/calculator")} className="h-auto min-h-11 w-full min-w-0 flex-col items-start justify-center gap-0.5 px-0 py-1 text-left font-normal hover:bg-transparent hover:text-primary">
                <span className="w-full min-w-0 truncate" title={c.name}>{c.name}</span>
                <span className="w-full whitespace-normal break-words text-xs leading-4 text-muted-foreground">{chances.join(" · ")}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {!compact && <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Monatsziel</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEMO_MONTH_GOALS.map((g) => (
            <div key={g.label} className="space-y-1">
              <div className="flex justify-between text-xs"><span>{g.label}</span><span className="tabular-nums">{g.current}/{g.target}</span></div>
              <Progress value={Math.min(100, (g.current / g.target) * 100)} />
            </div>
          ))}
        </CardContent>
      </Card>}
    </div>
  );
}

export function DemoModeToggleCard() {
  const { enabled, setDemo } = useDemoMode();
  if (enabled) return null;
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div>
        <div className="font-medium text-foreground">Wie sieht die App im laufenden Betrieb aus?</div>
        <div className="text-muted-foreground">Nutzt die normalen Ansichten mit einer erfundenen Demo-Firma – ausschließlich in Ihrem Browser.</div>
      </div>
      <Button onClick={() => setDemo(true)}>Beispieldaten anzeigen</Button>
    </div>
  );
}

export function DemoDashboardOverview() {
  const accepted = DEMO_COMPANY_OFFERS.filter((offer) => offer.status === "Angenommen").length;
  const open = DEMO_COMPANY_OFFERS.filter((offer) => offer.status === "Gesendet").length;
  const pipeline = DEMO_COMPANY_OFFERS
    .filter((offer) => offer.status === "Gesendet")
    .reduce((total, offer) => total + offer.monthlyNet, 0);

  const metrics = [
    { label: "Kunden", value: String(DEMO_DUE_VVL.length), detail: "mit VVL-Potenzial", icon: Users },
    { label: "Offene Angebote", value: String(open), detail: "aktuell nachfassen", icon: FileText },
    { label: "Gewonnen", value: String(accepted), detail: "im Beispielzeitraum", icon: TrendingUp },
    { label: "Monatliche Pipeline", value: pipeline.toLocaleString("de-DE", { style: "currency", currency: "EUR" }), detail: "netto, Beispieldaten", icon: Target },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">{metric.label}</span>
                <metric.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{metric.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{metric.detail}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Zielerreichung</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEMO_MONTH_GOALS.map((goal) => (
            <div key={goal.label} className="space-y-2">
              <div className="flex justify-between text-xs"><span>{goal.label}</span><span className="tabular-nums">{goal.current}/{goal.target}</span></div>
              <Progress value={Math.min(100, (goal.current / goal.target) * 100)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
