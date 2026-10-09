// ============================================
// Eigene Produkte & Betreiberfokus
// Eigene Tarife/Leistungen per XLSX/CSV importieren, Fokusziele setzen.
// Lokal pro Benutzer gespeichert; PDF-Übernahme ist eine Simulation.
// ============================================
import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { Upload, Download, FileText, Trash2, Plus, Target, Sparkles } from "lucide-react";
import { DemoPageShell } from "@/components/workspace/DemoPageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useDemoMode } from "@/hooks/useDemoMode";
import {
  useBusinessFocus, DEMO_CUSTOM_PRODUCTS, CUSTOM_PRODUCT_CATEGORIES,
  type CustomProduct, type CustomProductCategory,
} from "@/margenkalkulator/workspace/useBusinessFocus";
import { FOCUS_LABELS, type FocusGoal } from "@/margenkalkulator/workspace/suggestions";
import { listMobileTariffs } from "@/margenkalkulator/engine/catalogResolver";

const eur = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const num = (v: unknown) => {
  const n = parseFloat(String(v ?? "").replace(/\s|€/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const HEADERS = ["name", "kategorie", "monatlich_netto", "einmalig_netto", "provision", "notiz"];

type Row = Record<string, unknown>;
interface Preview { ok: CustomProduct[]; errors: string[] }

function rowsToProducts(rows: Row[]): Preview {
  const ok: CustomProduct[] = [];
  const errors: string[] = [];
  rows.forEach((raw, i) => {
    const r: Row = {};
    Object.entries(raw).forEach(([k, v]) => (r[k.trim().toLowerCase()] = v));
    const name = String(r.name ?? r.produkt ?? "").trim();
    if (!name) { if (Object.values(r).some((v) => String(v ?? "").trim())) errors.push(`Zeile ${i + 2}: Name fehlt`); return; }
    const catRaw = String(r.kategorie ?? r.category ?? "Sonstiges").trim();
    const category = (CUSTOM_PRODUCT_CATEGORIES.find((c) => c.toLowerCase() === catRaw.toLowerCase()) ?? "Sonstiges") as CustomProductCategory;
    ok.push({
      id: `cp-${Date.now()}-${i}`, name: name.slice(0, 120), category,
      monthlyNet: num(r.monatlich_netto ?? r.monatlich), oneTimeNet: num(r.einmalig_netto ?? r.einmalig),
      provision: num(r.provision), note: String(r.notiz ?? "").slice(0, 200) || undefined,
    });
  });
  return { ok, errors };
}

export default function EigeneProdukte() {
  const { focus, setFocus, products, setProducts } = useBusinessFocus();
  const { enabled: demoOn } = useDemoMode();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pdfSim, setPdfSim] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const tariffs = useMemo(() => { try { return listMobileTariffs("business-2025-09"); } catch { return []; } }, []);

  const shown = products.length ? products : demoOn ? DEMO_CUSTOM_PRODUCTS : [];
  const isDemoList = !products.length && demoOn;

  const toggleGoal = (g: FocusGoal) =>
    setFocus({ ...focus, goals: focus.goals.includes(g) ? focus.goals.filter((x) => x !== g) : [...focus.goals, g] });
  const toggleTariff = (id: string) =>
    setFocus({ ...focus, preferredTariffIds: focus.preferredTariffIds.includes(id) ? focus.preferredTariffIds.filter((x) => x !== id) : [...focus.preferredTariffIds, id] });

  const onFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast.error("Datei zu groß (max. 5 MB)");
    const name = file.name.toLowerCase();
    try {
      if (name.endsWith(".csv")) {
        const text = await file.text();
        const res = Papa.parse<Row>(text, { header: true, skipEmptyLines: true, delimiter: "" });
        setPreview(rowsToProducts(res.data));
      } else if (name.endsWith(".xlsx")) {
        const ExcelJS = (await import("exceljs")).default;
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(await file.arrayBuffer());
        const ws = wb.worksheets[0];
        const head: string[] = [];
        const rows: Row[] = [];
        ws?.eachRow((row, idx) => {
          const vals = (row.values as unknown[]).slice(1).map((v) => (v && typeof v === "object" && "result" in (v as object) ? (v as { result: unknown }).result : v));
          if (idx === 1) vals.forEach((v) => head.push(String(v ?? "")));
          else { const r: Row = {}; head.forEach((h, i) => (r[h] = vals[i])); rows.push(r); }
        });
        setPreview(rowsToProducts(rows));
      } else if (name.endsWith(".pdf")) {
        toast.info("PDF-Übernahme kommt später – bitte CSV oder XLSX nutzen");
      } else toast.error("Bitte CSV oder XLSX wählen");
    } catch (err) {
      console.warn("[EigeneProdukte] import failed", err);
      toast.error("Datei konnte nicht gelesen werden");
    }
  };

  const confirmImport = () => {
    if (!preview?.ok.length) return;
    setProducts([...products, ...preview.ok]);
    toast.success(`${preview.ok.length} Produkte übernommen`);
    setPreview(null); setPdfSim(false);
  };

  const downloadTemplate = () => {
    const csv = [HEADERS.join(";"), "Panzerglas Premium;Zubehör;0;24,90;10;", "Ökostrom Gewerbe;Energie;89;0;80;Partner X"].join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "eigene-produkte-vorlage.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const addEmpty = () => setProducts([...products, { id: `cp-${Date.now()}`, name: "Neues Produkt", category: "Sonstiges", monthlyNet: 0, oneTimeNet: 0, provision: 0 }]);
  const update = (id: string, patch: Partial<CustomProduct>) => setProducts(products.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <DemoPageShell title="Eigene Produkte & Fokus" description="Eigene Tarife, Leistungen und Partnerprodukte pflegen – und festlegen, was der Kalkulator zuerst vorschlägt." demo={isDemoList}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4 text-primary" /> Unser Verkaufsfokus</CardTitle>
          <CardDescription>Steuert die Reihenfolge der Vorschläge nach der Gerätewahl. Preise und Rechnung ändern sich dadurch nicht.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FOCUS_LABELS) as FocusGoal[]).map((g) => (
              <button key={g} type="button" onClick={() => toggleGoal(g)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${focus.goals.includes(g) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>
                {FOCUS_LABELS[g]}
              </button>
            ))}
          </div>
          {tariffs.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hausfavoriten (bevorzugte Tarife)</p>
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 max-h-56 overflow-auto pr-1">
                {tariffs.filter((t) => t.productLine !== "TEAMDEAL").map((t) => (
                  <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-muted/50">
                    <Checkbox checked={focus.preferredTariffIds.includes(t.id)} onCheckedChange={() => toggleTariff(t.id)} />
                    <span className="truncate">{t.name}</span>
                    <span className="ml-auto tabular-nums text-xs text-muted-foreground">{eur(t.baseNet)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Upload className="h-4 w-4 text-primary" /> Liste importieren</CardTitle>
          <CardDescription>CSV oder Excel (XLSX) mit Spalten: {HEADERS.join(", ")}. PDF-Übernahme kommt später.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => fileRef.current?.click()}><Upload className="mr-1.5 h-4 w-4" /> Datei wählen</Button>
            <Button variant="outline" onClick={downloadTemplate}><Download className="mr-1.5 h-4 w-4" /> Vorlage (CSV)</Button>
            <Button variant="ghost" onClick={addEmpty}><Plus className="mr-1.5 h-4 w-4" /> Manuell anlegen</Button>
            <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
          </div>
          {preview && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                {pdfSim ? <FileText className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                Vorschau: {preview.ok.length} erkannt
                {pdfSim && <Badge variant="secondary">Simulation</Badge>}
              </div>
              {preview.errors.map((e) => <p key={e} className="text-xs text-muted-foreground">• {e}</p>)}
              <ul className="text-sm space-y-0.5">
                {preview.ok.slice(0, 8).map((p) => <li key={p.id}>{p.name} · {p.category} · {eur(p.monthlyNet)}/Monat · {eur(p.oneTimeNet)} einmalig</li>)}
              </ul>
              <div className="flex gap-2"><Button size="sm" onClick={confirmImport} disabled={!preview.ok.length}>Übernehmen</Button>
                <Button size="sm" variant="ghost" onClick={() => { setPreview(null); setPdfSim(false); }}>Verwerfen</Button></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Meine Produkte {isDemoList && <Badge variant="secondary" className="ml-2">Demo</Badge>}</CardTitle>
          <CardDescription>{shown.length ? `${shown.length} Einträge` : "Noch keine eigenen Produkte – importiere eine Liste oder schalte die Demo-Firma ein."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {shown.map((p) => (
            <div key={p.id} className="grid items-center gap-2 rounded-lg border border-border p-2.5 sm:grid-cols-[1fr_140px_110px_110px_100px_36px]">
              {isDemoList ? <span className="text-sm font-medium">{p.name}</span>
                : <Input value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} className="h-8" />}
              <Badge variant="outline" className="w-fit">{p.category}</Badge>
              <span className="text-sm tabular-nums">{eur(p.monthlyNet)}<span className="text-xs text-muted-foreground"> /M</span></span>
              <span className="text-sm tabular-nums">{eur(p.oneTimeNet)}<span className="text-xs text-muted-foreground"> einm.</span></span>
              <span className="text-sm tabular-nums text-muted-foreground">Prov. {eur(p.provision)}</span>
              {!isDemoList && <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setProducts(products.filter((x) => x.id !== p.id))} aria-label="Löschen"><Trash2 className="h-4 w-4" /></Button>}
            </div>
          ))}
        </CardContent>
      </Card>
    </DemoPageShell>
  );
}
