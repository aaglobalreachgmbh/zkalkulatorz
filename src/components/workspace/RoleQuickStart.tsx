import { Link } from "react-router-dom";
import { ArrowRight, Search, Settings2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWorkspaceProfile } from "@/hooks/useWorkspaceProfile";
import { USER_TYPES } from "@/margenkalkulator/workspace/profiles";
import { cn } from "@/lib/utils";

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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-3">
          <span className="hidden h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary min-[390px]:flex">
            <current.icon className="h-4 w-4" />
          </span>
          <div>
            <div className="text-xs font-semibold uppercase text-muted-foreground">Arbeitsmodus</div>
            <div className="text-sm font-semibold text-foreground">{current.label}</div>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1 px-2">
          <Link to="/settings/workspace"><Settings2 className="h-4 w-4" /><span className="hidden min-[390px]:inline">Anpassen</span></Link>
        </Button>
      </div>
      <div className="space-y-1 text-left sm:text-center">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Wie möchten Sie <span className="text-primary">arbeiten?</span></h1>
        <p className="hidden text-sm text-muted-foreground min-[390px]:block">Direkt in den passenden Vorgang starten.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...current.quickActions, { label: "Kundensuche", description: "Bestand öffnen", url: "/customers", icon: Search }].map((a, i) => (
          <Link
            key={`${a.url}-${a.label}`}
            to={a.url}
            className={cn(
              "group flex min-h-20 flex-col justify-between rounded-lg border p-3 transition-all duration-150 sm:min-h-28 sm:p-4",
              i === 0 ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card hover:border-primary hover:shadow-sm"
            )}
          >
            <div className="flex items-start justify-between font-semibold">
              {a.label}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
            <div className={cn("text-xs mt-1", i === 0 ? "text-primary-foreground/80" : "text-muted-foreground")}>
              {a.description}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
