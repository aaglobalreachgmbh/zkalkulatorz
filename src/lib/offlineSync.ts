/**
 * Offline Sync Service
 * 
 * Synchronisiert lokale Daten mit dem Backend:
 * - Download: Hardware-Katalog, Tarife beim Start
 * - Upload: Pending Offers/Calculations beim Reconnect
 */

import { supabase } from "@/integrations/supabase/client";
import { offlineStorage, type PendingOffer } from "./offlineStorage";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

// Import static data for fallback
import { hardwareCatalog } from "@/margenkalkulator/data/business/v2025_10/hardware";
import { allMobileTariffs } from "@/margenkalkulator/data/business/v2025_10";

type SyncStatus = "idle" | "syncing" | "success" | "error";

interface SyncResult {
  status: SyncStatus;
  downloaded: {
    hardware: number;
    tariffs: number;
  };
  uploaded: {
    offers: number;
    calculations: number;
  };
  errors: string[];
}

class OfflineSyncService {
  private syncInProgress = false;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  /**
   * Initialisiert den Offline-Cache mit Daten
   */
  async initializeCache(): Promise<void> {
    try {
      const isAvailable = await offlineStorage.isDataAvailable();
      
      if (!isAvailable) {
        console.info("[OfflineSync] Initializing cache with static data...");
        await this.cacheStaticData();
      }
    } catch (error) {
      console.error("[OfflineSync] Cache initialization failed:", error);
    }
  }

  /**
   * Cached statische Daten für Offline-Nutzung
   */
  private async cacheStaticData(): Promise<void> {
    try {
      // Hardware-Katalog
      const hardwareItems = hardwareCatalog.map((h) => ({
        id: h.id,
        brand: h.brand,
        model: h.model,
        category: h.category || "smartphone",
        ek_net: h.ekNet,
      }));
      await offlineStorage.saveHardwareCatalog(hardwareItems);

      // Tarife
      const tariffItems = allMobileTariffs.map((t) => ({
        id: t.id,
        name: t.name,
        family: t.family,
        monthlyBase: t.baseNet,
        dataVolume: t.dataVolumeGB,
      }));
      await offlineStorage.saveTariffs(tariffItems);

      console.info("[OfflineSync] Static data cached:", {
        hardware: hardwareItems.length,
        tariffs: tariffItems.length,
      });
    } catch (error) {
      console.error("[OfflineSync] Static cache failed:", error);
    }
  }

  /**
   * Synchronisiert beim Reconnect
   */
  async syncOnReconnect(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        status: "idle",
        downloaded: { hardware: 0, tariffs: 0 },
        uploaded: { offers: 0, calculations: 0 },
        errors: ["Sync already in progress"],
      };
    }

    this.syncInProgress = true;
    this.notifyListeners("syncing");

    const result: SyncResult = {
      status: "syncing",
      downloaded: { hardware: 0, tariffs: 0 },
      uploaded: { offers: 0, calculations: 0 },
      errors: [],
    };

    try {
      // 1. Upload pending offers
      const pendingOffers = await offlineStorage.getPendingOffers();
      for (const offer of pendingOffers) {
        try {
          await this.uploadPendingOffer(offer);
          await offlineStorage.removePendingOffer(offer.id);
          result.uploaded.offers++;
        } catch (error) {
          await offlineStorage.updateOfferSyncStatus(offer.id, "failed");
          result.errors.push(`Offer ${offer.id}: ${error}`);
        }
      }

      // 2. Upload pending calculations
      const pendingCalcs = await offlineStorage.getPendingCalculations();
      for (const calc of pendingCalcs) {
        try {
          await this.uploadPendingCalculation(calc);
          await offlineStorage.removePendingCalculation(calc.id);
          result.uploaded.calculations++;
        } catch (error) {
          result.errors.push(`Calculation ${calc.id}: ${error}`);
        }
      }

      // 3. Refresh cache from cloud if available
      await this.refreshFromCloud(result);

      result.status = result.errors.length > 0 ? "error" : "success";
      this.notifyListeners(result.status);

      // Show toast
      if (result.uploaded.offers > 0 || result.uploaded.calculations > 0) {
        toast.success(
          `Synchronisiert: ${result.uploaded.offers} Angebote, ${result.uploaded.calculations} Berechnungen`
        );
      }

      return result;
    } catch (error) {
      result.status = "error";
      result.errors.push(String(error));
      this.notifyListeners("error");
      return result;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Lädt ein pending Offer hoch
   */
  private async uploadPendingOffer(offer: PendingOffer): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[offlineSync] uploadPendingOffer: Not authenticated, skipping");
      return;
    }

    const { error } = await supabase.from("saved_offers").insert([{
      user_id: user.id,
      tenant_id: "tenant_default",
      name: `Offline-Angebot ${new Date(offer.createdAt).toLocaleDateString("de-DE")}`,
      config: offer.config as Json,
      visibility: "private",
      is_draft: true,
    }]);

    if (error) throw error;
  }

  /**
   * Lädt eine pending Calculation hoch
   */
  private async uploadPendingCalculation(calc: {
    id: string;
    config: Record<string, unknown>;
    summary: string;
    createdAt: string;
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[offlineSync] uploadPendingCalculation: Not authenticated, skipping");
      return;
    }

    const { error } = await supabase.from("calculation_history").insert([{
      user_id: user.id,
      tenant_id: "tenant_default",
      config: calc.config as Json,
      summary: calc.summary,
      created_at: calc.createdAt,
    }]);

    if (error) throw error;
  }

  /**
   * Aktualisiert den lokalen Cache aus der Cloud
   */
  private async refreshFromCloud(result: SyncResult): Promise<void> {
    try {
      // Try tenant hardware first
      const { data: tenantHardware } = await supabase
        .from("tenant_hardware")
        .select("*")
        .eq("is_active", true)
        .limit(500);

      if (tenantHardware && tenantHardware.length > 0) {
        const items = tenantHardware.map((h) => ({
          id: h.hardware_id,
          brand: h.brand,
          model: h.model,
          category: h.category || "smartphone",
          ek_net: h.ek_net,
        }));
        await offlineStorage.saveHardwareCatalog(items);
        result.downloaded.hardware = items.length;
      }
    } catch (error) {
      console.warn("[OfflineSync] Cloud refresh failed, using cached data:", error);
    }
  }

  /**
   * Status-Listener registrieren
   */
  addListener(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(status: SyncStatus): void {
    this.listeners.forEach((cb) => cb(status));
  }

  /**
   * Gibt Sync-Status zurück
   */
  isSyncing(): boolean {
    return this.syncInProgress;
  }
}

export const offlineSyncService = new OfflineSyncService();
export type { SyncStatus, SyncResult };
