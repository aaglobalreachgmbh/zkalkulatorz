// ============================================
// Cloud Seats Hook - Supabase Integration
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { useToast } from "@/hooks/use-toast";
import { useCloudLicense } from "./useCloudLicense";

const QUERY_KEY = ["cloud-seats"];

export interface SeatAssignment {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  tenantId: string;
  assignedAt: string;
  assignedBy: string;
}

function rowToSeatAssignment(row: {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string;
  tenant_id: string;
  assigned_at: string;
  assigned_by: string;
}): SeatAssignment {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    tenantId: row.tenant_id,
    assignedAt: row.assigned_at,
    assignedBy: row.assigned_by,
  };
}

/**
 * Hook for managing seat assignments in Supabase
 */
export function useCloudSeats() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { license, updateSeatsUsed } = useCloudLicense();

  // Fetch all seat assignments for tenant
  const { data: seats = [], isLoading, error } = useQuery({
    queryKey: [...QUERY_KEY, identity.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seat_assignments")
        .select("*")
        .eq("tenant_id", identity.tenantId)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(rowToSeatAssignment);
    },
    enabled: !!user,
  });

  // Assign seat mutation
  const assignMutation = useMutation({
    mutationFn: async ({
      userId,
      userName,
      userEmail,
    }: {
      userId: string;
      userName?: string;
      userEmail: string;
    }) => {
      if (!user) throw new Error("Nicht authentifiziert");

      // Check seat limit
      if (license && seats.length >= license.seatLimit) {
        throw new Error("Seat-Limit erreicht");
      }

      // Check if already assigned
      const existing = seats.find((s) => s.userId === userId);
      if (existing) {
        throw new Error("Benutzer hat bereits einen Seat");
      }

      const { data, error } = await supabase
        .from("seat_assignments")
        .insert({
          user_id: userId,
          user_name: userName || null,
          user_email: userEmail,
          tenant_id: identity.tenantId,
          assigned_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update license seat count
      await updateSeatsUsed(seats.length + 1);

      return rowToSeatAssignment(data);
    },
    onSuccess: () => {
      toast({
        title: "Seat zugewiesen",
        description: "Der Benutzer hat nun Zugriff.",
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Seat konnte nicht zugewiesen werden.",
        variant: "destructive",
      });
    },
  });

  // Revoke seat mutation
  const revokeMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!user) throw new Error("Nicht authentifiziert");

      const { error } = await supabase
        .from("seat_assignments")
        .delete()
        .eq("user_id", userId)
        .eq("tenant_id", identity.tenantId);

      if (error) throw error;

      // Update license seat count
      await updateSeatsUsed(Math.max(0, seats.length - 1));
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<SeatAssignment[]>(QUERY_KEY);
      queryClient.setQueryData<SeatAssignment[]>(
        [...QUERY_KEY, identity.tenantId],
        (old = []) => old.filter((s) => s.userId !== userId)
      );
      return { previous };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(QUERY_KEY, context?.previous);
      toast({
        title: "Fehler",
        description: "Seat konnte nicht entfernt werden.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Seat entfernt",
        description: "Der Benutzer hat keinen Zugriff mehr.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Check if user has seat
  const isUserSeated = (userId: string): boolean => {
    return seats.some((s) => s.userId === userId);
  };

  // Check if current user has seat
  const currentUserHasSeat = user ? isUserSeated(user.id) : false;

  // Seat usage stats
  const seatUsage = {
    used: seats.length,
    limit: license?.seatLimit || 999,
    available: (license?.seatLimit || 999) - seats.length,
    exceeded: seats.length >= (license?.seatLimit || 999),
  };

  return {
    // Data
    seats,
    isLoading,
    error,

    // Computed
    seatUsage,
    currentUserHasSeat,

    // Actions
    assignSeat: (userId: string, userEmail: string, userName?: string) =>
      assignMutation.mutateAsync({ userId, userEmail, userName }),
    revokeSeat: (userId: string) => revokeMutation.mutateAsync(userId),
    isUserSeated,

    // Mutation states
    isAssigning: assignMutation.isPending,
    isRevoking: revokeMutation.isPending,
  };
}
