// ============================================
// License Overview Page - Phase 3C
// User-facing license status and features
// ============================================

import { Link } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Check, 
  X, 
  Shield, 
  Users, 
  ArrowLeft,
  Crown,
  Sparkles,
  Database,
  FileText,
  Bot,
  LayoutGrid,
  Router,
  ClipboardList,
  BarChart3,
  Plug,
  Palette
} from "lucide-react";
import { useLicense } from "@/hooks/useLicense";
import { type LicenseFeatures, type LicensePlan, PLAN_FEATURES, PLAN_SEAT_LIMITS } from "@/lib/license";
import { cn } from "@/lib/utils";

/**
 * Feature metadata for display
 */
const FEATURE_META: Record<keyof LicenseFeatures, { 
  name: string; 
  description: string; 
  icon: typeof Check;
}> = {
  dataGovernance: {
    name: "Daten-Governance",
    description: "Import/Export mit Approval-Workflow",
    icon: Database,
  },
  compareOption2: {
    name: "Option 2 Vergleich",
    description: "Zwei Angebote nebeneinander kalkulieren",
    icon: LayoutGrid,
  },
  fixedNetModule: {
    name: "Festnetz-Modul",
    description: "Cable, DSL, Fiber, Komfort-Tarife",
    icon: Router,
  },
  exportPdf: {
    name: "PDF Export",
    description: "Angebote als PDF exportieren",
    icon: FileText,
  },
  auditLog: {
    name: "Audit-Protokoll",
    description: "Alle Aktionen nachvollziehbar",
    icon: ClipboardList,
  },
  aiConsultant: {
    name: "AI Margen-Berater",
    description: "Intelligente Optimierungsvorschläge",
    icon: Bot,
  },
  advancedReporting: {
    name: "Erweitertes Reporting",
    description: "Dashboard mit Margen-Trends & Team-Performance",
    icon: BarChart3,
  },
  apiAccess: {
    name: "API-Zugang",
    description: "REST-Endpunkte für CRM/ERP-Integration",
    icon: Plug,
  },
  customBranding: {
    name: "Eigenes Branding",
    description: "Logo, Farben, Badge entfernen",
    icon: Palette,
  },
};

/**
 * Plan display names
 */
const PLAN_NAMES: Record<LicensePlan, string> = {
  internal: "Internal",
  pro: "Pro",
  enterprise: "Enterprise",
};

export default function License() {
  const { license, isValid, seatUsage } = useLicense();
  
  const seatPercentage = seatUsage.limit > 0 
    ? Math.min(100, (seatUsage.used / seatUsage.limit) * 100) 
    : 0;
  
  const featureKeys = Object.keys(FEATURE_META) as (keyof LicenseFeatures)[];
  const allPlans: LicensePlan[] = ["internal", "pro", "enterprise"];
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Ihre Lizenz</h1>
              <p className="text-muted-foreground">Übersicht und enthaltene Features</p>
            </div>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Link>
          </Button>
        </div>
        
        {/* License Status Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {license.plan === "enterprise" ? (
                  <Crown className="h-10 w-10 text-amber-500" />
                ) : license.plan === "pro" ? (
                  <Sparkles className="h-10 w-10 text-blue-500" />
                ) : (
                  <Shield className="h-10 w-10 text-emerald-500" />
                )}
                <div>
                  <CardTitle className="text-xl">
                    Plan: {PLAN_NAMES[license.plan].toUpperCase()}
                  </CardTitle>
                  <CardDescription>
                    {license.validUntil 
                      ? `Gültig bis ${new Date(license.validUntil).toLocaleDateString('de-DE')}`
                      : "Unbegrenzt gültig"
                    }
                  </CardDescription>
                </div>
              </div>
              <Badge variant={isValid ? "default" : "destructive"}>
                {isValid ? "✓ Aktiv" : "Abgelaufen"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seat Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Seats
                </span>
                <span className="font-medium">
                  {seatUsage.used} von {seatUsage.limit} verwendet
                </span>
              </div>
              <Progress value={seatPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {seatUsage.available} Seats verfügbar
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Feature List */}
        <Card>
          <CardHeader>
            <CardTitle>Enthaltene Features</CardTitle>
            <CardDescription>
              Diese Funktionen sind in Ihrem {PLAN_NAMES[license.plan]}-Plan enthalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {featureKeys.map((key) => {
                const meta = FEATURE_META[key];
                const enabled = license.features[key];
                const Icon = meta.icon;
                
                return (
                  <div 
                    key={key}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border",
                      enabled 
                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                        : "bg-muted/50 border-border opacity-60"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg",
                      enabled ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        enabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium text-sm",
                          !enabled && "text-muted-foreground"
                        )}>
                          {meta.name}
                        </span>
                        {enabled ? (
                          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {meta.description}
                      </p>
                      {!enabled && (
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          Enterprise erforderlich
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Plan Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Plan-Vergleich</CardTitle>
            <CardDescription>
              Vergleichen Sie die verfügbaren Pläne
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Feature</th>
                    {allPlans.map((plan) => (
                      <th 
                        key={plan} 
                        className={cn(
                          "text-center py-3 px-4 font-medium",
                          plan === license.plan && "bg-primary/10 rounded-t-lg"
                        )}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{PLAN_NAMES[plan]}</span>
                          {plan === license.plan && (
                            <Badge variant="secondary" className="text-[10px]">
                              Aktuell
                            </Badge>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Seats Row */}
                  <tr className="border-b">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Seats</span>
                      </div>
                    </td>
                    {allPlans.map((plan) => (
                      <td 
                        key={plan} 
                        className={cn(
                          "text-center py-3 px-4 font-medium",
                          plan === license.plan && "bg-primary/10"
                        )}
                      >
                        {PLAN_SEAT_LIMITS[plan]}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Feature Rows */}
                  {featureKeys.map((key) => {
                    const meta = FEATURE_META[key];
                    
                    return (
                      <tr key={key} className="border-b last:border-0">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <meta.icon className="h-4 w-4 text-muted-foreground" />
                            <span>{meta.name}</span>
                          </div>
                        </td>
                        {allPlans.map((plan) => {
                          const enabled = PLAN_FEATURES[plan][key];
                          
                          return (
                            <td 
                              key={plan} 
                              className={cn(
                                "text-center py-3 px-4",
                                plan === license.plan && "bg-primary/10"
                              )}
                            >
                              {enabled ? (
                                <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
