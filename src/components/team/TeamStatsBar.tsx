// ============================================
// Team Stats Bar Component
// Shows overview statistics for team management
// ============================================

import { Users, Mail, Clock, Shield } from "lucide-react";

interface TeamStats {
  totalMembers: number;
  admins: number;
  pendingInvitations: number;
  expiringInvitations: number;
}

interface TeamStatsBarProps {
  stats: TeamStats;
}

export function TeamStatsBar({ stats }: TeamStatsBarProps) {
  const statItems = [
    {
      label: "Mitarbeiter",
      value: stats.totalMembers,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Admins",
      value: stats.admins,
      icon: Shield,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Einladungen",
      value: stats.pendingInvitations,
      icon: Mail,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      label: "Ablaufend",
      value: stats.expiringInvitations,
      icon: Clock,
      color: stats.expiringInvitations > 0 ? "text-red-600" : "text-muted-foreground",
      bgColor: stats.expiringInvitations > 0 ? "bg-red-100" : "bg-muted",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 p-4 rounded-xl bg-card border shadow-sm"
        >
          <div className={`p-2.5 rounded-lg ${item.bgColor}`}>
            <item.icon className={`h-5 w-5 ${item.color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
