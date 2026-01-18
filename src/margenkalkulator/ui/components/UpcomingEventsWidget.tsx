// ============================================
// Upcoming Events Widget - Shows next 3 calendar events on Dashboard
// ============================================

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Phone, Users, Bell, Plus, ArrowRight } from "lucide-react";
import { useCalendarEvents, CalendarEvent } from "@/margenkalkulator/hooks/useCalendarEvents";
import { format, isToday, isTomorrow, parseISO, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

const EVENT_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  meeting: { icon: Users, color: "text-blue-500 bg-blue-500/10", label: "Meeting" },
  call: { icon: Phone, color: "text-green-500 bg-green-500/10", label: "Anruf" },
  followup: { icon: Bell, color: "text-amber-500 bg-amber-500/10", label: "Follow-up" },
  vvl_reminder: { icon: Bell, color: "text-red-500 bg-red-500/10", label: "VVL-Erinnerung" },
  appointment: { icon: Calendar, color: "text-purple-500 bg-purple-500/10", label: "Termin" },
};

function getEventConfig(eventType: string) {
  return EVENT_TYPE_CONFIG[eventType] || EVENT_TYPE_CONFIG.appointment;
}

function formatEventDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Heute";
  if (isTomorrow(date)) return "Morgen";
  const days = differenceInDays(date, new Date());
  if (days > 0 && days <= 7) return `in ${days} Tagen`;
  return format(date, "dd. MMM", { locale: de });
}

function formatEventTime(startTime: string, endTime: string, isAllDay: boolean): string {
  if (isAllDay) return "Ganztägig";
  const start = parseISO(startTime);
  const end = parseISO(endTime);
  return `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
}

interface EventCardProps {
  event: CalendarEvent;
  onClick?: () => void;
}

function EventCard({ event, onClick }: EventCardProps) {
  const config = getEventConfig(event.event_type || "appointment");
  const Icon = config.icon;
  
  return (
    <div 
      onClick={onClick}
      className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", config.color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm truncate">{event.title}</p>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatEventDate(event.start_time)}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatEventTime(event.start_time, event.end_time, event.is_all_day || false)}
          </span>
          {event.location && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3" />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface UpcomingEventsWidgetProps {
  limit?: number;
  compact?: boolean;
}

export function UpcomingEventsWidget({ limit = 3, compact = false }: UpcomingEventsWidgetProps) {
  const navigate = useNavigate();
  const { getUpcomingEvents, isLoading } = useCalendarEvents();
  
  const upcomingEvents = getUpcomingEvents(30);
  const eventsToShow = upcomingEvents.slice(0, limit);
  
  if (isLoading) {
    return (
      <Card className={cn(compact && "shadow-sm")}>
        <CardHeader className={cn("pb-3", compact && "py-3 px-4")}>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4 text-primary" />
            Nächste Termine
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(compact && "px-4 pb-4")}>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(compact && "shadow-sm")}>
      <CardHeader className={cn("pb-3", compact && "py-3 px-4")}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4 text-primary" />
            Nächste Termine
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs gap-1"
            onClick={() => navigate("/calendar")}
          >
            Kalender
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className={cn(compact && "px-4 pb-4")}>
        {eventsToShow.length === 0 ? (
          <div className="text-center py-4">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground mb-4">
              Keine anstehenden Termine
            </p>
            
            {/* Integration prompts for calendar */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Kalender verbinden:</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => navigate("/calendar")}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#4285F4]/30 bg-[#4285F4]/5 hover:bg-[#4285F4]/10 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" fill="#FFFFFF" stroke="#4285F4" strokeWidth="2"/>
                    <rect x="3" y="4" width="18" height="5" rx="2" fill="#4285F4"/>
                    <text x="12" y="17" textAnchor="middle" fill="#4285F4" fontSize="8" fontWeight="bold">31</text>
                    <circle cx="7" cy="6.5" r="1" fill="#EA4335"/>
                    <circle cx="12" cy="6.5" r="1" fill="#FBBC05"/>
                    <circle cx="17" cy="6.5" r="1" fill="#34A853"/>
                  </svg>
                  <span className="text-xs font-medium">Google</span>
                </button>
                <button
                  onClick={() => navigate("/calendar")}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#0078D4]/30 bg-[#0078D4]/5 hover:bg-[#0078D4]/10 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4"/>
                    <ellipse cx="9" cy="12" rx="4" ry="4.5" fill="white"/>
                    <path d="M14 7L22 11V17L14 13V7Z" fill="white" fillOpacity="0.8"/>
                  </svg>
                  <span className="text-xs font-medium">Outlook</span>
                </button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 text-xs"
                onClick={() => navigate("/calendar")}
              >
                <Plus className="w-3 h-3" />
                Termin erstellen
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {eventsToShow.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onClick={() => navigate("/calendar")}
              />
            ))}
            
            {upcomingEvents.length > limit && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs mt-2"
                onClick={() => navigate("/calendar")}
              >
                +{upcomingEvents.length - limit} weitere Termine
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
