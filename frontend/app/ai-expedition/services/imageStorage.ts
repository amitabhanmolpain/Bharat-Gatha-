/**
 * Production-Grade Image Storage & Cache System — Bharat Gatha AI Historical Expedition
 *
 * ARCHITECTURE:
 * 1. In-Memory Map: 0-latency instant access during active gameplay session.
 * 2. IndexedDB Store ("ai_expedition_media_db"): Persistent multi-megabyte image store across browser refreshes.
 * 3. Zero LocalStorage Use: Generated base64/blob image payloads NEVER touch localStorage (eliminating QuotaExceededError).
 */

const DB_NAME = "ai_expedition_media_db";
const DB_VERSION = 1;
const STORE_NAME = "scene_images";

// Fast in-memory cache for the current application session
const memoryCache = new Map<string, string>();

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getIDBDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "hashKey" });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (err) => {
        console.warn("IndexedDB open error:", err);
        resolve(null);
      };
    } catch (err) {
      console.warn("IndexedDB initialization exception:", err);
      resolve(null);
    }
  });

  return dbPromise;
}

/**
 * Stores a generated image payload into memory cache and IndexedDB.
 */
export async function storeImagePayload(hashKey: string, imageUrl: string): Promise<void> {
  if (!hashKey || !imageUrl) return;

  // 1. Store in memory cache for instant access
  memoryCache.set(hashKey, imageUrl);

  // 2. Persist to IndexedDB asynchronously
  try {
    const db = await getIDBDatabase();
    if (!db) return;

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({
      hashKey,
      imageUrl,
      createdAt: Date.now(),
    });
  } catch (err) {
    console.warn("Failed to store image in IndexedDB:", err);
  }
}

/**
 * Retrieves a stored image payload by scene hashKey.
 * Checks memory cache first, then IndexedDB.
 */
export async function getImagePayload(hashKey: string): Promise<string | null> {
  if (!hashKey) return null;

  // 1. Check memory cache first
  if (memoryCache.has(hashKey)) {
    return memoryCache.get(hashKey) || null;
  }

  // 2. Check IndexedDB
  try {
    const db = await getIDBDatabase();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(hashKey);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.imageUrl) {
          memoryCache.set(hashKey, result.imageUrl);
          resolve(result.imageUrl);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn("Failed to read image from IndexedDB:", err);
    return null;
  }
}

/**
 * Synchronous memory cache check for immediate rendering.
 */
export function getImagePayloadSync(hashKey: string): string | null {
  return memoryCache.get(hashKey) || null;
}
