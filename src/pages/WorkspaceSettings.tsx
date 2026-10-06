import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DemoPageShell } from "@/components/workspace/DemoPageShell";
import { useWorkspaceProfile } from "@/hooks/useWorkspaceProfile";
import { useDemoMode } from "@/hooks/useDemoMode";
import { useDensity } from "@/contexts/DensityContext";
import { USER_TYPES, PALETTES, HOME_LAYOUTS } from "@/margenkalkulator/workspace/profiles";

export default function WorkspaceSettings() {
  const { profile, update } = useWorkspaceProfile();
  const { density, setDensity } = useDensity();
  const demo = useDemoMode();

  return (
    <DemoPageShell title="Mein Arbeitsplatz" description="Nutzertyp, Farben und Startseite nach Ihrem Bedarf einstellen." demo={false}>
      <Card>
        <CardHeader><CardTitle className="text-base">Wie arbeiten Sie?</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {USER_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => update({ userType: t.id })}
              className={cn(
                "text-left rounded-lg border p-4 transition-colors",
                profile.userType === t.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              )}
            >
              <t.icon className="h-5 w-5 text-primary mb-2" />
              <div className="font-medium text-foreground">{t.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Farbpalette</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => update({ paletteId: p.id })}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                profile.paletteId === p.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              )}
            >
              <span className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: p.swatch }} />
              {p.label}
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Startseite</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {HOME_LAYOUTS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => update({ homeLayout: l.id })}
                className={cn(
                  "w-full text-left rounded-lg border px-3 py-2",
                  profile.homeLayout === l.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                )}
              >
                <div className="text-sm font-medium text-foreground">{l.label}</div>
                <div className="text-xs text-muted-foreground">{l.description}</div>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Darstellung</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Button variant={density === "comfortable" ? "default" : "outline"} onClick={() => setDensity("comfortable")}>Komfortabel</Button>
            <Button variant={density === "compact" ? "default" : "outline"} onClick={() => setDensity("compact")}>Kompakt</Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Beispieldaten (Demo-Firma)</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Zeigt eine erfundene Firma mit Kunden, Angeboten, Verträgen und Terminen – nur in Ihrem Browser.</span>
          <div className="flex gap-2">
            <Button variant={demo.enabled ? "default" : "outline"} onClick={() => demo.setDemo(!demo.enabled)}>
              {demo.enabled ? "Beispieldaten ausblenden" : "Beispieldaten anzeigen"}
            </Button>
            <Button variant="ghost" asChild><a href="/demo-betrieb">Demo-Betrieb öffnen</a></Button>
          </div>
        </CardContent>
      </Card>
    </DemoPageShell>
  );
}
