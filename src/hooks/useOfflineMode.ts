/**
 * Hook für Offline-Modus Funktionalität
 * 
 * Kombiniert Network-Status mit Offline-Storage und Sync.
 */

import { useState, useEffect, useCallback } from "react";
import { useNetworkStatus } from "./useNetworkStatus";
import { offlineStorage } from "@/lib/offlineStorage";
import { offlineSyncService, type SyncStatus } from "@/lib/offlineSync";

interface OfflineStats {
  hardwareCount: number;
  tariffCount: number;
  pendingOffers: number;
  pendingCalculations: number;
  lastSync: string | null;
}

interface UseOfflineModeReturn {
  isOnline: boolean;
  isOfflineCapable: boolean;
  syncStatus: SyncStatus;
  stats: OfflineStats;
  isSyncing: boolean;
  triggerSync: () => Promise<void>;
  savePendingOffer: (config: Record<string, unknown>) => Promise<string>;
  savePendingCalculation: (config: Record<string, unknown>, summary: string) => Promise<string>;
  refreshStats: () => Promise<void>;
}

const defaultStats: OfflineStats = {
  hardwareCount: 0,
  tariffCount: 0,
  pendingOffers: 0,
  pendingCalculations: 0,
  lastSync: null,
};

export function useOfflineMode(): UseOfflineModeReturn {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [isOfflineCapable, setIsOfflineCapable] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [stats, setStats] = useState<OfflineStats>(defaultStats);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check offline capability on mount
  useEffect(() => {
    const checkCapability = async () => {
      try {
        const available = await offlineStorage.isDataAvailable();
        setIsOfflineCapable(available);
        
        if (!available) {
          // Initialize cache
          await offlineSyncService.initializeCache();
          const nowAvailable = await offlineStorage.isDataAvailable();
          setIsOfflineCapable(nowAvailable);
        }
      } catch (error) {
        console.error("[useOfflineMode] Capability check failed:", error);
        setIsOfflineCapable(false);
      }
    };

    checkCapability();
  }, []);

  // Refresh stats
  const refreshStats = useCallback(async () => {
    try {
      const newStats = await offlineStorage.getStorageStats();
      setStats(newStats);
    } catch (error) {
      console.error("[useOfflineMode] Stats refresh failed:", error);
    }
  }, []);

  // Initial stats load
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Listen to sync status changes
  useEffect(() => {
    const unsubscribe = offlineSyncService.addListener((status) => {
      setSyncStatus(status);
      setIsSyncing(status === "syncing");
      
      if (status === "success" || status === "error") {
        refreshStats();
      }
    });

    return unsubscribe;
  }, [refreshStats]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      console.info("[useOfflineMode] Back online, triggering sync...");
      offlineSyncService.syncOnReconnect();
    }
  }, [isOnline, wasOffline]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!isOnline) {
      console.warn("[useOfflineMode] Cannot sync while offline");
      return;
    }
    
    setIsSyncing(true);
    await offlineSyncService.syncOnReconnect();
  }, [isOnline]);

  // Save pending offer for later sync
  const savePendingOffer = useCallback(async (config: Record<string, unknown>): Promise<string> => {
    const id = await offlineStorage.addPendingOffer(config);
    await refreshStats();
    return id;
  }, [refreshStats]);

  // Save pending calculation for later sync
  const savePendingCalculation = useCallback(
    async (config: Record<string, unknown>, summary: string): Promise<string> => {
      const id = await offlineStorage.addPendingCalculation(config, summary);
      await refreshStats();
      return id;
    },
    [refreshStats]
  );

  return {
    isOnline,
    isOfflineCapable,
    syncStatus,
    stats,
    isSyncing,
    triggerSync,
    savePendingOffer,
    savePendingCalculation,
    refreshStats,
  };
}
