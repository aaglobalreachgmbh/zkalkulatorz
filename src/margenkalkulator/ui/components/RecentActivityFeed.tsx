// ============================================
// Recent Activity Feed Component
// Kompakte Aktivitätsliste für Dashboard
// ============================================

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, Mail, ScrollText, Building2, 
  Clock, ExternalLink, Activity 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { useRecentActivities, type RecentActivity } from "@/margenkalkulator/hooks/useRecentActivities";
import { 
  getEmailStatus, 
  getOfferStatus, 
  getContractStatus, 
  getCustomerStatus 
} from "@/lib/statusBadges";

const TYPE_ICONS = {
  offer: FileText,
  email: Mail,
  contract: ScrollText,
  customer: Building2,
};

const TYPE_LABELS = {
  offer: "Angebot",
  email: "E-Mail",
  contract: "Vertrag",
  customer: "Kunde",
};

const TYPE_COLORS = {
  offer: "text-amber-600 bg-amber-500/20",
  email: "text-blue-600 bg-blue-500/20",
  contract: "text-emerald-600 bg-emerald-500/20",
  customer: "text-purple-600 bg-purple-500/20",
};

interface RecentActivityFeedProps {
  limit?: number;
  compact?: boolean;
}

export function RecentActivityFeed({ limit = 10, compact = false }: RecentActivityFeedProps) {
  const navigate = useNavigate();
  const { activities, isLoading } = useRecentActivities(limit);

  const handleActivityClick = (activity: RecentActivity) => {
    switch (activity.type) {
      case "offer":
        navigate("/offers");
        break;
      case "email":
        if (activity.customerId) {
          navigate(`/customers/${activity.customerId}`);
        }
        break;
      case "contract":
        navigate("/contracts");
        break;
      case "customer":
        if (activity.customerId) {
          navigate(`/customers/${activity.customerId}`);
        }
        break;
    }
  };

  const getStatusBadge = (activity: RecentActivity) => {
    let config;
    switch (activity.type) {
      case "email":
        config = getEmailStatus(activity.status || null);
        break;
      case "offer":
        config = getOfferStatus(activity.status === "draft", false);
        break;
      case "contract":
        config = getContractStatus(activity.status || null);
        break;
      case "customer":
        config = getCustomerStatus(activity.status || null);
        break;
      default:
        return null;
    }

    return (
      <Badge 
        variant="outline" 
        className={`${config.bgColor} ${config.color} text-xs`}
      >
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className={compact ? "pb-2" : undefined}>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Letzte Aktivitäten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader className={compact ? "pb-2" : undefined}>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Letzte Aktivitäten
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Noch keine Aktivitäten</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className={compact ? "pb-2" : undefined}>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Letzte Aktivitäten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activities.map((activity) => {
          const Icon = TYPE_ICONS[activity.type];
          const typeColor = TYPE_COLORS[activity.type];
          
          return (
            <div
              key={activity.id}
              onClick={() => handleActivityClick(activity)}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group"
            >
              {/* Type Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${typeColor}`}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{activity.title}</span>
                  {getStatusBadge(activity)}
                </div>
                
                {activity.subtitle && (
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.subtitle}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-0.5">
                  {activity.customerName && activity.type !== "customer" && (
                    <span className="text-xs text-muted-foreground">
                      {activity.customerName}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    • {formatDistanceToNow(activity.createdAt, { addSuffix: true, locale: de })}
                  </span>
                </div>
              </div>

              {/* Action */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
