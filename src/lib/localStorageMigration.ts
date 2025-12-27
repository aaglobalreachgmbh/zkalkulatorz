// ============================================
// localStorage to Cloud Migration Functions
// Phase 3: One-time migration on first login
// ============================================

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { OfferOptionState } from "@/margenkalkulator/engine/types";

// ============================================
// Types
// ============================================

export interface MigrationResult {
  drafts: { migrated: number; skipped: number };
  history: { migrated: number; skipped: number };
  templates: { migrated: number; skipped: number };
  folders: { migrated: number; skipped: number };
  dataset: boolean;
  license: boolean;
  seats: { migrated: number; skipped: number };
  departments: { migrated: number; skipped: number };
  assignments: { migrated: number; skipped: number };
  errors: string[];
}

interface LocalDraft {
  id: string;
  name: string;
  config: OfferOptionState;
  preview?: {
    hardwareName: string;
    tariffName: string;
    avgMonthly: number;
    hasFixedNet: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface LocalHistoryEntry {
  id: string;
  timestamp: string;
  summary: string;
  config: OfferOptionState;
}

interface LocalTemplate {
  id: string;
  name: string;
  config: OfferOptionState;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
}

interface LocalFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
}

interface LocalSeatAssignment {
  id: string;
  userId: string;
  userName: string;
  assignedBy: string;
  assignedAt: string;
}

interface LocalDepartment {
  id: string;
  name: string;
  parentId?: string;
  policy?: Record<string, unknown>;
  createdAt: string;
}

interface LocalUserAssignment {
  userId: string;
  departmentId: string;
  assignedBy?: string;
  assignedAt: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Find all localStorage keys matching a prefix
 */
function findLocalStorageKeys(prefix: string): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Safely parse JSON from localStorage
 */
function safeParseJSON<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ============================================
// Migration Functions
// ============================================

/**
 * Migrate drafts from localStorage to cloud
 */
export async function migrateDrafts(
  userId: string,
  tenantId: string
): Promise<{ migrated: number; skipped: number; errors: string[] }> {
  const MIGRATION_FLAG = `migration_drafts_done_${userId}`;
  if (localStorage.getItem(MIGRATION_FLAG)) {
    return { migrated: 0, skipped: 0, errors: [] };
  }

  const errors: string[] = [];
  let migrated = 0;
  let skipped = 0;

  // Find all scoped draft keys
  const scopedKeys = findLocalStorageKeys("margenkalkulator_drafts_");

  for (const key of scopedKeys) {
    const drafts = safeParseJSON<LocalDraft[]>(key, []);

    for (const draft of drafts) {
      try {
        // Check if already exists in cloud
        const { data: existing } = await supabase
          .from("offer_drafts")
          .select("id")
          .eq("id", draft.id)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        const { error } = await supabase.from("offer_drafts").insert({
          id: draft.id,
          user_id: userId,
          tenant_id: tenantId,
          name: draft.name,
          config: draft.config as unknown as Json,
          preview: draft.preview as unknown as Json,
          draft_type: "draft",
          created_at: draft.createdAt,
          updated_at: draft.updatedAt,
        });

        if (error) {
          errors.push(`Draft ${draft.name}: ${error.message}`);
        } else {
          migrated++;
        }
      } catch (e) {
        errors.push(`Draft ${draft.name}: ${(e as Error).message}`);
      }
    }

    // Remove localStorage after successful migration
    if (errors.length === 0) {
      localStorage.removeItem(key);
    }
  }

  if (errors.length === 0) {
    localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
  }

  return { migrated, skipped, errors };
}

/**
 * Migrate calculation history from localStorage to cloud
 */
export async function migrateHistory(
  userId: string,
  tenantId: string
): Promise<{ migrated: number; skipped: number; errors: string[] }> {
  const MIGRATION_FLAG = `migration_history_done_${userId}`;
  if (localStorage.getItem(MIGRATION_FLAG)) {
    return { migrated: 0, skipped: 0, errors: [] };
  }

  const errors: string[] = [];
  let migrated = 0;
  let skipped = 0;

  const scopedKeys = findLocalStorageKeys("margenkalkulator_history_");

  for (const key of scopedKeys) {
    const history = safeParseJSON<LocalHistoryEntry[]>(key, []);

    for (const entry of history) {
      try {
        // Check if already exists
        const { data: existing } = await supabase
          .from("calculation_history")
          .select("id")
          .eq("id", entry.id)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        const { error } = await supabase.from("calculation_history").insert({
          id: entry.id,
          user_id: userId,
          tenant_id: tenantId,
          config: entry.config as unknown as Json,
          summary: entry.summary,
          created_at: entry.timestamp,
        });

        if (error) {
          errors.push(`History ${entry.id}: ${error.message}`);
        } else {
          migrated++;
        }
      } catch (e) {
        errors.push(`History ${entry.id}: ${(e as Error).message}`);
      }
    }

    if (errors.length === 0) {
      localStorage.removeItem(key);
    }
  }

  if (errors.length === 0) {
    localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
  }

  return { migrated, skipped, errors };
}

/**
 * Migrate template folders from localStorage to cloud
 */
export async function migrateTemplateFolders(
  userId: string,
  tenantId: string
): Promise<{ migrated: number; skipped: number; errors: string[]; idMap: Map<string, string> }> {
  const errors: string[] = [];
  let migrated = 0;
  let skipped = 0;
  const idMap = new Map<string, string>();

  const folders = safeParseJSON<LocalFolder[]>("margenkalkulator_template_folders", []);

  // Sort folders to migrate parents first
  const sortedFolders = [...folders].sort((a, b) => {
    if (!a.parentId && b.parentId) return -1;
    if (a.parentId && !b.parentId) return 1;
    return 0;
  });

  for (const folder of sortedFolders) {
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from("template_folders")
        .select("id")
        .eq("name", folder.name)
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        idMap.set(folder.id, existing.id);
        skipped++;
        continue;
      }

      const parentId = folder.parentId ? idMap.get(folder.parentId) : null;

      const { data, error } = await supabase
        .from("template_folders")
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          name: folder.name,
          parent_id: parentId,
          created_at: folder.createdAt,
        })
        .select("id")
        .single();

