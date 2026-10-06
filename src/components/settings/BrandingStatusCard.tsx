// ============================================
// BrandingStatusCard – zeigt, ob ein Logo hinterlegt ist und lädt,
// und wo stattdessen der Firmenname (Ersatz) erscheint.
// ============================================
import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/BrandLogo";

type LogoState = "none" | "checking" | "ok" | "broken";

export function useLogoStatus(url: string | null | undefined) {
  const [state, setState] = useState<LogoState>(url ? "checking" : "none");
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    setSize(null);
    if (!url) { setState("none"); return; }
    setState("checking");
    let alive = true;
    const img = new Image();
    img.onload = () => { if (alive) { setState("ok"); setSize({ w: img.naturalWidth, h: img.naturalHeight }); } };
    img.onerror = () => { if (alive) setState("broken"); };
    img.src = url;
    return () => { alive = false; };
  }, [url]);
  return { state, size };
}

const PLACES: { label: string; usesLogo: boolean }[] = [
  { label: "Kopfzeile der App", usesLogo: true },
  { label: "Seitenleiste", usesLogo: true },
  { label: "Startseite / Willkommensbanner", usesLogo: true },
  { label: "Angebots-PDF (Deckblatt & Kopf)", usesLogo: true },
  { label: "Kundenbericht-PDF", usesLogo: true },
  { label: "VVL-Liste (PDF)", usesLogo: true },
  { label: "Geteiltes Angebot (Kundenlink)", usesLogo: true },
];

interface Props { logoUrl: string | null; companyName: string | null; unsaved?: boolean }

export function BrandingStatusCard({ logoUrl, companyName, unsaved }: Props) {
  const { state, size } = useLogoStatus(logoUrl);
  const fallbackName = companyName?.trim() || "Standardname (MargenKalkulator)";
  const ext = logoUrl?.split("?")[0].split(".").pop()?.toUpperCase();

  const header = {
    none: { icon: XCircle, text: "Kein Logo hinterlegt", cls: "text-muted-foreground" },
    checking: { icon: Loader2, text: "Logo wird geprüft …", cls: "text-muted-foreground" },
    ok: { icon: CheckCircle2, text: "Logo hinterlegt und lädt korrekt", cls: "text-success" },
    broken: { icon: AlertTriangle, text: "Logo hinterlegt, lädt aber nicht", cls: "text-destructive" },
  }[state];
  const Icon = header.icon;
  const showsLogo = state === "ok" || state === "checking";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo-Status</CardTitle>
        <CardDescription>Wo Ihr Logo erscheint – und wo stattdessen der Firmenname gezeigt wird.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-28 rounded-md border border-border bg-muted/30 flex items-center justify-center p-1">
            {logoUrl ? <BrandLogo src={logoUrl} alt="Logo" className="h-full w-full" /> : <span className="text-xs text-muted-foreground">—</span>}
          </div>
          <div className="space-y-0.5">
            <div className={`flex items-center gap-2 font-medium ${header.cls}`}>
              <Icon className={`h-4 w-4 ${state === "checking" ? "animate-spin" : ""}`} /> {header.text}
            </div>
            {size && <div className="text-xs text-muted-foreground">{size.w} × {size.h} px{ext && ext.length <= 4 ? ` · ${ext}` : ""}{size.w < 200 ? " · eher klein, für PDFs mind. 400 px Breite empfohlen" : ""}</div>}
            {unsaved && <div className="text-xs text-warning">Vorschau – noch nicht gespeichert</div>}
          </div>
        </div>
        <ul className="divide-y divide-border rounded-md border border-border">
          {PLACES.map((p) => (
            <li key={p.label} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>{p.label}</span>
              {showsLogo && p.usesLogo ? (
                <Badge variant="secondary">Logo</Badge>
              ) : (
                <Badge variant="outline" title={fallbackName}>Firmenname (Ersatz): {fallbackName.length > 28 ? fallbackName.slice(0, 28) + "…" : fallbackName}</Badge>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
