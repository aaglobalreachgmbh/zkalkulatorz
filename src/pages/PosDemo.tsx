import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { DemoPageShell } from "@/components/workspace/DemoPageShell";
import { DEMO_ACCESSORIES } from "@/margenkalkulator/workspace/demoData";

const eur = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export default function PosDemo() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [withContract, setWithContract] = useState(true);
  const [dayTotal, setDayTotal] = useState(0);
  const [receipts, setReceipts] = useState(0);

  const change = (id: string, d: number) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + d) }));
  const lines = DEMO_ACCESSORIES.filter((p) => (cart[p.id] ?? 0) > 0);
  const total = lines.reduce((s, p) => s + p.price * (cart[p.id] ?? 0), 0);

  const checkout = () => {
    setDayTotal((t) => t + total);
    setReceipts((r) => r + 1);
    setCart({});
    toast.success("Demo-Beleg erstellt");
  };

  return (
    <DemoPageShell title="Kasse" description="Zubehör und Vertrag auf einem Beleg. Nur Simulation – kein GoBD-Kassensystem.">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {DEMO_ACCESSORIES.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{eur(p.price)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => change(p.id, -1)} aria-label="Weniger"><Minus className="h-4 w-4" /></Button>
                  <span className="w-6 text-center">{cart[p.id] ?? 0}</span>
                  <Button size="icon" variant="outline" onClick={() => change(p.id, 1)} aria-label="Mehr"><Plus className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Beleg</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={withContract} onChange={(e) => setWithContract(e.target.checked)} />
                Vertrag aus aktuellem Angebot anhängen
              </label>
              {lines.map((p) => (
                <div key={p.id} className="flex justify-between"><span>{cart[p.id]}× {p.name}</span><span>{eur(p.price * (cart[p.id] ?? 0))}</span></div>
              ))}
              {withContract && <div className="flex justify-between text-muted-foreground"><span>Vertrag (Angebot)</span><span>0,00 €</span></div>}
              <div className="flex justify-between font-bold border-t border-border pt-2"><span>Summe brutto</span><span>{eur(total)}</span></div>
              <Button className="w-full" disabled={total === 0 && !withContract} onClick={checkout}>Kassieren (Demo)</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Tagesabschluss</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex justify-between"><span>Belege</span><span>{receipts}</span></div>
              <div className="flex justify-between font-semibold"><span>Umsatz</span><span>{eur(dayTotal)}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DemoPageShell>
  );
}
