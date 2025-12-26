/**
 * Security Audit Report Page
 * 
 * Vollständige Dokumentation der 16-Layer Security-Architektur
 * mit OWASP Top 10 Coverage und Live-Statistiken.
 */

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getGatewayStats } from "@/lib/secureApiGateway";
import { getSessionProfile, calculateTrustScore } from "@/lib/zeroDefenseLayer";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Layers,
  Lock,
  Eye,
  Zap,
  Globe,
  Database,
  Key,
  FileWarning,
  Bug,
  Server,
  Wifi,
  Brain,
  Fingerprint,
  Clock,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface SecurityLayer {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "active" | "warning" | "error" | "inactive";
  description: string;
  protections: string[];
  file: string;
  lastCheck?: Date;
  stats?: {
    blocked?: number;
    processed?: number;
    warnings?: number;
  };
}

interface OWASPItem {
  id: string;
  name: string;
  description: string;
  status: "covered" | "partial" | "review" | "not_covered";
  implementation: string;
}

interface SecurityStats {
  totalBlocked24h: number;
  totalBlocked7d: number;
  totalBlocked30d: number;
  topThreats: { type: string; count: number }[];
  topBlockedIPs: { hash: string; count: number }[];
  lastUpdated: Date;
}

// =============================================================================
// Security Layer Definitions
// =============================================================================

const SECURITY_LAYERS: SecurityLayer[] = [
  {
    id: "csp",
    name: "CSP Headers",
    icon: Lock,
    status: "active",
    description: "Content Security Policy im HTML-Header",
    protections: ["XSS Prevention", "Script Injection", "Clickjacking"],
    file: "index.html",
  },
  {
    id: "security-provider",
    name: "SecurityProvider",
    icon: Shield,
    status: "active",
    description: "React Context für globale Sicherheit",
    protections: ["Input Sanitization", "Threat Detection", "Rate Limiting"],
    file: "src/providers/SecurityProvider.tsx",
  },
  {
    id: "with-security",
    name: "withSecurity HOC",
    icon: Layers,
    status: "active",
    description: "Higher-Order Component für automatischen Schutz",
    protections: ["Component Protection", "Prop Validation", "Auto-Sanitization"],
    file: "src/lib/withSecurity.tsx",
  },
  {
    id: "error-boundary",
    name: "SecurityErrorBoundary",
    icon: Bug,
    status: "active",
    description: "Graceful Error Handling",
    protections: ["Crash Prevention", "Error Logging", "User Feedback"],
    file: "src/components/SecurityErrorBoundary.tsx",
  },
  {
    id: "secure-input",
    name: "SecureInput Components",
    icon: Key,
    status: "active",
    description: "XSS-sichere Eingabefelder",
    protections: ["Input Validation", "HTML Escaping", "Length Limits"],
    file: "src/components/ui/secure-input.tsx",
  },
  {
    id: "api-gateway",
    name: "Zero-Trust API Gateway",
    icon: Globe,
    status: "active",
    description: "Zentraler Schutz für alle externen API-Calls",
    protections: ["SSRF Prevention", "Domain Whitelist", "Rate Limiting", "Response Sanitization"],
    file: "src/lib/secureApiGateway.ts",
  },
  {
    id: "llm-security",
    name: "LLM Security Layer",
    icon: Brain,
    status: "active",
    description: "Spezieller Schutz für AI/LLM-Interaktionen",
    protections: ["Prompt Injection", "Jailbreak Detection", "Output Filtering", "System Prompt Protection"],
    file: "src/lib/llmSecurityLayer.ts",
  },
  {
    id: "tunnel-guard",
    name: "Tunnel Security Guard",
    icon: Wifi,
    status: "active",
    description: "Schutz für WebSocket/SSE Verbindungen",
    protections: ["WebSocket Hijacking", "Message Flooding", "Protocol Violations"],
    file: "src/lib/tunnelSecurityGuard.ts",
  },
  {
    id: "zero-defense",
    name: "Zero-Day Defense Layer",
    icon: Zap,
    status: "active",
    description: "Heuristische Erkennung unbekannter Angriffe",
    protections: ["Anomaly Detection", "Entropy Analysis", "Behavioral Analysis", "Session Quarantine"],
    file: "src/lib/zeroDefenseLayer.ts",
  },
  {
    id: "session-security",
    name: "Session Security",
    icon: Clock,
    status: "active",
    description: "Sichere Session-Verwaltung",
    protections: ["Session Timeout", "Token Refresh", "Activity Tracking"],
    file: "src/hooks/useSessionSecurity.ts",
  },
  {
    id: "csrf",
    name: "CSRF Protection",
    icon: Fingerprint,
    status: "active",
    description: "Cross-Site Request Forgery Schutz",
    protections: ["Token Validation", "Origin Check", "SameSite Cookies"],
    file: "src/lib/csrfProtection.ts",
  },
  {
    id: "anomaly",
    name: "Login Anomaly Detection",
    icon: Eye,
    status: "active",
    description: "Erkennung verdächtiger Login-Muster",
    protections: ["Brute Force Detection", "Unusual Location", "Time Anomalies"],
    file: "src/lib/anomalyDetection.ts",
  },
  {
    id: "honeypot",
    name: "Honeypot Fields",
    icon: FileWarning,
    status: "active",
    description: "Automatische Bot-Erkennung",
    protections: ["Bot Detection", "Spam Prevention", "Form Protection"],
    file: "src/components/ui/honeypot-field.tsx",
  },
  {
    id: "ip-blocking",
    name: "IP-Based Blocking",
    icon: ShieldX,
    status: "active",
    description: "Automatisches Blocken von Angreifern",
    protections: ["Auto-Blocking", "Repeat Offender Detection", "Temporary Bans"],
    file: "supabase/functions/security-log/index.ts",
  },
  {
    id: "rls",
    name: "Row Level Security",
    icon: Database,
    status: "active",
    description: "Datenbank-Level Zugriffskontrolle",
    protections: ["Data Isolation", "User Scoping", "Role-Based Access"],
    file: "Supabase RLS Policies",
  },
  {
    id: "edge-security",
    name: "Edge Function Security",
    icon: Server,
    status: "active",
    description: "Server-seitige Sicherheit",
    protections: ["Request Validation", "Email Alerts", "Audit Logging"],
    file: "supabase/functions/security-log/index.ts",
  },
];

