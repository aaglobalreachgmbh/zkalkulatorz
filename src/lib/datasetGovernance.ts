// ============================================
// Dataset Governance Layer - Phase 3B.3
// Workflow: draft → review → published → archived
// ============================================

import { type CanonicalDataset } from "@/margenkalkulator/dataManager/types";
import { type AppRole } from "@/contexts/IdentityContext";

/**
 * Dataset status lifecycle
 */
export type DatasetStatus = "draft" | "review" | "published" | "archived";

/**
 * Managed dataset entity
 */
export interface ManagedDataset {
  datasetId: string;
  datasetVersion: string;
  createdAt: string;
  createdBy: string;        // userId
  createdByName: string;    // displayName
  status: DatasetStatus;
  scope: "department";      // Later: "tenant"
  departmentId: string;
  notes?: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedByName?: string;
}

/**
 * Status transition event
 */
export interface StatusTransition {
  from: DatasetStatus;
  to: DatasetStatus;
  by: string;           // userId
  byName: string;       // displayName
  at: string;           // ISO timestamp
  reason?: string;
}

// ============================================
// Storage Keys (Scoped)
// ============================================

function getRegistryKey(tenantId: string, departmentId: string): string {
  return `datasets_registry_${tenantId}_${departmentId}`;
}

function getPayloadKey(tenantId: string, departmentId: string, datasetId: string): string {
  return `dataset_payload_${tenantId}_${departmentId}_${datasetId}`;
}

function getActiveKey(tenantId: string, departmentId: string): string {
  return `dataset_active_${tenantId}_${departmentId}`;
}

// ============================================
// Role-Based Permissions
// ============================================

/**
 * Check if a role can perform a specific status transition
 */
export function canTransition(role: AppRole, from: DatasetStatus, to: DatasetStatus): boolean {
  // Import (create draft): all roles
  if (from === "draft" && to === "draft") return true;
  
  // draft → review: manager, admin
  if (from === "draft" && to === "review") {
    return role === "manager" || role === "admin";
  }
  
  // review → published: admin only
  if (from === "review" && to === "published") {
    return role === "admin";
  }
  
  // review → draft (reject): admin only
  if (from === "review" && to === "draft") {
    return role === "admin";
  }
  
  // published → archived: admin only
  if (from === "published" && to === "archived") {
    return role === "admin";
  }
  
  return false;
}

/**
 * Check if a role can import datasets (create drafts)
 */
export function canImport(role: AppRole): boolean {
  return role === "sales" || role === "manager" || role === "admin";
}

/**
 * Check if a role can set review status
 */
export function canSetReview(role: AppRole): boolean {
  return role === "manager" || role === "admin";
}

/**
 * Check if a role can publish datasets
 */
export function canPublish(role: AppRole): boolean {
  return role === "admin";
}

// ============================================
// Registry CRUD
// ============================================

/**
 * Load dataset registry (metadata only, no payloads)
 */
