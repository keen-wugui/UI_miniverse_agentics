import React from "react";
import { networkMonitor } from "./api-error-handling";
import { showInfoToast, showWarningToast, showErrorToast } from "./toast-utils";

// Offline storage interface
export interface OfflineStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
}

// IndexedDB implementation
export class IndexedDBStorage implements OfflineStorage {
  private dbName = "offline-app-storage";
  private version = 1;
  private storeName = "key-value-store";

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: "key",
          });
          store.createIndex("expiresAt", "expiresAt", { unique: false });
        }
      };
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(null);
            return;
          }

          // Check expiration
          if (result.expiresAt && Date.now() > result.expiresAt) {
            this.remove(key); // Clean up expired data
            resolve(null);
            return;
          }

          resolve(result.value);
        };
      });
    } catch (error) {
      console.error("IndexedDB get error:", error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const data = {
        key,
        value,
        createdAt: Date.now(),
        expiresAt: ttl ? Date.now() + ttl : null,
      };

      return new Promise((resolve, reject) => {
        const request = store.put(data);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error("IndexedDB set error:", error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error("IndexedDB remove error:", error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error("IndexedDB clear error:", error);
      throw error;
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async keys(): Promise<string[]> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.getAllKeys();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as string[]);
      });
    } catch (error) {
      console.error("IndexedDB keys error:", error);
      return [];
    }
  }
}

// Offline queue item
export interface OfflineQueueItem {
  id: string;
  type: "create" | "update" | "delete";
  endpoint: string;
  data?: any;
  method: string;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

// Offline queue manager
export class OfflineQueueManager {
  private static instance: OfflineQueueManager | null = null;
  private storage: OfflineStorage;
  private queueKey = "offline-queue";
  private isProcessing = false;
  private listeners: Array<(queueSize: number) => void> = [];

  constructor(storage: OfflineStorage) {
    this.storage = storage;
    this.initializeProcessing();
  }

  static getInstance(storage?: OfflineStorage): OfflineQueueManager {
    if (!OfflineQueueManager.instance) {
      OfflineQueueManager.instance = new OfflineQueueManager(
        storage || new IndexedDBStorage()
      );
    }
    return OfflineQueueManager.instance;
  }

  private initializeProcessing(): void {
    // Process queue when coming back online
    networkMonitor.addListener((status) => {
      if (status.isOnline && !this.isProcessing) {
        this.processQueue();
      }
    });
  }

  async addToQueue(
    item: Omit<OfflineQueueItem, "id" | "timestamp" | "retries">
  ): Promise<void> {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0,
      maxRetries: item.maxRetries || 3,
    };

    const queue = await this.getQueue();
    queue.push(queueItem);
    await this.storage.set(this.queueKey, queue);

    this.notifyListeners();

    showInfoToast("Action queued", {
      description: "This action will be processed when you're back online.",
    });
  }

  async getQueue(): Promise<OfflineQueueItem[]> {
    const queue = await this.storage.get<OfflineQueueItem[]>(this.queueKey);
    return queue || [];
  }

  async getQueueSize(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  async clearQueue(): Promise<void> {
    await this.storage.remove(this.queueKey);
    this.notifyListeners();
  }

  async removeFromQueue(id: string): Promise<void> {
    const queue = await this.getQueue();
    const filteredQueue = queue.filter((item) => item.id !== id);
    await this.storage.set(this.queueKey, filteredQueue);
    this.notifyListeners();
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || !networkMonitor.isOnline()) {
      return;
    }

    this.isProcessing = true;
    const queue = await this.getQueue();

    if (queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    showInfoToast("Syncing offline changes...", {
      description: `Processing ${queue.length} queued action${queue.length !== 1 ? "s" : ""}.`,
    });

    let processed = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        await this.processQueueItem(item);
        await this.removeFromQueue(item.id);
        processed++;
      } catch (error) {
        console.error("Failed to process queue item:", error);

        // Increment retry count
        item.retries++;

        if (item.retries >= item.maxRetries) {
          await this.removeFromQueue(item.id);
          failed++;
        } else {
          // Update the item in the queue with new retry count
          const updatedQueue = await this.getQueue();
          const itemIndex = updatedQueue.findIndex((q) => q.id === item.id);
          if (itemIndex !== -1) {
            updatedQueue[itemIndex] = item;
            await this.storage.set(this.queueKey, updatedQueue);
          }
        }
      }
    }

    this.isProcessing = false;
    this.notifyListeners();

    // Show completion message
    if (processed > 0) {
      showInfoToast("Sync complete", {
        description: `Successfully processed ${processed} action${processed !== 1 ? "s" : ""}.`,
      });
    }

