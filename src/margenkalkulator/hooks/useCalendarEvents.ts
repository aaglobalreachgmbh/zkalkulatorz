// ============================================
// Calendar Events Hook - Full CRUD for calendar_events table
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";

export type EventType = "meeting" | "call" | "followup" | "vvl_reminder" | "task" | "other";
export type EventStatus = "confirmed" | "tentative" | "cancelled";
export type EventVisibility = "private" | "team" | "tenant";

export interface CalendarEvent {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  event_type: EventType;
  customer_id: string | null;
  contract_id: string | null;
  offer_id: string | null;
  is_all_day: boolean;
  color: string | null;
  reminder_minutes: number;
  recurrence_rule: string | null;
  external_id: string | null;
  external_calendar: "google" | "ionos" | null;
  last_synced_at: string | null;
  visibility: EventVisibility;
  status: EventStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  customer?: { id: string; company_name: string } | null;
  user?: { id: string; display_name: string | null; email: string | null } | null;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  event_type?: EventType;
  customer_id?: string;
  contract_id?: string;
  offer_id?: string;
  is_all_day?: boolean;
  color?: string;
  reminder_minutes?: number;
  visibility?: EventVisibility;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
  status?: EventStatus;
}

const QUERY_KEY = ["calendarEvents"];

export function useCalendarEvents(options?: {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  includeTeam?: boolean;
}) {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  // Build query key with filters
  const queryKey = [
    ...QUERY_KEY,
    options?.startDate?.toISOString(),
    options?.endDate?.toISOString(),
    options?.userId,
    options?.includeTeam,
  ];

  // Fetch events
  const {
    data: events = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];

      try {
        let query = supabase
          .from("calendar_events")
          .select(`
            *,
            customer:customers(id, company_name)
          `)
          .order("start_time", { ascending: true });

        // Date range filter
        if (options?.startDate) {
          query = query.gte("start_time", options.startDate.toISOString());
        }
        if (options?.endDate) {
          query = query.lte("start_time", options.endDate.toISOString());
        }

        // User filter (if not including team view)
        if (options?.userId) {
          query = query.eq("user_id", options.userId);
        }

        const { data, error } = await query;

        if (error) {
          console.warn("[useCalendarEvents] Query error:", error.message);
          return [];
        }

        return (data || []) as CalendarEvent[];
      } catch (err) {
        console.error("[useCalendarEvents] Unexpected error:", err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateEventInput) => {
      if (!user || !identity?.tenantId) {
        throw new Error("Nicht authentifiziert");
      }

      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          tenant_id: identity.tenantId,
          user_id: user.id,
          title: input.title,
          description: input.description || null,
          start_time: input.start_time,
          end_time: input.end_time,
          location: input.location || null,
          event_type: input.event_type || "meeting",
          customer_id: input.customer_id || null,
          contract_id: input.contract_id || null,
          offer_id: input.offer_id || null,
          is_all_day: input.is_all_day || false,
          color: input.color || null,
          reminder_minutes: input.reminder_minutes ?? 60,
          visibility: input.visibility || "private",
        })
        .select()
        .single();

      if (error) throw error;
      return data as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Termin erstellt");
    },
    onError: (error: Error) => {
      console.error("[useCalendarEvents] Create error:", error);
      toast.error("Termin konnte nicht erstellt werden");
    },
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: async (input: UpdateEventInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("calendar_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Termin aktualisiert");
    },
    onError: (error: Error) => {
      console.error("[useCalendarEvents] Update error:", error);
      toast.error("Termin konnte nicht aktualisiert werden");
    },
  });

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Termin gelöscht");
    },
    onError: (error: Error) => {
      console.error("[useCalendarEvents] Delete error:", error);
      toast.error("Termin konnte nicht gelöscht werden");
    },
  });

  // Get events for a specific day
  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      const eventStart = new Date(event.start_time);
      return eventStart >= dayStart && eventStart <= dayEnd;
    });
  };

  // Get upcoming events (next N days)
  const getUpcomingEvents = (days: number = 7): CalendarEvent[] => {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return events.filter((event) => {
      const eventStart = new Date(event.start_time);
      return eventStart >= now && eventStart <= future && event.status !== "cancelled";
    });
  };

  return {
    events,
    isLoading,
    error,
    refetch,
    
    // Mutations
    createEvent: createMutation.mutateAsync,
    updateEvent: updateMutation.mutateAsync,
    deleteEvent: deleteMutation.mutateAsync,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Helpers
    getEventsForDay,
    getUpcomingEvents,
  };
}
