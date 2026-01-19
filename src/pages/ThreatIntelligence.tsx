import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuditLog } from "@/hooks/useAdminAuditLog";
import { toast } from "sonner";
import {
  Shield,
  RefreshCw,
  AlertTriangle,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Globe,
  Zap,
  Eye,
  ShieldOff,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface ThreatFeed {
  id: string;
  feed_name: string;
  feed_url: string;
  last_sync_at: string | null;
  sync_status: string;
  total_entries: number | null;
  enabled: boolean | null;
}

interface RecentThreat {
  id: string;
  ip_hash: string | null;
  event_type: string;
  risk_level: string;
  created_at: string;
  is_blocked: boolean;
}

interface ThreatStats {
  knownBadIps: number;
  activeFeeds: number;
  autoBlocked: number;
  recentThreats: number;
}

export default function ThreatIntelligence() {
  const [feeds, setFeeds] = useState<ThreatFeed[]>([]);
  const [recentThreats, setRecentThreats] = useState<RecentThreat[]>([]);
  const [stats, setStats] = useState<ThreatStats>({
    knownBadIps: 0,
    activeFeeds: 0,
    autoBlocked: 0,
    recentThreats: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoBlockEnabled, setAutoBlockEnabled] = useState(true);
  const { logAdminAction } = useAdminAuditLog();

  const fetchData = useCallback(async () => {
    try {
      // Fetch threat feeds
      const { data: feedsData } = await supabase
        .from("threat_feeds")
        .select("*")
        .order("feed_name");

      if (feedsData) {
        setFeeds(feedsData);
      }

      // Fetch threat entries count
      const { count: entriesCount } = await supabase
        .from("threat_feed_entries")
        .select("*", { count: "exact", head: true });

      // Fetch auto-blocked count
      const { count: autoBlockedCount } = await supabase
        .from("threat_feed_entries")
        .select("*", { count: "exact", head: true })
        .eq("auto_blocked", true);

      // Fetch blocked IPs count
      const { count: blockedCount } = await supabase
        .from("blocked_ips")
        .select("*", { count: "exact", head: true });

      // Fetch recent high-risk security events
      const { data: eventsData } = await supabase
        .from("security_events")
        .select("id, ip_hash, event_type, risk_level, created_at")
        .in("risk_level", ["high", "critical"])
        .order("created_at", { ascending: false })
        .limit(20);

      if (eventsData) {
        // Check which IPs are blocked
        const ipHashes = eventsData.map((e) => e.ip_hash).filter((hash): hash is string => !!hash);
        const { data: blockedIps } = await supabase
          .from("blocked_ips")
          .select("ip_hash")
          .in("ip_hash", ipHashes);

        const blockedSet = new Set(blockedIps?.map((b) => b.ip_hash) || []);

        setRecentThreats(
          eventsData.map((e) => ({
            ...e,
            is_blocked: blockedSet.has(e.ip_hash || ""),
          }))
        );
      }

      setStats({
        knownBadIps: entriesCount || 0,
        activeFeeds: feedsData?.filter((f) => f.enabled).length || 0,
        autoBlocked: autoBlockedCount || 0,
        recentThreats: blockedCount || 0,
      });
    } catch (error) {
      console.error("Error fetching threat data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSyncFeeds = async () => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("threat-intel", {
        body: { action: "sync" },
      });

      if (error) throw error;

      toast.success("Threat-Feeds werden synchronisiert");
      await logAdminAction({
        action: "security_scan_trigger",
        newValues: { type: "threat_feed_sync" },
      });

      // Refresh data after a delay
      setTimeout(fetchData, 2000);
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Fehler beim Synchronisieren der Feeds");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleFeed = async (feedId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("threat_feeds")
        .update({ enabled })
        .eq("id", feedId);

      if (error) throw error;

      setFeeds((prev) =>
        prev.map((f) => (f.id === feedId ? { ...f, enabled } : f))
      );

      await logAdminAction({
        action: "threat_feed_toggle",
        targetTable: "threat_feeds",
        targetId: feedId,
        newValues: { enabled },
      });

      toast.success(enabled ? "Feed aktiviert" : "Feed deaktiviert");
    } catch (error) {
      console.error("Toggle error:", error);
      toast.error("Fehler beim Umschalten des Feeds");
    }
  };

  const handleBlockIp = async (ipHash: string) => {
    try {
      const { error } = await supabase.from("blocked_ips").insert({
        ip_hash: ipHash,
        reason: "Manual block from Threat Intelligence Dashboard",
      });

      if (error && !error.message.includes("duplicate")) throw error;

      await logAdminAction({
        action: "ip_block",
        targetTable: "blocked_ips",
        newValues: { ip_hash: ipHash, source: "threat_intel" },
      });

      toast.success("IP-Adresse blockiert");
      fetchData();
    } catch (error) {
      console.error("Block error:", error);
      toast.error("Fehler beim Blockieren der IP");
    }
  };

  const getRiskBadge = (level: string) => {
    const variants: Record<string, { className: string; icon: React.ReactNode }> = {
      critical: { className: "bg-red-500 text-white", icon: <AlertTriangle className="h-3 w-3" /> },
      high: { className: "bg-orange-500 text-white", icon: <AlertTriangle className="h-3 w-3" /> },
      medium: { className: "bg-yellow-500 text-white", icon: <Clock className="h-3 w-3" /> },
      low: { className: "bg-blue-500 text-white", icon: <Eye className="h-3 w-3" /> },
    };
    const v = variants[level] || variants.low;
    return (
      <Badge className={v.className}>
        {v.icon}
        <span className="ml-1 capitalize">{level}</span>
      </Badge>
    );
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Synchronisiert</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Fehlgeschlagen</Badge>;
      case "syncing":
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Synchronisiert...</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Ausstehend</Badge>;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Threat Intelligence</h1>
              <p className="text-muted-foreground">
                Externe Threat-Feeds und automatische IP-Blockierung
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Auto-Block</span>
              <Switch
                checked={autoBlockEnabled}
                onCheckedChange={setAutoBlockEnabled}
              />
            </div>
            <Button onClick={handleSyncFeeds} disabled={isSyncing}>
              {isSyncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync Now
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Bekannte Bad IPs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.knownBadIps.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Aktive Feeds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{stats.activeFeeds}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Auto-Blockiert</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{stats.autoBlocked}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Blockierte IPs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShieldOff className="h-5 w-5 text-orange-500" />
                <span className="text-2xl font-bold">{stats.recentThreats}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Threats */}
        <Card>
          <CardHeader>
            <CardTitle>Aktuelle Bedrohungen</CardTitle>
            <CardDescription>
              Hochriskante Security-Events der letzten 24 Stunden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP (Hash)</TableHead>
                  <TableHead>Bedrohungstyp</TableHead>
                  <TableHead>Risiko</TableHead>
                  <TableHead>Zeit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentThreats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Keine hochriskanten Bedrohungen gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  recentThreats.map((threat) => (
                    <TableRow key={threat.id}>
                      <TableCell className="font-mono text-sm">
                        {threat.ip_hash?.substring(0, 12)}...
                      </TableCell>
                      <TableCell>{threat.event_type.replace(/_/g, " ")}</TableCell>
                      <TableCell>{getRiskBadge(threat.risk_level)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(threat.created_at), {
                          addSuffix: true,
                          locale: de,
                        })}
                      </TableCell>
                      <TableCell>
                        {threat.is_blocked ? (
                          <Badge variant="destructive">
                            <Ban className="h-3 w-3 mr-1" />
                            Blockiert
                          </Badge>
                        ) : (
                          <Badge variant="outline">Aktiv</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!threat.is_blocked && threat.ip_hash && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleBlockIp(threat.ip_hash!)}
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            Blockieren
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Separator />

        {/* Threat Feed Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Threat-Feed Quellen</CardTitle>
            <CardDescription>
              Externe Threat-Intelligence-Feeds für automatische Erkennung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feed Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Letzte Sync</TableHead>
                  <TableHead>Einträge</TableHead>
                  <TableHead>Aktiv</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeds.map((feed) => (
                  <TableRow key={feed.id}>
                    <TableCell className="font-medium">{feed.feed_name}</TableCell>
                    <TableCell>{getSyncStatusBadge(feed.sync_status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {feed.last_sync_at
                        ? formatDistanceToNow(new Date(feed.last_sync_at), {
                          addSuffix: true,
                          locale: de,
                        })
                        : "Noch nie"}
                    </TableCell>
                    <TableCell>{(feed.total_entries || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Switch
                        checked={feed.enabled || false}
                        onCheckedChange={(checked) => handleToggleFeed(feed.id, checked)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
