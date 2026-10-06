import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoPageShell } from "@/components/workspace/DemoPageShell";
import { DEMO_CUSTOMERS, type DemoCustomer } from "@/margenkalkulator/workspace/demoData";

interface Chance { label: string; tone: "default" | "secondary" | "outline" }

function chancesFor(c: DemoCustomer): Chance[] {
  const list: Chance[] = [];
  if (!c.hasFixedNet) list.push({ label: "Festnetz fehlt – GigaKombi möglich", tone: "default" });
  if (c.vvlInDays <= 90) list.push({ label: `VVL in ${c.vvlInDays} Tagen`, tone: "secondary" });
  if (c.mobileLines >= 5) list.push({ label: "Mengenbonus prüfen", tone: "outline" });
  return list;
}

export default function CrossSell() {
  const navigate = useNavigate();
  const rows = DEMO_CUSTOMERS.map((c) => ({ c, chances: chancesFor(c) }))
    .filter((r) => r.chances.length > 0)
    .sort((a, b) => b.chances.length - a.chances.length);

  return (
    <DemoPageShell title="Kreuzgeschäft" description="Chancen im Kundenbestand: fehlendes Festnetz, fällige VVL, Mengenvorteile.">
      <div className="grid gap-3">
        {rows.map(({ c, chances }) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium text-foreground">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.contact} · {c.mobileLines} Karten · {c.tariff}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {chances.map((ch) => <Badge key={ch.label} variant={ch.tone}>{ch.label}</Badge>)}
                </div>
              </div>
              <Button onClick={() => navigate("/calculator")}>Angebot starten</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DemoPageShell>
  );
}
