// ============================================
// Shifts Hook
// Shift schedule management for shop employees
// ============================================

import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";

export type ShiftStatus = "scheduled" | "confirmed" | "completed" | "cancelled";
export type SwapRequestStatus = "pending" | "approved" | "rejected";

export interface ShiftTemplate {
  id: string;
  tenant_id: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  tenant_id: string;
  user_id: string;
  template_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  status: ShiftStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: { id: string; display_name: string | null; email: string | null };
  template?: ShiftTemplate | null;
}

export interface ShiftSwapRequest {
  id: string;
  tenant_id: string;
  shift_id: string;
  requesting_user_id: string;
  target_user_id: string | null;
  reason: string | null;
  status: SwapRequestStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  // Joined data
  shift?: Shift;
  requesting_user?: { id: string; display_name: string | null };
  target_user?: { id: string; display_name: string | null };
}

export interface CreateShiftInput {
  user_id: string;
  date: string;
  template_id?: string;
  start_time: string;
  end_time: string;
  break_minutes?: number;
  notes?: string;
}

const SHIFTS_KEY = ["shifts"];
const TEMPLATES_KEY = ["shift-templates"];
const SWAP_REQUESTS_KEY = ["shift-swap-requests"];

export function useShifts(options?: { startDate?: Date; endDate?: Date }) {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  const queryKey = [
    ...SHIFTS_KEY,
    options?.startDate?.toISOString(),
    options?.endDate?.toISOString(),
  ];

  // Fetch shifts
  const {
    data: shifts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];

      try {
        let query = supabase
          .from("shifts")
          .select(`
            *,
            user:profiles!shifts_user_id_fkey(id, display_name, email),
            template:shift_templates(*)
          `)
          .order("date", { ascending: true })
          .order("start_time", { ascending: true });

        if (options?.startDate) {
          query = query.gte("date", options.startDate.toISOString().split("T")[0]);
        }
        if (options?.endDate) {
          query = query.lte("date", options.endDate.toISOString().split("T")[0]);
        }

        const { data, error } = await query;

        if (error) {
          console.warn("[useShifts] Query error:", error.message);
          return [];
        }

        return (data || []) as unknown as Shift[];
      } catch (err) {
        console.error("[useShifts] Unexpected error:", err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch shift templates
  const { data: templates = [] } = useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("shift_templates")
          .select("*")
          .eq("is_active", true)
          .order("start_time", { ascending: true });

        if (error) {
          console.warn("[useShifts] Templates query error:", error.message);
          return [];
        }

        return (data || []) as ShiftTemplate[];
      } catch (err) {
        console.error("[useShifts] Templates unexpected error:", err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch swap requests
  const { data: swapRequests = [] } = useQuery({
    queryKey: SWAP_REQUESTS_KEY,
    queryFn: async () => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from("shift_swap_requests")
          .select(`
            *,
            shift:shifts(*),
            requesting_user:profiles!shift_swap_requests_requesting_user_id_fkey(id, display_name),
            target_user:profiles!shift_swap_requests_target_user_id_fkey(id, display_name)
          `)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("[useShifts] Swap requests query error:", error.message);
          return [];
        }

        return (data || []) as unknown as ShiftSwapRequest[];
      } catch (err) {
        console.error("[useShifts] Swap requests unexpected error:", err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const shiftsChannel = supabase
      .channel("shifts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shifts" },
        () => queryClient.invalidateQueries({ queryKey: SHIFTS_KEY })
      )
      .subscribe();

    const swapChannel = supabase
      .channel("swap-requests-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shift_swap_requests" },
        () => queryClient.invalidateQueries({ queryKey: SWAP_REQUESTS_KEY })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(shiftsChannel);
      supabase.removeChannel(swapChannel);
    };
  }, [user, queryClient]);

  // Today's shifts
  const todaysShifts = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return shifts.filter((s) => s.date === today && s.status !== "cancelled");
  }, [shifts]);

  // My shifts
  const myShifts = useMemo(
    () => shifts.filter((s) => s.user_id === user?.id),
    [shifts, user]
  );

  // Pending swap requests
  const pendingSwapRequests = useMemo(
    () => swapRequests.filter((r) => r.status === "pending"),
    [swapRequests]
  );

  // Create shift mutation
  const createShiftMutation = useMutation({
    mutationFn: async (input: CreateShiftInput) => {
      if (!user || !identity.tenantId) {
        console.warn("[useShifts] Not authenticated, cannot create shift");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      const { data, error } = await supabase
        .from("shifts")
        .insert({
          tenant_id: identity.tenantId,
          user_id: input.user_id,
          template_id: input.template_id || null,
          date: input.date,
          start_time: input.start_time,
          end_time: input.end_time,
          break_minutes: input.break_minutes ?? 30,
          notes: input.notes || null,
          status: "scheduled",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Notify assigned user if not self
      if (input.user_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: input.user_id,
          tenant_id: identity.tenantId,
          type: "shift_assigned",
          title: "Neue Schicht zugeteilt",
          message: `Ihnen wurde eine Schicht am ${new Date(input.date).toLocaleDateString("de-DE")} von ${input.start_time} bis ${input.end_time} zugeteilt.`,
          link: "/shifts",
        });
      }

      return data as Shift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIFTS_KEY });
      toast.success("Schicht erstellt");
    },
    onError: (error) => {
      console.error("[useShifts] Create error:", error);
      toast.error("Fehler beim Erstellen der Schicht");
    },
  });

  // Update shift mutation
  const updateShiftMutation = useMutation({
    mutationFn: async (input: Partial<CreateShiftInput> & { id: string; status?: ShiftStatus }) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("shifts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Shift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIFTS_KEY });
      toast.success("Schicht aktualisiert");
    },
    onError: (error) => {
      console.error("[useShifts] Update error:", error);
      toast.error("Fehler beim Aktualisieren");
    },
  });

  // Delete shift mutation
  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      const { error } = await supabase.from("shifts").delete().eq("id", shiftId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIFTS_KEY });
      toast.success("Schicht gelöscht");
    },
    onError: (error) => {
      console.error("[useShifts] Delete error:", error);
      toast.error("Fehler beim Löschen");
    },
  });

  // Create swap request mutation
  const createSwapRequestMutation = useMutation({
    mutationFn: async (input: {
      shift_id: string;
      target_user_id?: string;
      reason?: string;
    }) => {
      if (!user || !identity.tenantId) {
        console.warn("[useShifts] Not authenticated, cannot create swap request");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      const { data, error } = await supabase
        .from("shift_swap_requests")
        .insert({
          tenant_id: identity.tenantId,
          shift_id: input.shift_id,
          requesting_user_id: user.id,
          target_user_id: input.target_user_id || null,
          reason: input.reason || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data as ShiftSwapRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SWAP_REQUESTS_KEY });
      toast.success("Tausch-Anfrage erstellt");
    },
    onError: (error) => {
      console.error("[useShifts] Create swap request error:", error);
      toast.error("Fehler beim Erstellen der Tausch-Anfrage");
    },
  });

  // Approve/reject swap request mutation
  const updateSwapRequestMutation = useMutation({
    mutationFn: async (input: { id: string; status: SwapRequestStatus }) => {
      if (!user) {
        console.warn("[useShifts] Not authenticated, cannot update swap request");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      const updateData: Record<string, unknown> = {
        status: input.status,
      };

      if (input.status !== "pending") {
        updateData.approved_by = user.id;
        updateData.approved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("shift_swap_requests")
        .update(updateData)
        .eq("id", input.id)
        .select(`*, shift:shifts(*)`)
        .single();

      if (error) throw error;

      // If approved, swap the shifts
      if (input.status === "approved" && data.target_user_id && data.shift) {
        await supabase
          .from("shifts")
          .update({ user_id: data.target_user_id })
          .eq("id", data.shift_id);
      }

      return data as ShiftSwapRequest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SHIFTS_KEY });
      queryClient.invalidateQueries({ queryKey: SWAP_REQUESTS_KEY });

      // Notify requesting user
      supabase.from("notifications").insert({
        user_id: data.requesting_user_id,
        tenant_id: data.tenant_id,
        type: data.status === "approved" ? "shift_swap_approved" : "shift_swap_request",
        title: data.status === "approved" ? "Tausch genehmigt" : "Tausch abgelehnt",
        message: data.status === "approved"
          ? "Ihre Schicht-Tausch-Anfrage wurde genehmigt."
          : "Ihre Schicht-Tausch-Anfrage wurde abgelehnt.",
        link: "/shifts",
      });

      toast.success(data.status === "approved" ? "Tausch genehmigt" : "Tausch abgelehnt");
    },
    onError: (error) => {
      console.error("[useShifts] Update swap request error:", error);
      toast.error("Fehler beim Aktualisieren");
    },
  });

  return {
    shifts,
    templates,
    swapRequests,
    todaysShifts,
    myShifts,
    pendingSwapRequests,
    isLoading,
    error,
    refetch,
    createShift: createShiftMutation.mutateAsync,
    updateShift: updateShiftMutation.mutateAsync,
    deleteShift: deleteShiftMutation.mutateAsync,
    createSwapRequest: createSwapRequestMutation.mutateAsync,
    approveSwapRequest: (id: string) =>
      updateSwapRequestMutation.mutateAsync({ id, status: "approved" }),
    rejectSwapRequest: (id: string) =>
      updateSwapRequestMutation.mutateAsync({ id, status: "rejected" }),
    isCreating: createShiftMutation.isPending,
    isUpdating: updateShiftMutation.isPending,
  };
}
