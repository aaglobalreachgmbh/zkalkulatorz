// ============================================
// Admin & Sicherheit – gebündelter Einstieg zu allen Sicherheitsseiten
// ============================================
import { NavLink } from "react-router-dom";
import { Shield, FileBarChart, Radar, Activity, Lock, FlaskConical, UserCog } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DemoPageShell } from "@/components/workspace/DemoPageShell";

const PAGES = [
  { title: "Sicherheits-Dashboard", desc: "Ereignisse und Warnungen", url: "/security", icon: Shield },
  { title: "Sicherheitsbericht", desc: "Zusammenfassung zum Export", url: "/security/report", icon: FileBarChart },
  { title: "Bedrohungslage", desc: "Erkannte Angriffe und IPs", url: "/security/threat-intel", icon: Radar },
  { title: "Systemstatus", desc: "Status aller Schutzebenen", url: "/security/status", icon: Activity },
  { title: "Datenschutz (DSGVO)", desc: "Löschungen und Auskünfte", url: "/security/gdpr", icon: Lock },
  { title: "Sicherheitstest", desc: "Schutzfunktionen prüfen", url: "/security/test", icon: FlaskConical },
  { title: "Mein Konto – Sicherheit", desc: "Passwort, Zwei-Faktor", url: "/settings/security", icon: UserCog },
];

export default function SecurityHub() {
  return (
    <DemoPageShell title="Admin & Sicherheit" description="Alle Sicherheitsseiten an einem Ort." demo={false}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PAGES.map((p) => (
          <NavLink key={p.url} to={p.url}>
            <Card className="h-full hover:border-primary transition-colors">
              <CardContent className="p-4 flex gap-3">
                <p.icon className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <div className="font-medium text-foreground">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </div>
              </CardContent>
            </Card>
          </NavLink>
        ))}
      </div>
    </DemoPageShell>
  );
}
