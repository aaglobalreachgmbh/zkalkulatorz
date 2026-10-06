// ============================================
// DeviceSuggestionsPanel – Vorschläge direkt nach der Gerätewahl
// Tarife (nach Betreiberfokus), Aktionen, Bundles. Manuelle Wahl bleibt immer möglich.
// ============================================
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ChevronDown, ChevronUp, Tag, Package, Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";
import type { OfferOptionState, ViewMode } from "../../engine/types";
import { listMobileTariffs, listPromos, listSubVariants } from "../../engine/catalogResolver";
import { suggestTariffs, suggestPromos, suggestSubVariant, FOCUS_LABELS } from "../../workspace/suggestions";
import { useBusinessFocus } from "../../workspace/useBusinessFocus";
import { DEMO_BUNDLES, loadTemplates, saveTemplate } from "../../storage/bundles";

interface Props {
  state: OfferOptionState;
  onApply: (next: OfferOptionState) => void;
  viewMode?: ViewMode;
}

const eur = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export function DeviceSuggestionsPanel({ state, onApply, viewMode = "dealer" }: Props) {
  const [open, setOpen] = useState(true);
  const { showDealerEconomics } = useSensitiveFieldsVisible(viewMode);
  const { focus } = useBusinessFocus();
  const version = state.meta.datasetVersion;
  const ekNet = state.hardware.ekNet ?? 0;

  const data = useMemo(() => {
    try {
      const tariffs = listMobileTariffs(version);
      const subs = listSubVariants(version).map((s) => s.id);
      const top = suggestTariffs(ekNet, tariffs, focus, 3, { showDealerReasons: showDealerEconomics });
      const promos = suggestPromos(listPromos(version), [state.mobile.tariffId, ...top.map((t) => t.tariff.id)].filter(Boolean), 3);
      const sub = suggestSubVariant(ekNet, subs);
      const known = new Set(tariffs.map((t) => t.id));
      const templates = loadTemplates().slice(0, 3);
      const bundles = DEMO_BUNDLES.filter((b) => !b.config.mobile || known.has(b.config.mobile.tariffId)).slice(0, 3);
      return { top, promos, sub, templates, bundles };
    } catch (err) {
      console.warn("[DeviceSuggestionsPanel] failed", err);
      return { top: [], promos: [], sub: "SIM_ONLY", templates: [], bundles: [] };
    }
  }, [version, ekNet, focus, showDealerEconomics]);

  const applyTariff = (tariffId: string, promoId?: string) => {
    onApply({ ...state, mobile: { ...state.mobile, tariffId, subVariantId: data.sub, promoId: promoId ?? state.mobile.promoId ?? "NONE" } });
    toast.success("Vorschlag übernommen – du kannst alles weiter anpassen");
  };

  const applyConfig = (cfg: Partial<OfferOptionState>, name: string) => {
    onApply({
      ...state,
      mobile: cfg.mobile ? { ...state.mobile, ...cfg.mobile } : state.mobile,
      fixedNet: cfg.fixedNet ? { ...state.fixedNet, ...cfg.fixedNet } : state.fixedNet,
      // Gerät bleibt erhalten, wenn bereits gewählt
      hardware: ekNet > 0 ? state.hardware : cfg.hardware ? { ...state.hardware, ...cfg.hardware } : state.hardware,
    });
    toast.success(`„${name}" übernommen`);
  };

  const saveCurrent = () => {
    const now = new Date().toISOString();
    try {
      saveTemplate({ id: `tpl-${Date.now()}`, name: `${state.hardware.name || "Angebot"} – Vorlage`, config: state, createdAt: now, updatedAt: now });
      toast.success("Als eigene Vorlage gespeichert");
    } catch {
      toast.error("Vorlage konnte nicht gespeichert werden");
    }
  };

  if (!state.hardware.name) return null;

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Vorschläge zu {state.hardware.name}</span>
        <span className="hidden sm:inline text-xs text-muted-foreground">
          · Fokus: {focus.goals.map((g) => FOCUS_LABELS[g]).join(", ") || "neutral"}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">{open ? "Einklappen" : "Anzeigen"}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="grid gap-4 border-t border-border p-4 md:grid-cols-3">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Passt oft dazu</h4>
            {data.top.length === 0 && <p className="text-xs text-muted-foreground">Keine Tarife im Datenstand.</p>}
            {data.top.map((s, i) => (
              <button key={s.tariff.id} type="button" onClick={() => applyTariff(s.tariff.id)}
                className={cn("w-full rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5",
                  state.mobile.tariffId === s.tariff.id ? "border-primary bg-primary/5" : "border-border")}>
                <div className="flex items-center gap-2">
                  {i === 0 && <Badge className="h-5 px-1.5 text-[10px]">Top</Badge>}
                  <span className="text-sm font-medium truncate">{s.tariff.name}</span>
                  <span className="ml-auto text-sm font-semibold tabular-nums">{eur(s.tariff.baseNet)}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                  {s.reasons.map((r) => <span key={r} className="rounded bg-muted px-1.5 py-0.5">{r}</span>)}
                  {showDealerEconomics && <span className="ml-auto tabular-nums">Prov. {eur(s.tariff.provisionBase ?? 0)}</span>}
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aktionen jetzt</h4>
            {data.promos.length === 0 && <p className="text-xs text-muted-foreground">Aktuell keine passende Aktion.</p>}
            {data.promos.map(({ promo: p, tariffId }) => (
              <button key={p.id} type="button" onClick={() => applyTariff(tariffId, p.id)}
                className="flex w-full items-center gap-2 rounded-lg border border-border p-3 text-left hover:border-primary hover:bg-primary/5">
                <Tag className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">{p.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bundles & Vorlagen</h4>
            {data.templates.map((t) => (
              <button key={t.id} type="button" onClick={() => applyConfig(t.config, t.name)}
                className="flex w-full items-center gap-2 rounded-lg border border-border p-3 text-left hover:border-primary hover:bg-primary/5">
                <Save className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate">{t.name}</span>
                <Badge variant="secondary" className="ml-auto text-[10px]">Meine</Badge>
              </button>
            ))}
            {data.bundles.map((b) => (
              <button key={b.id} type="button" onClick={() => applyConfig(b.config, b.name)}
                className="flex w-full items-center gap-2 rounded-lg border border-border p-3 text-left hover:border-primary hover:bg-primary/5">
                <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate">{b.name}</span>
                <Badge variant="outline" className="ml-auto text-[10px]">Firma</Badge>
              </button>
            ))}
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" className="h-8 flex-1" onClick={saveCurrent}>
                <Save className="mr-1 h-3.5 w-3.5" /> Als Vorlage
              </Button>
              <Button size="sm" variant="ghost" className="h-8" asChild>
                <Link to="/eigene-produkte"><Settings2 className="mr-1 h-3.5 w-3.5" /> Fokus</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