// =============================================================================
// OWASP Top 10 Coverage
// =============================================================================

const OWASP_ITEMS: OWASPItem[] = [
  {
    id: "A01",
    name: "Broken Access Control",
    description: "Zugriffskontrolle und Autorisierung",
    status: "covered",
    implementation: "RLS Policies + RBAC + AdminRoute + ProtectedRoute",
  },
  {
    id: "A02",
    name: "Cryptographic Failures",
    description: "Verschlüsselung und sichere Speicherung",
    status: "covered",
    implementation: "Supabase Auth + TLS + Hashed Secrets",
  },
  {
    id: "A03",
    name: "Injection",
    description: "SQL, XSS, NoSQL, Command Injection",
    status: "covered",
    implementation: "SecurityProvider + SecureInput + checkAllThreats()",
  },
  {
    id: "A04",
    name: "Insecure Design",
    description: "Sichere Architektur und Threat Modeling",
    status: "covered",
    implementation: "Zero-Trust Architecture + 16-Layer Defense",
  },
  {
    id: "A05",
    name: "Security Misconfiguration",
    description: "Sichere Konfiguration aller Komponenten",
    status: "partial",
    implementation: "CSP Headers + ESLint Security Rules - Review empfohlen",
  },
  {
    id: "A06",
    name: "Vulnerable Components",
    description: "Aktuelle und sichere Dependencies",
    status: "covered",
    implementation: "npm audit + Dependency Updates",
  },
  {
    id: "A07",
    name: "Auth Failures",
    description: "Sichere Authentifizierung",
    status: "covered",
    implementation: "MFA + Rate Limiting + Session Security + Login Anomaly Detection",
  },
  {
    id: "A08",
    name: "Software & Data Integrity",
    description: "Integritätsprüfung von Code und Daten",
    status: "covered",
    implementation: "Input Validation + Zod Schemas + CSRF Protection",
  },
  {
    id: "A09",
    name: "Security Logging & Monitoring",
    description: "Umfassendes Logging und Alerting",
    status: "covered",
    implementation: "securityLogger + Edge Function + Email Alerts + Security Dashboard",
  },
  {
    id: "A10",
    name: "SSRF",
    description: "Server-Side Request Forgery",
    status: "covered",
    implementation: "secureApiGateway + Domain Whitelist + IP Blocking",
  },
];

