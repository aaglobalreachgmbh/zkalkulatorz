import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO, isSameDay, getISOWeek } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Clock, AlertCircle, CheckCircle2, Edit } from "lucide-react";
import { useTimeTracking, formatMinutesAsTime, type TimeEntry } from "@/hooks/useTimeTracking";
import { cn } from "@/lib/utils";

const TARGET_HOURS_PER_DAY = 8;
const TARGET_MINUTES_PER_DAY = TARGET_HOURS_PER_DAY * 60;

export function TimeTrackingOverview() {
  const [weekOffset, setWeekOffset] = useState(0);
  
  const currentWeekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });

  const {
    entries,
    entriesByDate,
    weeklyStats,
    isLoading,
    activeEntry,
  } = useTimeTracking({
    startDate: currentWeekStart,
    endDate: currentWeekEnd,
  });

  const weekNumber = getISOWeek(currentWeekStart);
  const progressPercent = Math.min(100, (weeklyStats.totalMinutes / weeklyStats.targetMinutes) * 100);

  // Generate days of the week
  const weekDays = useMemo(() => {
    const days = [];
    let current = currentWeekStart;
    while (current <= currentWeekEnd) {
      days.push(current);
      current = addWeeks(current, 0);
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
    }
    return days.slice(0, 7);
  }, [currentWeekStart, currentWeekEnd]);

  const goToPrevWeek = () => setWeekOffset(weekOffset - 1);
  const goToNextWeek = () => setWeekOffset(weekOffset + 1);
  const goToCurrentWeek = () => setWeekOffset(0);

  const getDayStatus = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const dayEntries = entriesByDate[dateKey] || [];
    const totalMinutes = dayEntries.reduce((sum, e) => sum + (e.work_minutes || 0), 0);
    const hasActiveEntry = dayEntries.some((e) => e.status === "active");
    const isToday = isSameDay(day, new Date());
    const isPast = day < new Date() && !isToday;
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

    return {
      entries: dayEntries,
      totalMinutes,
      hasActiveEntry,
      isToday,
      isPast,
      isWeekend,
      isBelowTarget: isPast && !isWeekend && totalMinutes > 0 && totalMinutes < TARGET_MINUTES_PER_DAY,
      isComplete: totalMinutes >= TARGET_MINUTES_PER_DAY,
    };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Meine Arbeitszeit
            </CardTitle>
            <CardDescription>
              Wochenübersicht und Zeiteinträge
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {weekOffset !== 0 && (
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                Aktuelle Woche
              </Button>
            )}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={goToPrevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[100px] text-center">
                KW {weekNumber}
              </span>
              <Button variant="ghost" size="icon" onClick={goToNextWeek} disabled={weekOffset >= 0}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Weekly Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Gearbeitet</p>
            <p className="text-2xl font-bold">{formatMinutesAsTime(weeklyStats.totalMinutes)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Soll</p>
            <p className="text-2xl font-bold">{formatMinutesAsTime(weeklyStats.targetMinutes)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Überstunden</p>
            <p className={cn(
              "text-2xl font-bold",
              weeklyStats.overtimeMinutes > 0 && "text-emerald-600",
              weeklyStats.overtimeMinutes < 0 && "text-amber-600"
            )}>
              {weeklyStats.overtimeMinutes >= 0 ? "+" : ""}
              {formatMinutesAsTime(weeklyStats.overtimeMinutes)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Arbeitstage</p>
            <p className="text-2xl font-bold">{weeklyStats.daysWorked} / 5</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Wochenfortschritt</span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Day-by-Day View */}
        <div className="space-y-3">
          {weekDays.map((day) => {
            const status = getDayStatus(day);
            const dateKey = format(day, "yyyy-MM-dd");

            return (
              <div
                key={dateKey}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg border",
                  status.isToday && "border-primary bg-primary/5",
                  status.isWeekend && "bg-muted/30",
                  status.hasActiveEntry && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                )}
              >
                {/* Date */}
                <div className="w-24 shrink-0">
                  <p className={cn(
                    "font-medium",
                    status.isToday && "text-primary"
                  )}>
                    {format(day, "EEEE", { locale: de })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(day, "dd.MM.", { locale: de })}
                  </p>
                </div>

                {/* Time Bar */}
                <div className="flex-1">
                  {status.entries.length > 0 ? (
                    <div className="space-y-1">
                      {status.entries.map((entry) => (
                        <div key={entry.id} className="flex items-center gap-2 text-sm">
                          <span className="font-mono">
                            {format(parseISO(entry.clock_in), "HH:mm")}
                          </span>
                          <div className={cn(
                            "flex-1 h-4 rounded",
                            entry.status === "active" 
                              ? "bg-emerald-500 animate-pulse" 
                              : "bg-primary/20"
                          )} />
                          <span className="font-mono">
                            {entry.clock_out 
                              ? format(parseISO(entry.clock_out), "HH:mm")
                              : "..."
                            }
                          </span>
                          <span className="text-muted-foreground w-16 text-right">
                            {entry.status === "active" && "(aktiv)"}
                            {entry.status === "completed" && formatMinutesAsTime(entry.work_minutes)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : status.isWeekend ? (
                    <span className="text-sm text-muted-foreground">Wochenende</span>
                  ) : status.isPast ? (
                    <span className="text-sm text-muted-foreground">Kein Eintrag</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>

                {/* Status */}
                <div className="w-24 shrink-0 text-right">
                  {status.hasActiveEntry ? (
                    <Badge className="bg-emerald-500">Aktiv</Badge>
                  ) : status.isComplete ? (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {formatMinutesAsTime(status.totalMinutes)}
                    </Badge>
                  ) : status.isBelowTarget ? (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {formatMinutesAsTime(status.totalMinutes)}
                    </Badge>
                  ) : status.totalMinutes > 0 ? (
                    <span className="text-sm font-medium">
                      {formatMinutesAsTime(status.totalMinutes)}
                    </span>
                  ) : null}
                </div>

                {/* Edit Button */}
                {status.entries.length > 0 && !status.hasActiveEntry && (
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Date Range */}
        <p className="text-xs text-center text-muted-foreground">
          {format(currentWeekStart, "dd.MM.", { locale: de })} - {format(currentWeekEnd, "dd.MM.yyyy", { locale: de })}
        </p>
      </CardContent>
    </Card>
  );
}