export function loadDatasetRegistry(tenantId: string, departmentId: string): ManagedDataset[] {
  try {
    const key = getRegistryKey(tenantId, departmentId);
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

/**
 * Save dataset registry
 */
export function saveDatasetRegistry(tenantId: string, departmentId: string, registry: ManagedDataset[]): void {
  const key = getRegistryKey(tenantId, departmentId);
  localStorage.setItem(key, JSON.stringify(registry));
}

/**
 * Load dataset payload
 */
export function loadDatasetPayload(
  tenantId: string, 
  departmentId: string, 
  datasetId: string
): CanonicalDataset | null {
  try {
    const key = getPayloadKey(tenantId, departmentId, datasetId);
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

/**
 * Save dataset payload
 */
export function saveDatasetPayload(
  tenantId: string, 
  departmentId: string, 
  datasetId: string, 
  payload: CanonicalDataset
): void {
  const key = getPayloadKey(tenantId, departmentId, datasetId);
  localStorage.setItem(key, JSON.stringify(payload));
}

/**
 * Delete dataset payload
 */
export function deleteDatasetPayload(tenantId: string, departmentId: string, datasetId: string): void {
  const key = getPayloadKey(tenantId, departmentId, datasetId);
  localStorage.removeItem(key);
}

// ============================================
// Active Dataset Management
// ============================================

/**
 * Get active dataset ID for a department
 */
export function getActiveDatasetId(tenantId: string, departmentId: string): string | null {
  try {
    const key = getActiveKey(tenantId, departmentId);
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Set active dataset ID for a department
 */
export function setActiveDatasetId(tenantId: string, departmentId: string, datasetId: string): void {
  const key = getActiveKey(tenantId, departmentId);
  localStorage.setItem(key, datasetId);
}

/**
 * Clear active dataset for a department
 */
export function clearActiveDatasetId(tenantId: string, departmentId: string): void {
  const key = getActiveKey(tenantId, departmentId);
  localStorage.removeItem(key);
}

/**
 * Get the currently active dataset (with payload)
 */
export function getActiveDataset(
  tenantId: string, 
  departmentId: string
): { meta: ManagedDataset; payload: CanonicalDataset } | null {
  const activeId = getActiveDatasetId(tenantId, departmentId);
  if (!activeId) return null;
  
  const registry = loadDatasetRegistry(tenantId, departmentId);
  const meta = registry.find(d => d.datasetId === activeId && d.status === "published");
  if (!meta) return null;
  
  const payload = loadDatasetPayload(tenantId, departmentId, activeId);
  if (!payload) return null;
  
  return { meta, payload };
}

// ============================================
// Workflow Operations
// ============================================

/**
 * Create a new draft dataset
 */
export function createDraftDataset(
  tenantId: string,
  departmentId: string,
  payload: CanonicalDataset,
  userId: string,
  userName: string,
  notes?: string
): ManagedDataset {
  const datasetId = `ds_${Date.now()}`;
  const now = new Date().toISOString();
  
  const newDataset: ManagedDataset = {
    datasetId,
    datasetVersion: payload.meta.datasetVersion,
    createdAt: now,
    createdBy: userId,
    createdByName: userName,
    status: "draft",
    scope: "department",
    departmentId,
    notes,
  };
  
  // Save to registry
  const registry = loadDatasetRegistry(tenantId, departmentId);
  registry.push(newDataset);
  saveDatasetRegistry(tenantId, departmentId, registry);
  
  // Save payload
  saveDatasetPayload(tenantId, departmentId, datasetId, payload);
  
  return newDataset;
}

/**
 * Transition dataset status
 */
export function transitionDatasetStatus(
  tenantId: string,
  departmentId: string,
  datasetId: string,
  newStatus: DatasetStatus,
  userId: string,
  userName: string,
  reason?: string
): ManagedDataset | null {
  const registry = loadDatasetRegistry(tenantId, departmentId);
  const index = registry.findIndex(d => d.datasetId === datasetId);
  if (index === -1) return null;
  
  const dataset = registry[index];
  const now = new Date().toISOString();
  
  // Update status
  dataset.status = newStatus;
  dataset.updatedAt = now;
  dataset.updatedBy = userId;
  dataset.updatedByName = userName;
  if (reason) {
    dataset.notes = `${dataset.notes || ""}\n[${newStatus}] ${reason}`.trim();
  }
  
  // If publishing, also set as active and archive previous published
  if (newStatus === "published") {
    // Archive any existing published dataset
    registry.forEach((d, i) => {
      if (i !== index && d.status === "published") {
        d.status = "archived";
        d.updatedAt = now;
        d.updatedBy = userId;
        d.updatedByName = userName;
      }
    });
    
    // Set as active
    setActiveDatasetId(tenantId, departmentId, datasetId);
  }
  
  saveDatasetRegistry(tenantId, departmentId, registry);
  return dataset;
}

/**
 * Get dataset by ID
 */
export function getDatasetById(
  tenantId: string,
  departmentId: string,
  datasetId: string
): ManagedDataset | null {
  const registry = loadDatasetRegistry(tenantId, departmentId);
  return registry.find(d => d.datasetId === datasetId) ?? null;
}

/**
 * Get datasets by status
 */
export function getDatasetsByStatus(
  tenantId: string,
  departmentId: string,
  status: DatasetStatus
): ManagedDataset[] {
  const registry = loadDatasetRegistry(tenantId, departmentId);
  return registry.filter(d => d.status === status);
}

/**
 * Delete a draft dataset (only drafts can be deleted)
 */
export function deleteDraftDataset(
  tenantId: string,
  departmentId: string,
  datasetId: string
): boolean {
  const registry = loadDatasetRegistry(tenantId, departmentId);
  const dataset = registry.find(d => d.datasetId === datasetId);
  
  if (!dataset || dataset.status !== "draft") return false;
  
  // Remove from registry
  const filtered = registry.filter(d => d.datasetId !== datasetId);
  saveDatasetRegistry(tenantId, departmentId, filtered);
  
  // Delete payload
  deleteDatasetPayload(tenantId, departmentId, datasetId);
  
  return true;
}
