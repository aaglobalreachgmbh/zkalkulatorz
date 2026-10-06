import { Link } from "react-router-dom";
import { ArrowRight, Settings2 } from "lucide-react";
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <current.icon className="h-4 w-4 text-primary" />
          Arbeitsplatz: <span className="font-medium text-foreground">{current.label}</span>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/settings/workspace"><Settings2 className="h-4 w-4" />Anpassen</Link>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {current.quickActions.map((a, i) => (
          <Link
            key={a.url}
            to={a.url}
            className={cn(
              "group rounded-xl border p-4 transition-colors",
              i === 0 ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary"
            )}
          >
            <div className="flex items-center justify-between font-semibold">
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
