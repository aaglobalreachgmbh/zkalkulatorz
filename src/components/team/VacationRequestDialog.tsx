import { useState, useMemo } from "react";
import { format, differenceInBusinessDays, parseISO, isWithinInterval, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, AlertTriangle, Loader2, User } from "lucide-react";
import { useAbsences, type AbsenceType } from "@/hooks/useAbsences";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface VacationRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const absenceTypes: { value: AbsenceType; label: string }[] = [
  { value: "vacation", label: "Urlaub" },
  { value: "sick", label: "Krankheit" },
  { value: "training", label: "Schulung" },
  { value: "other", label: "Sonstiges" },
];

export function VacationRequestDialog({ open, onOpenChange }: VacationRequestDialogProps) {
  const { user } = useAuth();
  const { absences, createAbsence, isCreating } = useAbsences();

  const [absenceType, setAbsenceType] = useState<AbsenceType>("vacation");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [substituteId, setSubstituteId] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Fetch team members for substitute selection
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members-substitute"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, email")
        .neq("id", user?.id || "")
        .order("display_name");

      if (error) return [];
      return data || [];
    },
    enabled: !!user,
  });

  // Calculate vacation days
  const vacationDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return differenceInBusinessDays(endDate, startDate) + 1;
  }, [startDate, endDate]);

  // Check for overlaps with other absences
  const overlaps = useMemo(() => {
    if (!startDate || !endDate) return [];

    return absences.filter((absence) => {
      if (absence.user_id === user?.id) return false;
      if (absence.status !== "approved") return false;

      const absStart = parseISO(absence.start_date);
      const absEnd = parseISO(absence.end_date);

      return (
        isWithinInterval(startDate, { start: absStart, end: absEnd }) ||
        isWithinInterval(endDate, { start: absStart, end: absEnd }) ||
        isWithinInterval(absStart, { start: startDate, end: endDate })
      );
    });
  }, [startDate, endDate, absences, user]);

  // Check substitute availability
  const substituteAvailable = useMemo(() => {
    if (!substituteId || !startDate || !endDate) return true;

    const substituteAbsences = absences.filter(
      (a) => a.user_id === substituteId && a.status === "approved"
    );

    return !substituteAbsences.some((absence) => {
      const absStart = parseISO(absence.start_date);
      const absEnd = parseISO(absence.end_date);

      return (
        isWithinInterval(startDate, { start: absStart, end: absEnd }) ||
        isWithinInterval(endDate, { start: absStart, end: absEnd }) ||
        isWithinInterval(absStart, { start: startDate, end: endDate })
      );
    });
  }, [substituteId, startDate, endDate, absences]);

  const handleSubmit = async () => {
    if (!startDate || !endDate) return;

    try {
      await createAbsence({
        absence_type: absenceType,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        substitute_user_id: substituteId || undefined,
        notes: notes || undefined,
      });

      // Reset form
      setAbsenceType("vacation");
      setStartDate(undefined);
      setEndDate(undefined);
      setSubstituteId("");
      setNotes("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create absence:", error);
    }
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    if (date && (!endDate || endDate < date)) {
      setEndDate(date);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Abwesenheit beantragen</DialogTitle>
          <DialogDescription>
            Stellen Sie einen Antrag für Urlaub, Krankheit oder andere Abwesenheiten.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Absence Type */}
          <div className="grid gap-2">
            <Label>Art der Abwesenheit</Label>
            <Select value={absenceType} onValueChange={(v) => setAbsenceType(v as AbsenceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {absenceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Von</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd.MM.yyyy", { locale: de }) : "Datum wählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateSelect}
                    locale={de}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Bis</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd.MM.yyyy", { locale: de }) : "Datum wählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    locale={de}
                    disabled={(date) => (startDate ? date < startDate : date < new Date())}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Days Count */}
          {startDate && endDate && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{vacationDays}</span> Werktage
            </div>
          )}

          {/* Overlaps Warning */}
          {overlaps.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">Überschneidung mit anderen Abwesenheiten:</div>
                {overlaps.slice(0, 3).map((o) => (
                  <div key={o.id} className="text-sm">
                    {o.user?.display_name || o.user?.email}: {format(parseISO(o.start_date), "dd.MM.")} - {format(parseISO(o.end_date), "dd.MM.")}
                  </div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Substitute */}
          <div className="grid gap-2">
            <Label>Vertretung (optional)</Label>
            <Select value={substituteId} onValueChange={setSubstituteId}>
              <SelectTrigger>
                <SelectValue placeholder="Vertretung auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Keine Vertretung</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {member.display_name || member.email}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {substituteId && !substituteAvailable && (
              <p className="text-sm text-destructive">
                Die gewählte Vertretung ist im Zeitraum nicht verfügbar.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label>Notizen (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Informationen..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!startDate || !endDate || isCreating}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Antrag stellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
