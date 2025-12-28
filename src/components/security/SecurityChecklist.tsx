import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Database,
  Key,
  Code,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  docsLink?: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Database Security
  {
    id: "rls_enabled",
    category: "database",
    title: "RLS aktiviert für alle Tabellen",
    description: "Jede Tabelle hat Row Level Security aktiviert (ALTER TABLE x ENABLE ROW LEVEL SECURITY)",
    severity: "critical",
    docsLink: "#regel-1-datenbank-härtung",
  },
  {
    id: "rls_with_check",
    category: "database",
    title: "WITH CHECK für Schreiboperationen",
    description: "Alle INSERT/UPDATE Policies haben USING + WITH CHECK Klauseln",
    severity: "critical",
    docsLink: "#regel-1-datenbank-härtung",
  },
  {
    id: "security_definer",
    category: "database",
    title: "SECURITY DEFINER mit search_path",
    description: "Alle SECURITY DEFINER Funktionen haben expliziten search_path = 'public'",
    severity: "high",
    docsLink: "#regel-1-datenbank-härtung",
  },
  {
    id: "has_role_function",
    category: "database",
    title: "has_role() für Admin-Checks",
    description: "Admin-Prüfungen nutzen die sichere has_role() Funktion statt direkter Joins",
    severity: "high",
  },
  
  // Secrets & Edge Functions
  {
    id: "no_client_secrets",
    category: "secrets",
    title: "Keine Secrets im Client-Code",
    description: "API-Keys (Stripe, OpenAI, Service Role) sind nur in Supabase Secrets, nicht im Frontend",
    severity: "critical",
    docsLink: "#regel-2-geheimnisse--edge-functions",
  },
  {
    id: "edge_functions_proxy",
    category: "secrets",
    title: "Edge Functions als Proxy",
    description: "Externe APIs werden über Supabase Edge Functions aufgerufen, nicht direkt vom Client",
    severity: "critical",
    docsLink: "#regel-2-geheimnisse--edge-functions",
  },
  {
    id: "jwt_verification",
    category: "secrets",
    title: "JWT-Verifikation in Edge Functions",
    description: "Edge Functions verifizieren JWTs kryptographisch gegen Supabase Auth",
    severity: "high",
  },
  {
    id: "cors_whitelist",
    category: "secrets",
    title: "CORS-Whitelisting aktiv",
    description: "Edge Functions erlauben nur spezifische Origins, keine Wildcards",
    severity: "high",
  },
  
  // Frontend & Validation
  {
    id: "zod_validation",
    category: "frontend",
    title: "Zod-Schemas für alle Eingaben",
    description: "Alle Formulare und API-Returns werden mit Zod validiert",
    severity: "high",
    docsLink: "#regel-3-frontend--validierung",
  },
  {
    id: "no_dangerous_html",
    category: "frontend",
    title: "Kein dangerouslySetInnerHTML",
    description: "User-Input wird niemals als HTML gerendert oder mit DOMPurify bereinigt",
    severity: "critical",
    docsLink: "#regel-3-frontend--validierung",
  },
  {
    id: "secure_input",
    category: "frontend",
    title: "SecureInput für sensible Felder",
    description: "Alle Eingabefelder nutzen SecureInput oder Input aus @/components/ui",
    severity: "medium",
  },
  {
    id: "rate_limiting",
    category: "frontend",
    title: "Rate Limiting für API-Calls",
    description: "Externe API-Calls sind durch useServerRateLimit() geschützt",
    severity: "high",
  },
  
  // Project-Specific
  {
    id: "security_provider",
    category: "project",
    title: "SecurityProvider aktiv",
    description: "App ist in SecurityProvider gewrappt für automatischen Schutz",
    severity: "high",
    docsLink: "#1-securityprovider",
  },
  {
    id: "prototype_pollution",
    category: "project",
    title: "Prototype Pollution Schutz",
    description: "Object.freeze(Object.prototype) ist am App-Start aktiv",
    severity: "high",
  },
  {
    id: "npm_audit",
    category: "project",
    title: "npm audit ausgeführt",
    description: "Keine bekannten Sicherheitslücken in Dependencies",
    severity: "medium",
  },
  {
    id: "encrypted_storage",
    category: "project",
    title: "Encrypted Storage für sensible Daten",
    description: "useSecureStorage() wird für lokale Speicherung sensibler Daten verwendet",
    severity: "medium",
  },
];

