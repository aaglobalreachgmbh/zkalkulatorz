// ============================================
// Cloud Departments Hook - Supabase Integration
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

const DEPARTMENTS_KEY = ["cloud-departments"];
const ASSIGNMENTS_KEY = ["cloud-department-assignments"];

export interface DepartmentPolicy {
  canViewAllDepartments?: boolean;
  canManageEmployees?: boolean;
  visibleDepartments?: string[];
}

export interface CloudDepartment {
  id: string;
  departmentId: string;
  tenantId: string;
  name: string;
  parentId: string | null;
  policy: DepartmentPolicy;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface UserDepartmentAssignment {
  id: string;
  userId: string;
  departmentId: string;
  tenantId: string;
  assignedAt: string;
  assignedBy: string | null;
}

function rowToDepartment(row: {
  id: string;
  department_id: string;
  tenant_id: string;
  name: string;
  parent_id: string | null;
  policy: Json;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}): CloudDepartment {
  return {
    id: row.id,
    departmentId: row.department_id,
    tenantId: row.tenant_id,
    name: row.name,
    parentId: row.parent_id,
    policy: (row.policy as unknown as DepartmentPolicy) || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

function rowToAssignment(row: {
  id: string;
  user_id: string;
  department_id: string;
  tenant_id: string;
  assigned_at: string;
  assigned_by: string | null;
}): UserDepartmentAssignment {
  return {
    id: row.id,
    userId: row.user_id,
    departmentId: row.department_id,
    tenantId: row.tenant_id,
    assignedAt: row.assigned_at,
    assignedBy: row.assigned_by,
  };
}

/**
 * Hook for managing departments in Supabase
 */
export function useCloudDepartments() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all departments for tenant
  const {
    data: departments = [],
    isLoading: departmentsLoading,
    error: departmentsError,
  } = useQuery({
    queryKey: [...DEPARTMENTS_KEY, identity.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("tenant_id", identity.tenantId)
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []).map(rowToDepartment);
    },
    enabled: !!user,
  });

  // Fetch user department assignments
  const {
    data: assignments = [],
    isLoading: assignmentsLoading,
    error: assignmentsError,
  } = useQuery({
    queryKey: [...ASSIGNMENTS_KEY, identity.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_department_assignments")
        .select("*")
        .eq("tenant_id", identity.tenantId);

      if (error) throw error;
      return (data || []).map(rowToAssignment);
    },
    enabled: !!user,
  });

  // Create department mutation (Admin only)
  const createMutation = useMutation({
    mutationFn: async ({
      name,
      departmentId,
      parentId,
      policy,
    }: {
      name: string;
      departmentId: string;
      parentId?: string;
      policy?: DepartmentPolicy;
    }) => {
      if (!user) throw new Error("Nicht authentifiziert");

      const { data, error } = await supabase
        .from("departments")
        .insert({
          tenant_id: identity.tenantId,
          department_id: departmentId,
          name,
          parent_id: parentId || null,
          policy: (policy || {}) as unknown as Json,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToDepartment(data);
    },
    onSuccess: () => {
      toast({ title: "Abteilung erstellt" });
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Abteilung konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Update department mutation (Admin only)
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      parentId,
      policy,
    }: {
      id: string;
      name?: string;
      parentId?: string | null;
      policy?: DepartmentPolicy;
    }) => {
      if (!user) throw new Error("Nicht authentifiziert");

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) updates.name = name;
      if (parentId !== undefined) updates.parent_id = parentId;
      if (policy !== undefined) updates.policy = policy as unknown as Json;

      const { error } = await supabase
        .from("departments")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Abteilung konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  // Delete department mutation (Admin only)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Nicht authentifiziert");

      // First remove all user assignments
      await supabase
        .from("user_department_assignments")
        .delete()
        .eq("department_id", id);

      // Then delete department
      const { error } = await supabase.from("departments").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Abteilung gelöscht" });
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_KEY });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Abteilung konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  // Assign user to department mutation (Admin only)
  const assignUserMutation = useMutation({
    mutationFn: async ({
      userId,
      departmentId,
    }: {
      userId: string;
      departmentId: string;
    }) => {
      if (!user) throw new Error("Nicht authentifiziert");

      // Remove existing assignment first
      await supabase
        .from("user_department_assignments")
        .delete()
        .eq("user_id", userId)
        .eq("tenant_id", identity.tenantId);

      // Create new assignment
      const { data, error } = await supabase
        .from("user_department_assignments")
        .insert({
          user_id: userId,
          department_id: departmentId,
          tenant_id: identity.tenantId,
          assigned_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToAssignment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_KEY });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Zuweisung fehlgeschlagen.",
        variant: "destructive",
      });
    },
  });

  // Remove user from department
  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!user) throw new Error("Nicht authentifiziert");

      const { error } = await supabase
        .from("user_department_assignments")
        .delete()
        .eq("user_id", userId)
        .eq("tenant_id", identity.tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_KEY });
    },
  });

  // Get user's department
  const getUserDepartment = (userId: string): CloudDepartment | null => {
    const assignment = assignments.find((a) => a.userId === userId);
    if (!assignment) return null;
    return departments.find((d) => d.departmentId === assignment.departmentId) || null;
  };

  // Get current user's department
  const currentUserDepartment = user ? getUserDepartment(user.id) : null;

  // Check if user can access a department
  const canAccessDepartment = (targetDepartmentId: string): boolean => {
    if (!currentUserDepartment) return false;
    if (identity.role === "admin") return true;
    if (currentUserDepartment.policy.canViewAllDepartments) return true;
    if (currentUserDepartment.policy.visibleDepartments?.includes(targetDepartmentId)) {
      return true;
    }
    return currentUserDepartment.departmentId === targetDepartmentId;
  };

  // Get child departments
  const getChildDepartments = (parentId: string | null): CloudDepartment[] => {
    return departments.filter((d) => d.parentId === parentId);
  };

  return {
    // Data
    departments,
    assignments,
    isLoading: departmentsLoading || assignmentsLoading,
    error: departmentsError || assignmentsError,

    // Computed
    currentUserDepartment,

    // Department actions
    createDepartment: (
      name: string,
      departmentId: string,
      parentId?: string,
      policy?: DepartmentPolicy
    ) => createMutation.mutateAsync({ name, departmentId, parentId, policy }),
    updateDepartment: (
      id: string,
      updates: { name?: string; parentId?: string | null; policy?: DepartmentPolicy }
    ) => updateMutation.mutateAsync({ id, ...updates }),
    deleteDepartment: (id: string) => deleteMutation.mutateAsync(id),

    // User assignment actions
    assignUserToDepartment: (userId: string, departmentId: string) =>
      assignUserMutation.mutateAsync({ userId, departmentId }),
    removeUserFromDepartment: (userId: string) => removeUserMutation.mutateAsync(userId),

    // Helpers
    getUserDepartment,
    canAccessDepartment,
    getChildDepartments,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