    if (failed > 0) {
      showErrorToast(
        `${failed} action${failed !== 1 ? "s" : ""} failed to sync after maximum retries.`
      );
    }
  }

  private async processQueueItem(item: OfflineQueueItem): Promise<void> {
    const response = await fetch(item.endpoint, {
      method: item.method,
      headers: {
        "Content-Type": "application/json",
        ...item.headers,
      },
      body: item.data ? JSON.stringify(item.data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  addListener(listener: (queueSize: number) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private async notifyListeners(): Promise<void> {
    const size = await this.getQueueSize();
    this.listeners.forEach((listener) => listener(size));
  }
}

// Cache manager for offline content
export class OfflineCacheManager {
  private static instance: OfflineCacheManager | null = null;
  private storage: OfflineStorage;
  private cachePrefix = "cache:";
  private defaultTTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(storage: OfflineStorage) {
    this.storage = storage;
  }

  static getInstance(storage?: OfflineStorage): OfflineCacheManager {
    if (!OfflineCacheManager.instance) {
      OfflineCacheManager.instance = new OfflineCacheManager(
        storage || new IndexedDBStorage()
      );
    }
    return OfflineCacheManager.instance;
  }

  private getCacheKey(key: string): string {
    return `${this.cachePrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    return this.storage.get<T>(this.getCacheKey(key));
  }

  async set<T>(
    key: string,
    value: T,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    await this.storage.set(this.getCacheKey(key), value, ttl);
  }

  async remove(key: string): Promise<void> {
    await this.storage.remove(this.getCacheKey(key));
  }

  async has(key: string): Promise<boolean> {
    return this.storage.has(this.getCacheKey(key));
  }

  async clear(): Promise<void> {
    const keys = await this.storage.keys();
    const cacheKeys = keys.filter((key) => key.startsWith(this.cachePrefix));

    for (const key of cacheKeys) {
      await this.storage.remove(key);
    }
  }

  // Cache API responses
  async cacheApiResponse<T>(
    endpoint: string,
    data: T,
    ttl?: number
  ): Promise<void> {
    const key = `api:${endpoint}`;
    await this.set(key, data, ttl);
  }

  async getCachedApiResponse<T>(endpoint: string): Promise<T | null> {
    const key = `api:${endpoint}`;
    return this.get<T>(key);
  }

  // Cache user data
  async cacheUserData<T>(userId: string, data: T, ttl?: number): Promise<void> {
    const key = `user:${userId}`;
    await this.set(key, data, ttl);
  }

  async getCachedUserData<T>(userId: string): Promise<T | null> {
    const key = `user:${userId}`;
    return this.get<T>(key);
  }
}

// Offline-first hook for React components
export function useOfflineFirst<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    cacheTTL?: number;
    enableQueue?: boolean;
    fallbackData?: T;
  } = {}
) {
  const [data, setData] = React.useState<T | null>(
    options.fallbackData || null
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = React.useState(false);

  const cache = OfflineCacheManager.getInstance();
  const networkStatus = networkMonitor.getStatus();

  React.useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get cached data first
        const cachedData = await cache.get<T>(key);
        if (cachedData && isMounted) {
          setData(cachedData);
          setIsFromCache(true);
          setLoading(false);
        }

        // If online, fetch fresh data
        if (networkStatus.isOnline) {
          try {
            const freshData = await fetcher();
            if (isMounted) {
              setData(freshData);
              setIsFromCache(false);

              // Cache the fresh data
              await cache.set(key, freshData, options.cacheTTL);
            }
          } catch (fetchError) {
            // If we have cached data, use it; otherwise, show error
            if (!cachedData && isMounted) {
              setError(fetchError as Error);
            }
          }
        } else if (!cachedData && isMounted) {
          // Offline and no cached data
          setError(new Error("No cached data available offline"));
        }
      } catch (cacheError) {
        if (isMounted) {
          setError(cacheError as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [key, networkStatus.isOnline]);

  return {
    data,
    loading,
    error,
    isFromCache,
    isOnline: networkStatus.isOnline,
  };
}

// Export singleton instances
export const offlineStorage = new IndexedDBStorage();
export const offlineQueue = OfflineQueueManager.getInstance(offlineStorage);
export const offlineCache = OfflineCacheManager.getInstance(offlineStorage);

// Offline utilities
export const offlineUtils = {
  // Check if app is in offline mode
  isOffline: () => !networkMonitor.isOnline(),

  // Get offline capabilities
  getOfflineCapabilities: () => ({
    hasIndexedDB: typeof indexedDB !== "undefined",
    hasServiceWorker: "serviceWorker" in navigator,
    hasNetworkInformation: "connection" in navigator,
  }),

  // Estimate storage usage
  estimateStorageUsage: async (): Promise<{
    used: number;
    quota: number;
  } | null> => {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return null;
  },

  // Clear all offline data
  clearAllOfflineData: async (): Promise<void> => {
    await offlineStorage.clear();
    showInfoToast("Offline data cleared", {
      description: "All cached data and queued actions have been removed.",
    });
  },
};