      if (error) {
        errors.push(`Folder ${folder.name}: ${error.message}`);
      } else if (data) {
        idMap.set(folder.id, data.id);
        migrated++;
      }
    } catch (e) {
      errors.push(`Folder ${folder.name}: ${(e as Error).message}`);
    }
  }

  return { migrated, skipped, errors, idMap };
}

/**
 * Migrate templates from localStorage to cloud
 */
export async function migrateTemplates(
  userId: string,
  tenantId: string
): Promise<{ migrated: number; skipped: number; foldersMigrated: number; errors: string[] }> {
  const MIGRATION_FLAG = `migration_templates_done_${userId}`;
  if (localStorage.getItem(MIGRATION_FLAG)) {
    return { migrated: 0, skipped: 0, foldersMigrated: 0, errors: [] };
  }

  // First migrate folders
  const folderResult = await migrateTemplateFolders(userId, tenantId);
  const errors = [...folderResult.errors];
  let migrated = 0;
  let skipped = 0;

  const templates = safeParseJSON<LocalTemplate[]>("margenkalkulator_templates", []);

  for (const template of templates) {
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from("offer_drafts")
        .select("id")
        .eq("name", template.name)
        .eq("user_id", userId)
        .eq("draft_type", "template")
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const folderId = template.folderId ? folderResult.idMap.get(template.folderId) : null;

      const { error } = await supabase.from("offer_drafts").insert({
        user_id: userId,
        tenant_id: tenantId,
        name: template.name,
        config: template.config as unknown as Json,
        draft_type: "template",
        folder_id: folderId,
        created_at: template.createdAt,
        updated_at: template.updatedAt,
      });

      if (error) {
        errors.push(`Template ${template.name}: ${error.message}`);
      } else {
        migrated++;
      }
    } catch (e) {
      errors.push(`Template ${template.name}: ${(e as Error).message}`);
    }
  }

  if (errors.length === 0) {
    localStorage.removeItem("margenkalkulator_templates");
    localStorage.removeItem("margenkalkulator_template_folders");
    localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
  }

  return { migrated, skipped, foldersMigrated: folderResult.migrated, errors };
}

