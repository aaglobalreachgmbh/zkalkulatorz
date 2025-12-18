// ============================================
// Dataset Diff Calculator
// Compares current vs new dataset for preview
// ============================================

export type DiffChange = {
  field: string;
  oldValue: unknown;
  newValue: unknown;
};

export type DiffItem = {
  entityType: string;
  id: string;
  changes?: DiffChange[];
};

export type DiffResult = {
  added: DiffItem[];
  changed: DiffItem[];
  removed: DiffItem[];
  breakingRisk: boolean;
  summary: {
    totalAdded: number;
    totalChanged: number;
    totalRemoved: number;
  };
};

type EntityWithId = { id: string; [key: string]: unknown };
type DatasetLike = Record<string, EntityWithId[]>;

export function diffDatasets(
  current: DatasetLike,
  next: DatasetLike
): DiffResult {
  const result: DiffResult = {
    added: [],
    changed: [],
    removed: [],
    breakingRisk: false,
    summary: {
      totalAdded: 0,
      totalChanged: 0,
      totalRemoved: 0,
    },
  };
  
  // Entity types to compare
  const entityTypes = [
    "mobileTariffs",
    "fixedNetProducts",
    "hardwareCatalog",
    "promos",
    "subVariants",
  ];
  
  for (const entityType of entityTypes) {
    const currentItems = (current[entityType] ?? []) as EntityWithId[];
    const nextItems = (next[entityType] ?? []) as EntityWithId[];
    
    const currentMap = new Map(currentItems.map(item => [item.id, item]));
    const nextMap = new Map(nextItems.map(item => [item.id, item]));
    
    // Added items
    for (const [id] of nextMap) {
      if (!currentMap.has(id)) {
        result.added.push({ entityType, id });
        result.summary.totalAdded++;
      }
    }
    
    // Removed items (BREAKING RISK!)
    for (const [id] of currentMap) {
      if (!nextMap.has(id)) {
        result.removed.push({ entityType, id });
        result.breakingRisk = true;
        result.summary.totalRemoved++;
      }
    }
    
    // Changed items
    for (const [id, nextItem] of nextMap) {
      const currentItem = currentMap.get(id);
      if (currentItem) {
        const changes = findChanges(currentItem, nextItem);
        if (changes.length > 0) {
          result.changed.push({ entityType, id, changes });
          result.summary.totalChanged++;
        }
      }
    }
  }
  
  return result;
}

function findChanges(current: EntityWithId, next: EntityWithId): DiffChange[] {
  const changes: DiffChange[] = [];
  const allKeys = new Set([...Object.keys(current), ...Object.keys(next)]);
  
  for (const key of allKeys) {
    // Skip internal/computed fields
    if (key === "features" || key === "sources") continue;
    
    const currentVal = current[key];
    const nextVal = next[key];
    
    // Deep compare using JSON serialization
    if (JSON.stringify(currentVal) !== JSON.stringify(nextVal)) {
      changes.push({
        field: key,
        oldValue: currentVal,
        newValue: nextVal,
      });
    }
  }
  
  return changes;
}

// Format diff for display
export function formatDiffSummary(diff: DiffResult): string {
  const parts: string[] = [];
  
  if (diff.summary.totalAdded > 0) {
    parts.push(`${diff.summary.totalAdded} hinzugefügt`);
  }
  if (diff.summary.totalChanged > 0) {
    parts.push(`${diff.summary.totalChanged} geändert`);
  }
  if (diff.summary.totalRemoved > 0) {
    parts.push(`${diff.summary.totalRemoved} entfernt`);
  }
  
  return parts.length > 0 ? parts.join(", ") : "Keine Änderungen";
}
