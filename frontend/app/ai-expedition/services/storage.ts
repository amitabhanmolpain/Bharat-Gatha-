import { SavedGameState, WorldDefinition } from "../types/expedition";
import { PLASSEY_1757_BLUEPRINT } from "../demo/blueprints/plassey1757";

const SAVE_KEY_PREFIX = "ai_expedition_save_";
const RECENT_WORLDS_KEY = "ai_expedition_recent_worlds";

export class ExpeditionStorage {
  static saveGameState(state: SavedGameState): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`${SAVE_KEY_PREFIX}${state.worldId}`, JSON.stringify(state));
    } catch (e) {
      console.warn("LocalStorage save failed:", e);
    }
  }

  static getGameState(worldId: string): SavedGameState | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${worldId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("LocalStorage load failed:", e);
    }
    return null;
  }

  static clearGameState(worldId: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(`${SAVE_KEY_PREFIX}${worldId}`);
    } catch (e) {
      console.warn("LocalStorage clear failed:", e);
    }
  }

  static saveRecentWorld(world: WorldDefinition): void {
    if (typeof window === "undefined") return;
    try {
      const recent = this.getRecentWorlds();
      const filtered = recent.filter((w) => w.metadata.id !== world.metadata.id);
      const updated = [world, ...filtered].slice(0, 5); // keep max 5 recent worlds
      localStorage.setItem(RECENT_WORLDS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save recent world:", e);
    }
  }

  static getRecentWorlds(): WorldDefinition[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(RECENT_WORLDS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Failed to read recent worlds:", e);
    }
    return [];
  }

  static getWorldById(worldId: string): WorldDefinition | null {
    const wId = worldId.toLowerCase();
    if (wId.includes("plassey") || wId.includes("1757")) {
      return {
        ...PLASSEY_1757_BLUEPRINT.world,
        metadata: {
          ...PLASSEY_1757_BLUEPRINT.world.metadata,
          id: worldId
        }
      };
    }
    const recent = this.getRecentWorlds();
    return recent.find((w) => w.metadata.id === worldId) || null;
  }
}

