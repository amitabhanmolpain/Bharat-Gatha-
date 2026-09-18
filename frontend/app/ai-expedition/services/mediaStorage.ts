const DB_NAME = "ai_expedition_media_db";
const DB_VERSION = 1;
const STORE_NAME = "images";

export interface StoredImageRecord {
  key: string;
  worldId: string;
  assetId: string;
  blob: Blob;
  mimeType: string;
  createdAt: string;
}

class MediaStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private activeObjectUrls: Set<string> = new Set();

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        reject(new Error("IndexedDB is not supported in this environment."));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
          store.createIndex("worldId", "worldId", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB"));
    });

    return this.dbPromise;
  }

  async saveImageBlob(worldId: string, assetId: string, blob: Blob, mimeType: string = "image/png"): Promise<string> {
    const db = await this.getDB();
    const key = `${worldId}_${assetId}`;
    const record: StoredImageRecord = {
      key,
      worldId,
      assetId,
      blob,
      mimeType,
      createdAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(record);

      req.onsuccess = () => resolve(key);
      req.onerror = () => reject(req.error || new Error(`Failed to save image asset '${key}' to IndexedDB`));
    });
  }

  async getImageBlob(worldId: string, assetId: string): Promise<Blob | null> {
    const db = await this.getDB();
    const key = `${worldId}_${assetId}`;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        const record = req.result as StoredImageRecord | undefined;
        resolve(record ? record.blob : null);
      };
      req.onerror = () => reject(req.error || new Error(`Failed to read image asset '${key}' from IndexedDB`));
    });
  }

  async getImageObjectUrl(worldId: string, assetId: string): Promise<string | null> {
    const blob = await this.getImageBlob(worldId, assetId);
    if (!blob) return null;

    const url = URL.createObjectURL(blob);
    this.activeObjectUrls.add(url);
    return url;
  }

  revokeObjectUrl(url: string) {
    if (this.activeObjectUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.activeObjectUrls.delete(url);
    }
  }

  clearAllActiveObjectUrls() {
    this.activeObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.activeObjectUrls.clear();
  }

  async deleteWorldMedia(worldId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("worldId");
      const request = index.openKeyCursor(IDBKeyRange.only(worldId));

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error || new Error("Failed to delete world media"));
    });
  }
}

export const mediaStorage = new MediaStorageService();
