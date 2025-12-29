/**
 * Offline Storage Layer mit IndexedDB
 * 
 * Speichert Hardware-Katalog, Tarife und pending Angebote
 * für Offline-Nutzung des MargenKalkulators.
 */

const DB_NAME = "margenkalkulator_offline";
const DB_VERSION = 1;

// Store-Namen
const STORES = {
  HARDWARE: "hardware_catalog",
  TARIFFS: "mobile_tariffs",
  FIXED_NET: "fixed_net_products",
  PENDING_OFFERS: "pending_offers",
  PENDING_CALCULATIONS: "pending_calculations",
  METADATA: "sync_metadata",
} as const;

type StoreName = (typeof STORES)[keyof typeof STORES];

interface SyncMetadata {
  id: string;
  lastSyncAt: string;
  dataVersion: string;
  itemCount: number;
}

interface PendingOffer {
  id: string;
  config: Record<string, unknown>;
  createdAt: string;
  syncStatus: "pending" | "syncing" | "failed";
  retryCount: number;
}

interface PendingCalculation {
  id: string;
  config: Record<string, unknown>;
  summary: string;
  createdAt: string;
  syncStatus: "pending" | "syncing" | "failed";
}

let dbInstance: IDBDatabase | null = null;

/**
 * Initialisiert die IndexedDB-Datenbank
 */
async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("[OfflineStorage] DB init failed:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Hardware-Katalog Store
      if (!db.objectStoreNames.contains(STORES.HARDWARE)) {
        const store = db.createObjectStore(STORES.HARDWARE, { keyPath: "id" });
        store.createIndex("brand", "brand", { unique: false });
        store.createIndex("category", "category", { unique: false });
      }

      // Tarife Store
      if (!db.objectStoreNames.contains(STORES.TARIFFS)) {
        const store = db.createObjectStore(STORES.TARIFFS, { keyPath: "id" });
        store.createIndex("family", "family", { unique: false });
      }

      // Festnetz-Produkte Store
      if (!db.objectStoreNames.contains(STORES.FIXED_NET)) {
        const store = db.createObjectStore(STORES.FIXED_NET, { keyPath: "id" });
        store.createIndex("type", "type", { unique: false });
      }

      // Pending Offers Store
      if (!db.objectStoreNames.contains(STORES.PENDING_OFFERS)) {
        const store = db.createObjectStore(STORES.PENDING_OFFERS, { keyPath: "id" });
        store.createIndex("syncStatus", "syncStatus", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Pending Calculations Store
      if (!db.objectStoreNames.contains(STORES.PENDING_CALCULATIONS)) {
        const store = db.createObjectStore(STORES.PENDING_CALCULATIONS, { keyPath: "id" });
        store.createIndex("syncStatus", "syncStatus", { unique: false });
      }

      // Sync Metadata Store
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: "id" });
      }
    };
  });
}

/**
 * Generische Get-Funktion
 */
async function getItem<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const objectStore = tx.objectStore(store);
    const request = objectStore.get(key);

    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generische Set-Funktion
 */
async function setItem<T>(store: StoreName, item: T): Promise<void> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const objectStore = tx.objectStore(store);
    const request = objectStore.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Alle Items eines Stores abrufen
 */
async function getAllItems<T>(store: StoreName): Promise<T[]> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const objectStore = tx.objectStore(store);
    const request = objectStore.getAll();

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Bulk-Insert für Store
 */
async function bulkInsert<T>(store: StoreName, items: T[]): Promise<void> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const objectStore = tx.objectStore(store);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    // Clear existing data first
    objectStore.clear();

    // Insert new items
    items.forEach((item) => {
      objectStore.put(item);
    });
  });
}

/**
 * Item löschen
 */
async function deleteItem(store: StoreName, key: string): Promise<void> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const request = tx.objectStore(store).delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Items nach Index filtern
 */
