// ============================================
// Audit Log Layer (Supabase Connected)
// Tenant-scoped Audit Trail
// Mapped to 'user_activity_log' table
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
  | "user_assignment_change"
  // Add legacy/standard actions if needed
  | "offer_create" | "offer_update" | "offer_delete"
  | "customer_create" | "customer_update" | "customer_delete";

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
  // Query Supabase 'user_activity_log'
  const { data, error } = await supabase
    .from("user_activity_log")
    .select("*")
    .eq("tenant_id", tenantId)
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
      actorUserId: row.user_id || "system",
      actorDisplayName: meta.actorDisplayName || "Unknown",
      actorRole: meta.actorRole || "user",
      tenantId: row.tenant_id || tenantId,
      departmentId: row.department_id || departmentId,
      action: row.action as AuditAction,
      target: row.resource_name || row.summary || "",
      meta: meta.details || meta // Fallback to entire metadata if details not present
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
    resource_type: "audit_event",
    resource_name: event.target,
    summary: `Audit: ${event.action} on ${event.target}`,
    metadata: {
      actorDisplayName: event.actorDisplayName,
      actorRole: event.actorRole,
      details: event.meta
    }
  };

  const { data, error } = await supabase
    .from("user_activity_log")
    .insert([payload as any])
    .select()
    .single();

  if (error) {
    console.error("[auditLog] logAuditEvent error:", error);
    return null;
  }

  // Return constructed event
  const meta = (data.metadata as Record<string, any>) || {};
  return {
    id: data.id,
    ts: data.created_at,
    actorUserId: data.user_id,
    actorDisplayName: meta.actorDisplayName || "Unknown",
    actorRole: meta.actorRole || "user",
    tenantId: data.tenant_id || "",
    departmentId: data.department_id || "",
    action: data.action as AuditAction,
    target: data.resource_name || "",
    meta: meta.details || {}
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
  const labels: Record<string, string> = {
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
