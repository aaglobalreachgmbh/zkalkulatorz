// ============================================
// Google Calendar Event Edge Function
// ============================================
//
// Creates calendar events via Google Calendar API.
// Supports creating follow-up appointments for offer discussions.
//
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalendarEventRequest {
  // Event details
  title: string;
  description?: string;
  startDateTime: string; // ISO 8601 format
  endDateTime: string;   // ISO 8601 format
  location?: string;
  
  // Attendee info
  attendeeEmail?: string;
  attendeeName?: string;
  
  // Related offer
  customerId?: string;
  offerInfo?: {
    tariffCount: number;
    totalMonthly?: number;
  };
  
  // Branding for description
  companyName?: string;
}

// Generate a descriptive event body
function generateEventDescription(params: {
  description?: string;
  attendeeName?: string;
  offerInfo?: { tariffCount: number; totalMonthly?: number };
  companyName: string;
}): string {
  const { description, attendeeName, offerInfo, companyName } = params;
  
  let body = `📋 Termin erstellt über ${companyName}\n\n`;
  
  if (attendeeName) {
    body += `👤 Kunde: ${attendeeName}\n`;
  }
  
  if (offerInfo && offerInfo.tariffCount > 0) {
    body += `📄 Angebot: ${offerInfo.tariffCount} Tarif${offerInfo.tariffCount > 1 ? "e" : ""}\n`;
    if (offerInfo.totalMonthly) {
      body += `💰 Monatlich: ${offerInfo.totalMonthly.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}\n`;
    }
  }
  
  if (description) {
    body += `\n📝 Notizen:\n${description}\n`;
  }
  
  body += `\n---\nErstellt mit ${companyName} MargenKalkulator`;
  
  return body;
}

// Generate Google Calendar URL (no API key needed)
function generateGoogleCalendarUrl(event: {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
}): string {
  const formatDateTime = (isoString: string) => {
    // Convert to format: YYYYMMDDTHHmmssZ
    return new Date(isoString).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    dates: `${formatDateTime(event.startDateTime)}/${formatDateTime(event.endDateTime)}`,
  });

  if (event.location) {
    params.append("location", event.location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Generate .ics file content for download
function generateIcsContent(event: {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  attendeeEmail?: string;
  organizerEmail?: string;
}): string {
  const formatIcsDate = (isoString: string) => {
    return new Date(isoString).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@margenkalkulator`;
  const now = formatIcsDate(new Date().toISOString());

  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MargenKalkulator//DE
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${formatIcsDate(event.startDateTime)}
DTEND:${formatIcsDate(event.endDateTime)}
SUMMARY:${event.title.replace(/,/g, "\\,")}
DESCRIPTION:${event.description.replace(/\n/g, "\\n").replace(/,/g, "\\,")}`;

  if (event.location) {
    ics += `\nLOCATION:${event.location.replace(/,/g, "\\,")}`;
  }

  if (event.attendeeEmail) {
    ics += `\nATTENDEE;RSVP=TRUE:mailto:${event.attendeeEmail}`;
  }

  if (event.organizerEmail) {
    ics += `\nORGANIZER:mailto:${event.organizerEmail}`;
  }

  ics += `
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

  return ics;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse request body
    const body: CalendarEventRequest = await req.json();

    // Validate required fields
    if (!body.title || !body.startDateTime || !body.endDateTime) {
      console.error("[create-calendar-event] Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, startDateTime, endDateTime" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const companyName = body.companyName || "MargenKalkulator";

    // Generate event description
    const description = generateEventDescription({
      description: body.description,
      attendeeName: body.attendeeName,
      offerInfo: body.offerInfo,
      companyName,
    });

    // Generate Google Calendar URL
    const googleCalendarUrl = generateGoogleCalendarUrl({
      title: body.title,
      description,
      startDateTime: body.startDateTime,
      endDateTime: body.endDateTime,
      location: body.location,
    });

    // Generate .ics file content
    const icsContent = generateIcsContent({
      title: body.title,
      description,
      startDateTime: body.startDateTime,
      endDateTime: body.endDateTime,
      location: body.location,
      attendeeEmail: body.attendeeEmail,
    });

    const elapsed = Date.now() - startTime;
    console.log(`[create-calendar-event] Event generated in ${elapsed}ms`);

    // Log to database (optional)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from("security_events").insert({
          event_type: "calendar_event_created",
          risk_level: "info",
          details: {
            title: body.title,
            attendee: body.attendeeEmail,
            customer_id: body.customerId,
            elapsed_ms: elapsed,
          },
        });
      }
    } catch (logError) {
      console.warn("[create-calendar-event] Failed to log event:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        googleCalendarUrl,
        icsContent,
        elapsed_ms: elapsed,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[create-calendar-event] Error after ${elapsed}ms:`, error);

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to create calendar event",
        elapsed_ms: elapsed,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
