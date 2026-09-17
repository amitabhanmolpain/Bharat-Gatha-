/**
 * IndexedDB Offline Persistence Service for Bharat Gatha.
 *
 * Manages canonical local save state for game victories, solved status,
 * checkpoints, and pending sync items using native browser IndexedDB.
 */

export interface LocalGameWinRecord {
  localEventId: string;
  user_id: string;
  era: string;
  game_type: string;
  prize_unlocked?: string;
  score: number;
  solved: boolean;
  created_at: string;
  synced: boolean;
}

export interface LocalCheckpointRecord {
  user_id: string;
  era: string;
  checkpoint: any;
  updated_at: string;
  synced: boolean;
}

const DB_NAME = "bharat_gatha_db";
const DB_VERSION = 1;

class OfflinePersistenceService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return Promise.reject("IndexedDB unavailable in current environment.");
    }
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains("game_wins")) {
          const winsStore = db.createObjectStore("game_wins", { keyPath: "localEventId" });
          winsStore.createIndex("user_era", ["user_id", "era"], { unique: false });
        }
        if (!db.objectStoreNames.contains("checkpoints")) {
          db.createObjectStore("checkpoints", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("sync_queue")) {
          db.createObjectStore("sync_queue", { keyPath: "localEventId" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Record a game victory in local IndexedDB immediately.
   */
  public async recordWinLocally(record: Omit<LocalGameWinRecord, "localEventId" | "created_at" | "synced">): Promise<LocalGameWinRecord> {
    const localEventId = `win_${record.user_id}_${record.era}_${record.game_type}`;
    const fullRecord: LocalGameWinRecord = {
      ...record,
      localEventId,
      solved: true,
      created_at: new Date().toISOString(),
      synced: false,
    };

    try {
      const db = await this.getDB();
      const tx = db.transaction(["game_wins", "sync_queue"], "readwrite");
      tx.objectStore("game_wins").put(fullRecord);
      tx.objectStore("sync_queue").put({
        localEventId,
        type: "WIN",
        payload: fullRecord,
        created_at: fullRecord.created_at,
      });
      await new Promise((resolve) => (tx.oncomplete = resolve));
    } catch (e) {
      console.warn("[IndexedDB Save Notice]: Falling back to local storage.", e);
      this.fallbackSaveWin(fullRecord);
    }

    return fullRecord;
  }

  /**
   * Retrieve list of solved puzzle keys for a user and era.
   */
  public async getSolvedPuzzlesLocally(user_id: string, era: string): Promise<string[]> {
    try {
      const db = await this.getDB();
      const tx = db.transaction("game_wins", "readonly");
      const store = tx.objectStore("game_wins");
      const request = store.getAll();

      const wins: LocalGameWinRecord[] = await new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result || []);
      });

      return wins
        .filter((w) => w.user_id === user_id && w.era === era && w.solved)
        .map((w) => w.game_type);
    } catch {
      return this.fallbackGetSolvedPuzzles(user_id, era);
    }
  }

  /**
   * Mark item as synced in IndexedDB.
   */
  public async markSynced(localEventId: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(["game_wins", "sync_queue"], "readwrite");
      const winsStore = tx.objectStore("game_wins");
      const getReq = winsStore.get(localEventId);
      getReq.onsuccess = () => {
        if (getReq.result) {
          winsStore.put({ ...getReq.result, synced: true });
        }
      };
      tx.objectStore("sync_queue").delete(localEventId);
    } catch (e) {
      console.warn("[IndexedDB Mark Synced Notice]:", e);
    }
  }

  /**
   * Retrieve unsynced queue items for network sync.
   */
  public async getUnsyncedQueue(): Promise<any[]> {
    try {
      const db = await this.getDB();
      const tx = db.transaction("sync_queue", "readonly");
      const request = tx.objectStore("sync_queue").getAll();
      return await new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result || []);
      });
    } catch {
      return [];
    }
  }

  // Fallbacks using browser localStorage if IndexedDB is blocked or disabled
  private fallbackSaveWin(record: LocalGameWinRecord) {
    if (typeof window === "undefined") return;
    try {
      const key = `bg_win_${record.user_id}_${record.era}`;
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      if (!existing.includes(record.game_type)) {
        existing.push(record.game_type);
        localStorage.setItem(key, JSON.stringify(existing));
      }
    } catch {}
  }

  private fallbackGetSolvedPuzzles(user_id: string, era: string): string[] {
    if (typeof window === "undefined") return [];
    try {
      const key = `bg_win_${user_id}_${era}`;
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }
}

export const offlinePersistenceService = new OfflinePersistenceService();
