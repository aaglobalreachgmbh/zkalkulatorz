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
      <Card className="border-primary/30">
        <CardContent className="p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Wie arbeiten Sie?</h2>
            <p className="text-sm text-muted-foreground">Wir passen Startseite und Werkzeuge an Ihren Alltag an.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {USER_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => update({ userType: t.id })}
                className="text-left rounded-lg border border-border p-3 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <t.icon className="h-5 w-5 text-primary mb-1" />
                <div className="text-sm font-medium text-foreground">{t.label}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <current.icon className="h-4 w-4" />
          </span>
          <div>
            <div className="text-xs font-semibold uppercase text-muted-foreground">Arbeitsmodus</div>
            <div className="text-sm font-semibold text-foreground">{current.label}</div>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/settings/workspace"><Settings2 className="h-4 w-4" />Anpassen</Link>
        </Button>
      </div>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Wie möchten Sie <span className="text-primary">arbeiten?</span></h1>
        <p className="text-sm text-muted-foreground">Direkt in den passenden Vorgang starten.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...current.quickActions, { label: "Kundensuche", description: "Bestand öffnen", url: "/customers", icon: Search }].map((a, i) => (
          <Link
            key={`${a.url}-${a.label}`}
            to={a.url}
            className={cn(
              "group flex min-h-28 flex-col justify-between rounded-lg border p-4 transition-all duration-150",
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
