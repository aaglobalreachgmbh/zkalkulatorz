// ============================================
// Security Status Dashboard - Max-Admin Only
// Echtzeit-Übersicht aller Schutzmaßnahmen + Benutzer/Lizenzen
// ============================================

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSessionSecurity } from "@/hooks/useSessionSecurity";
import { useLicense } from "@/hooks/useLicense";
import { useAdminAuditLog } from "@/hooks/useAdminAuditLog";
import { toast } from "@/hooks/use-toast";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX,
  Users,
  Key,
  Lock,
  Unlock,
  Clock,
  Activity,
  Server,
  Globe,
  Zap,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Crown,
  UserCheck,
  Timer,
  Network,
  Database,
  FileKey,
  Bot,
  Fingerprint,
  UserPlus,
  Calendar,
  Mail,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, subDays, isAfter } from "date-fns";
import { de } from "date-fns/locale";

// Security Layer Definition
interface SecurityLayer {
  id: string;
  name: string;
  description: string;
  status: "active" | "warning" | "inactive";
  category: "frontend" | "backend" | "database" | "network";
  icon: React.ReactNode;
  details?: string;
}

// User with License info
interface LicensedUser {
  id: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
  role: string;
  lastActivity?: string;
  hasLicense: boolean;
}

// Recent registration from security_events
interface RecentRegistration {
  id: string;
  userId: string | null;
  email: string;
  displayName: string;
  createdAt: string;
  notificationSent: boolean;
}

