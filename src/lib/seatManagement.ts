// ============================================
// Seat Management - Phase 3C.2
// Tenant-scoped seat assignment
// ============================================

import { loadLicense, updateSeatsUsed, type LicenseState } from "./license";

/**
 * Seat assignment record
 */
export interface SeatAssignment {
  tenantId: string;
  userId: string;
  userName: string;
  assignedAt: string;
  assignedBy: string;
}

// ============================================
// Storage Keys
// ============================================

const SEATS_STORAGE_PREFIX = "seats_";

function getSeatsStorageKey(tenantId: string): string {
  return `${SEATS_STORAGE_PREFIX}${tenantId}`;
}

// ============================================
// CRUD Functions
// ============================================

/**
 * Load all seat assignments for a tenant
 */
export function loadSeatAssignments(tenantId: string): SeatAssignment[] {
  try {
    const key = getSeatsStorageKey(tenantId);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return [];
    }
    
    const parsed = JSON.parse(stored) as SeatAssignment[];
    return parsed.filter(a => a.tenantId === tenantId);
  } catch (error) {
    console.warn("[Seats] Failed to load assignments:", error);
    return [];
  }
}

/**
 * Save all seat assignments for a tenant
 */
export function saveSeatAssignments(tenantId: string, assignments: SeatAssignment[]): void {
  try {
    const key = getSeatsStorageKey(tenantId);
    localStorage.setItem(key, JSON.stringify(assignments));
    
    // Update seatsUsed in license
    updateSeatsUsed(tenantId, assignments.length);
  } catch (error) {
    console.error("[Seats] Failed to save assignments:", error);
  }
}

/**
 * Assign a seat to a user
 * Returns true if successful, false if seat limit exceeded
 */
export function assignSeat(
  tenantId: string,
  userId: string,
  userName: string,
  assignedBy: string
): { success: boolean; error?: string; assignment?: SeatAssignment } {
  const license = loadLicense(tenantId);
  const assignments = loadSeatAssignments(tenantId);
  
  // Check if user already has a seat
  const existing = assignments.find(a => a.userId === userId);
  if (existing) {
    return { success: true, assignment: existing };
  }
  
  // Check seat limit
  if (assignments.length >= license.seatLimit) {
    return { 
      success: false, 
      error: `Seat-Limit erreicht (${license.seatLimit}). Bitte upgraden Sie Ihre Lizenz.` 
    };
  }
  
  // Create new assignment
  const newAssignment: SeatAssignment = {
    tenantId,
    userId,
    userName,
    assignedAt: new Date().toISOString(),
    assignedBy,
  };
  
  const updated = [...assignments, newAssignment];
  saveSeatAssignments(tenantId, updated);
  
  return { success: true, assignment: newAssignment };
}

/**
 * Revoke a seat from a user
 */
export function revokeSeat(tenantId: string, userId: string): boolean {
  const assignments = loadSeatAssignments(tenantId);
  const filtered = assignments.filter(a => a.userId !== userId);
  
  if (filtered.length === assignments.length) {
    return false; // User didn't have a seat
  }
  
  saveSeatAssignments(tenantId, filtered);
  return true;
}

/**
 * Check if a user has a seat assigned
 */
export function isUserSeated(tenantId: string, userId: string): boolean {
  const assignments = loadSeatAssignments(tenantId);
  return assignments.some(a => a.userId === userId);
}

/**
 * Get the seat assignment for a user
 */
export function getUserSeat(tenantId: string, userId: string): SeatAssignment | undefined {
  const assignments = loadSeatAssignments(tenantId);
  return assignments.find(a => a.userId === userId);
}

/**
 * Count the number of used seats
 */
export function countUsedSeats(tenantId: string): number {
  const assignments = loadSeatAssignments(tenantId);
  return assignments.length;
}

/**
 * Get seat usage info
 */
export function getSeatUsageInfo(tenantId: string): {
  used: number;
  limit: number;
  available: number;
  exceeded: boolean;
  license: LicenseState;
} {
  const license = loadLicense(tenantId);
  const used = countUsedSeats(tenantId);
  
  return {
    used,
    limit: license.seatLimit,
    available: Math.max(0, license.seatLimit - used),
    exceeded: used > license.seatLimit,
    license,
  };
}

/**
 * Clear all seat assignments (for testing)
 */
export function clearSeatAssignments(tenantId: string): void {
  const key = getSeatsStorageKey(tenantId);
  localStorage.removeItem(key);
  updateSeatsUsed(tenantId, 0);
}

/**
 * Get all users with seats for display
 */
export function getSeatedUsers(tenantId: string): Array<{
  userId: string;
  userName: string;
  assignedAt: string;
  assignedBy: string;
}> {
  return loadSeatAssignments(tenantId).map(a => ({
    userId: a.userId,
    userName: a.userName,
    assignedAt: a.assignedAt,
    assignedBy: a.assignedBy,
  }));
}
