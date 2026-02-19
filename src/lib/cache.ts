// Simple IndexedDB cache for offline support
const DB_NAME = 'cardledger-cache';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;
let dbOpenPromise: Promise<IDBDatabase> | null = null;

const isIndexedDBAvailable = (): boolean => {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
};

const openDB = (): Promise<IDBDatabase> => {
  if (db) return Promise.resolve(db);
  if (dbOpenPromise) return dbOpenPromise;

  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error('IndexedDB not available'));
  }

  dbOpenPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        dbOpenPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        db = request.result;
        // Handle unexpected close (e.g. storage cleared)
        db.onclose = () => {
          db = null;
          dbOpenPromise = null;
        };
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        if (!database.objectStoreNames.contains('cache')) {
          database.createObjectStore('cache', { keyPath: 'key' });
        }
      };

      request.onblocked = () => {
        dbOpenPromise = null;
        reject(new Error('IndexedDB blocked'));
      };
    } catch (err) {
      dbOpenPromise = null;
      reject(err);
    }
  });

  return dbOpenPromise;
};

export const cacheSet = async <T>(key: string, data: T): Promise<void> => {
  try {
    const database = await openDB();
    const transaction = database.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');

    store.put({ key, data, timestamp: Date.now() });

    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.warn('Cache set failed (graceful):', error);
    // Graceful degradation — don't throw
  }
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const database = await openDB();
    const transaction = database.transaction('cache', 'readonly');
    const store = transaction.objectStore('cache');
    const request = store.get(key);

    return new Promise<T | null>((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Cache get failed (graceful):', error);
    return null;
  }
};

export const cacheGetWithTimestamp = async <T>(key: string): Promise<{ data: T; timestamp: number } | null> => {
  try {
    const database = await openDB();
    const transaction = database.transaction('cache', 'readonly');
    const store = transaction.objectStore('cache');
    const request = store.get(key);

    return new Promise<{ data: T; timestamp: number } | null>((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? { data: result.data, timestamp: result.timestamp } : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Cache getWithTimestamp failed (graceful):', error);
    return null;
  }
};

export const cacheClear = async (): Promise<void> => {
  try {
    const database = await openDB();
    const transaction = database.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');
    store.clear();

    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.warn('Cache clear failed (graceful):', error);
  }
};

// Check if we're online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Listen for online/offline events
export const onConnectivityChange = (callback: (online: boolean) => void): (() => void) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// ============================================
// OFFLINE WRITE QUEUE
// ============================================
const QUEUE_KEY = 'cardledger-write-queue';

interface QueuedWrite {
  id: string;
  timestamp: number;
  action: string;
  payload: unknown;
}

export const queueWrite = async (action: string, payload: unknown): Promise<void> => {
  try {
    const database = await openDB();
    const transaction = database.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');
    const existing = await new Promise<QueuedWrite[]>((resolve) => {
      const req = store.get(QUEUE_KEY);
      req.onsuccess = () => resolve(req.result?.data || []);
      req.onerror = () => resolve([]);
    });
    const entry: QueuedWrite = { id: crypto.randomUUID(), timestamp: Date.now(), action, payload };
    existing.push(entry);
    store.put({ key: QUEUE_KEY, data: existing, timestamp: Date.now() });
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.warn('Queue write failed:', error);
  }
};

export const getQueuedWrites = async (): Promise<QueuedWrite[]> => {
  try {
    const result = await cacheGet<QueuedWrite[]>(QUEUE_KEY);
    return result || [];
  } catch {
    return [];
  }
};

export const clearQueuedWrites = async (): Promise<void> => {
  try {
    const database = await openDB();
    const transaction = database.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');
    store.delete(QUEUE_KEY);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.warn('Clear queue failed:', error);
  }
};
