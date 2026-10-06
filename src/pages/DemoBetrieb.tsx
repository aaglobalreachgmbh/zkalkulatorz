// ============================================
// Demo-Betrieb – die App "in aktiver Nutzung" mit erfundenen Daten
// ============================================
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoPageShell } from "@/components/workspace/DemoPageShell";
import { TodayOverview } from "@/components/workspace/TodayOverview";
import { useDemoMode } from "@/hooks/useDemoMode";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import {
  DEMO_COMPANY_CUSTOMERS, DEMO_COMPANY_OFFERS, DEMO_COMPANY_CONTRACTS, DEMO_COMPANY_EVENTS, DEMO_DUE_VVL,
} from "@/margenkalkulator/workspace/demoDataset";

const eur = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

function Table({ head, rows }: { head: string[]; rows: (string | JSX.Element)[][] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>{head.map((h) => <th key={h} className="text-left font-medium px-3 py-2">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="px-3 py-2">{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export default function DemoBetrieb() {
  const { enabled, setDemo } = useDemoMode();
  const { showDealerEconomics } = useSensitiveFieldsVisible("dealer");

  const stats = useMemo(() => {
    const accepted = DEMO_COMPANY_OFFERS.filter((o) => o.status === "Angenommen");
    const sent = DEMO_COMPANY_OFFERS.filter((o) => o.status !== "Entwurf");
    return {
      customers: DEMO_COMPANY_CUSTOMERS.length,
      offers: DEMO_COMPANY_OFFERS.length,
      contracts: DEMO_COMPANY_CONTRACTS.length,
      quote: sent.length ? Math.round((accepted.length / sent.length) * 100) : 0,
      margin: accepted.reduce((s, o) => s + o.margin, 0),
      provision: DEMO_COMPANY_CONTRACTS.reduce((s, c) => s + c.provision, 0),
      byType: ["Neuvertrag", "VVL", "Festnetz", "Energie"].map((t) => ({ t, n: DEMO_COMPANY_CONTRACTS.filter((c) => c.type === t).length })),
    };
  }, []);

  return (
    <DemoPageShell title="Demo-Betrieb" description="So sieht die App im laufenden Tagesgeschäft aus – mit einer erfundenen Demo-Firma.">
      {!enabled && (
        <div className="rounded-md border border-dashed border-border p-3 text-sm flex items-center justify-between gap-3">
          <span>Die Startseite zeigt die Beispieldaten aktuell nicht.</span>
          <Button size="sm" onClick={() => setDemo(true)}>Auch auf der Startseite anzeigen</Button>
        </div>
      )}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        {[
          ["Kunden", String(stats.customers)],
          ["Angebote", String(stats.offers)],
          ["Verträge", String(stats.contracts)],
          ["Abschlussquote", `${stats.quote} %`],
          [showDealerEconomics ? "Marge (angenommen)" : "Fällige VVL", showDealerEconomics ? eur(stats.margin) : String(DEMO_DUE_VVL.length)],
        ].map(([l, v]) => (
          <Card key={l}><CardContent className="p-4"><div className="text-xs text-muted-foreground">{l}</div><div className="text-xl font-semibold tabular-nums">{v}</div></CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="heute">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="heute">Heute</TabsTrigger>
          <TabsTrigger value="kunden">Kunden</TabsTrigger>
          <TabsTrigger value="angebote">Angebote</TabsTrigger>
          <TabsTrigger value="vertraege">Verträge</TabsTrigger>
          <TabsTrigger value="vvl">VVL</TabsTrigger>
          {showDealerEconomics && <TabsTrigger value="provisionen">Provisionen</TabsTrigger>}
          <TabsTrigger value="kalender">Kalender</TabsTrigger>
          <TabsTrigger value="auswertung">Auswertung</TabsTrigger>
        </TabsList>

        <TabsContent value="heute"><TodayOverview compact /></TabsContent>

        <TabsContent value="kunden">
          <Table head={["Kunde", "Branche", "Ort", "Karten", "Festnetz", "Energie", "Ø Monat"]} rows={DEMO_COMPANY_CUSTOMERS.map((c) => [
            c.name, c.industry, c.city, String(c.mobileLines),
            c.hasFixedNet ? <Badge variant="secondary">ja</Badge> : <Badge variant="outline">Chance</Badge>,
            c.hasEnergy ? <Badge variant="secondary">ja</Badge> : <Badge variant="outline">Chance</Badge>,
            eur(c.monthlyNet),
          ])} />
        </TabsContent>

        <TabsContent value="angebote">
          <Table head={["Nr.", "Datum", "Kunde", "Inhalt", "Monat netto", ...(showDealerEconomics ? ["Marge"] : []), "Status"]} rows={DEMO_COMPANY_OFFERS.map((o) => [
            o.id, o.date, o.customer, o.title, eur(o.monthlyNet),
            ...(showDealerEconomics ? [<span key="m" className={o.margin < 0 ? "text-destructive" : "text-success"}>{eur(o.margin)}</span>] : []),
            <Badge key="s" variant={o.status === "Angenommen" ? "default" : o.status === "Abgelehnt" ? "destructive" : "secondary"}>{o.status}</Badge>,
          ])} />
        </TabsContent>

        <TabsContent value="vertraege">
          <Table head={["Nr.", "Kunde", "Produkt", "Art", "Beginn", "Ende"]} rows={DEMO_COMPANY_CONTRACTS.map((c) => [c.id, c.customer, c.product, c.type, c.start, c.end])} />
        </TabsContent>

        <TabsContent value="vvl">
          <Table head={["Kunde", "Karten", "Fällig", "Ansprechpartner"]} rows={DEMO_DUE_VVL.map((c) => [
            c.name, String(c.mobileLines),
            <Badge key="d" variant={c.vvlInDays <= 14 ? "destructive" : "secondary"}>{c.vvlInDays < 0 ? "überfällig" : `in ${c.vvlInDays} Tagen`}</Badge>,
            c.contact,
          ])} />
        </TabsContent>

        {showDealerEconomics && (
          <TabsContent value="provisionen">
            <div className="mb-3 text-sm">Summe (Demo): <span className="font-semibold">{eur(stats.provision)}</span></div>
            <Table head={["Vertrag", "Kunde", "Art", "Provision"]} rows={DEMO_COMPANY_CONTRACTS.map((c) => [c.id, c.customer, c.type, eur(c.provision)])} />
          </TabsContent>
        )}

        <TabsContent value="kalender">
          <div className="grid gap-3 md:grid-cols-5">
            {["Mo", "Di", "Mi", "Do", "Fr"].map((d) => (
              <Card key={d}>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{d}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {DEMO_COMPANY_EVENTS.filter((e) => e.day === d).map((e) => (
                    <div key={e.id} className="rounded border border-border p-2">
                      <div className="font-medium">{e.time} · {e.kind}</div>
                      <div>{e.customer}</div>
                      <div className="text-muted-foreground">{e.topic}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="auswertung">
          <Card>
            <CardHeader><CardTitle className="text-base">Verträge nach Art</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {stats.byType.map(({ t, n }) => (
                <div key={t} className="flex items-center gap-3 text-sm">
                  <span className="w-24">{t}</span>
                  <div className="flex-1 h-3 rounded bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(n / stats.contracts) * 100}%` }} /></div>
                  <span className="w-8 text-right tabular-nums">{n}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DemoPageShell>
  );
}
