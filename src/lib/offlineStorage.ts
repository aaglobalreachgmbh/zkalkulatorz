/**
 * Offline Storage Layer mit IndexedDB
 * 
 * Speichert Hardware-Katalog, Tarife und pending Angebote
 * für Offline-Nutzung des MargenKalkulators.
 */

const DB_NAME = "margenkalkulator_offline";
const DB_VERSION = 2; // Increased for new stores

// Store-Namen
const STORES = {
  HARDWARE: "hardware_catalog",
  TARIFFS: "mobile_tariffs",
  FIXED_NET: "fixed_net_products",
  PENDING_OFFERS: "pending_offers",
  PENDING_CALCULATIONS: "pending_calculations",
  PENDING_VISITS: "pending_visits",
  PENDING_PHOTOS: "pending_photos",
  CACHED_CHECKLISTS: "cached_checklists",
  CACHED_CUSTOMERS: "cached_customers",
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

interface PendingVisit {
  id: string;
  customerId: string;
  visitDate: string;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
  notes?: string;
  checklistId?: string;
  checklistResponses?: Record<string, unknown>;
  createdAt: string;
  syncStatus: "pending" | "syncing" | "failed";
}

interface PendingPhoto {
  id: string;
  visitId: string;
  base64: string;
  caption?: string;
  createdAt: string;
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

      // Pending Visits Store (for field service)
      if (!db.objectStoreNames.contains(STORES.PENDING_VISITS)) {
        const store = db.createObjectStore(STORES.PENDING_VISITS, { keyPath: "id" });
        store.createIndex("syncStatus", "syncStatus", { unique: false });
        store.createIndex("customerId", "customerId", { unique: false });
      }

      // Pending Photos Store (Base64 for offline)
      if (!db.objectStoreNames.contains(STORES.PENDING_PHOTOS)) {
        const store = db.createObjectStore(STORES.PENDING_PHOTOS, { keyPath: "id" });
        store.createIndex("visitId", "visitId", { unique: false });
      }

      // Cached Checklists Store
      if (!db.objectStoreNames.contains(STORES.CACHED_CHECKLISTS)) {
        db.createObjectStore(STORES.CACHED_CHECKLISTS, { keyPath: "id" });
      }

      // Cached Customers Store
      if (!db.objectStoreNames.contains(STORES.CACHED_CUSTOMERS)) {
        const store = db.createObjectStore(STORES.CACHED_CUSTOMERS, { keyPath: "id" });
        store.createIndex("company_name", "company_name", { unique: false });
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

  // Pending Visits (for field service offline)
  async addPendingVisit(visit: Omit<PendingVisit, "id" | "createdAt" | "syncStatus">): Promise<string> {
    const id = crypto.randomUUID();
    const pendingVisit: PendingVisit = {
      id,
      ...visit,
      createdAt: new Date().toISOString(),
      syncStatus: "pending",
    };
    await setItem(STORES.PENDING_VISITS, pendingVisit);
    return id;
  },

  async getPendingVisits(): Promise<PendingVisit[]> {
    return getAllItems<PendingVisit>(STORES.PENDING_VISITS);
  },

  async removePendingVisit(id: string) {
    await deleteItem(STORES.PENDING_VISITS, id);
  },

  async updateVisitSyncStatus(id: string, status: PendingVisit["syncStatus"]) {
    const visit = await getItem<PendingVisit>(STORES.PENDING_VISITS, id);
    if (visit) {
      visit.syncStatus = status;
      await setItem(STORES.PENDING_VISITS, visit);
    }
  },

  // Pending Photos (Base64 for offline)
  async addPendingPhoto(visitId: string, base64: string, caption?: string): Promise<string> {
    const id = crypto.randomUUID();
    const photo: PendingPhoto = {
      id,
      visitId,
      base64,
      caption,
      createdAt: new Date().toISOString(),
    };
    await setItem(STORES.PENDING_PHOTOS, photo);
    return id;
  },

  async getPendingPhotos(visitId?: string): Promise<PendingPhoto[]> {
    if (visitId) {
      return getByIndex<PendingPhoto>(STORES.PENDING_PHOTOS, "visitId", visitId);
    }
    return getAllItems<PendingPhoto>(STORES.PENDING_PHOTOS);
  },

  async removePendingPhoto(id: string) {
    await deleteItem(STORES.PENDING_PHOTOS, id);
  },

  // Cached Checklists
  async cacheChecklists(checklists: Array<{ id: string; [key: string]: unknown }>) {
    await bulkInsert(STORES.CACHED_CHECKLISTS, checklists);
  },

  async getCachedChecklists() {
    return getAllItems<{ id: string; name: string; items: unknown[] }>(STORES.CACHED_CHECKLISTS);
  },

  // Cached Customers
  async cacheCustomers(customers: Array<{ id: string; [key: string]: unknown }>) {
    await bulkInsert(STORES.CACHED_CUSTOMERS, customers);
  },

  async getCachedCustomers() {
    return getAllItems<{ id: string; company_name: string }>(STORES.CACHED_CUSTOMERS);
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

export type { PendingOffer, PendingCalculation, PendingVisit, PendingPhoto, SyncMetadata };
