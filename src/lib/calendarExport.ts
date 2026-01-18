/**
 * Kalender-Export Utility (.ics Format)
 * 
 * Generiert ICS-Dateien für Termine, Besuchserinnerungen, etc.
 */

export interface CalendarEvent {
  uid?: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  reminder?: number; // Minuten vor dem Termin
  organizer?: {
    name: string;
    email: string;
  };
  attendees?: Array<{
    name: string;
    email: string;
  }>;
  url?: string;
  categories?: string[];
}

/**
 * Formatiert ein Datum für ICS (UTC)
 */
function formatICSDate(date: Date, allDay = false): string {
  if (allDay) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  // UTC format: YYYYMMDDTHHmmssZ
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Escaped text für ICS
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generiert eine eindeutige UID
 */
function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}@margenkalkulator.app`;
}

/**
 * Generiert eine ICS-Datei aus einem Kalenderevent
 */
export function generateICSFile(event: CalendarEvent): string {
  const uid = event.uid || generateUID();
  const now = new Date();
  
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MargenKalkulator//Calendar//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICSDate(now)}
`;

  // Datum-Format
  if (event.allDay) {
    icsContent += `DTSTART;VALUE=DATE:${formatICSDate(event.start, true)}\n`;
    icsContent += `DTEND;VALUE=DATE:${formatICSDate(event.end, true)}\n`;
  } else {
    icsContent += `DTSTART:${formatICSDate(event.start)}\n`;
    icsContent += `DTEND:${formatICSDate(event.end)}\n`;
  }

  // Titel (Pflichtfeld)
  icsContent += `SUMMARY:${escapeICS(event.title)}\n`;

  // Optionale Felder
  if (event.description) {
    icsContent += `DESCRIPTION:${escapeICS(event.description)}\n`;
  }

  if (event.location) {
    icsContent += `LOCATION:${escapeICS(event.location)}\n`;
  }

  if (event.url) {
    icsContent += `URL:${event.url}\n`;
  }

  if (event.categories && event.categories.length > 0) {
    icsContent += `CATEGORIES:${event.categories.join(",")}\n`;
  }

  if (event.organizer) {
    icsContent += `ORGANIZER;CN=${escapeICS(event.organizer.name)}:mailto:${event.organizer.email}\n`;
  }

  if (event.attendees) {
    event.attendees.forEach((attendee) => {
      icsContent += `ATTENDEE;CN=${escapeICS(attendee.name)}:mailto:${attendee.email}\n`;
    });
  }

  // Reminder (Alarm)
  if (event.reminder && event.reminder > 0) {
    icsContent += `BEGIN:VALARM
TRIGGER:-PT${event.reminder}M
ACTION:DISPLAY
DESCRIPTION:${escapeICS(event.title)}
END:VALARM
`;
  }

  icsContent += `END:VEVENT
END:VCALENDAR`;

  return icsContent;
}

/**
 * Generiert ICS für mehrere Events
 */
export function generateMultiEventICS(events: CalendarEvent[]): string {
  const now = new Date();
  
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MargenKalkulator//Calendar//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

  events.forEach((event) => {
    const uid = event.uid || generateUID();
    
    icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICSDate(now)}
`;

    if (event.allDay) {
      icsContent += `DTSTART;VALUE=DATE:${formatICSDate(event.start, true)}\n`;
      icsContent += `DTEND;VALUE=DATE:${formatICSDate(event.end, true)}\n`;
    } else {
      icsContent += `DTSTART:${formatICSDate(event.start)}\n`;
      icsContent += `DTEND:${formatICSDate(event.end)}\n`;
    }

    icsContent += `SUMMARY:${escapeICS(event.title)}\n`;

    if (event.description) {
      icsContent += `DESCRIPTION:${escapeICS(event.description)}\n`;
    }

    if (event.location) {
      icsContent += `LOCATION:${escapeICS(event.location)}\n`;
    }

    if (event.reminder && event.reminder > 0) {
      icsContent += `BEGIN:VALARM
TRIGGER:-PT${event.reminder}M
ACTION:DISPLAY
DESCRIPTION:${escapeICS(event.title)}
END:VALARM
`;
    }

    icsContent += `END:VEVENT
`;
  });

  icsContent += `END:VCALENDAR`;

  return icsContent;
}

/**
 * Download ICS Datei
 */
export function downloadICSFile(event: CalendarEvent, filename?: string): void {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `${event.title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Erstellt einen Kalender-Link für verschiedene Anbieter
 */
export function generateCalendarLinks(event: CalendarEvent): {
  google: string;
  outlook: string;
  ics: string;
} {
  const startISO = event.start.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const endISO = event.end.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  
  // Google Calendar
  const googleParams = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${startISO}/${endISO}`,
  });
  if (event.description) googleParams.set("details", event.description);
  if (event.location) googleParams.set("location", event.location);

  // Outlook
  const outlookParams = new URLSearchParams({
    subject: event.title,
    startdt: event.start.toISOString(),
    enddt: event.end.toISOString(),
  });
  if (event.description) outlookParams.set("body", event.description);
  if (event.location) outlookParams.set("location", event.location);

  // ICS as data URL
  const icsContent = generateICSFile(event);
  const icsDataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;

  return {
    google: `https://calendar.google.com/calendar/render?${googleParams.toString()}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?${outlookParams.toString()}`,
    ics: icsDataUrl,
  };
}
