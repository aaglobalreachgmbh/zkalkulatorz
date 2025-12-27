/**
 * Activity Dashboard
 * 
 * Admin-Dashboard für die Anzeige aller Benutzeraktivitäten.
 * Features: Filterung, Timeline-Ansicht, Export, Realtime-Updates.
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Download, 
  RefreshCw, 
  Activity, 
  Users, 
  FileText, 
  Building2, 
  FolderOpen,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { format, formatDistanceToNow, startOfDay, isToday, isYesterday, subDays } from "date-fns";
import { de } from "date-fns/locale";

// =====================================================
// Types
// =====================================================

interface ActivityLogEntry {
  id: string;
  user_id: string;
  tenant_id: string;
  department_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  summary: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface ActivityStats {
  totalToday: number;
  totalThisWeek: number;
  topAction: string;
  topResource: string;
}

// =====================================================
// Constants
// =====================================================

const ITEMS_PER_PAGE = 50;

const ACTION_LABELS: Record<string, string> = {
  offer_create: "Angebot erstellt",
  offer_update: "Angebot aktualisiert",
  offer_delete: "Angebot gelöscht",
  offer_rename: "Angebot umbenannt",
  offer_export: "Angebot exportiert",
  customer_create: "Kunde erstellt",
  customer_update: "Kunde aktualisiert",
  customer_delete: "Kunde gelöscht",
  customer_import: "Kunden importiert",
  template_create: "Vorlage erstellt",
  template_use: "Vorlage verwendet",
  template_delete: "Vorlage gelöscht",
  template_duplicate: "Vorlage dupliziert",
  draft_create: "Entwurf gespeichert",
  draft_restore: "Entwurf wiederhergestellt",
  pdf_export: "PDF exportiert",
  csv_export: "CSV exportiert",
  settings_change: "Einstellung geändert",
  dataset_import: "Daten importiert",
  folder_create: "Ordner erstellt",
  folder_rename: "Ordner umbenannt",
  folder_delete: "Ordner gelöscht",
};

const RESOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  offer: FileText,
  customer: Building2,
  template: FolderOpen,
  draft: FileText,
  folder: FolderOpen,
  pdf: FileText,
  csv: FileText,
  settings: Activity,
  dataset: BarChart3,
};

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  update: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  delete: "bg-red-500/10 text-red-600 border-red-500/20",
  import: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  export: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  use: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
};

// =====================================================
// Helper Functions
// =====================================================

function getActionColor(action: string): string {
  if (action.includes("create")) return ACTION_COLORS.create;
  if (action.includes("update") || action.includes("rename")) return ACTION_COLORS.update;
  if (action.includes("delete")) return ACTION_COLORS.delete;
  if (action.includes("import")) return ACTION_COLORS.import;
  if (action.includes("export")) return ACTION_COLORS.export;
  if (action.includes("use") || action.includes("restore")) return ACTION_COLORS.use;
  return "bg-muted text-muted-foreground";
}

function getActionVerb(action: string): string {
  if (action.includes("create")) return "erstellt";
  if (action.includes("update")) return "aktualisiert";
  if (action.includes("rename")) return "umbenannt";
  if (action.includes("delete")) return "gelöscht";
  if (action.includes("import")) return "importiert";
  if (action.includes("export")) return "exportiert";
  if (action.includes("use")) return "verwendet";
  if (action.includes("restore")) return "wiederhergestellt";
  if (action.includes("duplicate")) return "dupliziert";
  return action;
}

function groupActivitiesByDate(activities: ActivityLogEntry[]): Map<string, ActivityLogEntry[]> {
  const grouped = new Map<string, ActivityLogEntry[]>();
  
  activities.forEach(activity => {
    const date = startOfDay(new Date(activity.created_at)).toISOString();
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(activity);
  });
  
  return grouped;
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Heute";
  if (isYesterday(date)) return "Gestern";
  return format(date, "EEEE, d. MMMM yyyy", { locale: de });
}

// =====================================================
// Components
// =====================================================

function ActivityItem({ activity }: { activity: ActivityLogEntry }) {
  const IconComponent = RESOURCE_ICONS[activity.resource_type] || Activity;
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="mt-0.5">
        <div className={`p-2 rounded-lg ${getActionColor(activity.action)}`}>
          <IconComponent className="h-4 w-4" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">
            {activity.summary || ACTION_LABELS[activity.action] || activity.action}
          </span>
          <Badge variant="outline" className="text-xs">
            {getActionVerb(activity.action)}
          </Badge>
        </div>
        
        {activity.resource_name && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {activity.resource_name}
          </p>
        )}
        
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{format(new Date(activity.created_at), "HH:mm", { locale: de })}</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: de })}</span>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon 
}: { 
  title: string; 
  value: string | number; 
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Main Component
// =====================================================

export default function ActivityDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("7");
  const [page, setPage] = useState(0);
  
  // Fetch activities
  const { data: activities, isLoading, refetch } = useQuery({
    queryKey: ["user-activities", dateFilter, page],
    queryFn: async () => {
      const fromDate = subDays(new Date(), parseInt(dateFilter)).toISOString();
      
      const { data, error } = await supabase
        .from("user_activity_log" as any)
        .select("*")
        .gte("created_at", fromDate)
        .order("created_at", { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);
      
      if (error) throw error;
      return (data || []) as unknown as ActivityLogEntry[];
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["activity-stats"],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      const weekAgo = subDays(new Date(), 7).toISOString();
      
      const [todayResult, weekResult] = await Promise.all([
        supabase
          .from("user_activity_log" as any)
          .select("id", { count: "exact", head: true })
          .gte("created_at", today),
        supabase
          .from("user_activity_log" as any)
          .select("action", { count: "exact" })
          .gte("created_at", weekAgo),
      ]);
      
      // Get action counts for top action
      const { data: actionCounts } = await supabase
        .from("user_activity_log" as any)
        .select("action")
        .gte("created_at", weekAgo);
      
      const actionMap = new Map<string, number>();
      const counts = (actionCounts || []) as unknown as { action: string }[];
      counts.forEach(a => {
        actionMap.set(a.action, (actionMap.get(a.action) || 0) + 1);
      });
      
      let topAction = "Keine";
      let maxCount = 0;
      actionMap.forEach((count, action) => {
        if (count > maxCount) {
          maxCount = count;
          topAction = ACTION_LABELS[action] || action;
        }
      });
      
      return {
        totalToday: todayResult.count || 0,
        totalThisWeek: weekResult.count || 0,
        topAction,
        topResource: "Angebote", // Placeholder
      } as ActivityStats;
    },
  });

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    
    return activities.filter(activity => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSummary = activity.summary?.toLowerCase().includes(search);
        const matchesResource = activity.resource_name?.toLowerCase().includes(search);
        const matchesAction = activity.action.toLowerCase().includes(search);
        if (!matchesSummary && !matchesResource && !matchesAction) return false;
      }
      
      // Action filter
      if (actionFilter !== "all" && !activity.action.includes(actionFilter)) return false;
      
      // Resource filter
      if (resourceFilter !== "all" && activity.resource_type !== resourceFilter) return false;
      
      return true;
    });
  }, [activities, searchTerm, actionFilter, resourceFilter]);

  // Group by date
  const groupedActivities = useMemo(() => 
    groupActivitiesByDate(filteredActivities),
    [filteredActivities]
  );

  // Export to CSV
  const exportToCsv = () => {
    if (!activities || activities.length === 0) return;
    
    const headers = ["Datum", "Zeit", "Aktion", "Ressource", "Name", "Zusammenfassung"];
    const rows = activities.map(a => [
      format(new Date(a.created_at), "yyyy-MM-dd"),
      format(new Date(a.created_at), "HH:mm:ss"),
      ACTION_LABELS[a.action] || a.action,
      a.resource_type,
      a.resource_name || "",
      a.summary || "",
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aktivitaeten_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Aktivitätsprotokoll
            </h1>
            <p className="text-muted-foreground">
              Übersicht aller Benutzeraktivitäten
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCsv}>
              <Download className="h-4 w-4 mr-2" />
              CSV Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Heute"
            value={stats?.totalToday || 0}
            description="Aktivitäten heute"
            icon={Calendar}
          />
          <StatsCard
            title="Diese Woche"
            value={stats?.totalThisWeek || 0}
            description="Letzte 7 Tage"
            icon={TrendingUp}
          />
          <StatsCard
            title="Top Aktion"
            value={stats?.topAction || "-"}
            description="Häufigste Aktion"
            icon={Activity}
          />
          <StatsCard
            title="Benutzer aktiv"
            value="-"
            description="Aktive Nutzer heute"
            icon={Users}
          />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Alle Aktionen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Aktionen</SelectItem>
                  <SelectItem value="create">Erstellt</SelectItem>
                  <SelectItem value="update">Aktualisiert</SelectItem>
                  <SelectItem value="delete">Gelöscht</SelectItem>
                  <SelectItem value="import">Importiert</SelectItem>
                  <SelectItem value="export">Exportiert</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Alle Ressourcen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Ressourcen</SelectItem>
                  <SelectItem value="offer">Angebote</SelectItem>
                  <SelectItem value="customer">Kunden</SelectItem>
                  <SelectItem value="template">Vorlagen</SelectItem>
                  <SelectItem value="draft">Entwürfe</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Zeitraum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Heute</SelectItem>
                  <SelectItem value="7">Letzte 7 Tage</SelectItem>
                  <SelectItem value="30">Letzte 30 Tage</SelectItem>
                  <SelectItem value="90">Letzte 90 Tage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity List */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>
              {filteredActivities.length} Aktivitäten gefunden
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Keine Aktivitäten gefunden</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-6">
                  {Array.from(groupedActivities.entries()).map(([date, items]) => (
                    <div key={date}>
                      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 mb-2">
                        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {getDateLabel(date)}
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {items.map((activity) => (
                          <ActivityItem key={activity.id} activity={activity} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            {/* Pagination */}
            {(activities?.length || 0) >= ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Vorherige
                </Button>
                <span className="text-sm text-muted-foreground">
                  Seite {page + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={(activities?.length || 0) < ITEMS_PER_PAGE}
                >
                  Nächste
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
