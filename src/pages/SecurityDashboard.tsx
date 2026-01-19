import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Shield,
  AlertTriangle,
  Bot,
  Skull,
  RefreshCw,
  Download,
  ArrowLeft,
  Activity,
  ClipboardCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { SecurityChecklist } from "@/components/security/SecurityChecklist";

interface SecurityEvent {
  id: string;
  created_at: string;
  event_type: string;
  risk_level: string;
  user_id: string | null;
  ip_hash: string | null;
  user_agent_hash: string | null;
  details: unknown;
  email_sent: boolean | null;
  is_bot: boolean | null;
  is_phishing: boolean | null;
}

const ITEMS_PER_PAGE = 10;

const riskColors: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/50",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/50",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  low: "bg-green-500/20 text-green-400 border-green-500/50",
};

export default function SecurityDashboard() {
  const { signOut } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("24h");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    critical24h: 0,
    botAttacks: 0,
    phishing: 0,
  });

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("security_events")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply filters
      if (eventTypeFilter !== "all") {
        query = query.eq("event_type", eventTypeFilter);
      }
      if (riskFilter !== "all") {
        query = query.eq("risk_level", riskFilter);
      }

      // Time filter
      const now = new Date();
      if (timeFilter === "1h") {
        query = query.gte("created_at", new Date(now.getTime() - 60 * 60 * 1000).toISOString());
      } else if (timeFilter === "24h") {
        query = query.gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
      } else if (timeFilter === "7d") {
        query = query.gte("created_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
      } else if (timeFilter === "30d") {
        query = query.gte("created_at", new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());
      }

      // Pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setEvents(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Error fetching security events:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // Total events
      const { count: total } = await supabase
        .from("security_events")
        .select("*", { count: "exact", head: true });

      // Critical in last 24h
      const { count: critical24h } = await supabase
        .from("security_events")
        .select("*", { count: "exact", head: true })
        .eq("risk_level", "critical")
        .gte("created_at", yesterday);

      // Bot attacks
      const { count: botAttacks } = await supabase
        .from("security_events")
        .select("*", { count: "exact", head: true })
        .eq("is_bot", true);

      // Phishing attempts
      const { count: phishing } = await supabase
        .from("security_events")
        .select("*", { count: "exact", head: true })
        .eq("is_phishing", true);

      setStats({
        total: total || 0,
        critical24h: critical24h || 0,
        botAttacks: botAttacks || 0,
        phishing: phishing || 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [page, eventTypeFilter, riskFilter, timeFilter]);

  const exportCSV = () => {
    const headers = ["Zeitpunkt", "Event-Typ", "Risikostufe", "IP-Hash", "Bot", "Phishing", "Details"];
    const rows = events.map((e) => [
      format(new Date(e.created_at), "dd.MM.yyyy HH:mm:ss"),
      e.event_type,
      e.risk_level,
      e.ip_hash || "-",
      e.is_bot ? "Ja" : "Nein",
      e.is_phishing ? "Ja" : "Nein",
      JSON.stringify(e.details),
    ]);

    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `security-events-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Security Dashboard
              </h1>
              <p className="text-muted-foreground text-sm">Übersicht aller Sicherheitsereignisse</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { fetchEvents(); fetchStats(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV Export
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Abmelden
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Gesamt Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                Kritisch (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-400">{stats.critical24h}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Bot className="h-4 w-4 text-orange-400" />
                Bot-Angriffe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-400">{stats.botAttacks}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Skull className="h-4 w-4 text-purple-400" />
                Phishing-Versuche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-400">{stats.phishing}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Events and Checklist */}
        <Tabs defaultValue="events" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Security Events
            </TabsTrigger>
            <TabsTrigger value="checklist" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Checkliste
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="space-y-4">
            <SecurityChecklist />
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            {/* Filters */}
            <Card className="bg-card border-border">
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-sm text-muted-foreground mb-1 block">Zeitraum</label>
                    <Select value={timeFilter} onValueChange={(v) => { setTimeFilter(v); setPage(1); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">Letzte Stunde</SelectItem>
                        <SelectItem value="24h">Letzte 24 Stunden</SelectItem>
                        <SelectItem value="7d">Letzte 7 Tage</SelectItem>
                        <SelectItem value="30d">Letzte 30 Tage</SelectItem>
                        <SelectItem value="all">Alle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[150px]">
                    <label className="text-sm text-muted-foreground mb-1 block">Risikostufe</label>
                    <Select value={riskFilter} onValueChange={(v) => { setRiskFilter(v); setPage(1); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle</SelectItem>
                        <SelectItem value="critical">Kritisch</SelectItem>
                        <SelectItem value="high">Hoch</SelectItem>
                        <SelectItem value="medium">Mittel</SelectItem>
                        <SelectItem value="low">Niedrig</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[150px]">
                    <label className="text-sm text-muted-foreground mb-1 block">Event-Typ</label>
                    <Select value={eventTypeFilter} onValueChange={(v) => { setEventTypeFilter(v); setPage(1); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle</SelectItem>
                        <SelectItem value="threat_detected">Bedrohung erkannt</SelectItem>
                        <SelectItem value="auth_failure">Auth-Fehler</SelectItem>
                        <SelectItem value="rate_limit">Rate-Limit</SelectItem>
                        <SelectItem value="xss_attempt">XSS-Versuch</SelectItem>
                        <SelectItem value="sql_injection">SQL-Injection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Events Table */}
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Zeitpunkt</TableHead>
                      <TableHead className="text-muted-foreground">Event-Typ</TableHead>
                      <TableHead className="text-muted-foreground">Risikostufe</TableHead>
                      <TableHead className="text-muted-foreground">IP-Hash</TableHead>
                      <TableHead className="text-muted-foreground">Flags</TableHead>
                      <TableHead className="text-muted-foreground">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="border-border">
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        </TableRow>
                      ))
                    ) : events.length === 0 ? (
                      <TableRow className="border-border">
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Keine Sicherheitsereignisse gefunden
                        </TableCell>
                      </TableRow>
                    ) : (
                      events.map((event) => (
                        <TableRow key={event.id} className="border-border hover:bg-muted/50">
                          <TableCell className="text-foreground">
                            {format(new Date(event.created_at), "dd.MM.yyyy HH:mm:ss", { locale: de })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {event.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={riskColors[event.risk_level] || riskColors.low}>
                              {event.risk_level}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {event.ip_hash?.slice(0, 12) || "-"}...
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {event.is_bot && (
                                <Badge variant="outline" className="text-orange-400 border-orange-400/50">
                                  <Bot className="h-3 w-3 mr-1" />
                                  Bot
                                </Badge>
                              )}
                              {event.is_phishing && (
                                <Badge variant="outline" className="text-purple-400 border-purple-400/50">
                                  <Skull className="h-3 w-3 mr-1" />
                                  Phishing
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground text-xs">
                            {JSON.stringify(event.details).slice(0, 50)}...
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={page === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
