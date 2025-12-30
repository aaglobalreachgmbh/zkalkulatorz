// ============================================
// Create Calendar Event Hook
// ============================================

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { toast } from "sonner";

interface CreateEventParams {
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  location?: string;
  attendeeEmail?: string;
  attendeeName?: string;
  customerId?: string;
  offerInfo?: {
    tariffCount: number;
    totalMonthly?: number;
  };
}

interface CreateEventResult {
  success: boolean;
  googleCalendarUrl?: string;
  icsContent?: string;
  error?: string;
}

export function useCalendarEvent() {
  const [isCreating, setIsCreating] = useState(false);
  const { branding } = useTenantBranding();

  const createEvent = useCallback(async (params: CreateEventParams): Promise<CreateEventResult> => {
    setIsCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-calendar-event", {
        body: {
          title: params.title,
          description: params.description,
          startDateTime: params.startDateTime.toISOString(),
          endDateTime: params.endDateTime.toISOString(),
          location: params.location,
          attendeeEmail: params.attendeeEmail,
          attendeeName: params.attendeeName,
          customerId: params.customerId,
          offerInfo: params.offerInfo,
          companyName: branding.companyName,
        },
      });

      if (error) {
        console.error("[useCalendarEvent] Edge function error:", error);
        toast.error(`Kalendereintrag konnte nicht erstellt werden: ${error.message}`);
        return { success: false, error: error.message };
      }

      if (data?.error) {
        console.error("[useCalendarEvent] API error:", data.error);
        toast.error(`Kalenderfehler: ${data.error}`);
        return { success: false, error: data.error };
      }

      return {
        success: true,
        googleCalendarUrl: data?.googleCalendarUrl,
        icsContent: data?.icsContent,
      };
    } catch (err: any) {
      console.error("[useCalendarEvent] Unexpected error:", err);
      toast.error("Unerwarteter Fehler beim Erstellen des Kalendereintrags");
      return { success: false, error: err.message };
    } finally {
      setIsCreating(false);
    }
  }, [branding.companyName]);

  // Helper to download ICS file
  const downloadIcs = useCallback((icsContent: string, filename: string) => {
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Helper to open Google Calendar
  const openGoogleCalendar = useCallback((url: string) => {
    window.open(url, "_blank");
  }, []);

  return {
    createEvent,
    downloadIcs,
    openGoogleCalendar,
    isCreating,
  };
}
