/**
 * Idempotent Network Synchronization Service for Bharat Gatha.
 *
 * Flushes unsynced offline records to backend APIs when internet connection is restored.
 */

import { networkService } from "./networkService";
import { offlinePersistenceService } from "./offlinePersistenceService";

class SyncService {
  private isSyncing: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      networkService.subscribe((isOnline) => {
        if (isOnline) {
          this.syncPendingData();
        }
      });
    }
  }

  public async syncPendingData(): Promise<void> {
    if (this.isSyncing || networkService.isOffline()) return;
    this.isSyncing = true;

    try {
      const pendingItems = await offlinePersistenceService.getUnsyncedQueue();
      if (!pendingItems || pendingItems.length === 0) {
        this.isSyncing = false;
        return;
      }

      const backendUrl =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"
          : "http://localhost:5001";

      for (const item of pendingItems) {
        if (networkService.isOffline()) break;

        if (item.type === "WIN" && item.payload) {
          try {
            const res = await fetch(`${backendUrl}/api/game/win`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...item.payload,
                local_event_id: item.localEventId,
              }),
            });

            if (res.ok || res.status === 409) {
              await offlinePersistenceService.markSynced(item.localEventId);
            }
          } catch (e) {
            console.warn(`[Sync Warning]: Failed to sync event ${item.localEventId}. Will retry later.`, e);
          }
        }
      }
    } catch (e) {
      console.warn("[Sync Engine Error]:", e);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncService = new SyncService();
