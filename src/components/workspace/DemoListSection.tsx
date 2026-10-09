// Klar markierte Beispiel-Listen der Demo-Firma – getrennt von echten Daten.
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDemoMode } from "@/hooks/useDemoMode";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import {
  DEMO_COMPANY_CUSTOMERS, DEMO_COMPANY_OFFERS, DEMO_COMPANY_CONTRACTS,
} from "@/margenkalkulator/workspace/demoDataset";

type Kind = "customers" | "offers" | "contracts" | "reporting";
const eur = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

/** Kleiner Hinweis im leeren Zustand: Beispieldaten einschalten. */
export function DemoEnableHint() {
  const { enabled, setDemo } = useDemoMode();
  if (enabled) return null;
  return (
    <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setDemo(true)}>
      <Sparkles className="h-4 w-4" /> Beispieldaten anzeigen
    </Button>
  );
}

export function DemoListSection({ kind }: { kind: Kind }) {
  const { enabled, setDemo } = useDemoMode();
  const { showDealerEconomics } = useSensitiveFieldsVisible("dealer");
  if (!enabled) return null;

  const header = (title: string) => (
    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        {title} <Badge variant="secondary">Beispieldaten – erfunden</Badge>
      </CardTitle>
      <Button variant="ghost" size="sm" onClick={() => setDemo(false)}>Ausblenden</Button>
    </CardHeader>
  );

  if (kind === "reporting") {
    const won = DEMO_COMPANY_OFFERS.filter((o) => o.status === "Angenommen");
    const rate = Math.round((won.length / DEMO_COMPANY_OFFERS.length) * 100);
    const kpis = [
      ["Angebote", String(DEMO_COMPANY_OFFERS.length)],
      ["Abschlussquote", `${rate} %`],
      ["Umsatz/Monat (Abschlüsse)", eur(won.reduce((s, o) => s + o.monthlyNet, 0))],
      ...(showDealerEconomics ? [["Marge (Abschlüsse)", eur(won.reduce((s, o) => s + o.margin, 0))]] : []),
    ];
    return (
      <Card className="border-dashed">
        {header("Demo-Firma: Auswertung")}
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map(([l, v]) => (
            <div key={l} className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">{l}</div>
              <div className="text-lg font-bold text-foreground">{v}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      {kind === "customers" && header(`Demo-Firma: Kunden (${DEMO_COMPANY_CUSTOMERS.length})`)}
      {kind === "offers" && header(`Demo-Firma: Angebote (${DEMO_COMPANY_OFFERS.length})`)}
      {kind === "contracts" && header(`Demo-Firma: Verträge (${DEMO_COMPANY_CONTRACTS.length})`)}
      <CardContent className="max-h-80 overflow-auto p-0">
        <Table>
          {kind === "customers" && (<>
            <TableHeader><TableRow><TableHead>Kunde</TableHead><TableHead>Branche</TableHead><TableHead>Ort</TableHead><TableHead className="text-right">Linien</TableHead><TableHead className="text-right">VVL in</TableHead></TableRow></TableHeader>
            <TableBody>{DEMO_COMPANY_CUSTOMERS.slice(0, 20).map((c) => (
              <TableRow key={c.id}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{c.industry}</TableCell><TableCell>{c.city}</TableCell><TableCell className="text-right">{c.mobileLines}</TableCell><TableCell className="text-right">{c.vvlInDays} Tage</TableCell></TableRow>
            ))}</TableBody>
          </>)}
          {kind === "offers" && (<>
            <TableHeader><TableRow><TableHead>Kunde</TableHead><TableHead>Angebot</TableHead><TableHead className="text-right">Monatlich netto</TableHead>{showDealerEconomics && <TableHead className="text-right">Marge</TableHead>}<TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{DEMO_COMPANY_OFFERS.slice(0, 20).map((o) => (
              <TableRow key={o.id}><TableCell className="font-medium">{o.customer}</TableCell><TableCell>{o.title}</TableCell><TableCell className="text-right">{eur(o.monthlyNet)}</TableCell>{showDealerEconomics && <TableCell className="text-right">{eur(o.margin)}</TableCell>}<TableCell><Badge variant="outline">{o.status}</Badge></TableCell></TableRow>
            ))}</TableBody>
          </>)}
          {kind === "contracts" && (<>
            <TableHeader><TableRow><TableHead>Kunde</TableHead><TableHead>Produkt</TableHead><TableHead>Art</TableHead><TableHead>Ende</TableHead>{showDealerEconomics && <TableHead className="text-right">Provision</TableHead>}</TableRow></TableHeader>
            <TableBody>{DEMO_COMPANY_CONTRACTS.slice(0, 20).map((c) => (
              <TableRow key={c.id}><TableCell className="font-medium">{c.customer}</TableCell><TableCell>{c.product}</TableCell><TableCell>{c.type}</TableCell><TableCell>{c.end}</TableCell>{showDealerEconomics && <TableCell className="text-right">{eur(c.provision)}</TableCell>}</TableRow>
            ))}</TableBody>
          </>)}
        </Table>
      </CardContent>
    </Card>
  );
}
