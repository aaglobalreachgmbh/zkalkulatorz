import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";
import { startOfWeek, endOfWeek, format, differenceInMinutes, parseISO } from "date-fns";

export interface TimeEntry {
  id: string;
  tenant_id: string;
  user_id: string;
  date: string;
  clock_in: string;
  clock_out: string | null;
  break_minutes: number;
  work_minutes: number;
  notes: string | null;
  status: "active" | "completed" | "edited" | "approved";
  approved_by: string | null;
  approved_at: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    display_name: string | null;
    email: string | null;
  };
}

export interface TimeEntryCorrection {
  id: string;
  tenant_id: string;
  time_entry_id: string;
  requested_by: string;
  original_clock_in: string | null;
  original_clock_out: string | null;
  new_clock_in: string | null;
  new_clock_out: string | null;
  new_break_minutes: number | null;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  // Joined data
  time_entry?: TimeEntry;
  requester?: {
    display_name: string | null;
    email: string | null;
  };
}

export interface WeeklyStats {
  totalMinutes: number;
  totalHours: number;
  targetMinutes: number;
  overtimeMinutes: number;
  avgPerDay: number;
  daysWorked: number;
}

const DEFAULT_WEEKLY_TARGET_HOURS = 40;

export function useTimeTracking(options?: {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  includeTeam?: boolean;
}) {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for active entries
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const targetUserId = options?.userId || user?.id;
  const startDate = options?.startDate || startOfWeek(new Date(), { weekStartsOn: 1 });
  const endDate = options?.endDate || endOfWeek(new Date(), { weekStartsOn: 1 });

  // Fetch time entries
  const {
    data: entries = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["time-entries", targetUserId, startDate.toISOString(), endDate.toISOString(), options?.includeTeam],
    queryFn: async () => {
      try {
        let query = supabase
          .from("time_entries")
          .select("*")
          .gte("date", format(startDate, "yyyy-MM-dd"))
          .lte("date", format(endDate, "yyyy-MM-dd"))
          .order("date", { ascending: false })
          .order("clock_in", { ascending: false });

        if (!options?.includeTeam && targetUserId) {
          query = query.eq("user_id", targetUserId);
        } else if (identity.tenantId) {
          query = query.eq("tenant_id", identity.tenantId);
        }

        const { data, error } = await query;

        if (error) {
          console.warn("[useTimeTracking] Fetch error:", error.message);
          return [];
        }

        return (data || []).map((entry) => ({
          ...entry,
          status: entry.status as TimeEntry["status"],
        })) as TimeEntry[];
      } catch (err) {
        console.warn("[useTimeTracking] Exception:", err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Get active entry (currently clocked in)
  const activeEntry = useMemo(() => {
    if (!user) return null;
    return entries.find(
      (e) => e.user_id === user.id && e.status === "active" && !e.clock_out
    ) || null;
  }, [entries, user]);

  // Calculate elapsed time for active entry
  const elapsedTime = useMemo(() => {
    if (!activeEntry) return null;
    const clockIn = parseISO(activeEntry.clock_in);
    const minutes = differenceInMinutes(currentTime, clockIn) - (activeEntry.break_minutes || 0);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const secs = currentTime.getSeconds();
    return {
      hours,
      minutes: mins,
      seconds: secs,
      totalMinutes: minutes,
      formatted: `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`,
    };
  }, [activeEntry, currentTime]);

  // Weekly statistics
  const weeklyStats = useMemo((): WeeklyStats => {
    const weekEntries = entries.filter((e) => e.user_id === targetUserId);
    const totalMinutes = weekEntries.reduce((sum, e) => sum + (e.work_minutes || 0), 0);
    const targetMinutes = DEFAULT_WEEKLY_TARGET_HOURS * 60;
    const daysWorked = new Set(weekEntries.map((e) => e.date)).size;

    return {
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      targetMinutes,
      overtimeMinutes: totalMinutes - targetMinutes,
      avgPerDay: daysWorked > 0 ? Math.round(totalMinutes / daysWorked) : 0,
      daysWorked,
    };
  }, [entries, targetUserId]);

  // Entries grouped by date
  const entriesByDate = useMemo(() => {
    const grouped: Record<string, TimeEntry[]> = {};
    entries.forEach((entry) => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = [];
      }
      grouped[entry.date].push(entry);
    });
    return grouped;
  }, [entries]);

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: async (input?: { location?: string; notes?: string }) => {
      if (!user || !identity.tenantId) {
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      // Check if already clocked in
      if (activeEntry) {
        toast.error("Du bist bereits eingestempelt");
        return null;
      }

      const { data, error } = await supabase
        .from("time_entries")
        .insert([{
          tenant_id: identity.tenantId,
          user_id: user.id,
          date: format(new Date(), "yyyy-MM-dd"),
          clock_in: new Date().toISOString(),
          location: input?.location || null,
          notes: input?.notes || null,
          status: "active",
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      toast.success("Erfolgreich eingestempelt");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Einstempeln fehlgeschlagen");
    },
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: async (input?: { breakMinutes?: number; notes?: string }) => {
      if (!activeEntry) {
        console.warn("[useTimeTracking] No active entry");
        toast.error("Kein aktiver Zeiteintrag gefunden");
        return null;
      }

      const { data, error } = await supabase
        .from("time_entries")
        .update({
          clock_out: new Date().toISOString(),
          break_minutes: input?.breakMinutes || activeEntry.break_minutes || 0,
          notes: input?.notes || activeEntry.notes,
          status: "completed",
        })
        .eq("id", activeEntry.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      if (!data) return;
      const hours = Math.floor((data.work_minutes || 0) / 60);
      const mins = (data.work_minutes || 0) % 60;
      toast.success(`Ausgestempelt (${hours}h ${mins}m)`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ausstempeln fehlgeschlagen");
    },
  });

  // Add break mutation
  const addBreakMutation = useMutation({
    mutationFn: async (minutes: number) => {
      if (!activeEntry) {
        console.warn("[useTimeTracking] No active entry");
        toast.error("Kein aktiver Zeiteintrag gefunden");
        return null;
      }

      const { data, error } = await supabase
        .from("time_entries")
        .update({
          break_minutes: (activeEntry.break_minutes || 0) + minutes,
        })
        .eq("id", activeEntry.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      toast.success("Pause hinzugefügt");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Pause hinzufügen fehlgeschlagen");
    },
  });

  // Request correction mutation
  const requestCorrectionMutation = useMutation({
    mutationFn: async (input: {
      timeEntryId: string;
      newClockIn?: string;
      newClockOut?: string;
      newBreakMinutes?: number;
      reason: string;
    }) => {
      if (!user || !identity.tenantId) {
        console.warn("[useTimeTracking] Not authenticated");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      const entry = entries.find((e) => e.id === input.timeEntryId);
      if (!entry) {
        toast.error("Zeiteintrag nicht gefunden");
        return null;
      }

      const { data, error } = await supabase
        .from("time_entry_corrections")
        .insert([{
          tenant_id: identity.tenantId,
          time_entry_id: input.timeEntryId,
          requested_by: user.id,
          original_clock_in: entry.clock_in,
          original_clock_out: entry.clock_out,
          new_clock_in: input.newClockIn || null,
          new_clock_out: input.newClockOut || null,
          new_break_minutes: input.newBreakMinutes,
          reason: input.reason,
          status: "pending",
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entry-corrections"] });
      toast.success("Korrekturantrag gestellt");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Korrekturantrag fehlgeschlagen");
    },
  });

  // Approve entry mutation (admin)
  const approveEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      if (!user) {
        console.warn("[useTimeTracking] Not authenticated");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      const { data, error } = await supabase
        .from("time_entries")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      toast.success("Zeiteintrag genehmigt");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Genehmigung fehlgeschlagen");
    },
  });

  return {
    // Data
    entries,
    entriesByDate,
    activeEntry,
    elapsedTime,
    weeklyStats,

    // State
    isLoading,
    error,
    refetch,

    // Actions
    clockIn: clockInMutation.mutateAsync,
    clockOut: clockOutMutation.mutateAsync,
    addBreak: addBreakMutation.mutateAsync,
    requestCorrection: requestCorrectionMutation.mutateAsync,
    approveEntry: approveEntryMutation.mutateAsync,

    // Mutation states
    isClockingIn: clockInMutation.isPending,
    isClockingOut: clockOutMutation.isPending,
    isAddingBreak: addBreakMutation.isPending,
  };
}

// Hook for corrections (admin view)
export function useTimeEntryCorrections() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  const {
    data: corrections = [],
    isLoading,
  } = useQuery({
    queryKey: ["time-entry-corrections", identity.tenantId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("time_entry_corrections")
          .select(`
            *,
            time_entry:time_entries(*)
          `)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("[useTimeEntryCorrections] Fetch error:", error.message);
          return [];
        }

        return (data || []).map((c) => ({
          ...c,
          status: c.status as TimeEntryCorrection["status"],
        })) as TimeEntryCorrection[];
      } catch (err) {
        console.warn("[useTimeEntryCorrections] Exception:", err);
        return [];
      }
    },
    enabled: !!user && !!identity.tenantId,
  });

  const reviewCorrectionMutation = useMutation({
    mutationFn: async (input: {
      correctionId: string;
      approved: boolean;
      reviewNotes?: string;
    }) => {
      if (!user) {
        console.warn("[useTimeEntryCorrections] Not authenticated");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      const correction = corrections.find((c) => c.id === input.correctionId);
      if (!correction) {
        toast.error("Korrektur nicht gefunden");
        return null;
      }

      // Update correction status
      const { error: corrError } = await supabase
        .from("time_entry_corrections")
        .update({
          status: input.approved ? "approved" : "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: input.reviewNotes || null,
        })
        .eq("id", input.correctionId);

      if (corrError) throw corrError;

      // If approved, update the time entry
      if (input.approved && correction.time_entry_id) {
        const updates: Record<string, unknown> = { status: "edited" };
        if (correction.new_clock_in) updates.clock_in = correction.new_clock_in;
        if (correction.new_clock_out) updates.clock_out = correction.new_clock_out;
        if (correction.new_break_minutes !== null) updates.break_minutes = correction.new_break_minutes;

        const { error: entryError } = await supabase
          .from("time_entries")
          .update(updates)
          .eq("id", correction.time_entry_id);

        if (entryError) throw entryError;
      }

      return { approved: input.approved };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["time-entry-corrections"] });
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      toast.success(data.approved ? "Korrektur genehmigt" : "Korrektur abgelehnt");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Bearbeitung fehlgeschlagen");
    },
  });

  return {
    corrections,
    isLoading,
    reviewCorrection: reviewCorrectionMutation.mutateAsync,
    isReviewing: reviewCorrectionMutation.isPending,
  };
}

// Helper to format minutes as HH:MM
export function formatMinutesAsTime(minutes: number): string {
  const hours = Math.floor(Math.abs(minutes) / 60);
  const mins = Math.abs(minutes) % 60;
  const sign = minutes < 0 ? "-" : "";
  return `${sign}${hours}h ${mins}m`;
}