async function getByIndex<T>(
  store: StoreName,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const objectStore = tx.objectStore(store);
    const index = objectStore.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

// ============================================
// Public API
// ============================================

export const offlineStorage = {
  // Hardware
  async saveHardwareCatalog(items: Array<{ id: string; [key: string]: unknown }>) {
    await bulkInsert(STORES.HARDWARE, items);
    await this.updateMetadata(STORES.HARDWARE, items.length);
  },
  
  async getHardwareCatalog() {
    return getAllItems<{ id: string; brand: string; model: string; ek_net: number }>(STORES.HARDWARE);
  },

  // Tarife
  async saveTariffs(items: Array<{ id: string; [key: string]: unknown }>) {
    await bulkInsert(STORES.TARIFFS, items);
    await this.updateMetadata(STORES.TARIFFS, items.length);
  },
  
  async getTariffs() {
    return getAllItems<{ id: string; name: string; family: string }>(STORES.TARIFFS);
  },

  // Festnetz
  async saveFixedNetProducts(items: Array<{ id: string; [key: string]: unknown }>) {
    await bulkInsert(STORES.FIXED_NET, items);
    await this.updateMetadata(STORES.FIXED_NET, items.length);
  },
  
  async getFixedNetProducts() {
    return getAllItems<{ id: string; name: string; type: string }>(STORES.FIXED_NET);
  },

  // Pending Offers
  async addPendingOffer(config: Record<string, unknown>): Promise<string> {
    const id = crypto.randomUUID();
    const offer: PendingOffer = {
      id,
      config,
      createdAt: new Date().toISOString(),
      syncStatus: "pending",
      retryCount: 0,
    };
    await setItem(STORES.PENDING_OFFERS, offer);
    return id;
  },

  async getPendingOffers(): Promise<PendingOffer[]> {
    return getByIndex<PendingOffer>(STORES.PENDING_OFFERS, "syncStatus", "pending");
  },

  async getAllPendingOffers(): Promise<PendingOffer[]> {
    return getAllItems<PendingOffer>(STORES.PENDING_OFFERS);
  },

  async updateOfferSyncStatus(id: string, status: PendingOffer["syncStatus"]) {
    const offer = await getItem<PendingOffer>(STORES.PENDING_OFFERS, id);
    if (offer) {
      offer.syncStatus = status;
      offer.retryCount = status === "failed" ? offer.retryCount + 1 : 0;
      await setItem(STORES.PENDING_OFFERS, offer);
    }
  },

  async removePendingOffer(id: string) {
    await deleteItem(STORES.PENDING_OFFERS, id);
  },

  // Pending Calculations
  async addPendingCalculation(config: Record<string, unknown>, summary: string): Promise<string> {
    const id = crypto.randomUUID();
    const calc: PendingCalculation = {
      id,
      config,
      summary,
      createdAt: new Date().toISOString(),
      syncStatus: "pending",
    };
    await setItem(STORES.PENDING_CALCULATIONS, calc);
    return id;
  },

  async getPendingCalculations(): Promise<PendingCalculation[]> {
    return getByIndex<PendingCalculation>(STORES.PENDING_CALCULATIONS, "syncStatus", "pending");
  },

  async removePendingCalculation(id: string) {
    await deleteItem(STORES.PENDING_CALCULATIONS, id);
  },

  // Metadata
  async updateMetadata(store: StoreName, itemCount: number) {
    const metadata: SyncMetadata = {
      id: store,
      lastSyncAt: new Date().toISOString(),
      dataVersion: "v2025_10",
      itemCount,
    };
    await setItem(STORES.METADATA, metadata);
  },

  async getMetadata(store: StoreName): Promise<SyncMetadata | undefined> {
    return getItem<SyncMetadata>(STORES.METADATA, store);
  },

  async getAllMetadata(): Promise<SyncMetadata[]> {
    return getAllItems<SyncMetadata>(STORES.METADATA);
  },

  // Utils
  async isDataAvailable(): Promise<boolean> {
    try {
      const hardware = await this.getHardwareCatalog();
      const tariffs = await this.getTariffs();
      return hardware.length > 0 && tariffs.length > 0;
    } catch {
      return false;
    }
  },

  async getStorageStats(): Promise<{
    hardwareCount: number;
    tariffCount: number;
    pendingOffers: number;
    pendingCalculations: number;
    lastSync: string | null;
  }> {
    const [hardware, tariffs, offers, calculations, metadata] = await Promise.all([
      this.getHardwareCatalog(),
      this.getTariffs(),
      this.getAllPendingOffers(),
      this.getPendingCalculations(),
      this.getMetadata(STORES.HARDWARE),
    ]);

    return {
      hardwareCount: hardware.length,
      tariffCount: tariffs.length,
      pendingOffers: offers.length,
      pendingCalculations: calculations.length,
      lastSync: metadata?.lastSyncAt || null,
    };
  },

  async clearAll(): Promise<void> {
    const db = await initDB();
    const storeNames = Object.values(STORES);
    
    for (const storeName of storeNames) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const request = tx.objectStore(storeName).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  },
};

export type { PendingOffer, PendingCalculation, SyncMetadata };
