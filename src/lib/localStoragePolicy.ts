// =============================================================================
// VAULT SECURITY: localStorage Policy & Governance
// =============================================================================
// Zentrale Definition aller erlaubten localStorage-Keys
// Alle anderen Keys werden als potentiell sensibel betrachtet
// =============================================================================

/**
 * Erlaubte localStorage-Keys nach Kategorie
 * Nur diese Keys dürfen im localStorage gespeichert werden
 */
export const ALLOWED_LOCAL_STORAGE_KEYS = {
  // Development/Testing - Nur für Entwicklung
  MOCK_IDENTITY: "margenkalkulator_mock_identity",
  
  // Security Tokens - Müssen lokal bleiben (CSRF, Rate Limiting)
  CSRF_TOKEN: "csrf_token",
  CSRF_TOKEN_EXPIRY: "csrf_token_expiry",
  LOGIN_ATTEMPTS: "mk_login_attempts",
  
  // UI State - Nicht-sensible transiente Daten
  ACTIVITY_DEBOUNCE: "last_activity_tracked",
  SIDEBAR_STATE: "sidebar:state",
  THEME: "theme",
  
  // Migration Flags - Präfix-basiert
  MIGRATION_PREFIX: "migration_",
  
  // Fallback für Gäste (nicht eingeloggte User) - Präfix-basiert
  GUEST_DRAFTS_PREFIX: "margenkalkulator_drafts_",
  GUEST_HISTORY_PREFIX: "margenkalkulator_history_",
  GUEST_TEMPLATES: "margenkalkulator_templates",
  GUEST_TEMPLATE_FOLDERS: "margenkalkulator_template_folders",
  GUEST_DATASET: "margenkalkulator_custom_dataset",
} as const;

/**
 * Kategorisierung für Audit und Dokumentation
 */
export const LOCAL_STORAGE_CATEGORIES = {
  /** Nur für Entwicklung und Tests */
  development: ["MOCK_IDENTITY"] as const,
  
  /** Security-relevante Keys die lokal bleiben müssen */
  security: ["CSRF_TOKEN", "CSRF_TOKEN_EXPIRY", "LOGIN_ATTEMPTS"] as const,
  
  /** UI-State ohne sensible Daten */
  ui: ["ACTIVITY_DEBOUNCE", "SIDEBAR_STATE", "THEME"] as const,
  
  /** Migration-bezogene Flags */
  migration: ["MIGRATION_PREFIX"] as const,
  
  /** Fallback-Speicher für nicht-eingeloggte User */
  fallback: [
    "GUEST_DRAFTS_PREFIX",
    "GUEST_HISTORY_PREFIX", 
    "GUEST_TEMPLATES",
    "GUEST_TEMPLATE_FOLDERS",
    "GUEST_DATASET",
  ] as const,
} as const;

/**
 * Bekannte sensible Patterns die NICHT in localStorage sein sollten
 */
const SENSITIVE_PATTERNS = [
  /auth/i,
  /password/i,
  /secret/i,
  /private/i,
  /api[_-]?key/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /bearer/i,
  /credential/i,
  /supabase/i,
];

/**
 * Prüft ob ein Key in der Whitelist enthalten ist
 */
function isAllowedKey(key: string): boolean {
  const allowedValues = Object.values(ALLOWED_LOCAL_STORAGE_KEYS);
  
  return allowedValues.some(allowed => {
    // Exakte Übereinstimmung
    if (key === allowed) return true;
    
    // Präfix-basierte Keys (z.B. migration_, margenkalkulator_drafts_)
    if (allowed.endsWith("_") || allowed.endsWith("PREFIX")) {
      const prefix = allowed.replace("PREFIX", "");
      if (key.startsWith(prefix)) return true;
    }
    
    return false;
  });
}

/**
 * Prüft ob ein Key sensible Daten enthalten könnte
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Ergebnis eines localStorage-Audits
 */
export interface LocalStorageAuditResult {
  /** Keys die in der Whitelist sind */
  allowed: string[];
  /** Unbekannte Keys (nicht in Whitelist, nicht sensibel) */
  unknown: string[];
  /** Potentiell sensible Keys die nicht in localStorage sein sollten */
  sensitive: string[];
  /** Gesamtanzahl der Keys */
  totalKeys: number;
  /** Timestamp des Audits */
  timestamp: number;
}

