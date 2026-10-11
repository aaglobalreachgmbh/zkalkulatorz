import { Link } from "react-router-dom";
import { ArrowRight, Search, Settings2, Calculator, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspaceProfile } from "@/hooks/useWorkspaceProfile";
import { USER_TYPES } from "@/margenkalkulator/workspace/profiles";

/** Schnellstart je Nutzertyp auf der Startseite. */
export function RoleQuickStart() {
  const { profile, update } = useWorkspaceProfile();
  const current = USER_TYPES.find((t) => t.id === profile.userType);

  if (!current) {
    return (
      <div className="space-y-4">
        <Link
          to="/calculator"
          className="group flex items-center justify-between rounded-lg border border-primary bg-primary p-6 text-primary-foreground shadow-sm transition-all hover:shadow-md"
        >
          <div>
            <div className="text-xl font-bold">Neues Angebot starten</div>
            <div className="text-sm text-primary-foreground/80">Direkt in den Kalkulator – Gerät, Tarif, fertig.</div>
          </div>
          <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
        </Link>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
          <span className="mr-1 text-sm text-muted-foreground">Startseite anpassen – ich arbeite als:</span>
          {USER_TYPES.map((t) => (
            <Button key={t.id} type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => update({ userType: t.id })}>
              <t.icon className="h-3.5 w-3.5 text-primary" />{t.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/calculator" className="group flex min-h-28 items-center justify-between rounded-lg bg-primary px-5 py-5 text-primary-foreground shadow-sm transition-shadow hover:shadow-md sm:px-6">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-foreground/10"><Calculator className="h-5 w-5" /></span>
          <div><h1 className="text-xl font-bold sm:text-2xl">Neues Angebot</h1><p className="text-sm text-primary-foreground/75">Gerät, Tarif und Kundenvorteil in einem Vorgang.</p></div>
        </div>
        <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
      </Link>
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { label: "Kunden finden", description: "Bestand und Historie", url: "/customers", icon: Users },
          { label: "Angebote", description: "Entwürfe und Status", url: "/offers", icon: FileText },
          ...current.quickActions.filter((action) => action.url !== "/calculator").slice(0, 1).map(action => ({ ...action, icon: Search })),
        ].map((a) => (
          <Link
            key={`${a.url}-${a.label}`}
            to={a.url}
            className="group flex min-h-20 items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary"
          >
            <a.icon className="h-4 w-4 text-primary" />
            <div className="min-w-0 flex-1"><div className="text-sm font-semibold">{a.label}</div><div className="truncate text-xs text-muted-foreground">{a.description}</div></div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-2 text-sm"><current.icon className="h-4 w-4 text-primary" /><span className="font-medium">{current.label}</span><span className="hidden text-muted-foreground sm:inline">Arbeitsplatz</span></div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5"><Link to="/settings/workspace"><Settings2 className="h-4 w-4" />Anpassen</Link></Button>
      </div>
    </div>
  );
}
