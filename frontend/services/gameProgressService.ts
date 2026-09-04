"use client";

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
 * Record a game or puzzle victory into MongoDB via backend API.
 */
export async function recordGameWinToDatabase(params: RecordGameWinParams): Promise<boolean> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    
    // Fallback or active user ID from localStorage if available
    let storedUserId = "default_traveller";
    if (typeof window !== "undefined") {
      storedUserId = localStorage.getItem("user_id") || "default_traveller";
    }

    const payload = {
      user_id: params.userId || storedUserId,
      era: params.era,
      game_type: params.gameType,
      prize_unlocked: params.prizeUnlocked,
      clues_found: params.cluesFound || [],
      score: params.score || 100,
      moves: params.moves || 0,
      metadata: params.metadata || {}
    };

    const response = await fetch(`${backendUrl}/api/game/win`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`[MongoDB] Win persisted successfully: ${params.gameType} -> ${params.prizeUnlocked}`);
      return true;
    } else {
      console.warn("[MongoDB] Non-200 response when saving win:", response.status);
      return false;
    }
  } catch (err) {
    console.warn("[MongoDB] Win recorded in localStorage, database sync postponed:", err);
    return false;
  }
}

/**
 * Fetch all past game wins for a user from MongoDB.
 */
export async function fetchUserWinsFromDatabase(era: string = "mughal"): Promise<string[]> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    let storedUserId = "default_traveller";
    if (typeof window !== "undefined") {
      storedUserId = localStorage.getItem("user_id") || "default_traveller";
    }

    const response = await fetch(`${backendUrl}/api/game/wins?user_id=${storedUserId}&era=${era}`);
    if (response.ok) {
      const data = await response.json();
      if (data.wins && Array.isArray(data.wins)) {
        return data.wins.map((w: any) => w.game_type);
      }
    }
    return [];
  } catch (err) {
    return [];
  }
}

/**
 * Fetch explicit solved puzzle status from database.
 */
export async function fetchSolvedStatusFromDatabase(era: string = "mughal"): Promise<{
  solvedPuzzles: string[];
  isPietraDuraSolved: boolean;
  isSheeshMirrorSolved: boolean;
}> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    let storedUserId = "default_traveller";
    if (typeof window !== "undefined") {
      storedUserId = localStorage.getItem("user_id") || "default_traveller";
    }

    const response = await fetch(`${backendUrl}/api/game/solved-status?user_id=${storedUserId}&era=${era}`);
    if (response.ok) {
      const data = await response.json();
      return {
        solvedPuzzles: data.solved_puzzles || [],
        isPietraDuraSolved: !!data.is_pietra_dura_solved,
        isSheeshMirrorSolved: !!data.is_sheesh_mirror_solved
      };
    }
  } catch (e) {}

  return {
    solvedPuzzles: [],
    isPietraDuraSolved: false,
    isSheeshMirrorSolved: false
  };
}