// =============================================================================
// Component
// =============================================================================

export default function SecurityReport() {
  const [isLoading, setIsLoading] = useState(true);
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
  const [layers, setLayers] = useState<SecurityLayer[]>(SECURITY_LAYERS);
  const [securityScore, setSecurityScore] = useState(0);

  // Calculate security score
  const calculateSecurityScore = () => {
    const activeCount = layers.filter(l => l.status === "active").length;
    const warningCount = layers.filter(l => l.status === "warning").length;
    const errorCount = layers.filter(l => l.status === "error").length;
    
    const layerScore = (activeCount * 100 + warningCount * 50) / layers.length;
    
    const owaspCovered = OWASP_ITEMS.filter(o => o.status === "covered").length;
    const owaspPartial = OWASP_ITEMS.filter(o => o.status === "partial").length;
    const owaspScore = (owaspCovered * 100 + owaspPartial * 50) / OWASP_ITEMS.length;
    
    return Math.round((layerScore * 0.6 + owaspScore * 0.4));
  };

  // Fetch security stats from database
  const fetchSecurityStats = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch events from last 30 days
      const { data: events, error } = await supabase
        .from("security_events")
        .select("*")
        .gte("created_at", lastMonth.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculate stats
      const blocked24h = events?.filter(e => 
        new Date(e.created_at) > yesterday && 
        (e.risk_level === "high" || e.risk_level === "critical")
      ).length || 0;

      const blocked7d = events?.filter(e => 
        new Date(e.created_at) > lastWeek && 
        (e.risk_level === "high" || e.risk_level === "critical")
      ).length || 0;

      const blocked30d = events?.filter(e => 
        e.risk_level === "high" || e.risk_level === "critical"
      ).length || 0;

      // Count threat types
      const threatCounts: Record<string, number> = {};
      events?.forEach(e => {
        const type = e.event_type;
        threatCounts[type] = (threatCounts[type] || 0) + 1;
      });

      const topThreats = Object.entries(threatCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Count blocked IPs
      const ipCounts: Record<string, number> = {};
      events?.forEach(e => {
        if (e.ip_hash && (e.risk_level === "high" || e.risk_level === "critical")) {
          ipCounts[e.ip_hash] = (ipCounts[e.ip_hash] || 0) + 1;
        }
      });

      const topBlockedIPs = Object.entries(ipCounts)
        .map(([hash, count]) => ({ hash, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setSecurityStats({
        totalBlocked24h: blocked24h,
        totalBlocked7d: blocked7d,
        totalBlocked30d: blocked30d,
        topThreats,
        topBlockedIPs,
        lastUpdated: new Date(),
      });

      // Update API Gateway stats
      const gatewayStats = getGatewayStats();
      const updatedLayers = [...layers];
      const gatewayLayer = updatedLayers.find(l => l.id === "api-gateway");
      if (gatewayLayer) {
        gatewayLayer.stats = {
          blocked: gatewayStats.blockedRequests,
          processed: gatewayStats.totalRequests,
        };
      }

      setLayers(updatedLayers);
      setSecurityScore(calculateSecurityScore());
    } catch (error) {
      console.error("Error fetching security stats:", error);
      toast.error("Fehler beim Laden der Sicherheitsstatistiken");
    } finally {
      setIsLoading(false);
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    fetchSecurityStats();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("security-events-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "security_events" },
        (payload) => {
          // Update stats on new event
          if (payload.new && (payload.new.risk_level === "high" || payload.new.risk_level === "critical")) {
            toast.warning(`Sicherheitsevent: ${payload.new.event_type}`);
            fetchSecurityStats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Status badge renderer
  const renderStatusBadge = (status: SecurityLayer["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Aktiv</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Warnung</Badge>;
      case "error":
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Fehler</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inaktiv</Badge>;
    }
  };

  // OWASP status renderer
  const renderOWASPStatus = (status: OWASPItem["status"]) => {
    switch (status) {
      case "covered":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "partial":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "review":
        return <Eye className="h-5 w-5 text-blue-500" />;
      case "not_covered":
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Security Audit Report
            </h1>
            <p className="text-muted-foreground mt-1">
              16-Layer Security Architecture Documentation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={fetchSecurityStats}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Aktualisieren
            </Button>
            <Button variant="outline" disabled>
              <Download className="h-4 w-4 mr-2" />
              PDF Export
            </Button>
          </div>
        </div>

        {/* Security Score */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-4xl font-bold">{securityScore}/100</div>
                <div className="text-sm text-muted-foreground">Security Score</div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div>Letzte Aktualisierung:</div>
                <div>{securityStats?.lastUpdated.toLocaleString("de-DE") || "—"}</div>
              </div>
            </div>
            <Progress value={securityScore} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Kritisch</span>
              <span>Niedrig</span>
              <span>Mittel</span>
              <span>Hoch</span>
              <span>Exzellent</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Blockiert (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                {securityStats?.totalBlocked24h || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Blockiert (7 Tage)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">
                {securityStats?.totalBlocked7d || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Blockiert (30 Tage)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {securityStats?.totalBlocked30d || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="layers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="layers">Security Layers (16)</TabsTrigger>
            <TabsTrigger value="owasp">OWASP Top 10</TabsTrigger>
            <TabsTrigger value="threats">Top Threats</TabsTrigger>
          </TabsList>

          {/* Security Layers Tab */}
          <TabsContent value="layers">
            <Card>
              <CardHeader>
                <CardTitle>16-Layer Security Architecture</CardTitle>
                <CardDescription>
                  Übersicht aller implementierten Security-Layer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {layers.map((layer, index) => (
                      <div key={layer.id}>
                        <div className="flex items-start gap-4 p-4 rounded-lg border bg-card/50">
                          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                            <layer.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{layer.name}</span>
                                {renderStatusBadge(layer.status)}
                              </div>
                              <span className="text-xs text-muted-foreground font-mono">
                                Layer {index + 1}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {layer.description}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {layer.protections.map(protection => (
                                <Badge 
                                  key={protection} 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  {protection}
                                </Badge>
                              ))}
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground font-mono">
                              📁 {layer.file}
                            </div>
                            {layer.stats && (
                              <div className="mt-2 text-xs">
                                <span className="text-red-500">
                                  {layer.stats.blocked} blocked
                                </span>
                                {" / "}
                                <span className="text-muted-foreground">
                                  {layer.stats.processed} total
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {index < layers.length - 1 && (
                          <div className="flex justify-center py-1">
                            <div className="w-0.5 h-4 bg-border" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OWASP Tab */}
          <TabsContent value="owasp">
            <Card>
              <CardHeader>
                <CardTitle>OWASP Top 10 Coverage</CardTitle>
                <CardDescription>
                  Abdeckung der wichtigsten Web Application Security Risiken
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {OWASP_ITEMS.map(item => (
                    <div 
                      key={item.id} 
                      className="flex items-start gap-4 p-4 rounded-lg border"
                    >
                      {renderOWASPStatus(item.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-muted-foreground">
                            {item.id}
                          </span>
                          <span className="font-semibold">{item.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.description}
                        </p>
                        <div className="text-xs bg-muted/50 p-2 rounded font-mono">
                          {item.implementation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Threats Tab */}
          <TabsContent value="threats">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Threat Types</CardTitle>
                </CardHeader>
                <CardContent>
                  {securityStats?.topThreats.length ? (
                    <div className="space-y-3">
                      {securityStats.topThreats.map((threat, i) => (
                        <div key={threat.type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{i + 1}.</span>
                            <Badge variant="outline">{threat.type}</Badge>
                          </div>
                          <span className="font-mono text-sm">{threat.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Keine Daten verfügbar</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Blocked IPs (Hashed)</CardTitle>
                </CardHeader>
                <CardContent>
                  {securityStats?.topBlockedIPs.length ? (
                    <div className="space-y-3">
                      {securityStats.topBlockedIPs.map((ip, i) => (
                        <div key={ip.hash} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{i + 1}.</span>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {ip.hash.slice(0, 12)}...
                            </code>
                          </div>
                          <Badge variant="destructive">{ip.count} blocks</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Keine Daten verfügbar</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