const CATEGORY_CONFIG = {
  database: { label: "Datenbank-Härtung", icon: Database, color: "text-blue-500" },
  secrets: { label: "Secrets & Edge Functions", icon: Key, color: "text-amber-500" },
  frontend: { label: "Frontend & Validierung", icon: Code, color: "text-green-500" },
  project: { label: "Projektspezifisch", icon: Shield, color: "text-purple-500" },
};

const SEVERITY_CONFIG = {
  critical: { label: "Kritisch", color: "bg-red-500/20 text-red-400 border-red-500/50" },
  high: { label: "Hoch", color: "bg-orange-500/20 text-orange-400 border-orange-500/50" },
  medium: { label: "Mittel", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" },
  low: { label: "Niedrig", color: "bg-green-500/20 text-green-400 border-green-500/50" },
};

const STORAGE_KEY = "security-checklist-state";

export function SecurityChecklist() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCheckedItems(parsed.items || {});
        setLastUpdated(parsed.lastUpdated || null);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save state
  const saveState = (items: Record<string, boolean>) => {
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, lastUpdated: now }));
    setLastUpdated(now);
  };

  const handleCheck = (id: string, checked: boolean) => {
    const newItems = { ...checkedItems, [id]: checked };
    setCheckedItems(newItems);
    saveState(newItems);
  };

  const resetChecklist = () => {
    setCheckedItems({});
    localStorage.removeItem(STORAGE_KEY);
    setLastUpdated(null);
  };

  // Calculate progress
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const progress = Math.round((checkedCount / totalCount) * 100);

  // Group items by category
  const groupedItems = CHECKLIST_ITEMS.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, ChecklistItem[]>
  );

  // Count unchecked critical items
  const uncheckedCritical = CHECKLIST_ITEMS.filter(
    (item) => item.severity === "critical" && !checkedItems[item.id]
  ).length;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Security-Checkliste</CardTitle>
              <CardDescription>
                Basierend auf dem Security Manifest für AI-generierte Webseiten
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={resetChecklist}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Zurücksetzen
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {checkedCount} von {totalCount} erledigt
            </span>
            <span className={progress === 100 ? "text-green-500 font-medium" : "text-muted-foreground"}>
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mt-2">
            {progress === 100 ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Alle Prüfungen bestanden
              </Badge>
            ) : uncheckedCritical > 0 ? (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {uncheckedCritical} kritische Punkte offen
              </Badge>
            ) : (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {totalCount - checkedCount} Punkte offen
              </Badge>
            )}
            {lastUpdated && (
              <Badge variant="outline" className="text-muted-foreground">
                Zuletzt geprüft: {new Date(lastUpdated).toLocaleDateString("de-DE")}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => {
          const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
          const Icon = config.icon;
          const categoryChecked = items.filter((i) => checkedItems[i.id]).length;

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${config.color}`} />
                <h3 className="font-medium text-foreground">{config.label}</h3>
                <Badge variant="outline" className="text-xs">
                  {categoryChecked}/{items.length}
                </Badge>
              </div>

              <div className="space-y-2 pl-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      checkedItems[item.id]
                        ? "bg-muted/30 border-muted"
                        : "bg-card border-border hover:border-primary/50"
                    }`}
                  >
                    <Checkbox
                      id={item.id}
                      checked={checkedItems[item.id] || false}
                      onCheckedChange={(checked) => handleCheck(item.id, !!checked)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label
                          htmlFor={item.id}
                          className={`font-medium cursor-pointer ${
                            checkedItems[item.id]
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {item.title}
                        </label>
                        <Badge className={SEVERITY_CONFIG[item.severity].color}>
                          {SEVERITY_CONFIG[item.severity].label}
                        </Badge>
                        {item.docsLink && (
                          <a
                            href={`/SECURITY.md${item.docsLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p
                        className={`text-sm mt-1 ${
                          checkedItems[item.id] ? "text-muted-foreground/60" : "text-muted-foreground"
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