/**
 * Migrate custom dataset from localStorage to cloud (Admin-Only)
 */
export async function migrateDataset(
  userId: string,
  tenantId: string,
  isAdmin: boolean
): Promise<{ migrated: boolean; errors: string[] }> {
  if (!isAdmin) {
    return { migrated: false, errors: [] };
  }

  const MIGRATION_FLAG = `migration_dataset_done_${tenantId}`;
  if (localStorage.getItem(MIGRATION_FLAG)) {
    return { migrated: false, errors: [] };
  }

  const errors: string[] = [];
  const datasetKey = "margenkalkulator_custom_dataset";
  const datasetJson = localStorage.getItem(datasetKey);

  if (!datasetJson) {
    localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
    return { migrated: false, errors: [] };
  }

  try {
    const dataset = JSON.parse(datasetJson);

    // Check if tenant already has a dataset
    const { data: existing } = await supabase
      .from("custom_datasets")
      .select("id")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (existing) {
      localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
      return { migrated: false, errors: [] };
    }

    const { error } = await supabase.from("custom_datasets").insert({
      tenant_id: tenantId,
      dataset_version: dataset.meta?.datasetVersion || "1.0.0",
      valid_from: dataset.meta?.validFromISO || new Date().toISOString().split("T")[0],
      verified_at: dataset.meta?.verifiedAtISO || new Date().toISOString().split("T")[0],
      created_by: userId,
      hardware_catalog: (dataset.hardwareCatalog || []) as unknown as Json,
      mobile_tariffs: (dataset.mobileTariffs || []) as unknown as Json,
      mobile_features: (dataset.mobileFeatures || []) as unknown as Json,
      mobile_dependencies: (dataset.mobileDependencies || []) as unknown as Json,
      fixed_net_products: (dataset.fixedNetProducts || []) as unknown as Json,
      promos: (dataset.promos || []) as unknown as Json,
      sub_variants: (dataset.subVariants || []) as unknown as Json,
      provisions: (dataset.provisions || []) as unknown as Json,
      omo_matrix: (dataset.omoMatrix || []) as unknown as Json,
    });

    if (error) {
      errors.push(`Dataset: ${error.message}`);
    } else {
      localStorage.removeItem(datasetKey);
      localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
      return { migrated: true, errors };
    }
  } catch (e) {
    errors.push(`Dataset: ${(e as Error).message}`);
  }

  return { migrated: false, errors };
}

/**
 * Migrate license from localStorage to cloud (Admin-Only)
 */
export async function migrateLicense(
  tenantId: string,
  isAdmin: boolean
): Promise<{ migrated: boolean; errors: string[] }> {
  if (!isAdmin) {
    return { migrated: false, errors: [] };
  }

  const errors: string[] = [];
  const licenseKey = `license_${tenantId}`;
  const licenseJson = localStorage.getItem(licenseKey);

  if (!licenseJson) {
    return { migrated: false, errors: [] };
  }

  try {
    const license = JSON.parse(licenseJson);

    // Check if already exists in cloud
    const { data: existing } = await supabase
      .from("licenses")
      .select("id")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (existing) {
      localStorage.removeItem(licenseKey);
      return { migrated: false, errors: [] };
    }

    const { error } = await supabase.from("licenses").insert({
      tenant_id: tenantId,
      plan: license.plan || "internal",
      seat_limit: license.seatLimit || 999,
      seats_used: license.seatsUsed || 0,
      features: (license.features || {}) as unknown as Json,
      valid_until: license.validUntil || null,
    });

    if (error) {
      errors.push(`License: ${error.message}`);
    } else {
      localStorage.removeItem(licenseKey);
      return { migrated: true, errors };
    }
  } catch (e) {
    errors.push(`License: ${(e as Error).message}`);
  }

  return { migrated: false, errors };
}

