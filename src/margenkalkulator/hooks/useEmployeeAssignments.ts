// ============================================
// Employee Assignments Hook - Manage supervisor-employee relationships
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";

export interface EmployeeAssignment {
  id: string;
  tenant_id: string;
  supervisor_id: string;
  employee_id: string;
  created_at: string;
  created_by: string | null;
  // Joined data
  supervisor?: { id: string; display_name: string | null; email: string | null };
  employee?: { id: string; display_name: string | null; email: string | null };
}

const QUERY_KEY = ["employeeAssignments"];

export function useEmployeeAssignments() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  // Fetch assignments for current user (as supervisor)
  const {
    data: assignments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from("employee_assignments")
          .select("*")
          .eq("supervisor_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("[useEmployeeAssignments] Query error:", error.message);
          return [];
        }

        return (data || []) as EmployeeAssignment[];
      } catch (err) {
        console.error("[useEmployeeAssignments] Unexpected error:", err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch all assignments (for admins)
  const {
    data: allAssignments = [],
    isLoading: isLoadingAll,
  } = useQuery({
    queryKey: [...QUERY_KEY, "all"],
    queryFn: async () => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from("employee_assignments")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("[useEmployeeAssignments] Query all error:", error.message);
          return [];
        }

        return (data || []) as EmployeeAssignment[];
      } catch (err) {
        console.error("[useEmployeeAssignments] Unexpected error:", err);
        return [];
      }
    },
    enabled: !!user && identity?.role === "admin",
  });

  // Create assignment mutation
  const createMutation = useMutation({
    mutationFn: async ({ supervisorId, employeeId }: { supervisorId: string; employeeId: string }) => {
      if (!identity?.tenantId) {
        console.warn("[useEmployeeAssignments] Not authenticated");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      const { data, error } = await supabase
        .from("employee_assignments")
        .insert({
          tenant_id: identity.tenantId,
          supervisor_id: supervisorId,
          employee_id: employeeId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Mitarbeiter zugewiesen");
    },
    onError: (error: Error) => {
      console.error("[useEmployeeAssignments] Create error:", error);
      if (error.message.includes("duplicate")) {
        toast.error("Zuweisung existiert bereits");
      } else {
        toast.error("Zuweisung fehlgeschlagen");
      }
    },
  });

  // Delete assignment mutation
  const deleteMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("employee_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Zuweisung entfernt");
    },
    onError: (error: Error) => {
      console.error("[useEmployeeAssignments] Delete error:", error);
      toast.error("Entfernen fehlgeschlagen");
    },
  });

  // Get employee IDs that current user supervises
  const supervisedEmployeeIds = assignments.map((a) => a.employee_id);

  // Check if user supervises a specific employee
  const supervisesEmployee = (employeeId: string): boolean => {
    return supervisedEmployeeIds.includes(employeeId);
  };

  return {
    assignments,
    allAssignments,
    isLoading,
    isLoadingAll,
    error,
    refetch,
    
    // Helpers
    supervisedEmployeeIds,
    supervisesEmployee,
    
    // Mutations
    assignEmployee: createMutation.mutateAsync,
    removeAssignment: deleteMutation.mutateAsync,
    
    // States
    isAssigning: createMutation.isPending,
    isRemoving: deleteMutation.isPending,
  };
}
