// ============================================
// Audit Log Layer (Supabase Connected)
// Uses existing user_activity_log table
// ============================================

import { type AppRole } from "@/contexts/IdentityContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Audit action types
 */
export type AuditAction =
  | "policy_change"
  | "dataset_import"
  | "dataset_status_change"
  | "department_create"
  | "department_update"
  | "department_delete"
  | "user_assignment_change";

/**
 * Audit event entry
 */
export interface AuditEvent {
  id: string;
  ts: string;
  actorUserId: string;
  actorDisplayName: string;
  actorRole: AppRole;
  tenantId: string;
  departmentId: string;
  action: AuditAction;
  target: string;
  meta?: Record<string, unknown>;
}

// Valid AppRole values
const VALID_ROLES: AppRole[] = ["admin", "tenant_admin", "manager", "sales"];

function toAppRole(role: unknown): AppRole {
  if (typeof role === "string" && VALID_ROLES.includes(role as AppRole)) {
    return role as AppRole;
  }
  return "sales"; // Default fallback
}

// ============================================
// Audit Log CRUD (Async / Supabase)
// Uses user_activity_log table
// ============================================

/**
 * Load audit log for a scope
 */
export async function loadAuditLog(tenantId: string, departmentId: string, limit: number = 100): Promise<AuditEvent[]> {
  const { data, error } = await supabase
    .from("user_activity_log")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[auditLog] loadAuditLog error:", error.message);
    return [];
  }

  // Map DB result to AuditEvent
  return (data || []).map((row) => {
    const meta = (row.metadata as Record<string, unknown>) || {};
    
    return {
      id: row.id,
      ts: row.created_at,
      actorUserId: row.user_id || "system",
      actorDisplayName: (meta.actorDisplayName as string) || "Unknown",
      actorRole: toAppRole(meta.actorRole),
      tenantId: row.tenant_id || tenantId,
      departmentId: row.department_id || departmentId,
      action: row.action as AuditAction,
      target: row.resource_name || "",
      meta: (meta.details as Record<string, unknown>) || {}
    };
  });
}

/**
 * Log a new audit event
 */
export async function logAuditEvent(
  tenantId: string,
  departmentId: string,
  event: Omit<AuditEvent, "id" | "ts" | "tenantId" | "departmentId">
): Promise<AuditEvent | null> {

  const payload = {
    user_id: event.actorUserId,
    tenant_id: tenantId,
    department_id: departmentId,
    action: event.action,
    resource_type: "audit",
    resource_name: event.target,
    summary: `${event.action}: ${event.target}`,
    metadata: JSON.parse(JSON.stringify({
      actorDisplayName: event.actorDisplayName,
      actorRole: event.actorRole,
      details: event.meta || {}
    }))
  };

  const { data, error } = await supabase
    .from("user_activity_log")
    .insert([payload])
    .select()
    .maybeSingle();

  if (error) {
    console.warn("[auditLog] logAuditEvent error:", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  // Return constructed event
  const meta = (data.metadata as Record<string, unknown>) || {};
    
  return {
    id: data.id,
    ts: data.created_at,
    actorUserId: data.user_id,
    actorDisplayName: (meta.actorDisplayName as string) || "",
    actorRole: toAppRole(meta.actorRole),
    tenantId: data.tenant_id,
    departmentId: data.department_id || departmentId,
    action: data.action as AuditAction,
    target: data.resource_name || "",
    meta: (meta.details as Record<string, unknown>) || {}
  };
}

// ============================================
// Convenience Logging Functions (Async)
// ============================================

export async function logPolicyChange(
  tenantId: string,
  departmentId: string,
  actorUserId: string,
  actorDisplayName: string,
  actorRole: AppRole,
  policyScope: "tenant" | "department",
  changes: Record<string, { from: unknown; to: unknown }>
): Promise<AuditEvent | null> {
  return logAuditEvent(tenantId, departmentId, {
    actorUserId,
    actorDisplayName,
    actorRole,
    action: "policy_change",
    target: `policy:${policyScope}:${policyScope === "tenant" ? tenantId : departmentId}`,
    meta: { changes },
  });
}

export async function logDatasetImport(
  tenantId: string,
  departmentId: string,
  actorUserId: string,
  actorDisplayName: string,
  actorRole: AppRole,
  datasetId: string,
  datasetVersion: string
): Promise<AuditEvent | null> {
  return logAuditEvent(tenantId, departmentId, {
    actorUserId,
    actorDisplayName,
    actorRole,
    action: "dataset_import",
    target: `dataset:${datasetId}`,
    meta: { datasetVersion },
  });
}

export async function logDatasetStatusChange(
  tenantId: string,
  departmentId: string,
  actorUserId: string,
  actorDisplayName: string,
  actorRole: AppRole,
  datasetId: string,
  fromStatus: string,
  toStatus: string,
  reason?: string
): Promise<AuditEvent | null> {
  return logAuditEvent(tenantId, departmentId, {
    actorUserId,
    actorDisplayName,
    actorRole,
    action: "dataset_status_change",
    target: `dataset:${datasetId}`,
    meta: { fromStatus, toStatus, reason },
  });
}

export async function logDepartmentAction(
  tenantId: string,
  departmentId: string,
  actorUserId: string,
  actorDisplayName: string,
  actorRole: AppRole,
  action: "department_create" | "department_update" | "department_delete",
  targetDepartmentId: string,
  details?: Record<string, unknown>
): Promise<AuditEvent | null> {
  return logAuditEvent(tenantId, departmentId, {
    actorUserId,
    actorDisplayName,
    actorRole,
    action,
    target: `department:${targetDepartmentId}`,
    meta: details,
  });
}

export async function logUserAssignmentChange(
  tenantId: string,
  departmentId: string,
  actorUserId: string,
  actorDisplayName: string,
  actorRole: AppRole,
  targetUserId: string,
  fromDepartment: string | null,
  toDepartment: string
): Promise<AuditEvent | null> {
  return logAuditEvent(tenantId, departmentId, {
    actorUserId,
    actorDisplayName,
    actorRole,
    action: "user_assignment_change",
    target: `user:${targetUserId}`,
    meta: { fromDepartment, toDepartment },
  });
}

// ============================================
// Query Functions
// ============================================

/**
 * Get recent audit events
 */
export async function getRecentAuditEvents(
  tenantId: string,
  departmentId: string,
  limit: number = 20
): Promise<AuditEvent[]> {
  return loadAuditLog(tenantId, departmentId, limit);
}

/**
 * Format audit action for display
 */
export function formatAuditAction(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    policy_change: "Richtlinie geändert",
    dataset_import: "Dataset importiert",
    dataset_status_change: "Dataset-Status geändert",
    department_create: "Abteilung erstellt",
    department_update: "Abteilung aktualisiert",
    department_delete: "Abteilung gelöscht",
    user_assignment_change: "Benutzer zugewiesen",
  };
  return labels[action] || action;
}
