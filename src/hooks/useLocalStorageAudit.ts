// ============================================
// useLocalStorageAudit Hook
// Phase 5: localStorage Audit & Cleanup für Admin UI
// ============================================

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  auditLocalStorage,
  cleanupMigratedLocalStorage,
  type LocalStorageAuditResult,
  ALLOWED_LOCAL_STORAGE_KEYS,
  LOCAL_STORAGE_CATEGORIES,
} from "@/lib/localStoragePolicy";

export type KeyCategory = 
  | "development" 
  | "security" 
  | "ui" 
  | "migration" 
  | "fallback" 
  | "unknown" 
  | "sensitive";

export interface KeyInfo {
  key: string;
  category: KeyCategory;
  size: number;
  valuePreview: string;
}

interface UseLocalStorageAuditReturn {
  /** Letztes Audit-Ergebnis */
  audit: LocalStorageAuditResult | null;
  /** Alle Keys mit Details */
  keyDetails: KeyInfo[];
  /** Führt Audit durch */
  runAudit: () => void;
  /** Bereinigt migrierte Daten */
  cleanup: () => { removed: string[]; kept: string[]; errors: string[] };
  /** Lädt gerade */
  isLoading: boolean;
}

/**
 * Bestimmt die Kategorie eines localStorage-Keys
 */
export function getKeyCategory(key: string): KeyCategory {
  // Check each category
  for (const [category, keyNames] of Object.entries(LOCAL_STORAGE_CATEGORIES)) {
    for (const keyName of keyNames) {
      const allowedValue = ALLOWED_LOCAL_STORAGE_KEYS[keyName as keyof typeof ALLOWED_LOCAL_STORAGE_KEYS];
      
      if (key === allowedValue) {
        return category as KeyCategory;
      }
      
      // Prefix-based matching
      if (allowedValue && (allowedValue.endsWith("_") || keyName.includes("PREFIX"))) {
        const prefix = allowedValue.replace("PREFIX", "");
        if (key.startsWith(prefix)) {
          return category as KeyCategory;
        }
      }
    }
  }
  
  // Check for sensitive patterns
  const sensitivePatterns = [
    /auth/i, /password/i, /secret/i, /private/i, 
    /api[_-]?key/i, /access[_-]?token/i, /refresh[_-]?token/i,
    /bearer/i, /credential/i, /supabase/i,
  ];
  
  if (sensitivePatterns.some(p => p.test(key))) {
    return "sensitive";
  }
  
  return "unknown";
}

/**
 * Gibt eine sichere Vorschau des Werts zurück (gekürzt, ohne sensible Daten)
 */
function getValuePreview(key: string, category: KeyCategory): string {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return "(leer)";
    
    // Keine Vorschau für sensible Keys
    if (category === "sensitive") {
      return "***";
    }
    
    // JSON formatieren
    try {
      const parsed = JSON.parse(value);
      const preview = JSON.stringify(parsed).slice(0, 50);
      return preview.length < JSON.stringify(parsed).length 
        ? preview + "..." 
        : preview;
    } catch {
      // Kein JSON, einfacher String
      return value.length > 50 ? value.slice(0, 50) + "..." : value;
    }
  } catch {
    return "(Fehler)";
  }
}

/**
 * Berechnet die Byte-Größe eines Strings
 */
function getByteSize(key: string): number {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return 0;
    return new Blob([value]).size;
  } catch {
    return 0;
  }
}

/**
 * Hook für localStorage-Audit und Cleanup-Funktionen
 */
export function useLocalStorageAudit(): UseLocalStorageAuditReturn {
  const { user } = useAuth();
  const [audit, setAudit] = useState<LocalStorageAuditResult | null>(null);
  const [keyDetails, setKeyDetails] = useState<KeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runAudit = useCallback(() => {
    setIsLoading(true);
    
    try {
      // Run audit
      const result = auditLocalStorage();
      setAudit(result);
      
      // Build key details
      const allKeys = [...result.allowed, ...result.unknown, ...result.sensitive];
      const details: KeyInfo[] = allKeys.map(key => {
        const category = getKeyCategory(key);
        return {
          key,
          category,
          size: getByteSize(key),
          valuePreview: getValuePreview(key, category),
        };
      });
      
      // Sort: sensitive first, then unknown, then by category
      details.sort((a, b) => {
        const order: Record<KeyCategory, number> = {
          sensitive: 0,
          unknown: 1,
          security: 2,
          migration: 3,
          fallback: 4,
          ui: 5,
          development: 6,
        };
        return order[a.category] - order[b.category];
      });
      
      setKeyDetails(details);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (!user?.id) {
      return { removed: [], kept: [], errors: ["Kein Benutzer angemeldet"] };
    }
    
    const result = cleanupMigratedLocalStorage(user.id);
    
    // Refresh audit after cleanup
    runAudit();
    
    return result;
  }, [user?.id, runAudit]);

  // Initial audit on mount
  useEffect(() => {
    runAudit();
  }, [runAudit]);

  return {
    audit,
    keyDetails,
    runAudit,
    cleanup,
    isLoading,
  };
}

/**
 * Formatiert Bytes in lesbare Größe
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Gibt Label für Kategorie zurück
 */
export function getCategoryLabel(category: KeyCategory): string {
  const labels: Record<KeyCategory, string> = {
    development: "Entwicklung",
    security: "Sicherheit",
    ui: "UI-Status",
    migration: "Migration",
    fallback: "Gast-Fallback",
    unknown: "Unbekannt",
    sensitive: "Sensibel",
  };
  return labels[category];
}

/**
 * Gibt Farbe für Kategorie zurück
 */
export function getCategoryColor(category: KeyCategory): string {
  const colors: Record<KeyCategory, string> = {
    development: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    security: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    ui: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    migration: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    fallback: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    unknown: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    sensitive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return colors[category];
}
