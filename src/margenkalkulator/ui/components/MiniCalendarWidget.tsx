// ============================================
// Mini Calendar Widget for Dashboard
// ============================================

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCalendarEvents } from "@/margenkalkulator/hooks/useCalendarEvents";
import { cn } from "@/lib/utils";
import { 
  format, 
  addDays, 
  startOfDay, 
  endOfDay, 
  isSameDay, 
  isToday,
  isTomorrow 
} from "date-fns";
import { de } from "date-fns/locale";
import { IntegrationPromptCard } from "./IntegrationPromptCard";
import { GoogleCalendarIcon, OutlookIcon } from "./icons/IntegrationIcons";
import { toast } from "sonner";

// Event type colors
const EVENT_TYPE_COLORS: Record<string, string> = {
  appointment: "bg-blue-500",
  followup: "bg-amber-500",
  meeting: "bg-purple-500",
  deadline: "bg-red-500",
  reminder: "bg-green-500",
  other: "bg-muted-foreground",
};

interface DayData {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  events: Array<{
    id: string;
    title: string;
    eventType: string;
  }>;
}

interface MiniCalendarWidgetProps {
  compact?: boolean;
}

export function MiniCalendarWidget({ compact = false }: MiniCalendarWidgetProps) {
  const navigate = useNavigate();
  const today = new Date();
  
  // Fetch events for next 7 days
  const { events, isLoading } = useCalendarEvents({
    startDate: startOfDay(today),
    endDate: endOfDay(addDays(today, 6)),
  });

  // Build 7-day data
  const weekData = useMemo<DayData[]>(() => {
    const days: DayData[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start_time);
        return isSameDay(eventDate, date);
      });
      
      days.push({
        date,
        dayName: format(date, "EEEEEE", { locale: de }),
        dayNumber: date.getDate(),
        isToday: isToday(date),
        events: dayEvents.map(e => ({
          id: e.id,
          title: e.title,
          eventType: e.event_type || "other",
        })),
      });
    }
    
    return days;
  }, [events, today]);

  // Next upcoming event
  const nextEvent = useMemo(() => {
    if (!events.length) return null;
    
    const now = new Date();
    const upcoming = events
      .filter(e => new Date(e.start_time) > now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    
    return upcoming[0] || null;
  }, [events]);

  // Format next event text
  const nextEventText = useMemo(() => {
    if (!nextEvent) return null;
    
    const eventDate = new Date(nextEvent.start_time);
    let dateText = "";
    
    if (isToday(eventDate)) {
      dateText = `heute, ${format(eventDate, "HH:mm")}`;
    } else if (isTomorrow(eventDate)) {
      dateText = `morgen, ${format(eventDate, "HH:mm")}`;
    } else {
      dateText = format(eventDate, "EEEE, HH:mm", { locale: de });
    }
    
    return {
      title: nextEvent.title,
      dateText,
    };
  }, [nextEvent]);

  // Check if any calendar is connected (mock for now)
  const hasCalendarIntegration = events.length > 0 || isLoading;

  const handleDayClick = (date: Date) => {
    navigate(`/calendar?date=${format(date, "yyyy-MM-dd")}`);
  };

  const handleConnectCalendar = (type: string) => {
    toast.info(`${type} Integration wird in Kürze verfügbar sein`);
  };

  // No integration connected - show prompts
  if (!hasCalendarIntegration && !isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Kalender
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground mb-3">
            Verbinden Sie Ihren Kalender für Terminübersicht
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-auto py-2 px-3"
              onClick={() => handleConnectCalendar("Google Calendar")}
            >
              <GoogleCalendarIcon className="h-4 w-4 mr-1.5" />
              <span className="text-xs">Google</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-auto py-2 px-3"
              onClick={() => handleConnectCalendar("Outlook")}
            >
              <OutlookIcon className="h-4 w-4 mr-1.5" />
              <span className="text-xs">Outlook</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Kalender
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/calendar")}
          >
            Öffnen
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* 7-Day Grid */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {weekData.map((day, idx) => (
            <button
              key={idx}
              onClick={() => handleDayClick(day.date)}
              className={cn(
                "flex flex-col items-center p-1.5 rounded-md transition-colors",
                "hover:bg-accent cursor-pointer",
                day.isToday && "bg-primary/10 ring-1 ring-primary/30"
              )}
            >
              {/* Day name */}
              <span className={cn(
                "text-[10px] uppercase font-medium",
                day.isToday ? "text-primary" : "text-muted-foreground"
              )}>
                {day.dayName}
              </span>
              
              {/* Day number */}
              <span className={cn(
                "text-sm font-semibold mt-0.5",
                day.isToday ? "text-primary" : "text-foreground"
              )}>
                {day.dayNumber}
              </span>
              
              {/* Event dots */}
              <div className="flex gap-0.5 mt-1 min-h-[6px]">
                {day.events.slice(0, 3).map((event, eventIdx) => (
                  <span
                    key={eventIdx}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      EVENT_TYPE_COLORS[event.eventType] || EVENT_TYPE_COLORS.other
                    )}
                    title={event.title}
                  />
                ))}
                {day.events.length > 3 && (
                  <span className="text-[8px] text-muted-foreground ml-0.5">
                    +{day.events.length - 3}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Next Event */}
        {nextEventText ? (
          <div className="text-xs border-t pt-2">
            <span className="text-muted-foreground">Nächster Termin: </span>
            <span className="font-medium">{nextEventText.title}</span>
            <span className="text-muted-foreground"> ({nextEventText.dateText})</span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground border-t pt-2">
            Keine anstehenden Termine
          </div>
        )}
      </CardContent>
    </Card>
  );
}
