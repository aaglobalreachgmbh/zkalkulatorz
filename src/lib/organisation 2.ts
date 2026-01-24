// ============================================
// Organisation Layer (Supabase Connected)
// Tenant-scoped Departments & User Assignment
// ============================================

import { type IdentityState } from "@/contexts/IdentityContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Department structure
 */
export interface Department {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

/**
 * User-Department assignment 
 */
export interface UserDepartmentAssignment {
  userId: string;
  departmentId: string;
  assignedAt: string;
}

// ============================================
// Department CRUD (Async / Supabase)
// ============================================

export async function loadDepartments(tenantId: string): Promise<Department[]> {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) {
    console.error("[organisation] loadDepartments error:", error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    description: "", // Description column missing in current schema, defaulting to empty
    createdAt: row.created_at
  }));
}

export async function createDepartment(
  tenantId: string,
  name: string,
  description: string = ""
): Promise<Department | null> {
  const departmentId = name.toLowerCase().replace(/[^a-z0-9]/g, "_");

  const { data, error } = await supabase
    .from("departments")
    .insert([
      {
        tenant_id: tenantId,
        department_id: departmentId, // Human readable ID derived from name
        name: name.trim(),
        // Note: 'description' column is not in the migration, omitting
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("[organisation] createDepartment error:", error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    description: "",
    createdAt: data.created_at
  };
}

export async function deleteDepartment(tenantId: string, departmentId: string): Promise<boolean> {
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", departmentId) // Using UUID Primary Key
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("[organisation] deleteDepartment error:", error);
    return false;
  }

  return true;
}

// ============================================
// Assignment Logic (Async / Supabase)
// ============================================

export async function getUserDepartment(tenantId: string, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_department_assignments")
    .select("department_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[organisation] getUserDepartment error:", error);
    return null;
  }

  return data?.department_id ?? null;
}

/**
 * Check if a user can see a specific department's data
 */
export function canAccessDepartment(
  identity: IdentityState,
  targetDepartmentId: string
): boolean {
  if (identity.role === "admin" || identity.role === "manager") {
    return true;
  }
  return identity.departmentId === targetDepartmentId;
}
