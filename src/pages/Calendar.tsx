import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, MapPin, User, Link2 } from "lucide-react";
import { useCalendarEvents, type CalendarEvent, type CreateEventInput } from "@/margenkalkulator/hooks/useCalendarEvents";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { de } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { IntegrationPromptCard } from "@/margenkalkulator/ui/components/IntegrationPromptCard";
import { GoogleCalendarIcon, OutlookIcon } from "@/margenkalkulator/ui/components/icons/IntegrationIcons";
import { toast } from "sonner";

const EVENT_TYPE_COLORS: Record<string, string> = {
  meeting: "bg-blue-500",
  call: "bg-green-500",
  followup: "bg-amber-500",
  vvl_reminder: "bg-red-500",
  task: "bg-purple-500",
  other: "bg-gray-500",
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CreateEventInput>>({
    title: "",
    event_type: "meeting",
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const { events, isLoading, createEvent, isCreating, getEventsForDay, getUpcomingEvents } = useCalendarEvents({
    startDate: monthStart,
    endDate: monthEnd,
  });

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const upcomingEvents = getUpcomingEvents(7);

  const handleCreateEvent = async () => {
    if (!newEvent.title || !selectedDate) return;
    
    const startTime = new Date(selectedDate);
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(selectedDate);
    endTime.setHours(10, 0, 0, 0);

    await createEvent({
      title: newEvent.title,
      description: newEvent.description,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      event_type: newEvent.event_type as any || "meeting",
      location: newEvent.location,
    });

    setNewEvent({ title: "", event_type: "meeting" });
    setIsCreateOpen(false);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-6 h-6" />
              Kalender
            </h1>
            <p className="text-muted-foreground">Termine und Erinnerungen verwalten</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Neuer Termin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuen Termin erstellen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Titel</Label>
                  <Input
                    value={newEvent.title || ""}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Terminbezeichnung"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Typ</Label>
                  <Select
                    value={newEvent.event_type || "meeting"}
                    onValueChange={(v) => setNewEvent({ ...newEvent, event_type: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="call">Anruf</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="vvl_reminder">VVL-Erinnerung</SelectItem>
                      <SelectItem value="task">Aufgabe</SelectItem>
                      <SelectItem value="other">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ort (optional)</Label>
                  <Input
                    value={newEvent.location || ""}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="z.B. Büro, Online"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Beschreibung (optional)</Label>
                  <Textarea
                    value={newEvent.description || ""}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Weitere Details..."
                  />
                </div>
                <Button onClick={handleCreateEvent} disabled={!newEvent.title || isCreating} className="w-full">
                  {isCreating ? "Wird erstellt..." : "Termin erstellen"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>{format(currentMonth, "MMMM yyyy", { locale: de })}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                  Heute
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Pad start of month */}
                {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                  <div key={`pad-${i}`} className="aspect-square" />
                ))}
                {days.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => {
                        setSelectedDate(day);
                        setIsCreateOpen(true);
                      }}
                      className={cn(
                        "aspect-square p-1 rounded-lg border text-sm transition-all hover:border-primary/50",
                        isToday && "border-primary bg-primary/5",
                        isSelected && "ring-2 ring-primary",
                        !isSameMonth(day, currentMonth) && "text-muted-foreground/50"
                      )}
                    >
                      <div className="font-medium">{format(day, "d")}</div>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-1 justify-center">
                          {dayEvents.slice(0, 3).map((evt) => (
                            <div
                              key={evt.id}
                              className={cn("w-1.5 h-1.5 rounded-full", EVENT_TYPE_COLORS[evt.event_type] || "bg-gray-500")}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Anstehende Termine</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground text-sm">Lade...</p>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm">Keine Termine in den nächsten 7 Tagen</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className={cn("w-1 rounded-full", EVENT_TYPE_COLORS[event.event_type])} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(event.start_time), "dd.MM. HH:mm", { locale: de })}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendar Integrations Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="w-4 h-4" />
              Kalender-Integrationen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Verbinden Sie externe Kalender, um Termine automatisch zu synchronisieren.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <IntegrationPromptCard
                type="google-calendar"
                onConnect={() => toast.info("Google Kalender-Integration kommt bald!")}
                variant="inline"
              />
              <IntegrationPromptCard
                type="outlook"
                onConnect={() => toast.info("Outlook-Integration kommt bald!")}
                variant="inline"
              />
              <button
                onClick={() => toast.info("iCloud-Integration kommt bald!")}
                className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/50 transition-all"
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="4" fill="url(#appleCalGradient2)"/>
                  <rect x="3" y="4" width="18" height="6" rx="4" fill="#FF3B30"/>
                  <text x="12" y="18" textAnchor="middle" fill="#333" fontSize="10" fontWeight="bold">31</text>
                  <defs>
                    <linearGradient id="appleCalGradient2" x1="12" y1="4" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FF3B30"/>
                      <stop offset="0.3" stopColor="#FFFFFF"/>
                      <stop offset="1" stopColor="#F5F5F5"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">iCloud Kalender</p>
                  <p className="text-xs text-muted-foreground">Apple Kalender</p>
                </div>
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Sync-Status: Manuell (keine externen Kalender verbunden)
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
