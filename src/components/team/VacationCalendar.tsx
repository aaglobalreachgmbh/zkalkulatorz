import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWeekend, addMonths, subMonths, isSameDay, isWithinInterval, parseISO, differenceInBusinessDays } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Calendar, AlertTriangle, Plus } from "lucide-react";
import { useAbsences, type Absence, type AbsenceType } from "@/hooks/useAbsences";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { VacationRequestDialog } from "./VacationRequestDialog";

const absenceColors: Record<AbsenceType, string> = {
  vacation: "bg-emerald-500",
  sick: "bg-rose-500",
  training: "bg-amber-500",
  other: "bg-slate-500",
};

const absenceLabels: Record<AbsenceType, string> = {
  vacation: "Urlaub",
  sick: "Krankheit",
  training: "Schulung",
  other: "Sonstiges",
};

interface TeamMember {
  id: string;
  display_name: string | null;
  email: string | null;
}

export function VacationCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const { absences, isLoading: absencesLoading, absenceTypeLabels } = useAbsences({
    startDate: monthStart,
    endDate: monthEnd,
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members-vacation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, email")
        .order("display_name");
      
      if (error) {
        console.warn("[VacationCalendar] Team fetch error:", error.message);
        return [];
      }
      return (data || []) as TeamMember[];
    },
  });

  // Get days of the month
  const days = useMemo(() => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [monthStart, monthEnd]);

  // Group absences by user
  const absencesByUser = useMemo(() => {
    const grouped: Record<string, Absence[]> = {};
    absences.forEach((absence) => {
      if (absence.status === "approved" || absence.status === "pending") {
        if (!grouped[absence.user_id]) {
          grouped[absence.user_id] = [];
        }
        grouped[absence.user_id].push(absence);
      }
    });
    return grouped;
  }, [absences]);

  // Check overlaps (multiple people absent on same day)
  const overlapsWarning = useMemo(() => {
    const warnings: { date: Date; count: number; names: string[] }[] = [];
    
    days.forEach((day) => {
      if (isWeekend(day)) return;
      
      const absentOnDay: string[] = [];
      absences.forEach((absence) => {
        if (absence.status !== "approved") return;
        
        const start = parseISO(absence.start_date);
        const end = parseISO(absence.end_date);
        
        if (isWithinInterval(day, { start, end })) {
          const member = teamMembers.find((m) => m.id === absence.user_id);
          absentOnDay.push(member?.display_name || member?.email || "Unbekannt");
        }
      });
      
      if (absentOnDay.length >= 2) {
        warnings.push({ date: day, count: absentOnDay.length, names: absentOnDay });
      }
    });
    
    return warnings;
  }, [days, absences, teamMembers]);

  // Members with absences this month
  const membersWithAbsences = useMemo(() => {
    return teamMembers.filter((member) => absencesByUser[member.id]?.length > 0);
  }, [teamMembers, absencesByUser]);

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Team-Urlaubskalender
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Heute
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[140px] text-center">
                {format(currentMonth, "MMMM yyyy", { locale: de })}
              </span>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" onClick={() => setShowRequestDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Antrag
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overlaps Warning */}
        {overlapsWarning.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-medium mb-2">
              <AlertTriangle className="h-4 w-4" />
              Überschneidungen erkannt
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
              {overlapsWarning.slice(0, 3).map((w, i) => (
                <div key={i}>
                  {format(w.date, "dd.MM.")}: {w.names.join(", ")} ({w.count} Personen)
                </div>
              ))}
              {overlapsWarning.length > 3 && (
                <div className="text-muted-foreground">
                  +{overlapsWarning.length - 3} weitere Überschneidungen
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-sm">
          {Object.entries(absenceLabels).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={cn("w-3 h-3 rounded", absenceColors[type as AbsenceType])} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-dashed border-muted-foreground/50" />
            <span className="text-muted-foreground">Ausstehend</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day Headers */}
            <div className="flex border-b">
              <div className="w-40 shrink-0 p-2 font-medium text-sm text-muted-foreground">
                Mitarbeiter
              </div>
              <div className="flex-1 flex">
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "flex-1 min-w-[28px] p-1 text-center text-xs",
                      isWeekend(day) && "bg-muted/50",
                      isSameDay(day, new Date()) && "bg-primary/10 font-bold"
                    )}
                  >
                    <div className="text-muted-foreground">
                      {format(day, "EEE", { locale: de }).slice(0, 2)}
                    </div>
                    <div>{format(day, "d")}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Member Rows */}
            {absencesLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Laden...
              </div>
            ) : membersWithAbsences.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Keine Abwesenheiten in diesem Monat
              </div>
            ) : (
              membersWithAbsences.map((member) => (
                <div key={member.id} className="flex border-b last:border-b-0 hover:bg-muted/30">
                  <div className="w-40 shrink-0 p-2 text-sm truncate">
                    {member.display_name || member.email?.split("@")[0] || "Unbekannt"}
                  </div>
                  <div className="flex-1 flex relative">
                    {days.map((day) => (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "flex-1 min-w-[28px] h-8",
                          isWeekend(day) && "bg-muted/30"
                        )}
                      />
                    ))}
                    
                    {/* Absence Bars */}
                    {absencesByUser[member.id]?.map((absence) => {
                      const start = parseISO(absence.start_date);
                      const end = parseISO(absence.end_date);
                      
                      // Calculate position
                      const startIdx = days.findIndex((d) => isSameDay(d, start) || d > start);
                      const endIdx = days.findIndex((d) => isSameDay(d, end));
                      
                      if (startIdx === -1 || endIdx === -1) return null;
                      
                      const leftPercent = (Math.max(0, startIdx) / days.length) * 100;
                      const widthPercent = ((endIdx - Math.max(0, startIdx) + 1) / days.length) * 100;
                      
                      return (
                        <TooltipProvider key={absence.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "absolute top-1 h-6 rounded-sm cursor-pointer",
                                  absenceColors[absence.absence_type as AbsenceType],
                                  absence.status === "pending" && "opacity-50 border-2 border-dashed border-white"
                                )}
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${widthPercent}%`,
                                }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <div className="font-medium">
                                  {absenceLabels[absence.absence_type as AbsenceType]}
                                </div>
                                <div>
                                  {format(start, "dd.MM.")} - {format(end, "dd.MM.yyyy")}
                                </div>
                                <div className="text-muted-foreground">
                                  {differenceInBusinessDays(end, start) + 1} Werktage
                                </div>
                                {absence.status === "pending" && (
                                  <Badge variant="outline" className="mt-1">
                                    Ausstehend
                                  </Badge>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>

      <VacationRequestDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
      />
    </Card>
  );
}
