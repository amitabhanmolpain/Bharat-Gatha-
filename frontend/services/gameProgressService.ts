"use client";

import { offlinePersistenceService } from "./offlinePersistenceService";
import { networkService } from "./networkService";
import { syncService } from "./syncService";

interface RecordGameWinParams {
  userId?: string;
  era: string;
  gameType: string;
  prizeUnlocked: string;
  cluesFound?: string[];
  score?: number;
  moves?: number;
  metadata?: Record<string, any>;
}

/**
 * Record a game or puzzle victory into IndexedDB immediately and sync to backend API if online.
 */
export async function recordGameWinToDatabase(params: RecordGameWinParams): Promise<boolean> {
  const storedUserId =
    typeof window !== "undefined"
      ? localStorage.getItem("user_id") || "default_traveller"
      : "default_traveller";

  const userId = params.userId || storedUserId;

  // 1. Canonical Immediate Save to Local IndexedDB
  const localRecord = await offlinePersistenceService.recordWinLocally({
    user_id: userId,
    era: params.era,
    game_type: params.gameType,
    prize_unlocked: params.prizeUnlocked,
    score: params.score || 100,
    solved: true,
  });

  // 2. If online, attempt direct API synchronization
  if (networkService.isOnline()) {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://localhost:5001";

      const payload = {
        user_id: userId,
        era: params.era,
        game_type: params.gameType,
        prize_unlocked: params.prizeUnlocked,
        clues_found: params.cluesFound || [],
        score: params.score || 100,
        moves: params.moves || 0,
        metadata: params.metadata || {},
        local_event_id: localRecord.localEventId,
      };

      const response = await fetch(`${backendUrl}/api/game/win`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await offlinePersistenceService.markSynced(localRecord.localEventId);
        console.log(`[Persistence] Win synced to database: ${params.gameType}`);
        return true;
      }
    } catch (err) {
      console.warn("[Persistence Notice]: Win saved locally, remote sync queued for reconnection.");
    }
  }

  // Trigger sync worker to handle any pending items safely
  syncService.syncPendingData().catch(() => {});
  return true;
}

/**
 * Fetch all past game wins for a user, combining local IndexedDB with online backend.
 */
export async function fetchUserWinsFromDatabase(era: string = "mughal"): Promise<string[]> {
  const storedUserId =
    typeof window !== "undefined"
      ? localStorage.getItem("user_id") || "default_traveller"
      : "default_traveller";

  const localWins = await offlinePersistenceService.getSolvedPuzzlesLocally(storedUserId, era);

  if (networkService.isOnline()) {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://localhost:5001";

      const response = await fetch(`${backendUrl}/api/game/wins?user_id=${storedUserId}&era=${era}`);
      if (response.ok) {
        const data = await response.json();
        if (data.wins && Array.isArray(data.wins)) {
          const remoteWins = data.wins.map((w: any) => w.game_type);
          return Array.from(new Set([...localWins, ...remoteWins]));
        }
      }
    } catch {}
  }

  return localWins;
}

/**
 * Fetch explicit solved puzzle status, combining local IndexedDB with online backend.
 */
export async function fetchSolvedStatusFromDatabase(era: string = "mughal"): Promise<{
  solvedPuzzles: string[];
  isPietraDuraSolved: boolean;
  isSheeshMirrorSolved: boolean;
}> {
  const localWins = await fetchUserWinsFromDatabase(era);

  return {
    solvedPuzzles: localWins,
    isPietraDuraSolved: localWins.includes("pietra_dura_flower_art") || localWins.includes("pietra_dura"),
    isSheeshMirrorSolved: localWins.includes("sheesh_mahal_reflection") || localWins.includes("sheesh_mirror"),
  };
}
