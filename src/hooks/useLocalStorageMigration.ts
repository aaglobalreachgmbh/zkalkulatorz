// ============================================
// useLocalStorageMigration Hook
// Phase 3: Auto-migrate localStorage to Cloud on login
// Phase 5: Auto-cleanup after successful migration
// ============================================

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import {
  performFullMigration,
  isMigrationNeeded,
  type MigrationResult,
} from "@/lib/localStorageMigration";
import { 
  cleanupMigratedLocalStorage,
  setMigrationFlag,
} from "@/lib/localStoragePolicy";

interface UseMigrationReturn {
  isMigrating: boolean;
  migrationResult: MigrationResult | null;
  migrationNeeded: boolean;
  triggerMigration: () => Promise<void>;
  lastCleanupResult: { removed: string[]; kept: string[]; errors: string[] } | null;
}

export function useLocalStorageMigration(): UseMigrationReturn {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();

  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [lastCleanupResult, setLastCleanupResult] = useState<{ 
    removed: string[]; 
    kept: string[]; 
    errors: string[]; 
  } | null>(null);

  // Check if migration is needed
  useEffect(() => {
    if (user?.id) {
      setMigrationNeeded(isMigrationNeeded(user.id));
    }
  }, [user?.id]);

  // Auto-trigger migration on first login
  useEffect(() => {
    if (
      user?.id &&
      identity?.tenantId &&
      migrationNeeded &&
      !isMigrating &&
      !hasAttempted
    ) {
      setHasAttempted(true);
      performMigration();
    }
  }, [user?.id, identity?.tenantId, migrationNeeded, isMigrating, hasAttempted]);

  const performMigration = useCallback(async () => {
    if (!user?.id || !identity?.tenantId) return;

    setIsMigrating(true);

    try {
      const result = await performFullMigration(
        user.id,
        identity.tenantId,
        isAdmin
      );

      setMigrationResult(result);

      // Calculate totals for toast
      const totalMigrated =
        result.drafts.migrated +
        result.history.migrated +
        result.templates.migrated +
        result.folders.migrated +
        result.seats.migrated +
        result.departments.migrated +
        result.assignments.migrated +
        (result.dataset ? 1 : 0) +
        (result.license ? 1 : 0);

      if (result.errors.length > 0) {
        toast({
          title: "Migration teilweise abgeschlossen",
          description: `${totalMigrated} Einträge migriert, ${result.errors.length} Fehler aufgetreten.`,
          variant: "destructive",
        });
        console.error("Migration errors:", result.errors);
      } else if (totalMigrated > 0) {
        toast({
          title: "Lokale Daten synchronisiert",
          description: `${totalMigrated} Einträge erfolgreich in die Cloud übertragen.`,
        });
        
        // ============================================
        // Phase 5: Auto-Cleanup nach erfolgreicher Migration
        // ============================================
        
        // Set migration flags for completed areas
        if (result.drafts.migrated > 0) {
          setMigrationFlag(user.id, "drafts");
        }
        if (result.history.migrated > 0) {
          setMigrationFlag(user.id, "history");
        }
        if (result.templates.migrated > 0) {
          setMigrationFlag(user.id, "templates");
        }
        if (result.folders.migrated > 0) {
          setMigrationFlag(user.id, "folders");
        }
        if (result.dataset) {
          setMigrationFlag(user.id, "dataset");
        }
        
        // Cleanup old localStorage data
        const cleanupResult = cleanupMigratedLocalStorage(user.id);
        setLastCleanupResult(cleanupResult);
        
        if (cleanupResult.removed.length > 0) {
          console.info(
            "[Migration] Alte localStorage-Daten bereinigt:",
            cleanupResult.removed
          );
        }
      }

      setMigrationNeeded(false);
    } catch (error) {
      console.error("Migration failed:", error);
      toast({
        title: "Migration fehlgeschlagen",
        description: "Lokale Daten konnten nicht synchronisiert werden.",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  }, [user?.id, identity?.tenantId, isAdmin, toast]);

  const triggerMigration = useCallback(async () => {
    await performMigration();
  }, [performMigration]);

  return {
    isMigrating,
    migrationResult,
    migrationNeeded,
    triggerMigration,
    lastCleanupResult,
  };
}
