import { WorldDefinition, SavedGameState, SceneDefinition } from "../types/world";
import { MOCK_RAJASTHAN_WORLD, MOCK_AGRA_WORLD } from "./mockData";
import { generateSceneHash } from "./cache";
import { storeImagePayload } from "./imageStorage";

const WORLDS_KEY = "ai_expedition_worlds";
const SAVES_KEY = "ai_expedition_saves";
const SINGLE_WORLD_PREFIX = "ai_expedition_world_";

/**
 * Sanitizes a WorldDefinition for persistence by extracting large base64 image strings
 * into IndexedDB/Memory Storage and storing lightweight visual signatures in LocalStorage.
 */

export function sanitizeWorldForPersistence(world: WorldDefinition): WorldDefinition {
  const clonedWorld: WorldDefinition = JSON.parse(JSON.stringify(world));

  if (clonedWorld.scenes) {
    for (const [sceneId, scene] of Object.entries(clonedWorld.scenes)) {
      const sceneObj = scene as SceneDefinition & { visualCacheKey?: string };
      const rawImg = sceneObj.backgroundImageUrl;

      const hashKey =
        sceneObj.visualCacheKey ||
        generateSceneHash(
          sceneObj.historicalPeriod || clonedWorld.historicalEra,
          clonedWorld.region,
          sceneObj.archetype,
          sceneObj.name
        );

      sceneObj.visualCacheKey = hashKey;

      if (rawImg && rawImg.startsWith("data:image/")) {
        // Save multi-megabyte base64 image string to IndexedDB asynchronously
        storeImagePayload(hashKey, rawImg).catch((err) => {
          console.warn(`Failed to store media payload for scene ${sceneId}:`, err);
        });

        // Clear base64 string from localStorage copy to guarantee <5KB footprint
        sceneObj.backgroundImageUrl = "";
      }
    }
  }

  return clonedWorld;
}

export function saveWorldDefinition(world: WorldDefinition): void {
  if (typeof window === "undefined" || !world || !world.worldId) return;

  const lightweightWorld = sanitizeWorldForPersistence(world);

  // 1. Always attempt to save the individual world key first (guarantees fast single-world lookup)
  try {
    localStorage.setItem(
      `${SINGLE_WORLD_PREFIX}${world.worldId}`,
      JSON.stringify(lightweightWorld)
    );
  } catch (singleErr) {
    console.warn("Individual world storage warning:", singleErr);
  }

  // 2. Save into bulk worlds map
  try {
    const existing = getAllSavedWorlds();
    existing[world.worldId] = lightweightWorld;

    // Keep max 10 lightweight world records
    const worldKeys = Object.keys(existing).filter(
      (k) => k !== MOCK_RAJASTHAN_WORLD.worldId && k !== MOCK_AGRA_WORLD.worldId
    );

    if (worldKeys.length > 10) {
      const keysToRemove = worldKeys.slice(0, worldKeys.length - 10);
      for (const k of keysToRemove) {
        delete existing[k];
      }
    }

    localStorage.setItem(WORLDS_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn("Bulk world storage exception:", err);
  }
}

export function getAllSavedWorlds(): Record<string, WorldDefinition> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(WORLDS_KEY);
    const parsed = data ? JSON.parse(data) : {};
    parsed[MOCK_RAJASTHAN_WORLD.worldId] = parsed[MOCK_RAJASTHAN_WORLD.worldId] || MOCK_RAJASTHAN_WORLD;
    parsed[MOCK_AGRA_WORLD.worldId] = parsed[MOCK_AGRA_WORLD.worldId] || MOCK_AGRA_WORLD;
    return parsed;
  } catch (err) {
    console.warn("Failed to read saved worlds:", err);
    return {
      [MOCK_RAJASTHAN_WORLD.worldId]: MOCK_RAJASTHAN_WORLD,
      [MOCK_AGRA_WORLD.worldId]: MOCK_AGRA_WORLD,
    };
  }
}

export function getWorldById(worldId: string): WorldDefinition | null {
  if (!worldId) return null;

  // 1. Try individual world key first
  if (typeof window !== "undefined") {
    try {
      const singleData = localStorage.getItem(`${SINGLE_WORLD_PREFIX}${worldId}`);
      if (singleData) {
        return JSON.parse(singleData) as WorldDefinition;
      }
    } catch (err) {
      console.warn(`Failed to read individual world ${worldId}:`, err);
    }
  }

  // 2. Fall back to bulk worlds registry
  const worlds = getAllSavedWorlds();
  return worlds[worldId] || null;
}

export function saveGameState(state: SavedGameState): void {
  if (typeof window === "undefined" || !state || !state.worldId) return;
  try {
    const data = localStorage.getItem(SAVES_KEY);
    const saves = data ? JSON.parse(data) : {};
    saves[state.worldId] = state;
    localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
  } catch (err) {
    console.warn("Failed to save game state:", err);
  }
}

export function getGameState(worldId: string): SavedGameState | null {
  if (typeof window === "undefined" || !worldId) return null;
  try {
    const data = localStorage.getItem(SAVES_KEY);
    const saves = data ? JSON.parse(data) : {};
    return saves[worldId] || null;
  } catch (err) {
    console.warn("Failed to get game state:", err);
    return null;
  }
}