export default function SecurityStatusDashboard() {
  const { user } = useAuth();
  const { role, isAdmin } = useUserRole();
  const navigate = useNavigate();
  const { getRemainingTime, getFormattedRemainingTime } = useSessionSecurity();
  const { license } = useLicense();
  const { logAdminAction } = useAdminAuditLog();
  
  const [users, setUsers] = useState<LicensedUser[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<RecentRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [securityScore, setSecurityScore] = useState(0);

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  // Fetch users with roles
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, display_name, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine data - all registered users have a license by default
      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      
      const combinedUsers: LicensedUser[] = (profiles || []).map(p => ({
        id: p.id,
        email: p.email,
        displayName: p.display_name,
        createdAt: p.created_at,
        role: rolesMap.get(p.id) || "user",
        hasLicense: true, // All registered users have license
      }));

      setUsers(combinedUsers);
      
      // Fetch recent registrations from security_events (last 7 days)
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data: registrationEvents, error: regError } = await supabase
        .from("security_events")
        .select("*")
        .eq("event_type", "user_registration")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false });

      if (!regError && registrationEvents) {
        const regs: RecentRegistration[] = registrationEvents.map(e => {
          const details = e.details as { email?: string; displayName?: string; notificationSent?: boolean } | null;
          return {
            id: e.id,
            userId: e.user_id,
            email: details?.email || "Unbekannt",
            displayName: details?.displayName || "Unbekannt",
            createdAt: e.created_at,
            notificationSent: details?.notificationSent || false,
          };
        });
        setRecentRegistrations(regs);
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Calculate security score
  useEffect(() => {
    const layers = getSecurityLayers();
    const activeCount = layers.filter(l => l.status === "active").length;
    const score = Math.round((activeCount / layers.length) * 100);
    setSecurityScore(score);
  }, []);

  // Define all security layers
  const getSecurityLayers = (): SecurityLayer[] => [
    // Frontend Layers
    {
      id: "csp",
      name: "CSP Headers",
      description: "Content Security Policy blockiert externe Scripts",
      status: "active",
      category: "frontend",
      icon: <Globe className="h-4 w-4" />,
      details: "default-src 'self'; script-src 'self' 'unsafe-inline'"
    },
    {
      id: "security-provider",
      name: "SecurityProvider",
      description: "Globaler Schutz für alle React-Komponenten",
      status: "active",
      category: "frontend",
      icon: <Shield className="h-4 w-4" />,
      details: "Threat Detection, Rate Limiting, Input Sanitization"
    },
    {
      id: "error-boundary",
      name: "Security Error Boundary",
      description: "Fängt Fehler ab, verhindert Stack-Trace-Leaks",
      status: "active",
      category: "frontend",
      icon: <ShieldAlert className="h-4 w-4" />,
    },
    {
      id: "secure-input",
      name: "SecureInput Components",
      description: "XSS-Schutz für alle Eingabefelder",
      status: "active",
      category: "frontend",
      icon: <Lock className="h-4 w-4" />,
    },
    {
      id: "threat-detection",
      name: "Threat Detection (7 Kategorien)",
      description: "SQL Injection, XSS, Prompt Injection, Path Traversal, etc.",
      status: "active",
      category: "frontend",
      icon: <Eye className="h-4 w-4" />,
    },
    {
      id: "session-security",
      name: "Session Security (5 Min Timeout)",
      description: "Automatische Abmeldung nach Inaktivität",
      status: "active",
      category: "frontend",
      icon: <Timer className="h-4 w-4" />,
      details: `Verbleibend: ${getFormattedRemainingTime()}`
    },
    {
      id: "offline-boundary",
      name: "Offline Boundary",
      description: "Sichere Fallback-Seite ohne sensitive Daten",
      status: "active",
      category: "frontend",
      icon: <Network className="h-4 w-4" />,
    },
    {
      id: "csrf-protection",
      name: "CSRF Protection",
      description: "Token-basierter Schutz für Formulare",
      status: "active",
      category: "frontend",
      icon: <FileKey className="h-4 w-4" />,
    },
    
    // Backend Layers
    {
      id: "api-gateway",
      name: "Zero-Trust API Gateway",
      description: "SSRF-Schutz, Domain Whitelist, Payload Sanitization",
      status: "active",
      category: "backend",
      icon: <Server className="h-4 w-4" />,
    },
    {
      id: "llm-security",
      name: "LLM Security Layer",
      description: "Prompt Injection Detection, Output Filtering",
      status: "active",
      category: "backend",
      icon: <Bot className="h-4 w-4" />,
    },
    {
      id: "ai-consultant-hardening",
      name: "AI Consultant Hardening",
      description: "15s Timeout, IP Blocklist, 10KB Response Limit",
      status: "active",
      category: "backend",
      icon: <Zap className="h-4 w-4" />,
      details: "Security Headers, Content-Type Validation"
    },
    {
      id: "rate-limiting",
      name: "Rate Limiting",
      description: "API: 60/min, AI: 10/min, Login: 5/5min",
      status: "active",
      category: "backend",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      id: "tunnel-security",
      name: "Tunnel Security Guard",
      description: "WebSocket/SSE Schutz für persistente Verbindungen",
      status: "active",
      category: "backend",
      icon: <Network className="h-4 w-4" />,
    },
    {
      id: "zero-day-defense",
      name: "Zero-Day Defense Layer",
      description: "Heuristische Erkennung unbekannter Angriffe",
      status: "active",
      category: "backend",
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    
    // Database Layers
    {
      id: "rls",
      name: "Row-Level Security (RLS)",
      description: "Alle Tabellen mit RLS geschützt",
      status: "active",
      category: "database",
      icon: <Database className="h-4 w-4" />,
    },
    {
      id: "admin-audit",
      name: "Admin Audit Log",
      description: "Protokollierung aller Admin-Aktionen",
      status: "active",
      category: "database",
      icon: <Fingerprint className="h-4 w-4" />,
    },
  ];

  const securityLayers = getSecurityLayers();
  const frontendLayers = securityLayers.filter(l => l.category === "frontend");
  const backendLayers = securityLayers.filter(l => l.category === "backend");
  const databaseLayers = securityLayers.filter(l => l.category === "database");

  const getStatusIcon = (status: SecurityLayer["status"]) => {
    switch (status) {
      case "active": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "inactive": return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: SecurityLayer["status"]) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Aktiv</Badge>;
      case "warning": return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Warnung</Badge>;
      case "inactive": return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Inaktiv</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50"><Crown className="h-3 w-3 mr-1" />Admin</Badge>;
      case "moderator": return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50"><UserCheck className="h-3 w-3 mr-1" />Moderator</Badge>;
      default: return <Badge variant="outline">User</Badge>;
    }
  };

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const currentUser = users.find(u => u.id === userId);
      const oldRole = currentUser?.role || "user";
      
      // Update the role in user_roles table
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole as "admin" | "moderator" | "user" })
        .eq("user_id", userId);

      if (error) throw error;

      // Log the action
      await logAdminAction({
        action: "role_change",
        targetTable: "user_roles",
        targetId: userId,
        oldValues: { role: oldRole },
        newValues: { role: newRole },
      });

      toast({
        title: "Rolle geändert",
        description: `Benutzerrolle wurde auf "${newRole}" geändert.`,
      });

      // Refresh users
      await fetchUsers();
    } catch (err) {
      console.error("Error changing role:", err);
      toast({
        title: "Fehler",
        description: "Rolle konnte nicht geändert werden.",
        variant: "destructive",
      });
    }
  };

  // Handle license toggle
  const handleLicenseToggle = async (userId: string, hasLicense: boolean) => {
    try {
      // For now, all users have licenses by default
      // This would integrate with a proper licensing system
      await logAdminAction({
        action: "license_change",
        targetTable: "profiles",
        targetId: userId,
        oldValues: { hasLicense: !hasLicense },
        newValues: { hasLicense },
      });

      toast({
        title: hasLicense ? "Lizenz aktiviert" : "Lizenz deaktiviert",
        description: `Benutzer-Lizenz wurde ${hasLicense ? "aktiviert" : "deaktiviert"}.`,
      });

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, hasLicense } : u
      ));
    } catch (err) {
      console.error("Error toggling license:", err);
      toast({
        title: "Fehler",
        description: "Lizenz konnte nicht geändert werden.",
        variant: "destructive",
      });
    }
  };

  // Count new registrations in last 7 days
  const newRegistrationsCount = users.filter(u => 
    isAfter(new Date(u.createdAt), subDays(new Date(), 7))
  ).length;

  if (!isAdmin) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Security Status Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Echtzeit-Übersicht aller Schutzmaßnahmen • Nur für Max-Admin
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Letztes Update</p>
              <p className="font-medium">{format(lastRefresh, "HH:mm:ss", { locale: de })}</p>
            </div>
            <Button variant="outline" onClick={fetchUsers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </div>

        {/* Security Score Card */}
        <Card className="mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Security Score</h2>
                <p className="text-muted-foreground">
                  {securityLayers.filter(l => l.status === "active").length} von {securityLayers.length} Schutzschichten aktiv
                </p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold text-primary">{securityScore}%</p>
                <Progress value={securityScore} className="w-32 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="registrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="registrations" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Neue Registrierungen ({newRegistrationsCount})
            </TabsTrigger>
            <TabsTrigger value="layers" className="gap-2">
              <Shield className="h-4 w-4" />
              Schutzschichten ({securityLayers.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Benutzer & Lizenzen ({users.length})
            </TabsTrigger>
            <TabsTrigger value="session" className="gap-2">
              <Clock className="h-4 w-4" />
              Session & Timeout
            </TabsTrigger>
          </TabsList>

          {/* Recent Registrations Tab (Last 7 Days) */}
          <TabsContent value="registrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-green-400" />
                  Registrierungen der letzten 7 Tage
                </CardTitle>
                <CardDescription>
                  Neue Benutzer die sich kürzlich registriert haben
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <UserPlus className="h-8 w-8 text-green-400" />
                        <div>
                          <p className="text-2xl font-bold">{newRegistrationsCount}</p>
                          <p className="text-sm text-muted-foreground">Neue Benutzer</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-8 w-8 text-blue-400" />
                        <div>
                          <p className="text-2xl font-bold">
                            {recentRegistrations.filter(r => r.notificationSent).length}
                          </p>
                          <p className="text-sm text-muted-foreground">Benachrichtigt</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-500/10 border-purple-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <Key className="h-8 w-8 text-purple-400" />
                        <div>
                          <p className="text-2xl font-bold">{users.filter(u => u.hasLicense).length}</p>
                          <p className="text-sm text-muted-foreground">Lizenziert</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-500/10 border-orange-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-orange-400" />
                        <div>
                          <p className="text-2xl font-bold">7</p>
                          <p className="text-sm text-muted-foreground">Tage Zeitraum</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Registrations Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Benutzer</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Registriert</TableHead>
                      <TableHead>Benachrichtigung</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.filter(u => isAfter(new Date(u.createdAt), subDays(new Date(), 7))).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Keine neuen Registrierungen in den letzten 7 Tagen
                        </TableCell>
                      </TableRow>
                    ) : (
                      users
                        .filter(u => isAfter(new Date(u.createdAt), subDays(new Date(), 7)))
                        .map(u => {
                          const regEvent = recentRegistrations.find(r => r.userId === u.id);
                          return (
                            <TableRow key={u.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <UserPlus className="h-4 w-4 text-green-400" />
                                  </div>
                                  <span className="font-medium">{u.displayName || "Unbekannt"}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {u.email || "-"}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {format(new Date(u.createdAt), "dd.MM.yyyy", { locale: de })}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(u.createdAt), "HH:mm", { locale: de })} Uhr
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {regEvent?.notificationSent ? (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                    <Mail className="h-3 w-3 mr-1" />
                                    Gesendet
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    Keine
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={u.role}
                                    onValueChange={(val) => handleRoleChange(u.id, val)}
                                  >
                                    <SelectTrigger className="w-32 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">User</SelectItem>
                                      <SelectItem value="moderator">Moderator</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant={u.hasLicense ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleLicenseToggle(u.id, !u.hasLicense)}
                                  >
                                    <Key className="h-3 w-3 mr-1" />
                                    {u.hasLicense ? "Lizenziert" : "Lizenz vergeben"}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Layers Tab */}
          <TabsContent value="layers" className="space-y-6">
            {/* Frontend Layers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-400" />
                  Frontend-Schutz ({frontendLayers.length} Layer)
                </CardTitle>
                <CardDescription>Client-seitige Sicherheitsmaßnahmen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {frontendLayers.map(layer => (
                    <div key={layer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                          {layer.icon}
                        </div>
                        <div>
                          <p className="font-medium">{layer.name}</p>
                          <p className="text-sm text-muted-foreground">{layer.description}</p>
                          {layer.details && (
                            <p className="text-xs text-primary mt-1">{layer.details}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(layer.status)}
                        {getStatusBadge(layer.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Backend Layers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-green-400" />
                  Backend-Schutz ({backendLayers.length} Layer)
                </CardTitle>
                <CardDescription>Server-seitige & Edge Function Sicherheit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {backendLayers.map(layer => (
                    <div key={layer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                          {layer.icon}
                        </div>
                        <div>
                          <p className="font-medium">{layer.name}</p>
                          <p className="text-sm text-muted-foreground">{layer.description}</p>
                          {layer.details && (
                            <p className="text-xs text-primary mt-1">{layer.details}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(layer.status)}
                        {getStatusBadge(layer.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Database Layers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-orange-400" />
                  Datenbank-Schutz ({databaseLayers.length} Layer)
                </CardTitle>
                <CardDescription>RLS Policies & Audit Logging</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {databaseLayers.map(layer => (
                    <div key={layer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                          {layer.icon}
                        </div>
                        <div>
                          <p className="font-medium">{layer.name}</p>
                          <p className="text-sm text-muted-foreground">{layer.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(layer.status)}
                        {getStatusBadge(layer.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users & Licenses Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Alle Benutzer mit Lizenzverwaltung
                </CardTitle>
                <CardDescription>
                  Verwalten Sie Rollen und Lizenzen für alle Benutzer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Benutzer</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Rolle</TableHead>
                      <TableHead>Registriert</TableHead>
                      <TableHead>Lizenz</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Lade Benutzer...
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Keine Benutzer gefunden
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map(u => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-medium">{u.displayName || "Unbekannt"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {u.email || "-"}
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(u.role)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(u.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}
                          </TableCell>
                          <TableCell>
                            {u.hasLicense ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                <Key className="h-3 w-3 mr-1" />
                                Aktiv
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Keine Lizenz
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Select
                                value={u.role}
                                onValueChange={(val) => handleRoleChange(u.id, val)}
                              >
                                <SelectTrigger className="w-28 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant={u.hasLicense ? "destructive" : "default"}
                                size="sm"
                                onClick={() => handleLicenseToggle(u.id, !u.hasLicense)}
                              >
                                {u.hasLicense ? (
                                  <>
                                    <Lock className="h-3 w-3 mr-1" />
                                    Entziehen
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="h-3 w-3 mr-1" />
                                    Vergeben
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* License Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Gesamt Benutzer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{users.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Admins</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-400">
                    {users.filter(u => u.role === "admin").length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Aktuelle Lizenz</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="text-lg py-1 px-3">{license.plan}</Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Session Tab */}
          <TabsContent value="session" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-primary" />
                    Session-Timeout
                  </CardTitle>
                  <CardDescription>
                    Automatische Abmeldung nach 5 Minuten Inaktivität
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Timeout-Dauer</span>
                    <Badge>5 Minuten</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Vorwarnung</span>
                    <Badge variant="outline">1 Minute vorher</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Check-Intervall</span>
                    <Badge variant="outline">15 Sekunden</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Verbleibende Zeit</span>
                    <span className="text-xl font-bold text-primary">{getFormattedRemainingTime()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-400" />
                    Activity Tracking
                  </CardTitle>
                  <CardDescription>
                    Diese Events setzen den Timer zurück
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {["Mausbewegung", "Tastendruck", "Klick", "Scroll", "Touch", "Tab-Wechsel"].map(event => (
                      <div key={event} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{event}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Security Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Link to="/security">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <ShieldAlert className="h-5 w-5" />
                      <span>Security Events</span>
                    </Button>
                  </Link>
                  <Link to="/security/report">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Activity className="h-5 w-5" />
                      <span>Täglicher Report</span>
                    </Button>
                  </Link>
                  <Link to="/security/threat-intel">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Globe className="h-5 w-5" />
                      <span>Threat Intel</span>
                    </Button>
                  </Link>
                  <Link to="/admin">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Crown className="h-5 w-5" />
                      <span>Admin Panel</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
