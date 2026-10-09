// Zusatzleistungen aus "Eigene Produkte" ins Angebot übernehmen.
// Nur Kundenpreise; Provision wird hier bewusst nie angezeigt.
import { Link } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBusinessFocus, DEMO_CUSTOM_PRODUCTS } from "../../workspace/useBusinessFocus";
import { useOfferExtras } from "../../workspace/useOfferExtras";
import { useDemoMode } from "@/hooks/useDemoMode";

const eur = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export function OfferExtrasSection() {
  const { products } = useBusinessFocus();
  const { enabled: demo } = useDemoMode();
  const { extras, add, remove, monthlyNet, oneTimeNet } = useOfferExtras();
  const catalog = products.length ? products : demo ? DEMO_CUSTOM_PRODUCTS : [];

  return (
    <div className="mt-3 border-t border-border pt-3 space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Zusatzleistungen</div>
      {catalog.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          Noch keine eigenen Produkte. <Link to="/eigene-produkte" className="text-primary underline">Anlegen</Link>
        </p>
      ) : (
        <Select value="" onValueChange={(id) => { const p = catalog.find((c) => c.id === id); if (p) add(p); }}>
          <SelectTrigger className="h-8 text-xs"><Plus className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="Produkt hinzufügen" /></SelectTrigger>
          <SelectContent>
            {catalog.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-xs">
                {p.name}{p.demo ? " (Beispiel)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {extras.length > 0 && (
        <>
          <ul className="space-y-0.5">
            {extras.map((e) => (
              <li key={e.id} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-muted group">
                <div className="min-w-0">
                  <span className="block truncate font-medium text-foreground">{e.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {e.monthlyNet ? `${eur(e.monthlyNet)}/Monat` : ""}{e.monthlyNet && e.oneTimeNet ? " · " : ""}{e.oneTimeNet ? `${eur(e.oneTimeNet)} einmalig` : ""}
                  </span>
                </div>
                <button aria-label="Entfernen" onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive p-0.5 ml-2">
                  <X className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-xs px-2 text-foreground">
            <span>Summe Zusatz (netto)</span>
            <span className="font-semibold">{eur(monthlyNet)}/Monat · {eur(oneTimeNet)} einmalig</span>
          </div>
          <p className="text-[10px] text-muted-foreground px-2">Wird zusätzlich zum Tarifpreis angezeigt, noch nicht im PDF.</p>
        </>
      )}
    </div>
  );
}
