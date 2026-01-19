// ============================================
// Create Calendar Event Modal
// Clean, modern calendar scheduling with integration options
// ============================================

import { useState, useCallback } from "react";
import { addHours, format, setHours, setMinutes, addDays } from "date-fns";
import { de } from "date-fns/locale";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  AtSign,
  FileText,
  Loader2,
  ExternalLink,
  Download,
  Link2,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCalendarEvent } from "../../hooks/useCalendarEvent";
import { useOfferBasket } from "../../contexts/OfferBasketContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateCalendarEventModalProps {
  trigger?: React.ReactNode;
}

// Time slot options (every 30 minutes from 8:00 to 20:00)
const TIME_SLOTS = Array.from({ length: 25 }, (_, i) => {
  const hours = Math.floor(i / 2) + 8;
  const minutes = (i % 2) * 30;
  if (hours > 20) return null;
  return {
    value: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
    label: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} Uhr`,
  };
}).filter(Boolean) as { value: string; label: string }[];

// Duration options
const DURATION_OPTIONS = [
  { value: "15", label: "15 Min" },
  { value: "30", label: "30 Min" },
  { value: "45", label: "45 Min" },
  { value: "60", label: "1 Std" },
  { value: "90", label: "1,5 Std" },
  { value: "120", label: "2 Std" },
];

// Quick date options
const QUICK_DATES = [
  { label: "Heute", days: 0 },
  { label: "Morgen", days: 1 },
  { label: "Übermorgen", days: 2 },
];

export function CreateCalendarEventModal({ trigger }: CreateCalendarEventModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("Angebotsbesprechung");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [duration, setDuration] = useState("60");
  const [location, setLocation] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [attendeeName, setAttendeeName] = useState("");
  const [activeTab, setActiveTab] = useState<"create" | "sync">("create");
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<{ googleCalendarUrl?: string; icsContent?: string } | null>(null);

  const { createEvent, downloadIcs, openGoogleCalendar, isCreating } = useCalendarEvent();
  const { items, customer } = useOfferBasket();

  // Pre-fill from customer
  const prefillFromBasket = useCallback(() => {
    if (customer.apEmail) {
      setAttendeeEmail(customer.apEmail);
    }
    const fullName = [customer.vorname, customer.nachname].filter(Boolean).join(" ");
    if (fullName) {
      setAttendeeName(fullName);
    } else if (customer.firma) {
      setAttendeeName(customer.firma);
    }
    if (customer.firma) {
      setTitle(`Angebotsbesprechung - ${customer.firma}`);
    }
  }, [customer]);

  // Calculate total monthly from basket items
  const totalMonthly = items.reduce((sum, item) => {
    return sum + (item.result.totals?.avgTermNet || 0);
  }, 0);

  // Quick date selection
  const selectQuickDate = (days: number) => {
    setSelectedDate(addDays(new Date(), days));
  };

  // Create event handler
  const handleCreate = async () => {
    if (!selectedDate) {
      toast.error("Bitte Datum auswählen");
      return;
    }

    // Parse time
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const startDateTime = setMinutes(setHours(selectedDate, hours), minutes);
    const endDateTime = addHours(startDateTime, parseInt(duration) / 60);

    const result = await createEvent({
      title,
      description: description || undefined,
      startDateTime,
      endDateTime,
      location: location || undefined,
      attendeeEmail: attendeeEmail || undefined,
      attendeeName: attendeeName || undefined,
      offerInfo: items.length > 0 ? {
        tariffCount: items.length,
        totalMonthly,
      } : undefined,
    });

    if (result.success) {
      setResultData({
        googleCalendarUrl: result.googleCalendarUrl,
        icsContent: result.icsContent,
      });
      setShowResult(true);
      toast.success("Kalendereintrag erstellt!");
    }
  };

  // Handle ICS download
  const handleDownloadIcs = () => {
    if (resultData?.icsContent) {
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
      downloadIcs(resultData.icsContent, filename);
    }
  };

  // Handle Google Calendar open
  const handleOpenGoogle = () => {
    if (resultData?.googleCalendarUrl) {
      openGoogleCalendar(resultData.googleCalendarUrl);
    }
  };

  // Reset and close
  const handleClose = () => {
    setIsOpen(false);
    setShowResult(false);
    setResultData(null);
  };

  // Reset form when opened
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setShowResult(false);
      setResultData(null);
      setActiveTab("create");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ? (trigger as any) : (
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="w-4 h-4" />
            Termin erstellen
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-muted/30">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="block">Folgetermin erstellen</span>
              {items.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  {items.length} Tarif{items.length !== 1 ? "e" : ""} im Angebot
                </span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {showResult && resultData ? (
          // Success Result View
          <div className="p-6 space-y-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-6 rounded-xl text-center border border-green-200/50 dark:border-green-800/50">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Check className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-green-800 dark:text-green-300 text-lg">
                Termin erstellt!
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                {format(selectedDate!, "EEEE, d. MMMM yyyy", { locale: de })} um {selectedTime} Uhr
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleOpenGoogle}
                className="w-full gap-2 h-12"
                variant="default"
              >
                <ExternalLink className="w-4 h-4" />
                In Google Kalender öffnen
              </Button>

              <Button
                onClick={handleDownloadIcs}
                className="w-full gap-2 h-12"
                variant="outline"
              >
                <Download className="w-4 h-4" />
                .ics Datei herunterladen
              </Button>

              <p className="text-xs text-center text-muted-foreground pt-2">
                Die .ics Datei kann in Outlook, Apple Kalender und anderen Apps importiert werden.
              </p>
            </div>

            <Button variant="ghost" onClick={handleClose} className="w-full">
              Schließen
            </Button>
          </div>
        ) : (
          // Form View with Tabs
          <div>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "create" | "sync")} className="w-full">
              <div className="px-6 pt-4">
                <TabsList className="w-full grid grid-cols-2 h-10">
                  <TabsTrigger value="create" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Neuer Termin
                  </TabsTrigger>
                  <TabsTrigger value="sync" className="gap-2">
                    <Link2 className="w-4 h-4" />
                    Kalender verbinden
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="create" className="p-6 pt-4 space-y-4 mt-0">
                {/* Pre-fill button */}
                {(customer.apEmail || customer.vorname || customer.firma) && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={prefillFromBasket}
                    className="w-full text-xs gap-2"
                  >
                    <User className="w-3.5 h-3.5" />
                    Kundendaten übernehmen
                  </Button>
                )}

                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="event-title" className="flex items-center gap-1.5 text-sm font-medium">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    Titel
                  </Label>
                  <Input
                    id="event-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Angebotsbesprechung"
                    className="h-11"
                  />
                </div>

                {/* Quick Date Buttons + Calendar Toggle */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    Datum
                  </Label>
                  <div className="flex gap-2">
                    {QUICK_DATES.map((qd) => {
                      const targetDate = addDays(new Date(), qd.days);
                      const isSelected = selectedDate &&
                        format(selectedDate, "yyyy-MM-dd") === format(targetDate, "yyyy-MM-dd");
                      return (
                        <Button
                          key={qd.days}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => selectQuickDate(qd.days)}
                          className="flex-1"
                        >
                          {qd.label}
                        </Button>
                      );
                    })}
                    <Popover open={showCalendarPicker} onOpenChange={setShowCalendarPicker}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="px-3"
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <CalendarPicker
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            setShowCalendarPicker(false);
                          }}
                          locale={de}
                          disabled={(date) => date < addDays(new Date(), -1)}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {/* Selected Date Display */}
                  {selectedDate && (
                    <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                      {format(selectedDate, "EEEE, d. MMMM yyyy", { locale: de })}
                    </div>
                  )}
                </div>

                {/* Time & Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      Uhrzeit
                    </Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Dauer</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <Label htmlFor="event-location" className="flex items-center gap-1.5 text-sm font-medium">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    Ort <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="event-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Büro, Online, Kundenadresse..."
                    className="h-11"
                  />
                </div>

                {/* Attendee */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="attendee-name" className="flex items-center gap-1.5 text-sm font-medium">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      Kunde
                    </Label>
                    <Input
                      id="attendee-name"
                      value={attendeeName}
                      onChange={(e) => setAttendeeName(e.target.value)}
                      placeholder="Name"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="attendee-email" className="flex items-center gap-1.5 text-sm font-medium">
                      <AtSign className="w-3.5 h-3.5 text-muted-foreground" />
                      E-Mail
                    </Label>
                    <Input
                      id="attendee-email"
                      type="email"
                      value={attendeeEmail}
                      onChange={(e) => setAttendeeEmail(e.target.value)}
                      placeholder="E-Mail"
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="event-description" className="text-sm font-medium">
                    Notizen <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="event-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Zusätzliche Informationen..."
                    rows={2}
                    className="resize-none"
                  />
                </div>

                {/* Offer info */}
                {items.length > 0 && (
                  <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg text-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <span>
                      <strong className="text-primary">{items.length} Tarif{items.length !== 1 ? "e" : ""}</strong>{" "}
                      <span className="text-muted-foreground">werden im Termin vermerkt</span>
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={isCreating}
                    className="flex-1 h-11"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={isCreating || !title || !selectedDate}
                    className="flex-1 h-11 gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Wird erstellt...
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="w-4 h-4" />
                        Termin erstellen
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="sync" className="p-6 pt-4 space-y-4 mt-0">
                {/* Calendar Integration Options */}
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Link2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">Kalender verbinden</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                    Verbinde deinen Unternehmenskalender, um Termine direkt zu synchronisieren und bestehende Termine einzusehen.
                  </p>
                </div>

                <div className="space-y-2">
                  {/* Google Calendar */}
                  <button
                    className="w-full p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all flex items-center gap-4 text-left group"
                    onClick={() => toast.info("Google Kalender Integration kommt bald!")}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.5 22h-15A2.5 2.5 0 012 19.5v-15A2.5 2.5 0 014.5 2H9v2H4.5a.5.5 0 00-.5.5v15a.5.5 0 00.5.5h15a.5.5 0 00.5-.5V15h2v4.5a2.5 2.5 0 01-2.5 2.5z" />
                        <path d="M18 8h-6V6h6a2 2 0 012 2v6h-2V8zM8 10h8v2H8z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium group-hover:text-primary transition-colors">Google Kalender</div>
                      <div className="text-sm text-muted-foreground">Termine automatisch synchronisieren</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>

                  {/* Microsoft Outlook */}
                  <button
                    className="w-full p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all flex items-center gap-4 text-left group"
                    onClick={() => toast.info("Outlook Integration kommt bald!")}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.13V2.55q0-.44.3-.75.3-.3.7-.3h6.35q.42 0 .71.3.3.3.3.75V6h6.13q.46 0 .8.33.33.33.33.8v3.79zM8 17.88h5.63v-3.5H8v3.5zm10.25-5.63h-5.5v3.79H18V12.26zm0-5.01H7.13V9h11.12V7.25z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium group-hover:text-primary transition-colors">Microsoft Outlook</div>
                      <div className="text-sm text-muted-foreground">Mit Office 365 verbinden</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>

                  {/* Apple Calendar */}
                  <button
                    className="w-full p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all flex items-center gap-4 text-left group"
                    onClick={() => toast.info("Apple Kalender Integration kommt bald!")}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium group-hover:text-primary transition-colors">Apple Kalender</div>
                      <div className="text-sm text-muted-foreground">iCloud Kalender synchronisieren</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Nach der Verbindung kannst du bestehende Termine einsehen und neue Termine werden automatisch synchronisiert.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
