import { format, parseISO, differenceInBusinessDays } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Clock, Calendar, User, Loader2 } from "lucide-react";
import { useAbsences, type AbsenceType } from "@/hooks/useAbsences";
import { cn } from "@/lib/utils";

const absenceLabels: Record<AbsenceType, string> = {
  vacation: "Urlaub",
  sick: "Krankheit",
  training: "Schulung",
  other: "Sonstiges",
};

const absenceColors: Record<AbsenceType, string> = {
  vacation: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  sick: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  training: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  other: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
};

export function VacationApprovalQueue() {
  const { pendingAbsences, approveAbsence, rejectAbsence, isUpdating } = useAbsences();

  if (pendingAbsences.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Offene Anträge
          </CardTitle>
          <CardDescription>
            Genehmigen oder lehnen Sie Abwesenheitsanträge ab
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Keine offenen Anträge</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Offene Anträge
          <Badge variant="secondary">{pendingAbsences.length}</Badge>
        </CardTitle>
        <CardDescription>
          Genehmigen oder lehnen Sie Abwesenheitsanträge ab
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingAbsences.map((absence) => {
          const startDate = parseISO(absence.start_date);
          const endDate = parseISO(absence.end_date);
          const days = differenceInBusinessDays(endDate, startDate) + 1;
          const userName = absence.user?.display_name || absence.user?.email?.split("@")[0] || "Unbekannt";
          const initials = userName.slice(0, 2).toUpperCase();

          return (
            <div
              key={absence.id}
              className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{userName}</span>
                  <Badge
                    variant="secondary"
                    className={cn("shrink-0", absenceColors[absence.absence_type as AbsenceType])}
                  >
                    {absenceLabels[absence.absence_type as AbsenceType]}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(startDate, "dd.MM.", { locale: de })} - {format(endDate, "dd.MM.yyyy", { locale: de })}
                  </div>
                  <span className="font-medium text-foreground">{days} Tage</span>
                </div>

                {absence.substitute && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    Vertretung: {absence.substitute.display_name || absence.substitute.email}
                  </div>
                )}

                {absence.notes && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {absence.notes}
                  </p>
                )}

                <p className="mt-2 text-xs text-muted-foreground">
                  Beantragt am {format(parseISO(absence.created_at), "dd.MM.yyyy 'um' HH:mm", { locale: de })}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => rejectAbsence(absence.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => approveAbsence(absence.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Genehmigen
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