/**
 * Migrate seat assignments from localStorage to cloud (Admin-Only)
 */
export async function migrateSeats(
  userId: string,
  tenantId: string,
  isAdmin: boolean
): Promise<{ migrated: number; skipped: number; errors: string[] }> {
  if (!isAdmin) {
    return { migrated: 0, skipped: 0, errors: [] };
  }

  const errors: string[] = [];
  let migrated = 0;
  let skipped = 0;

  const seatsKey = `seats_${tenantId}`;
  const seats = safeParseJSON<LocalSeatAssignment[]>(seatsKey, []);

  for (const seat of seats) {
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from("seat_assignments")
        .select("id")
        .eq("user_id", seat.userId)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("seat_assignments").insert({
        tenant_id: tenantId,
        user_id: seat.userId,
        user_email: seat.userName, // userName contains email in old format
        user_name: seat.userName,
        assigned_by: userId,
        assigned_at: seat.assignedAt,
      });

      if (error) {
        errors.push(`Seat ${seat.userName}: ${error.message}`);
      } else {
        migrated++;
      }
    } catch (e) {
      errors.push(`Seat ${seat.userName}: ${(e as Error).message}`);
    }
  }

  if (errors.length === 0 && seats.length > 0) {
    localStorage.removeItem(seatsKey);
  }

  return { migrated, skipped, errors };
}

/**
 * Migrate departments from localStorage to cloud (Admin-Only)
 */
export async function migrateDepartments(
  userId: string,
  tenantId: string,
  isAdmin: boolean
): Promise<{ migrated: number; skipped: number; errors: string[] }> {
  if (!isAdmin) {
    return { migrated: 0, skipped: 0, errors: [] };
  }

  const errors: string[] = [];
  let migrated = 0;
  let skipped = 0;

  const deptsKey = `org_departments_${tenantId}`;
  const depts = safeParseJSON<LocalDepartment[]>(deptsKey, []);

  // Sort to migrate parents first
  const sortedDepts = [...depts].sort((a, b) => {
    if (!a.parentId && b.parentId) return -1;
    if (a.parentId && !b.parentId) return 1;
    return 0;
  });

  for (const dept of sortedDepts) {
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from("departments")
        .select("id")
        .eq("department_id", dept.id)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("departments").insert({
        tenant_id: tenantId,
        department_id: dept.id,
        name: dept.name,
        parent_id: dept.parentId || null,
        policy: (dept.policy || {}) as unknown as Json,
        created_by: userId,
        created_at: dept.createdAt,
      });

      if (error) {
        errors.push(`Department ${dept.name}: ${error.message}`);
      } else {
        migrated++;
      }
    } catch (e) {
      errors.push(`Department ${dept.name}: ${(e as Error).message}`);
    }
  }

  if (errors.length === 0 && depts.length > 0) {
    localStorage.removeItem(deptsKey);
  }

  return { migrated, skipped, errors };
}

/**
 * Migrate user department assignments from localStorage to cloud (Admin-Only)
 */
export async function migrateDepartmentAssignments(
  userId: string,
  tenantId: string,
  isAdmin: boolean
): Promise<{ migrated: number; skipped: number; errors: string[] }> {
  if (!isAdmin) {
    return { migrated: 0, skipped: 0, errors: [] };
  }

  const errors: string[] = [];
  let migrated = 0;
  let skipped = 0;

  const assignmentsKey = `org_user_assignments_${tenantId}`;
  const assignments = safeParseJSON<LocalUserAssignment[]>(assignmentsKey, []);

  for (const assignment of assignments) {
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from("user_department_assignments")
        .select("id")
        .eq("user_id", assignment.userId)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("user_department_assignments").insert({
        tenant_id: tenantId,
        user_id: assignment.userId,
        department_id: assignment.departmentId,
        assigned_by: assignment.assignedBy || userId,
        assigned_at: assignment.assignedAt,
      });

      if (error) {
        errors.push(`Assignment ${assignment.userId}: ${error.message}`);
      } else {
        migrated++;
      }
    } catch (e) {
      errors.push(`Assignment ${assignment.userId}: ${(e as Error).message}`);
    }
  }

  if (errors.length === 0 && assignments.length > 0) {
    localStorage.removeItem(assignmentsKey);
  }

  return { migrated, skipped, errors };
}