/**
 * Führt einen Security-Audit auf alle localStorage-Einträge durch
 * Kategorisiert Keys als allowed, unknown oder sensitive
 */
export function auditLocalStorage(): LocalStorageAuditResult {
  const allowed: string[] = [];
  const unknown: string[] = [];
  const sensitive: string[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      if (isAllowedKey(key)) {
        allowed.push(key);
      } else if (isSensitiveKey(key)) {
        sensitive.push(key);
      } else {
        unknown.push(key);
      }
    }
  } catch {
    // localStorage nicht verfügbar (z.B. private browsing)
    console.warn("[LocalStoragePolicy] localStorage nicht verfügbar");
  }
  
  return {
    allowed,
    unknown,
    sensitive,
    totalKeys: allowed.length + unknown.length + sensitive.length,
    timestamp: Date.now(),
  };
}

/**
 * Entfernt alte localStorage-Daten nach erfolgreicher Cloud-Migration
 * Prüft Migration-Flags bevor Daten gelöscht werden
 */
export function cleanupMigratedLocalStorage(userId: string): {
  removed: string[];
  kept: string[];
  errors: string[];
} {
  const removed: string[] = [];
  const kept: string[] = [];
  const errors: string[] = [];
  
  // Keys die nach Migration entfernt werden können
  const migratableKeys = [
    { key: `margenkalkulator_drafts_${userId}`, flag: `migration_drafts_done_${userId}` },
    { key: `margenkalkulator_history_${userId}`, flag: `migration_history_done_${userId}` },
    { key: "margenkalkulator_templates", flag: `migration_templates_done_${userId}` },
    { key: "margenkalkulator_template_folders", flag: `migration_folders_done_${userId}` },
    { key: "margenkalkulator_custom_dataset", flag: `migration_dataset_done_${userId}` },
  ];
  
  for (const { key, flag } of migratableKeys) {
    try {
      const migrationDone = localStorage.getItem(flag);
      const hasData = localStorage.getItem(key) !== null;
      
      if (!hasData) {
        // Kein Eintrag vorhanden, nichts zu tun
        continue;
      }
      
      if (migrationDone === "true") {
        // Migration abgeschlossen, sicher zu löschen
        localStorage.removeItem(key);
        localStorage.removeItem(flag); // Auch Flag entfernen
        removed.push(key);
      } else {
        // Migration nicht abgeschlossen, behalten
        kept.push(key);
      }
    } catch (error) {
      errors.push(`${key}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  
  return { removed, kept, errors };
}

/**
 * Setzt ein Migration-Done-Flag für einen bestimmten Bereich
 */
export function setMigrationFlag(
  userId: string, 
  area: "drafts" | "history" | "templates" | "folders" | "dataset"
): void {
  try {
    localStorage.setItem(`migration_${area}_done_${userId}`, "true");
  } catch {
    console.warn(`[LocalStoragePolicy] Konnte Migration-Flag für ${area} nicht setzen`);
  }
}

/**
 * Prüft ob ein bestimmter Bereich bereits migriert wurde
 */
export function isMigrationComplete(
  userId: string,
  area: "drafts" | "history" | "templates" | "folders" | "dataset"
): boolean {
  try {
    return localStorage.getItem(`migration_${area}_done_${userId}`) === "true";
  } catch {
    return false;
  }
}

/**
 * Formatiert Audit-Ergebnis für Logging
 */
export function formatAuditForLog(audit: LocalStorageAuditResult): string {
  const lines = [
    `[LocalStorage Audit] ${new Date(audit.timestamp).toISOString()}`,
    `  Total Keys: ${audit.totalKeys}`,
    `  Allowed: ${audit.allowed.length}`,
    `  Unknown: ${audit.unknown.length}`,
    `  Sensitive: ${audit.sensitive.length}`,
  ];
  
  if (audit.sensitive.length > 0) {
    lines.push(`  ⚠️ Sensitive Keys: ${audit.sensitive.join(", ")}`);
  }
  
  if (audit.unknown.length > 0) {
    lines.push(`  ℹ️ Unknown Keys: ${audit.unknown.join(", ")}`);
  }
  
  return lines.join("\n");
}
