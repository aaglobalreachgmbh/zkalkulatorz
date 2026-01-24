// ============================================
// Audit Log Layer (Supabase Connected)
// Tenant-scoped Audit Trail
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

// ============================================
// Audit Log CRUD (Async / Supabase)
// ============================================

/**
 * Load audit log for a scope
 */
export async function loadAuditLog(tenantId: string, departmentId: string, limit: number = 100): Promise<AuditEvent[]> {
  // Query Supabase 'audit_logs'
  // We filter by metadata->>tenantId
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .contains("metadata", { tenantId }) // JSONB filter
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[auditLog] loadAuditLog error:", error);
    return [];
  }

  // Map DB result to AuditEvent
  return (data || []).map((row: any) => {
    const meta = row.metadata || {};
    return {
      id: row.id,
      ts: row.created_at,
      actorUserId: row.actor_id || meta.actorUserId || "system",
      actorDisplayName: meta.actorDisplayName || "Unknown",
      actorRole: meta.actorRole || "user",
      tenantId: meta.tenantId || tenantId,
      departmentId: meta.departmentId || departmentId,
      action: row.action as AuditAction,
      target: row.target || "",
      meta: meta.details as Record<string, unknown> // 'details' inside metadata
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
    actor_id: event.actorUserId,
    action: event.action,
    target: event.target,
    metadata: {
      tenantId,
      departmentId,
      actorUserId: event.actorUserId,
      actorDisplayName: event.actorDisplayName,
      actorRole: event.actorRole,
      details: event.meta
    }
  };

  const { data, error } = await supabase
    .from("audit_logs")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("[auditLog] logAuditEvent error:", error);
    return null;
  }

  // Return constructed event
  const meta = data.metadata || {};
  return {
    id: data.id,
    ts: data.created_at,
    actorUserId: data.actor_id,
    actorDisplayName: meta.actorDisplayName,
    actorRole: meta.actorRole,
    tenantId: meta.tenantId,
    departmentId: meta.departmentId,
    action: data.action as AuditAction,
    target: data.target,
    meta: meta.details
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

// Removed: getAuditEventsByAction, getAuditEventsByActor (YAGNI for now, kept interface clean)

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

