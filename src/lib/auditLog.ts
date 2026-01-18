// ============================================
// Audit Log Layer - Phase 3B.4
// Local audit trail for governance actions
// ============================================

import { type AppRole } from "@/contexts/IdentityContext";

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
  ts: string;              // ISO timestamp
  actorUserId: string;
  actorDisplayName: string;
  actorRole: AppRole;
  tenantId: string;
  departmentId: string;
  action: AuditAction;
  target: string;          // e.g., "department:store_berlin", "dataset:abc123", "policy:tenant"
  meta?: Record<string, unknown>;
}

/**
 * Maximum number of audit events to keep per scope
 */
const MAX_AUDIT_EVENTS = 100;

// ============================================
// Storage Keys
// ============================================

function getAuditKey(tenantId: string, departmentId: string): string {
  return `audit_${tenantId}_${departmentId}`;
}

// ============================================
// Audit Log CRUD
// ============================================

/**
 * Load audit log for a scope
 */
export function loadAuditLog(tenantId: string, departmentId: string): AuditEvent[] {
  try {
    const key = getAuditKey(tenantId, departmentId);
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

/**
 * Save audit log
 */
function saveAuditLog(tenantId: string, departmentId: string, events: AuditEvent[]): void {
  const key = getAuditKey(tenantId, departmentId);
  // Keep only the most recent MAX_AUDIT_EVENTS
  const trimmed = events.slice(-MAX_AUDIT_EVENTS);
  localStorage.setItem(key, JSON.stringify(trimmed));
}

/**
 * Log a new audit event
 */
export function logAuditEvent(
  tenantId: string,
  departmentId: string,
  event: Omit<AuditEvent, "id" | "ts" | "tenantId" | "departmentId">
): AuditEvent {
  const newEvent: AuditEvent = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ts: new Date().toISOString(),
    tenantId,
    departmentId,
    ...event,
  };
  
  const log = loadAuditLog(tenantId, departmentId);
  log.push(newEvent);
  saveAuditLog(tenantId, departmentId, log);
  
  return newEvent;
}

// ============================================
// Convenience Logging Functions
// ============================================

/**
 * Log a policy change
 */
export function logPolicyChange(
  tenantId: string,
  departmentId: string,
  actorUserId: string,
  actorDisplayName: string,
  actorRole: AppRole,
  policyScope: "tenant" | "department",
  changes: Record<string, { from: unknown; to: unknown }>
): AuditEvent {
  return logAuditEvent(tenantId, departmentId, {
    actorUserId,
    actorDisplayName,
    actorRole,
    action: "policy_change",
    target: `policy:${policyScope}:${policyScope === "tenant" ? tenantId : departmentId}`,
    meta: { changes },
  });
}

/**
 * Log a dataset import
 */
export function logDatasetImport(
  tenantId: string,
  departmentId: string,
  actorUserId: string,
  actorDisplayName: string,
  actorRole: AppRole,
  datasetId: string,
  datasetVersion: string
): AuditEvent {
  return logAuditEvent(tenantId, departmentId, {
    actorUserId,
    actorDisplayName,
    actorRole,
    action: "dataset_import",
    target: `dataset:${datasetId}`,
    meta: { datasetVersion },
  });
}

/**
 * Log a dataset status change
 */
export function logDatasetStatusChange(
  tenantId: string,
  departmentId: string,
  actorUserId: string,
  actorDisplayName: string,
  actorRole: AppRole,
  datasetId: string,
  fromStatus: string,
  toStatus: string,
  reason?: string
): AuditEvent {
  return logAuditEvent(tenantId, departmentId, {
    actorUserId,
    actorDisplayName,
    actorRole,
    action: "dataset_status_change",
    target: `dataset:${datasetId}`,
    meta: { fromStatus, toStatus, reason },
  });
}

/**
 * Log a department action
 */
export function logDepartmentAction(
  tenantId: string,
  departmentId: string,
  actorUserId: string,
  actorDisplayName: string,
  actorRole: AppRole,
  action: "department_create" | "department_update" | "department_delete",
  targetDepartmentId: string,
  details?: Record<string, unknown>
): AuditEvent {
  return logAuditEvent(tenantId, departmentId, {
    actorUserId,
    actorDisplayName,
    actorRole,
    action,
    target: `department:${targetDepartmentId}`,
    meta: details,
  });
}

/**
 * Log a user assignment change
 */
export function logUserAssignmentChange(
  tenantId: string,
  departmentId: string,
  actorUserId: string,
  actorDisplayName: string,
  actorRole: AppRole,
  targetUserId: string,
  fromDepartment: string | null,
  toDepartment: string
): AuditEvent {
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
export function getRecentAuditEvents(
  tenantId: string,
  departmentId: string,
  limit: number = 20
): AuditEvent[] {
  const log = loadAuditLog(tenantId, departmentId);
  return log.slice(-limit).reverse(); // Most recent first
}

/**
 * Get audit events by action type
 */
export function getAuditEventsByAction(
  tenantId: string,
  departmentId: string,
  action: AuditAction
): AuditEvent[] {
  const log = loadAuditLog(tenantId, departmentId);
  return log.filter(e => e.action === action).reverse();
}

/**
 * Get audit events by actor
 */
export function getAuditEventsByActor(
  tenantId: string,
  departmentId: string,
  actorUserId: string
): AuditEvent[] {
  const log = loadAuditLog(tenantId, departmentId);
  return log.filter(e => e.actorUserId === actorUserId).reverse();
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