/**
 * Main migration orchestration function
 */
export async function performFullMigration(
  userId: string,
  tenantId: string,
  isAdmin: boolean
): Promise<MigrationResult> {
  const result: MigrationResult = {
    drafts: { migrated: 0, skipped: 0 },
    history: { migrated: 0, skipped: 0 },
    templates: { migrated: 0, skipped: 0 },
    folders: { migrated: 0, skipped: 0 },
    dataset: false,
    license: false,
    seats: { migrated: 0, skipped: 0 },
    departments: { migrated: 0, skipped: 0 },
    assignments: { migrated: 0, skipped: 0 },
    errors: [],
  };

  // User-specific data (every user)
  const draftsResult = await migrateDrafts(userId, tenantId);
  result.drafts = { migrated: draftsResult.migrated, skipped: draftsResult.skipped };
  result.errors.push(...draftsResult.errors);

  const historyResult = await migrateHistory(userId, tenantId);
  result.history = { migrated: historyResult.migrated, skipped: historyResult.skipped };
  result.errors.push(...historyResult.errors);

  const templatesResult = await migrateTemplates(userId, tenantId);
  result.templates = { migrated: templatesResult.migrated, skipped: templatesResult.skipped };
  result.folders = { migrated: templatesResult.foldersMigrated, skipped: 0 };
  result.errors.push(...templatesResult.errors);

  // Tenant-wide data (admin only)
  if (isAdmin) {
    const datasetResult = await migrateDataset(userId, tenantId, isAdmin);
    result.dataset = datasetResult.migrated;
    result.errors.push(...datasetResult.errors);

    const licenseResult = await migrateLicense(tenantId, isAdmin);
    result.license = licenseResult.migrated;
    result.errors.push(...licenseResult.errors);

    const seatsResult = await migrateSeats(userId, tenantId, isAdmin);
    result.seats = { migrated: seatsResult.migrated, skipped: seatsResult.skipped };
    result.errors.push(...seatsResult.errors);

    const deptsResult = await migrateDepartments(userId, tenantId, isAdmin);
    result.departments = { migrated: deptsResult.migrated, skipped: deptsResult.skipped };
    result.errors.push(...deptsResult.errors);

    const assignmentsResult = await migrateDepartmentAssignments(userId, tenantId, isAdmin);
    result.assignments = { migrated: assignmentsResult.migrated, skipped: assignmentsResult.skipped };
    result.errors.push(...assignmentsResult.errors);
  }

  return result;
}

/**
 * Check if migration is needed
 */
export function isMigrationNeeded(userId: string): boolean {
  // Check for any local data that hasn't been migrated
  const draftKeys = findLocalStorageKeys("margenkalkulator_drafts_");
  const historyKeys = findLocalStorageKeys("margenkalkulator_history_");
  const hasTemplates = localStorage.getItem("margenkalkulator_templates");
  const hasDataset = localStorage.getItem("margenkalkulator_custom_dataset");

  const draftsMigrated = localStorage.getItem(`migration_drafts_done_${userId}`);
  const historyMigrated = localStorage.getItem(`migration_history_done_${userId}`);
  const templatesMigrated = localStorage.getItem(`migration_templates_done_${userId}`);

  return (
    (draftKeys.length > 0 && !draftsMigrated) ||
    (historyKeys.length > 0 && !historyMigrated) ||
    (hasTemplates && !templatesMigrated) ||
    !!hasDataset
  );
}
