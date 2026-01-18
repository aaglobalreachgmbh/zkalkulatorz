/**
 * Karte für Besuchsbericht in der Liste
 */

import { formatDistanceToNow, format } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Calendar,
  User,
  ChevronRight,
  CheckCircle,
  Clock,
  FileEdit,
  Image as ImageIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { VisitReport } from "@/hooks/useVisitReports";
import { cn } from "@/lib/utils";

interface VisitReportCardProps {
  report: VisitReport;
}

const STATUS_CONFIG = {
  draft: {
    label: "Entwurf",
    variant: "secondary" as const,
    icon: FileEdit,
  },
  submitted: {
    label: "Eingereicht",
    variant: "default" as const,
    icon: Clock,
  },
  reviewed: {
    label: "Geprüft",
    variant: "outline" as const,
    icon: CheckCircle,
  },
};

export function VisitReportCard({ report }: VisitReportCardProps) {
  const statusConfig = STATUS_CONFIG[report.status];
  const StatusIcon = statusConfig.icon;

  const visitDate = new Date(report.visit_date);
  const isToday = new Date().toDateString() === visitDate.toDateString();

  return (
    <Link to={`/visits/${report.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left side */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Customer */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium truncate">
                  {report.customer?.company_name || "Unbekannter Kunde"}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                {isToday ? (
                  <span>
                    Heute, {format(visitDate, "HH:mm", { locale: de })} Uhr
                  </span>
                ) : (
                  <span>
                    {format(visitDate, "dd.MM.yyyy, HH:mm", { locale: de })} Uhr
                  </span>
                )}
                <span className="text-xs">
                  ({formatDistanceToNow(visitDate, { addSuffix: true, locale: de })})
                </span>
              </div>

              {/* Location */}
              {report.location_address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{report.location_address}</span>
                </div>
              )}

              {/* Notes preview */}
              {report.notes && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {report.notes}
                </p>
              )}
            </div>

            {/* Right side */}
            <div className="flex flex-col items-end gap-2">
              <Badge variant={statusConfig.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>

              {/* Photo indicator */}
              {report.photos && report.photos.length > 0 && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <ImageIcon className="h-3 w-3" />
                  {report.photos.length}
                </Badge>
              )}

              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
