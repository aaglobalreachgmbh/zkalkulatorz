// ============================================
// Team Activity Timeline Component
// Shows team-related activities: invites, registrations, permission changes
// ============================================

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/contexts/IdentityContext";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import {
  UserPlus,
  UserCheck,
  UserMinus,
  ShieldCheck,
  Shield,
  Settings,
  Mail,
  RefreshCw,
  X,
  Clock,
  Filter,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Activity types we're interested in for team
const TEAM_ACTIONS = [
  "member_invite",
  "member_register",
  "member_remove",
  "member_promote",
  "member_demote",
  "member_reactivate",
  "permission_change",
  "invitation_resend",
  "invitation_revoke",
];

interface ActivityEntry {
  id: string;
  action: string;
  resource_name: string | null;
  summary: string | null;
  created_at: string;
  new_values: Record<string, unknown> | null;
  old_values: Record<string, unknown> | null;
}

const actionConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  member_invite: { icon: UserPlus, color: "text-blue-600 bg-blue-100", label: "Einladung" },
  member_register: { icon: UserCheck, color: "text-green-600 bg-green-100", label: "Registrierung" },
  member_remove: { icon: UserMinus, color: "text-red-600 bg-red-100", label: "Entfernt" },
  member_promote: { icon: ShieldCheck, color: "text-purple-600 bg-purple-100", label: "Befördert" },
  member_demote: { icon: Shield, color: "text-orange-600 bg-orange-100", label: "Herabgestuft" },
  member_reactivate: { icon: RefreshCw, color: "text-green-600 bg-green-100", label: "Reaktiviert" },
  permission_change: { icon: Settings, color: "text-blue-600 bg-blue-100", label: "Berechtigung" },
  invitation_resend: { icon: Mail, color: "text-amber-600 bg-amber-100", label: "Erneut gesendet" },
  invitation_revoke: { icon: X, color: "text-red-600 bg-red-100", label: "Widerrufen" },
};

type TimeFilter = "7" | "30" | "90" | "all";

interface TeamActivityTimelineProps {
  className?: string;
}

export function TeamActivityTimeline({ className }: TeamActivityTimelineProps) {
  const { identity } = useIdentity();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("30");

  const activitiesQuery = useQuery({
    queryKey: ["team-activities", identity.tenantId, timeFilter],
    queryFn: async (): Promise<ActivityEntry[]> => {
      if (!identity.tenantId) return [];

      let query = supabase
        .from("user_activity_log" as any)
        .select("id, action, resource_name, summary, created_at, new_values, old_values")
        .eq("tenant_id", identity.tenantId)
        .in("action", TEAM_ACTIONS)
        .order("created_at", { ascending: false })
        .limit(50);

      // Apply time filter
      if (timeFilter !== "all") {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(timeFilter));
        query = query.gte("created_at", daysAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.warn("[TeamActivityTimeline] Query error:", error.message);
        return [];
      }

      return (data || []) as unknown as ActivityEntry[];
    },
    enabled: !!identity.tenantId,
  });

  const activities = activitiesQuery.data || [];

  return (
    <div className={`bg-card rounded-xl border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Team-Aktivität</h3>
        </div>
        <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Letzte 7 Tage</SelectItem>
            <SelectItem value="30">Letzte 30 Tage</SelectItem>
            <SelectItem value="90">Letzte 90 Tage</SelectItem>
            <SelectItem value="all">Alle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity List */}
      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-3">
          {activitiesQuery.isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Lade Aktivitäten...
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Keine Aktivitäten im gewählten Zeitraum</p>
            </div>
          ) : (
            activities.map((activity) => {
              const config = actionConfig[activity.action] || {
                icon: Settings,
                color: "text-muted-foreground bg-muted",
                label: activity.action,
              };
              const Icon = config.icon;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-full ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.summary || activity.action}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: de,
                        })}
                      </span>
                    </div>
                    {/* Show changed values for permission_change */}
                    {activity.action === "permission_change" && activity.new_values && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {Object.entries(activity.new_values)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <span key={key} className="inline-block mr-2">
                              {key}: <span className="font-medium">{String(value)}</span>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(activity.created_at), "dd.MM.", { locale: de })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
