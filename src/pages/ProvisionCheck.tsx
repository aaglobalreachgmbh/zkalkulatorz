import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DemoPageShell } from "@/components/workspace/DemoPageShell";
import { DEMO_PROVISIONS } from "@/margenkalkulator/workspace/demoData";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";

const eur = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export default function ProvisionCheck() {
  const [loaded, setLoaded] = useState(true);
  const { showDealerEconomics: showSensitive } = useSensitiveFieldsVisible("dealer");
  const expected = DEMO_PROVISIONS.reduce((s, r) => s + r.expected, 0);
  const received = DEMO_PROVISIONS.reduce((s, r) => s + r.received, 0);

  if (!showSensitive) {
    return (
      <DemoPageShell title="Provisionskontrolle" description="In der Kundensitzung ausgeblendet.">
        <p className="text-sm text-muted-foreground">Bitte Kundensitzung beenden, um Provisionen zu sehen.</p>
      </DemoPageShell>
    );
  }

  return (
    <DemoPageShell title="Provisionskontrolle" description="Gutschrift des Distributors mit erwarteten Provisionen abgleichen.">
      {!loaded ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Gutschrift-Datei (CSV/XLSX) hochladen – in der Demo wird eine Beispieldatei verwendet.</p>
            <Button onClick={() => setLoaded(true)}>Beispiel-Gutschrift laden</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Erwartet</div><div className="text-xl font-bold text-foreground">{eur(expected)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Erhalten</div><div className="text-xl font-bold text-foreground">{eur(received)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Differenz</div><div className="text-xl font-bold text-destructive">{eur(received - expected)}</div></CardContent></Card>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Vertrag</TableHead><TableHead>Kunde</TableHead><TableHead>Tarif</TableHead><TableHead className="text-right">Erwartet</TableHead><TableHead className="text-right">Erhalten</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_PROVISIONS.map((r) => {
                  const diff = r.received - r.expected;
                  return (
                    <TableRow key={r.contractId}>
                      <TableCell>{r.contractId}</TableCell>
                      <TableCell>{r.customer}</TableCell>
                      <TableCell>{r.tariff}</TableCell>
                      <TableCell className="text-right">{eur(r.expected)}</TableCell>
                      <TableCell className="text-right">{eur(r.received)}</TableCell>
                      <TableCell>
                        {diff === 0 ? <Badge variant="secondary">OK</Badge>
                          : r.received === 0 ? <Badge variant="destructive">Fehlt</Badge>
                          : <Badge variant="outline">{eur(diff)}</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </DemoPageShell>
  );
}
