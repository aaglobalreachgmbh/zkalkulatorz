// ============================================
// Absences Hook
// Employee absence management
// ============================================

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";

export type AbsenceType = "vacation" | "sick" | "training" | "other";
export type AbsenceStatus = "pending" | "approved" | "rejected";

export interface Absence {
  id: string;
  tenant_id: string;
  user_id: string;
  absence_type: AbsenceType;
  start_date: string;
  end_date: string;
  substitute_user_id: string | null;
  notes: string | null;
  status: AbsenceStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: { id: string; display_name: string | null; email: string | null };
  substitute?: { id: string; display_name: string | null; email: string | null };
}

export interface CreateAbsenceInput {
  absence_type: AbsenceType;
  start_date: string;
  end_date: string;
  substitute_user_id?: string;
  notes?: string;
}

const QUERY_KEY = ["absences"];

const absenceTypeLabels: Record<AbsenceType, string> = {
  vacation: "Urlaub",
  sick: "Krankheit",
  training: "Schulung",
  other: "Sonstiges",
};

export function useAbsences(options?: { startDate?: Date; endDate?: Date }) {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  const queryKey = [
    ...QUERY_KEY,
    options?.startDate?.toISOString(),
    options?.endDate?.toISOString(),
  ];

  // Fetch absences
  const {
    data: absences = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];

      try {
        let query = supabase
          .from("absences")
          .select(`
            *,
            user:profiles!absences_user_id_fkey(id, display_name, email),
            substitute:profiles!absences_substitute_user_id_fkey(id, display_name, email)
          `)
          .order("start_date", { ascending: true });

        if (options?.startDate) {
          query = query.gte("end_date", options.startDate.toISOString().split("T")[0]);
        }
        if (options?.endDate) {
          query = query.lte("start_date", options.endDate.toISOString().split("T")[0]);
        }

        const { data, error } = await query;

        if (error) {
          console.warn("[useAbsences] Query error:", error.message);
          return [];
        }

        return (data || []) as unknown as Absence[];
      } catch (err) {
        console.error("[useAbsences] Unexpected error:", err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Current absences (today)
  const currentAbsences = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return absences.filter(
      (a) =>
        a.status === "approved" &&
        a.start_date <= today &&
        a.end_date >= today
    );
  }, [absences]);

  // My absences
  const myAbsences = useMemo(
    () => absences.filter((a) => a.user_id === user?.id),
    [absences, user]
  );

  // Pending absences (for admins)
  const pendingAbsences = useMemo(
    () => absences.filter((a) => a.status === "pending"),
    [absences]
  );

  // Create absence mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateAbsenceInput) => {
      if (!user || !identity.tenantId) {
        console.warn("[useAbsences] Not authenticated");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      const { data, error } = await supabase
        .from("absences")
        .insert({
          tenant_id: identity.tenantId,
          user_id: user.id,
          absence_type: input.absence_type,
          start_date: input.start_date,
          end_date: input.end_date,
          substitute_user_id: input.substitute_user_id || null,
          notes: input.notes || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.warn("[useAbsences] Create error:", error);
        throw error;
      }
      return data as Absence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Abwesenheit eingetragen");
    },
    onError: (error) => {
      console.error("[useAbsences] Create error:", error);
      toast.error("Fehler beim Eintragen der Abwesenheit: " + error.message);
    },
  });

  // Update absence status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (input: {
      absenceId: string;
      status: AbsenceStatus;
    }) => {
      if (!user) {
        console.warn("[useAbsences] Not authenticated");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      const updateData: Record<string, unknown> = {
        status: input.status,
      };

      if (input.status === "approved" || input.status === "rejected") {
        updateData.approved_by = user.id;
        updateData.approved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("absences")
        .update(updateData)
        .eq("id", input.absenceId)
        .select()
        .single();

      if (error) {
        console.warn("[useAbsences] Update status error:", error);
        throw error;
      }
      return data as Absence;
    },
    onSuccess: (data) => {
      if (!data) return;
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });

      // Create notification for the user
      supabase.from("notifications").insert({
        user_id: data.user_id,
        tenant_id: data.tenant_id,
        type: data.status === "approved" ? "absence_approved" : "absence_rejected",
        title: data.status === "approved"
          ? "Abwesenheit genehmigt"
          : "Abwesenheit abgelehnt",
        message: `Ihre ${absenceTypeLabels[data.absence_type as AbsenceType]} vom ${new Date(data.start_date).toLocaleDateString("de-DE")} bis ${new Date(data.end_date).toLocaleDateString("de-DE")} wurde ${data.status === "approved" ? "genehmigt" : "abgelehnt"}.`,
      });

      toast.success(
        data.status === "approved"
          ? "Abwesenheit genehmigt"
          : "Abwesenheit abgelehnt"
      );
    },
    onError: (error) => {
      console.error("[useAbsences] Update status error:", error);
      toast.error("Fehler beim Aktualisieren: " + error.message);
    },
  });

  // Delete absence mutation
  const deleteMutation = useMutation({
    mutationFn: async (absenceId: string) => {
      const { error } = await supabase
        .from("absences")
        .delete()
        .eq("id", absenceId);

      if (error) {
        console.warn("[useAbsences] Delete error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Abwesenheit gelöscht");
    },
    onError: (error) => {
      console.error("[useAbsences] Delete error:", error);
      toast.error("Fehler beim Löschen: " + error.message);
    },
  });

  return {
    absences,
    currentAbsences,
    myAbsences,
    pendingAbsences,
    isLoading,
    error,
    refetch,
    createAbsence: createMutation.mutateAsync,
    approveAbsence: (absenceId: string) =>
      updateStatusMutation.mutateAsync({ absenceId, status: "approved" }),
    rejectAbsence: (absenceId: string) =>
      updateStatusMutation.mutateAsync({ absenceId, status: "rejected" }),
    deleteAbsence: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateStatusMutation.isPending,
    absenceTypeLabels,
  };
}
