// ============================================
// Create Calendar Event Modal
// ============================================

import { useState, useCallback } from "react";
import { addHours, format, setHours, setMinutes } from "date-fns";
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
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCalendarEvent } from "../../hooks/useCalendarEvent";
import { useOfferBasket } from "../../contexts/OfferBasketContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateCalendarEventModalProps {
  trigger?: React.ReactNode;
}

// Time slot options (every 30 minutes)
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  return {
    value: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
    label: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} Uhr`,
  };
});

// Duration options
const DURATION_OPTIONS = [
  { value: "30", label: "30 Minuten" },
  { value: "60", label: "1 Stunde" },
  { value: "90", label: "1,5 Stunden" },
  { value: "120", label: "2 Stunden" },
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
    return sum + (item.result.customer?.avg24 || 0);
  }, 0);

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="w-4 h-4" />
            Termin erstellen
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Folgetermin erstellen
          </DialogTitle>
        </DialogHeader>

        {showResult && resultData ? (
          // Result view
          <div className="space-y-4 mt-4">
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-green-800 dark:text-green-300">
                Kalendereintrag erstellt!
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Wähle, wie du den Termin hinzufügen möchtest:
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleOpenGoogle}
                className="w-full gap-2"
                variant="default"
              >
                <ExternalLink className="w-4 h-4" />
                In Google Kalender öffnen
              </Button>
              
              <Button
                onClick={handleDownloadIcs}
                className="w-full gap-2"
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
          // Form view
          <div className="space-y-4 mt-4">
            {/* Pre-fill button */}
            {(customer.apEmail || customer.vorname || customer.firma) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={prefillFromBasket}
                className="w-full text-xs"
              >
                Kundendaten übernehmen
              </Button>
            )}

            {/* Title */}
            <div>
              <Label htmlFor="event-title" className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Titel
              </Label>
              <Input
                id="event-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Angebotsbesprechung"
              />
            </div>

            {/* Date */}
            <div>
              <Label className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Datum
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP", { locale: de })
                    ) : (
                      <span>Datum wählen</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={de}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Uhrzeit
                </Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
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
              <div>
                <Label>Dauer</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
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
            <div>
              <Label htmlFor="event-location" className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Ort (optional)
              </Label>
              <Input
                id="event-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Büro, Online, Kundenadresse..."
              />
            </div>

            {/* Attendee */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="attendee-name" className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  Kunde
                </Label>
                <Input
                  id="attendee-name"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder="Name"
                />
              </div>
              <div>
                <Label htmlFor="attendee-email" className="flex items-center gap-1">
                  <AtSign className="w-3.5 h-3.5" />
                  E-Mail
                </Label>
                <Input
                  id="attendee-email"
                  type="email"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  placeholder="E-Mail"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="event-description">Notizen (optional)</Label>
              <Textarea
                id="event-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Zusätzliche Informationen..."
                rows={2}
              />
            </div>

            {/* Offer info */}
            {items.length > 0 && (
              <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
                <p>
                  <strong>{items.length} Tarife</strong> werden im Termin vermerkt.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isCreating}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || !title || !selectedDate}
                className="gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    Termin erstellen
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
