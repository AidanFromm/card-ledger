// Simple IndexedDB cache for offline support
const DB_NAME = 'cardledger-cache';
const DB_VERSION = 1;

interface CacheStore {
  inventory: any[];
  sales: any[];
  lastSync: number;
}

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create stores if they don't exist
      if (!database.objectStoreNames.contains('cache')) {
        database.createObjectStore('cache', { keyPath: 'key' });
      }
    };
  });
};

export const cacheSet = async <T>(key: string, data: T): Promise<void> => {
  try {
    const database = await openDB();
    const transaction = database.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');

    store.put({ key, data, timestamp: Date.now() });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const database = await openDB();
    const transaction = database.transaction('cache', 'readonly');
    const store = transaction.objectStore('cache');
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

export const cacheGetWithTimestamp = async <T>(key: string): Promise<{ data: T; timestamp: number } | null> => {
  try {
    const database = await openDB();
    const transaction = database.transaction('cache', 'readonly');
    const store = transaction.objectStore('cache');
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? { data: result.data, timestamp: result.timestamp } : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

export const cacheClear = async (): Promise<void> => {
  try {
    const database = await openDB();
    const transaction = database.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');
    store.clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Cache clear error:', error);
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

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
