// ============================================
// EnergyCalculator + Gesamtübersicht (Demo)
// Reine Frontend-Rechnung mit erfundenen Beispieltarifen.
// ============================================
import { useMemo, useState } from "react";
import { Zap, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import { ENERGY_TARIFFS, calcEnergy, formatEur, type EnergyKind } from "@/margenkalkulator/workspace/energyDemo";

interface Props {
  /** Ø Monatskosten Telekommunikation netto (aus Kalkulation), optional */
  telcoMonthlyNet?: number;
  telcoOneTimeNet?: number;
  termMonths?: number;
}

interface Entry { on: boolean; tariffId: string; kwh: string; current: string }

function EnergyBlock({ kind, entry, setEntry }: { kind: EnergyKind; entry: Entry; setEntry: (e: Entry) => void }) {
  const Icon = kind === "strom" ? Zap : Flame;
  const tariffs = ENERGY_TARIFFS.filter((t) => t.kind === kind);
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4 text-primary" /> {kind === "strom" ? "Strom" : "Gas"}</div>
        <Switch checked={entry.on} onCheckedChange={(on) => setEntry({ ...entry, on })} aria-label={`${kind} einbeziehen`} />
      </div>
      {entry.on && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Tarif (Demo)</Label>
            <Select value={entry.tariffId} onValueChange={(v) => setEntry({ ...entry, tariffId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{tariffs.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Verbrauch kWh/Jahr</Label>
            <Input inputMode="numeric" value={entry.kwh} onChange={(e) => setEntry({ ...entry, kwh: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Heutiger Abschlag €/Monat (netto)</Label>
            <Input inputMode="decimal" value={entry.current} onChange={(e) => setEntry({ ...entry, current: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}

const num = (s: string) => Number(String(s).replace(",", ".")) || 0;

export function EnergyCalculator({ telcoMonthlyNet, telcoOneTimeNet = 0, termMonths = 24 }: Props) {
  const { showDealerEconomics } = useSensitiveFieldsVisible("dealer");
  const [strom, setStrom] = useState<Entry>({ on: true, tariffId: "s1", kwh: "8000", current: "210" });
  const [gas, setGas] = useState<Entry>({ on: false, tariffId: "g1", kwh: "20000", current: "190" });
  const [telcoCurrent, setTelcoCurrent] = useState("");

  const results = useMemo(() => {
    const list = [] as { label: string; r: NonNullable<ReturnType<typeof calcEnergy>> }[];
    if (strom.on) { const r = calcEnergy({ tariffId: strom.tariffId, kwhPerYear: num(strom.kwh), currentMonthlyNet: num(strom.current) }); if (r) list.push({ label: "Strom", r }); }
    if (gas.on) { const r = calcEnergy({ tariffId: gas.tariffId, kwhPerYear: num(gas.kwh), currentMonthlyNet: num(gas.current) }); if (r) list.push({ label: "Gas", r }); }
    return list;
  }, [strom, gas]);

  const telco = telcoMonthlyNet ?? 0;
  const telcoNow = num(telcoCurrent);
  const newMonthly = telco + results.reduce((s, x) => s + x.r.monthlyNet, 0);
  const nowMonthly = (telcoNow || (telcoMonthlyNet !== undefined ? 0 : 0)) + results.reduce((s, x) => s + x.r.currentMonthlyNet, 0);
  const total = newMonthly * termMonths + telcoOneTimeNet;
  const saving = nowMonthly > 0 ? (nowMonthly - newMonthly) * termMonths - telcoOneTimeNet : 0;
  const extraProvision = results.reduce((s, x) => s + x.r.tariff.demoProvision, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <EnergyBlock kind="strom" entry={strom} setEntry={setStrom} />
        <EnergyBlock kind="gas" entry={gas} setEntry={setGas} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            Gesamtübersicht für den Kunden
            <Badge variant="secondary" className="text-muted-foreground">Demo-Tarife</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {telcoMonthlyNet !== undefined && (
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-end">
              <div className="space-y-1">
                <Label>Heutige Telefon-/Internetkosten €/Monat (netto, optional)</Label>
                <Input inputMode="decimal" value={telcoCurrent} onChange={(e) => setTelcoCurrent(e.target.value)} placeholder="z. B. 180" />
              </div>
            </div>
          )}
          <table className="w-full">
            <thead className="text-xs text-muted-foreground">
              <tr><th className="text-left font-normal py-1">Bereich</th><th className="text-right font-normal">Heute / Monat</th><th className="text-right font-normal">Neu / Monat</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {telcoMonthlyNet !== undefined && (
                <tr><td className="py-1.5">Mobilfunk, Festnetz & Hardware</td><td className="text-right">{telcoNow ? formatEur(telcoNow) : "–"}</td><td className="text-right">{formatEur(telco)}</td></tr>
              )}
              {results.map((x) => (
                <tr key={x.label}><td className="py-1.5">{x.label} · {x.r.tariff.name}</td><td className="text-right">{x.r.currentMonthlyNet ? formatEur(x.r.currentMonthlyNet) : "–"}</td><td className="text-right">{formatEur(x.r.monthlyNet)}</td></tr>
              ))}
            </tbody>
            <tfoot className="font-semibold">
              <tr className="border-t border-border"><td className="py-1.5">Summe</td><td className="text-right">{nowMonthly ? formatEur(nowMonthly) : "–"}</td><td className="text-right">{formatEur(newMonthly)}</td></tr>
            </tfoot>
          </table>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-md bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground">Gesamt über {termMonths} Monate (inkl. Einmalkosten)</div>
              <div className="text-lg font-semibold">{formatEur(total)}</div>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground">Ersparnis gegenüber heute ({termMonths} Monate)</div>
              <div className={`text-lg font-semibold ${saving > 0 ? "text-success" : saving < 0 ? "text-destructive" : ""}`}>{nowMonthly ? formatEur(saving) : "Heutige Kosten eintragen"}</div>
            </div>
          </div>
          {showDealerEconomics && results.length > 0 && (
            <div className="rounded-md border border-dashed border-border p-3 text-xs">
              Händleransicht: geschätzte Zusatzprovision Energie <span className="font-semibold">{formatEur(extraProvision)}</span> (Demo-Wert)
            </div>
          )}
          <p className="text-xs text-muted-foreground">Alle Beträge netto. Energie-Tarife sind erfundene Beispielwerte zur Veranschaulichung.</p>
        </CardContent>
      </Card>
    </div>
  );
}
