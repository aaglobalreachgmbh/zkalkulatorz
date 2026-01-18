// ============================================
// Organisation Layer - Phase 3B.1
// Tenant-scoped Departments & User Assignment
// ============================================

import { type IdentityState } from "@/contexts/IdentityContext";

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
 * User-Department assignment (for mock/offline mode)
 */
export interface UserDepartmentAssignment {
  userId: string;
  departmentId: string;
  assignedAt: string;
}

// ============================================
// Storage Keys (Tenant-Scoped)
// ============================================

function getDepartmentsKey(tenantId: string): string {
  return `org_departments_${tenantId}`;
}

function getUserAssignmentsKey(tenantId: string): string {
  return `org_user_assignments_${tenantId}`;
}

// ============================================
// Default Data
// ============================================

const DEFAULT_DEPARTMENTS: Department[] = [
  { 
    id: "hq", 
    name: "Hauptverwaltung", 
    description: "Zentrale Administration",
    createdAt: "2025-01-01T00:00:00Z"
  },
  { 
    id: "store_berlin", 
    name: "Store Berlin", 
    description: "Filiale Berlin Mitte",
    createdAt: "2025-01-01T00:00:00Z"
  },
  { 
    id: "store_munich", 
    name: "Store München", 
    description: "Filiale München Zentrum",
    createdAt: "2025-01-01T00:00:00Z"
  },
];

// ============================================
// Department CRUD
// ============================================

export function loadDepartments(tenantId: string): Department[] {
  try {
    const key = getDepartmentsKey(tenantId);
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : [...DEFAULT_DEPARTMENTS];
  } catch {
    return [...DEFAULT_DEPARTMENTS];
  }
}

export function saveDepartments(tenantId: string, departments: Department[]): void {
  const key = getDepartmentsKey(tenantId);
  localStorage.setItem(key, JSON.stringify(departments));
}

export function createDepartment(
  tenantId: string, 
  name: string, 
  description: string = ""
): Department {
  const departments = loadDepartments(tenantId);
  const newDept: Department = {
    id: `dept_${Date.now()}`,
    name: name.trim(),
    description,
    createdAt: new Date().toISOString(),
  };
  saveDepartments(tenantId, [...departments, newDept]);
  return newDept;
}

export function updateDepartment(
  tenantId: string, 
  departmentId: string, 
  updates: Partial<Pick<Department, "name" | "description">>
): Department | null {
  const departments = loadDepartments(tenantId);
  const index = departments.findIndex(d => d.id === departmentId);
  if (index === -1) return null;
  
  departments[index] = { ...departments[index], ...updates };
  saveDepartments(tenantId, departments);
  return departments[index];
}

export function deleteDepartment(tenantId: string, departmentId: string): boolean {
  const departments = loadDepartments(tenantId);
  const filtered = departments.filter(d => d.id !== departmentId);
  if (filtered.length === departments.length) return false;
  
  saveDepartments(tenantId, filtered);
  return true;
}

export function getDepartmentById(tenantId: string, departmentId: string): Department | null {
  const departments = loadDepartments(tenantId);
  return departments.find(d => d.id === departmentId) ?? null;
}

// ============================================
// User-Department Assignments (Mock Mode)
// ============================================

export function loadUserAssignments(tenantId: string): UserDepartmentAssignment[] {
  try {
    const key = getUserAssignmentsKey(tenantId);
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export function saveUserAssignments(tenantId: string, assignments: UserDepartmentAssignment[]): void {
  const key = getUserAssignmentsKey(tenantId);
  localStorage.setItem(key, JSON.stringify(assignments));
}

export function assignUserToDepartment(
  tenantId: string, 
  userId: string, 
  departmentId: string
): UserDepartmentAssignment {
  const assignments = loadUserAssignments(tenantId);
  const existing = assignments.findIndex(a => a.userId === userId);
  
  const newAssignment: UserDepartmentAssignment = {
    userId,
    departmentId,
    assignedAt: new Date().toISOString(),
  };
  
  if (existing >= 0) {
    assignments[existing] = newAssignment;
  } else {
    assignments.push(newAssignment);
  }
  
  saveUserAssignments(tenantId, assignments);
  return newAssignment;
}

export function getUserDepartment(tenantId: string, userId: string): string | null {
  const assignments = loadUserAssignments(tenantId);
  return assignments.find(a => a.userId === userId)?.departmentId ?? null;
}

// ============================================
// Visibility Rules
// ============================================

/**
 * Check if a user can see a specific department's data
 * - Admin/Manager can see all departments
 * - Sales can only see their own department
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

/**
 * Get list of departments a user can access
 */
export function getAccessibleDepartments(
  identity: IdentityState, 
  tenantId: string
): Department[] {
  const allDepartments = loadDepartments(tenantId);
  
  if (identity.role === "admin" || identity.role === "manager") {
    return allDepartments;
  }
  
  return allDepartments.filter(d => d.id === identity.departmentId);
}
